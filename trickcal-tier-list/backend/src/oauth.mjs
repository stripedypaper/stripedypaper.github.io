import crypto from 'node:crypto';
import { getAuthContext, requireAdminUser, signSession } from './auth.mjs';
import { ensureUserRecord, listUsersPage } from './users.mjs';
import {
  createCharacterImageUploadUrl,
  createCharacterRecord,
  listCharactersPage,
  updateCharacterRecord
} from './characters.mjs';

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

    if (method === 'GET' && path === '/admin/users') {
      return listUsers(event);
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
  const statePayload = verifyPayload(getCookie(event, STATE_COOKIE) || '');

  if (
    !code ||
    !state ||
    !statePayload?.state ||
    !safeEqual(state, statePayload.state)
  ) {
    return redirect(`${FRONTEND_URL}?auth=failed`, [clearCookie(STATE_COOKIE)]);
  }

  const token = await exchangeCode(code);
  const user = await fetchDiscordUser(token.access_token);
  await ensureUserRecord({
    id: user.id,
    username: user.username,
    global_name: user.global_name,
    avatar: user.avatar
  });
  const session = signSession({
    user: {
      id: user.id,
      username: user.username,
      global_name: user.global_name,
      avatar: user.avatar
    },
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE
  });

  return redirect(statePayload.returnTo || FRONTEND_URL, [
    cookie('trickcal_session', session, {
      maxAge: SESSION_MAX_AGE,
      httpOnly: true
    }),
    clearCookie(STATE_COOKIE)
  ]);
}

async function me(event) {
  const context = await getAuthContext(event);
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

async function listCharacters(event) {
  const auth = await requireAdminUser(event);

  if (!auth.ok) {
    return json(auth.statusCode, auth.body);
  }

  const limit = parseLimit(event.queryStringParameters?.limit);
  const cursor = event.queryStringParameters?.cursor || null;
  const result = await listCharactersPage({ limit, cursor });

  return json(200, result);
}

async function createCharacter(event) {
  const auth = await requireAdminUser(event);

  if (!auth.ok) {
    return json(auth.statusCode, auth.body);
  }

  try {
    const body = parseJsonBody(event);
    const character = await createCharacterRecord(auth.user.id, body);

    return json(201, character);
  } catch (error) {
    return json(400, {
      error: error instanceof Error ? error.message : 'Invalid input.'
    });
  }
}

async function updateCharacter(event) {
  const auth = await requireAdminUser(event);

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

    return json(200, character);
  } catch (error) {
    return json(400, {
      error: error instanceof Error ? error.message : 'Invalid input.'
    });
  }
}

async function createCharacterImageUpload(event) {
  const auth = await requireAdminUser(event);

  if (!auth.ok) {
    return json(auth.statusCode, auth.body);
  }

  try {
    const id = getCharacterIdFromPath(event.rawPath);
    const body = parseJsonBody(event);
    const upload = await createCharacterImageUploadUrl(
      auth.user.id,
      id,
      body.contentType
    );

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

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
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
