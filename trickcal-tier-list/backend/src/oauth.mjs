import crypto from 'node:crypto';
import {
  listCommunityCharacterStats,
  listCommunityFavorites,
  rebuildCommunityCharacterStats,
  triggerPublicCommunityRebuild
} from './community-stats.mjs';
import { listAuditEventsPage, recordAuditEvent } from './audit-events.mjs';
import {
  getAuthContext,
  requireAuthenticatedUser,
  requireAdminUser,
  requireManagerOrAdminUser,
  signSession
} from './auth.mjs';
import { getRankingSubmission, saveRankingSubmission } from './rankings.mjs';
import { resolveQuestionnaireVersion } from './questionnaire-version.mjs';
import { ensureUserRecord, listUsersPage, updateUserRecord } from './users.mjs';
import {
  createCharacterImageUploadUrl,
  createCharacterRecord,
  listCharactersPage,
  updateCharacterRecord
} from './characters.mjs';
import {
  createChangelogEntry,
  deleteChangelogEntry,
  listChangelogEntries,
  updateChangelogEntry
} from './changelog.mjs';

const DISCORD_API = 'https://discord.com/api/v10';
const STATE_COOKIE = 'trickcal_oauth_state';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const STATE_MAX_AGE = 60 * 10;

const {
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  FRONTEND_URL,
  FRONTEND_ORIGIN,
  LOCAL_FRONTEND_ORIGIN,
  COOKIE_SECRET
} = process.env;

export async function handler(event) {
  try {
    globalThis.__lastRequestContext = event.requestContext;
    globalThis.__lastRequest = event;

    const method = event.requestContext.http.method;
    const path = event.rawPath;

    if (method === 'GET' && path === '/auth/start') {
      return startAuth(event);
    }

    if (method === 'GET' && path === '/auth/callback') {
      return callback(event);
    }

    if (method === 'GET' && path === '/auth/me') {
      return me(event);
    }

    if (method === 'GET' && path === '/rankings/me') {
      return getMyRankings(event);
    }

    if (method === 'GET' && path === '/community/characters') {
      return getCommunityCharacters(event);
    }

    if (method === 'GET' && path === '/community/favorites') {
      return getCommunityFavorites(event);
    }

    if (method === 'GET' && path === '/changelog') {
      return getChangelog(event);
    }

    if (method === 'POST' && path === '/community/rebuild') {
      return triggerCommunityRebuild(event);
    }

    if (method === 'GET' && path.startsWith('/rankings/')) {
      return getSharedRankings(event);
    }

    if (method === 'PUT' && path === '/rankings/me') {
      return putMyRankings(event);
    }

    if (method === 'GET' && path === '/admin/users') {
      return listUsers(event);
    }

    if (method === 'GET' && path === '/admin/audit-events') {
      return listAuditEvents(event);
    }

    if (method === 'PUT' && path.startsWith('/admin/users/')) {
      return updateUser(event);
    }

    if (method === 'POST' && path === '/admin/community/rebuild') {
      return rebuildCommunity(event);
    }

    if (method === 'POST' && path === '/admin/changelog') {
      return createChangelog(event);
    }

    if (path.startsWith('/admin/changelog/') && method === 'PUT') {
      return updateChangelog(event);
    }

    if (path.startsWith('/admin/changelog/') && method === 'DELETE') {
      return removeChangelog(event);
    }

    if (method === 'GET' && path === '/admin/characters') {
      return listCharacters(event);
    }

    if (method === 'POST' && path === '/admin/characters') {
      return createCharacter(event);
    }

    if (path.startsWith('/admin/characters/') && method === 'PUT') {
      return updateCharacter(event);
    }

    if (path.startsWith('/admin/characters/') && method === 'POST') {
      return createCharacterImageUpload(event);
    }

    if (method === 'POST' && path === '/auth/logout') {
      return logout();
    }

    return json(404, { error: 'Not found' });
  } catch (error) {
    console.error(error);
    return json(500, { error: 'Internal server error' });
  }
}

function startAuth(event) {
  assertConfigured();

  const state = crypto.randomBytes(24).toString('base64url');
  const returnTo = getAllowedReturnTo(event.queryStringParameters?.return_to);
  const statePayload = signPayload({
    state,
    returnTo,
    exp: Math.floor(Date.now() / 1000) + STATE_MAX_AGE
  });
  const redirectUri = getRedirectUri();
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify',
    state,
    prompt: 'none'
  });

  logAuthEvent('info', 'auth.start', event, {
    returnTo,
    redirectUri,
    hasOriginHeader: Boolean(getRequestHeader(event, 'origin')),
    hasRefererHeader: Boolean(getRequestHeader(event, 'referer'))
  });

  return redirect(`${DISCORD_API}/oauth2/authorize?${params}`, [
    cookie(STATE_COOKIE, statePayload, {
      maxAge: STATE_MAX_AGE,
      httpOnly: true
    })
  ]);
}

async function callback(event) {
  assertConfigured();

  const { code, state } = event.queryStringParameters || {};
  const rawStateCookie = getCookie(event, STATE_COOKIE) || '';
  const statePayload = verifyPayload(rawStateCookie);

  logAuthEvent('info', 'auth.callback.received', event, {
    hasCode: Boolean(code),
    hasState: Boolean(state),
    hasStateCookie: Boolean(rawStateCookie),
    hasValidStateCookie: Boolean(statePayload?.state)
  });

  if (
    !code ||
    !state ||
    !statePayload?.state ||
    !safeEqual(state, statePayload.state)
  ) {
    logAuthEvent('warn', 'auth.callback.rejected', event, {
      reason: !code
        ? 'missing_code'
        : !state
          ? 'missing_state'
          : !statePayload?.state
            ? 'invalid_or_missing_state_cookie'
            : 'state_mismatch'
    });
    return redirect(
      appendQueryParams(FRONTEND_URL, {
        auth: 'failed',
        reason: !code
          ? 'missing_code'
          : !state
            ? 'missing_state'
            : !statePayload?.state
              ? 'invalid_or_missing_state_cookie'
              : 'state_mismatch'
      }),
      [clearCookie(STATE_COOKIE)]
    );
  }

  const token = await exchangeCode(code);
  const user = await fetchDiscordUser(token.access_token);
  const ensuredUser = await ensureUserRecord({
    id: user.id,
    username: user.username,
    global_name: user.global_name,
    avatar: user.avatar
  });
  if (ensuredUser?.created) {
    await recordAuditEvent({
      category: 'user.created',
      actor: user.id,
      metadata: {
        discordId: user.id,
        username: user.username || ''
      }
    });
  } else if (ensuredUser?.usernameUpdated) {
    await recordAuditEvent({
      category: 'user.usernameUpdated',
      actor: user.id,
      metadata: {
        discordId: user.id,
        username: user.username || ''
      }
    });
  }
  const session = signSession({
    user: {
      id: user.id,
      username: user.username,
      global_name: user.global_name,
      avatar: user.avatar
    },
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE
  });

  logAuthEvent('info', 'auth.callback.success', event, {
    discordUserId: user.id,
    returnTo: statePayload.returnTo || FRONTEND_URL
  });

  return redirect(
    appendQueryParams(statePayload.returnTo || FRONTEND_URL, {
      auth: 'success',
      session_token: session
    }),
    [
      cookie('trickcal_session', session, {
        maxAge: SESSION_MAX_AGE,
        httpOnly: true
      }),
      clearCookie(STATE_COOKIE)
    ]
  );
}

async function me(event) {
  const context = await getAuthContext(event);
  logAuthEvent('info', 'auth.me', event, {
    isAuthenticated: context.isAuthenticated,
    discordUserId: context.user?.id || null,
    hasSessionCookie: Boolean(getCookie(event, 'trickcal_session')),
    hasAuthorizationHeader: Boolean(getRequestHeader(event, 'authorization'))
  });
  return json(200, { user: context.user });
}

async function listUsers(event) {
  const auth = await requireAdminUser(event);

  if (!auth.ok) {
    return json(auth.statusCode, auth.body);
  }

  const limit = parseLimit(event.queryStringParameters?.limit);
  const cursor = event.queryStringParameters?.cursor || null;
  const result = await listUsersPage({ limit, cursor });

  return json(200, result);
}

async function listAuditEvents(event) {
  const auth = await requireManagerOrAdminUser(event);

  if (!auth.ok) {
    return json(auth.statusCode, auth.body);
  }

  const limit = parseLimit(event.queryStringParameters?.limit);
  const cursor = event.queryStringParameters?.cursor || null;
  const result = await listAuditEventsPage({ limit, cursor });

  return json(200, result);
}

async function updateUser(event) {
  const auth = await requireAdminUser(event);

  if (!auth.ok) {
    return json(auth.statusCode, auth.body);
  }

  try {
    const discordId = getUserIdFromPath(event.rawPath);
    const body = parseJsonBody(event);
    const user = await updateUserRecord(auth.user.id, discordId, body);

    if (!user) {
      return json(404, { error: 'Not found' });
    }

    await recordAuditEvent({
      category: 'user.updated',
      actor: auth.user.id,
      metadata: {
        discordId,
        role: user.role,
        isCurator: user.isCurator
      }
    });

    return json(200, user);
  } catch (error) {
    return json(400, {
      error: error instanceof Error ? error.message : 'Invalid input.'
    });
  }
}

async function getMyRankings(event) {
  const auth = await requireAuthenticatedUser(event);

  if (!auth.ok) {
    return json(auth.statusCode, auth.body);
  }

  const submission = await getRankingSubmission(
    auth.user.id,
    getQuestionnaireVersion(event)
  );
  return json(200, { submission });
}

async function putMyRankings(event) {
  const auth = await requireAuthenticatedUser(event);

  if (!auth.ok) {
    return json(auth.statusCode, auth.body);
  }

  try {
    const body = parseJsonBody(event);
    const result = await saveRankingSubmission(
      auth.user.id,
      body.answers || body.placementsByQuestion || {},
      getQuestionnaireVersion(event)
    );

    await recordAuditEvent({
      category: 'rankings.submitted',
      actor: auth.user.id,
      metadata: {
        questionnaireVersion: getQuestionnaireVersion(event),
        questionCount: Object.keys(result.submission?.answers || {}).length,
        scoredCharacterCount: (result.submission?.derivedScores || []).length
      }
    });

    return json(200, { submission: result.submission });
  } catch (error) {
    return json(400, {
      error: error instanceof Error ? error.message : 'Invalid input.'
    });
  }
}

async function getCommunityCharacters(event) {
  const result = await listCommunityCharacterStats(
    getQuestionnaireVersion(event)
  );
  return json(200, result);
}

async function getCommunityFavorites(event) {
  const limit = parseLimit(event.queryStringParameters?.limit);
  const result = await listCommunityFavorites({
    limit,
    questionnaireVersion: getQuestionnaireVersion(event)
  });
  return json(200, result);
}

async function getChangelog(event) {
  const result = await listChangelogEntries();
  return json(200, result);
}

async function triggerCommunityRebuild(event) {
  try {
    const result = await triggerPublicCommunityRebuild(
      getQuestionnaireVersion(event)
    );
    await recordAuditEvent({
      category: 'community.rebuildRequestedPublic',
      actor: 'public',
      metadata: {
        questionnaireVersion: getQuestionnaireVersion(event),
        computedAt: result.computedAt,
        charactersProcessed: result.charactersProcessed
      }
    });
    return json(200, result);
  } catch (error) {
    if (error?.name === 'CommunityRebuildCooldownError') {
      return json(429, {
        error: 'Community rebuild is on cooldown.',
        retryAfterSeconds: error.retryAfterSeconds,
        lastRequestedAt: error.lastRequestedAt
      });
    }

    throw error;
  }
}

async function getSharedRankings(event) {
  const userId = getRankingUserIdFromPath(event.rawPath);

  if (!userId || userId === 'me') {
    return json(404, { error: 'Not found' });
  }

  const submission = await getRankingSubmission(
    userId,
    getQuestionnaireVersion(event)
  );

  if (!submission) {
    return json(404, { error: 'Not found' });
  }

  return json(200, {
    submission: {
      userId: submission.userId,
      updatedAt: submission.updatedAt,
      submittedAt: submission.submittedAt,
      derivedScores: submission.derivedScores
    }
  });
}

async function rebuildCommunity(event) {
  const auth = await requireAdminUser(event);

  if (!auth.ok) {
    return json(auth.statusCode, auth.body);
  }

  const result = await rebuildCommunityCharacterStats(
    getQuestionnaireVersion(event)
  );
  await recordAuditEvent({
    category: 'community.rebuildRequestedAdmin',
    actor: auth.user.id,
    metadata: {
      questionnaireVersion: getQuestionnaireVersion(event),
      computedAt: result.computedAt,
      charactersProcessed: result.charactersProcessed
    }
  });
  return json(200, result);
}

async function createChangelog(event) {
  const auth = await requireManagerOrAdminUser(event);

  if (!auth.ok) {
    return json(auth.statusCode, auth.body);
  }

  try {
    const body = parseJsonBody(event);
    const entry = await createChangelogEntry(auth.user.id, body);

    await recordAuditEvent({
      category: 'changelog.created',
      actor: auth.user.id,
      metadata: {
        changelogId: entry.id
      }
    });

    return json(201, entry);
  } catch (error) {
    return json(400, {
      error: error instanceof Error ? error.message : 'Invalid input.'
    });
  }
}

async function updateChangelog(event) {
  const auth = await requireManagerOrAdminUser(event);

  if (!auth.ok) {
    return json(auth.statusCode, auth.body);
  }

  try {
    const id = getChangelogIdFromPath(event.rawPath);
    const body = parseJsonBody(event);
    const entry = await updateChangelogEntry(auth.user.id, id, body);

    if (!entry) {
      return json(404, { error: 'Not found' });
    }

    await recordAuditEvent({
      category: 'changelog.updated',
      actor: auth.user.id,
      metadata: {
        changelogId: entry.id
      }
    });

    return json(200, entry);
  } catch (error) {
    return json(400, {
      error: error instanceof Error ? error.message : 'Invalid input.'
    });
  }
}

async function removeChangelog(event) {
  const auth = await requireManagerOrAdminUser(event);

  if (!auth.ok) {
    return json(auth.statusCode, auth.body);
  }

  try {
    const id = getChangelogIdFromPath(event.rawPath);
    const entry = await deleteChangelogEntry(id);

    if (!entry) {
      return json(404, { error: 'Not found' });
    }

    await recordAuditEvent({
      category: 'changelog.deleted',
      actor: auth.user.id,
      metadata: {
        changelogId: entry.id
      }
    });

    return json(200, { ok: true });
  } catch (error) {
    return json(400, {
      error: error instanceof Error ? error.message : 'Invalid input.'
    });
  }
}

async function listCharacters(event) {
  const limit = parseLimit(event.queryStringParameters?.limit);
  const cursor = event.queryStringParameters?.cursor || null;
  const filterType = event.queryStringParameters?.filterType || '';
  const filterValue = event.queryStringParameters?.filterValue || '';
  const result = await listCharactersPage({
    limit,
    cursor,
    filterType,
    filterValue
  });

  return json(200, result);
}

async function createCharacter(event) {
  const auth = await requireManagerOrAdminUser(event);

  if (!auth.ok) {
    return json(auth.statusCode, auth.body);
  }

  try {
    const body = parseJsonBody(event);
    const character = await createCharacterRecord(auth.user.id, body);

    await recordAuditEvent({
      category: 'character.created',
      actor: auth.user.id,
      metadata: {
        characterId: character.id,
        nameEn: character.nameEn || '',
        role: character.role,
        position: character.position,
        personality: character.personality
      }
    });

    return json(201, character);
  } catch (error) {
    return json(400, {
      error: error instanceof Error ? error.message : 'Invalid input.'
    });
  }
}

async function updateCharacter(event) {
  const auth = await requireManagerOrAdminUser(event);

  if (!auth.ok) {
    return json(auth.statusCode, auth.body);
  }

  try {
    const id = getCharacterIdFromPath(event.rawPath);
    const body = parseJsonBody(event);
    const character = await updateCharacterRecord(auth.user.id, id, body);

    if (!character) {
      return json(404, { error: 'Not found' });
    }

    await recordAuditEvent({
      category: 'character.updated',
      actor: auth.user.id,
      metadata: {
        characterId: id,
        nameEn: character.nameEn || '',
        role: character.role,
        position: character.position,
        personality: character.personality,
        hasYearning: character.hasYearning
      }
    });

    return json(200, character);
  } catch (error) {
    return json(400, {
      error: error instanceof Error ? error.message : 'Invalid input.'
    });
  }
}

async function createCharacterImageUpload(event) {
  const auth = await requireManagerOrAdminUser(event);

  if (!auth.ok) {
    return json(auth.statusCode, auth.body);
  }

  try {
    const id = getCharacterIdFromPath(event.rawPath);
    const body = parseJsonBody(event);
    const upload = await createCharacterImageUploadUrl(
      auth.user.id,
      id,
      body.contentType,
      body.imageType || 'default'
    );

    await recordAuditEvent({
      category: 'character.imageUploadRequested',
      actor: auth.user.id,
      metadata: {
        characterId: id,
        imageType: body.imageType || 'default',
        contentType: body.contentType || ''
      }
    });

    return json(200, upload);
  } catch (error) {
    return json(400, {
      error: error instanceof Error ? error.message : 'Invalid input.'
    });
  }
}

function logout() {
  return json(200, { ok: true }, [clearCookie('trickcal_session')]);
}

async function exchangeCode(code) {
  const response = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: getRedirectUri()
    })
  });

  if (!response.ok) {
    throw new Error(`Discord token exchange failed: ${response.status}`);
  }

  return response.json();
}

async function fetchDiscordUser(accessToken) {
  const response = await fetch(`${DISCORD_API}/users/@me`, {
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Discord user lookup failed: ${response.status}`);
  }

  return response.json();
}

function signPayload(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = hmac(body);
  return `${body}.${signature}`;
}

function verifyPayload(value) {
  const [body, signature] = value.split('.');
  if (!body || !signature || !safeEqual(signature, hmac(body))) {
    return null;
  }

  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

function getAllowedReturnTo(value) {
  if (!value) {
    return FRONTEND_URL;
  }

  try {
    const url = new URL(value);
    return getAllowedOrigins().includes(url.origin) ? url.href : FRONTEND_URL;
  } catch {
    return FRONTEND_URL;
  }
}

function getAllowedOrigins() {
  return [FRONTEND_ORIGIN, LOCAL_FRONTEND_ORIGIN].filter(Boolean);
}

function appendQueryParams(urlString, params) {
  const url = new URL(urlString);

  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

function getCorsOrigin(event) {
  const headers = event.headers || {};
  const origin = headers.origin || headers.Origin;
  return getAllowedOrigins().includes(origin) ? origin : FRONTEND_ORIGIN;
}

function hmac(value) {
  return crypto
    .createHmac('sha256', COOKIE_SECRET)
    .update(value)
    .digest('base64url');
}

function getRedirectUri() {
  return `${getApiBaseUrl()}/auth/callback`;
}

function getApiBaseUrl() {
  const { domainName } = globalThis.__lastRequestContext || {};
  if (!domainName) {
    throw new Error('Missing API Gateway domain name');
  }

  return `https://${domainName}`;
}

function redirect(location, cookies = []) {
  return {
    statusCode: 302,
    headers: {
      location
    },
    cookies
  };
}

function json(statusCode, body, cookies = []) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': getCorsOrigin(
        globalThis.__lastRequest || {}
      ),
      'access-control-allow-credentials': 'true',
      vary: 'origin'
    },
    cookies,
    body: JSON.stringify(body)
  };
}

function cookie(name, value, options = {}) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'Secure',
    'HttpOnly',
    'SameSite=None'
  ];

  if (options.maxAge) {
    parts.push(`Max-Age=${options.maxAge}`);
  }

  return parts.join('; ');
}

function clearCookie(name) {
  return `${name}=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=None`;
}

function getRequestHeader(event, name) {
  const headers = event.headers || {};
  return (
    headers[name] ||
    headers[name.toLowerCase()] ||
    headers[name.toUpperCase()] ||
    ''
  );
}

function getCookie(event, name) {
  for (const rawCookie of event.cookies || []) {
    const [key, ...valueParts] = rawCookie.split('=');
    if (key === name) {
      return decodeURIComponent(valueParts.join('='));
    }
  }

  return null;
}

function getCharacterIdFromPath(path) {
  const parts = path.split('/').filter(Boolean);
  return parts[2] || '';
}

function getRankingUserIdFromPath(path) {
  const parts = path.split('/').filter(Boolean);
  return parts[1] || '';
}

function getUserIdFromPath(path) {
  const parts = path.split('/').filter(Boolean);
  return parts[2] || '';
}

function getChangelogIdFromPath(path) {
  const parts = path.split('/').filter(Boolean);
  return parts[2] || '';
}

function parseLimit(value) {
  const parsed = Number.parseInt(value || '20', 10);
  if (Number.isNaN(parsed)) {
    return 20;
  }

  return Math.min(Math.max(parsed, 1), 100);
}

function parseJsonBody(event) {
  if (!event.body) {
    return {};
  }

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;

  try {
    return JSON.parse(rawBody);
  } catch {
    throw new Error('Invalid JSON body.');
  }
}

function getQuestionnaireVersion(event) {
  return resolveQuestionnaireVersion();
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function logAuthEvent(level, eventName, event, details = {}) {
  const logger = level === 'warn' ? console.warn : console.log;
  logger(
    JSON.stringify({
      area: 'auth',
      event: eventName,
      requestId: event?.requestContext?.requestId || '',
      method: event?.requestContext?.http?.method || '',
      path: event?.rawPath || '',
      origin: getRequestHeader(event, 'origin') || '',
      referer: getRequestHeader(event, 'referer') || '',
      userAgent: getRequestHeader(event, 'user-agent') || '',
      ...details
    })
  );
}

function assertConfigured() {
  for (const name of [
    'DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET',
    'FRONTEND_URL',
    'FRONTEND_ORIGIN',
    'COOKIE_SECRET'
  ]) {
    if (!process.env[name]) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
  }
}

globalThis.__lastRequestContext = null;
globalThis.__lastRequest = null;
