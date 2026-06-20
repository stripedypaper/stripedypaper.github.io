import { useEffect, useMemo, useState } from 'react';
import { buildReturnToUrl } from '../lib/site.js';

export function useSession(apiBaseUrl) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
        const response = await fetch(`${apiBaseUrl}/auth/me`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(
            `Session check failed with status ${response.status}.`
          );
        }

        const data = await response.json();

        if (!active) {
          return;
        }

        setUser(data.user || null);
      } catch {
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
      method: 'POST',
      credentials: 'include'
    });

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
