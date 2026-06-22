import crypto from 'node:crypto';
import { getUserRecord, isAdminRole, USER_ROLE } from './users.mjs';

const SESSION_COOKIE = 'trickcal_session';

export function getSessionFromEvent(event) {
  const value = getCookie(event, SESSION_COOKIE) || getBearerToken(event);
  return value ? verifySession(value) : null;
}

export async function getAuthContext(event) {
  const session = getSessionFromEvent(event);

  if (!session?.user?.id) {
    return {
      user: null,
      isAuthenticated: false,
      isAdmin: false
    };
  }

  const userRecord = await getUserRecord(session.user.id);
  const role = userRecord?.role || USER_ROLE;
  const isAdmin = isAdminRole(role);

  return {
    user: {
      ...session.user,
      username: userRecord?.username || session.user.username || '',
      role,
      isAdmin,
      isCurator: userRecord?.isCurator || false
    },
    isAuthenticated: true,
    isAdmin
  };
}

export async function requireAuthenticatedUser(event) {
  const context = await getAuthContext(event);

  if (!context.isAuthenticated) {
    return {
      ok: false,
      statusCode: 401,
      body: { error: 'Unauthorized' }
    };
  }

  return {
    ok: true,
    ...context
  };
}

export async function requireAdminUser(event) {
  const context = await getAuthContext(event);

  if (!context.isAuthenticated) {
    return {
      ok: false,
      statusCode: 401,
      body: { error: 'Unauthorized' }
    };
  }

  if (!context.isAdmin) {
    return {
      ok: false,
      statusCode: 403,
      body: { error: 'Forbidden' }
    };
  }

  return {
    ok: true,
    ...context
  };
}

export async function requireManagerOrAdminUser(event) {
  const context = await getAuthContext(event);

  if (!context.isAuthenticated) {
    return {
      ok: false,
      statusCode: 401,
      body: { error: 'Unauthorized' }
    };
  }

  if (context.user.role !== 'manager' && !context.isAdmin) {
    return {
      ok: false,
      statusCode: 403,
      body: { error: 'Forbidden' }
    };
  }

  return {
    ok: true,
    ...context
  };
}

export function signSession(payload) {
  return signPayload(payload);
}

function signPayload(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = hmac(body);
  return `${body}.${signature}`;
}

function verifySession(value) {
  return verifyPayload(value);
}

function verifyPayload(value) {
  const [body, signature] = value.split('.');
  if (!body || !signature || !safeEqual(signature, hmac(body))) {
    return null;
  }

  const session = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (!session.exp || session.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return session;
}

function hmac(value) {
  return crypto
    .createHmac('sha256', process.env.COOKIE_SECRET)
    .update(value)
    .digest('base64url');
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

function getBearerToken(event) {
  const headers = event.headers || {};
  const authorization = headers.authorization || headers.Authorization || '';

  if (!authorization.startsWith('Bearer ')) {
    return '';
  }

  return authorization.slice('Bearer '.length).trim();
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}
