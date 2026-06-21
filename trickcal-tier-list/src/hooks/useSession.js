import { useEffect, useMemo, useState } from 'react';
import {
  buildAuthenticatedRequestInit,
  clearStoredSessionToken,
  setStoredSessionToken
} from '../lib/auth.js';
import { buildReturnToUrl } from '../lib/site.js';

export function useSession(apiBaseUrl) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const url = new URL(window.location.href);
    const authResult = url.searchParams.get('auth');
    const authReason = url.searchParams.get('reason');
    const sessionToken = url.searchParams.get('session_token');

    if (!authResult) {
      return;
    }

    if (authResult === 'success') {
      if (sessionToken) {
        setStoredSessionToken(sessionToken);
      }
      console.info('[auth] callback returned from Discord', {
        auth: authResult,
        hasSessionToken: Boolean(sessionToken)
      });
    } else {
      console.error('[auth] callback failed', {
        auth: authResult,
        reason: authReason || 'unknown'
      });
    }

    url.searchParams.delete('auth');
    url.searchParams.delete('reason');
    url.searchParams.delete('session_token');
    window.history.replaceState(
      null,
      '',
      `${url.pathname}${url.search}${url.hash}`
    );
  }, []);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      if (!apiBaseUrl) {
        if (active) {
          setUser(null);
          setLoading(false);
        }

        return;
      }

      if (active) {
        setLoading(true);
      }

      try {
        const response = await fetch(
          `${apiBaseUrl}/auth/me`,
          buildAuthenticatedRequestInit()
        );

        if (!response.ok) {
          const responseText = await response.text().catch(() => '');
          console.error('[auth] session check failed', {
            status: response.status,
            statusText: response.statusText,
            body: responseText
          });
          throw new Error(
            `Session check failed with status ${response.status}.`
          );
        }

        const data = await response.json();

        console.info('[auth] session check completed', {
          isAuthenticated: Boolean(data.user),
          discordUserId: data.user?.id || null
        });

        if (!active) {
          return;
        }

        setUser(data.user || null);
      } catch (error) {
        console.error('[auth] session load error', error);
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      active = false;
    };
  }, [apiBaseUrl]);

  async function logout() {
    if (!apiBaseUrl) {
      return;
    }

    await fetch(`${apiBaseUrl}/auth/logout`, {
      ...buildAuthenticatedRequestInit({
        method: 'POST'
      })
    });

    clearStoredSessionToken();
    setUser(null);
  }

  const loginHref = useMemo(() => {
    if (!apiBaseUrl || typeof window === 'undefined') {
      return '#';
    }

    return `${apiBaseUrl}/auth/start?return_to=${encodeURIComponent(buildReturnToUrl())}`;
  }, [apiBaseUrl]);

  return {
    user,
    loading,
    loginHref,
    logout
  };
}
