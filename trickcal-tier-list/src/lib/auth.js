const SESSION_TOKEN_STORAGE_KEY = 'trickcal_session_token';

export function getStoredSessionToken() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(SESSION_TOKEN_STORAGE_KEY) || '';
}

export function setStoredSessionToken(token) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!token) {
    window.localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, token);
}

export function clearStoredSessionToken() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
}

export function buildAuthenticatedRequestInit(init = {}) {
  const token = getStoredSessionToken();
  const headers = new Headers(init.headers || {});

  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }

  return {
    ...init,
    credentials: 'include',
    headers
  };
}
