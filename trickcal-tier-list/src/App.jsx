import { useEffect, useState } from 'react';
import { AppShell, Container, Text } from '@mantine/core';
import { TopNavbar } from './components/TopNavbar.jsx';
import { ChangelogPage } from './pages/ChangelogPage.jsx';
import { AdminPage } from './pages/admin/AdminPage.jsx';
import { ContributePage } from './pages/contribute/ContributePage.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { SharedTierListPage } from './pages/SharedTierListPage.jsx';
import { useRoute } from './hooks/useRoute.js';
import { useSession } from './hooks/useSession.js';
import {
  canManageCharacters,
  canViewAdminUsers,
  getSharedTierListUserId,
  resolveApiBaseUrl
} from './lib/site.js';

function PageForRoute({
  route,
  apiBaseUrl,
  canViewCharacters,
  canViewUsers,
  user,
  sessionLoading,
  sharedUserId
}) {
  if (route === 'shared-tier-list') {
    return (
      <SharedTierListPage apiBaseUrl={apiBaseUrl} sharedUserId={sharedUserId} />
    );
  }

  if (route.startsWith('contribute')) {
    return (
      <ContributePage
        apiBaseUrl={apiBaseUrl}
        route={route}
        user={user}
        sessionLoading={sessionLoading}
      />
    );
  }

  if (route.startsWith('admin')) {
    return canViewCharacters || canViewUsers ? (
      <AdminPage
        apiBaseUrl={apiBaseUrl}
        route={route}
        canViewUsers={canViewUsers}
        canViewCharacters={canViewCharacters}
      />
    ) : (
      <HomePage apiBaseUrl={apiBaseUrl} />
    );
  }

  if (route === 'changelog') {
    return <ChangelogPage />;
  }

  return <HomePage apiBaseUrl={apiBaseUrl} />;
}

export function App() {
  const route = useRoute();
  const [apiBaseUrl, setApiBaseUrl] = useState(() => resolveApiBaseUrl());
  const sharedUserId = getSharedTierListUserId(window.location.hash);

  useEffect(() => {
    if (apiBaseUrl) {
      return;
    }

    let active = true;

    async function loadRuntimeConfig() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}config.json`, {
          cache: 'no-store'
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (active && typeof window !== 'undefined') {
          window.TRICKCAL_CONFIG = {
            ...(window.TRICKCAL_CONFIG || {}),
            ...data
          };
        }

        if (
          active &&
          typeof data.apiBaseUrl === 'string' &&
          data.apiBaseUrl.trim()
        ) {
          setApiBaseUrl(data.apiBaseUrl.trim().replace(/\/$/, ''));
        }
      } catch {
        // Leave the API URL empty if runtime config is unavailable.
      }
    }

    loadRuntimeConfig();

    return () => {
      active = false;
    };
  }, [apiBaseUrl]);

  const { user, loading, loginHref, logout } = useSession(apiBaseUrl);
  const canViewCharacters = !loading && canManageCharacters(user);
  const canViewUsers = !loading && canViewAdminUsers(user);

  useEffect(() => {
    if (
      loading ||
      !route.startsWith('admin') ||
      (route === 'admin-characters' && canViewCharacters) ||
      ((route === 'admin-users' || route === 'admin-community') && canViewUsers)
    ) {
      return;
    }

    const fallbackRoute = canViewCharacters ? '#/admin/characters' : '#/';
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.search}${fallbackRoute}`
    );
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }, [canViewCharacters, canViewUsers, loading, route]);

  return (
    <AppShell className="site-shell" header={{ height: 72 }} padding={0}>
      <TopNavbar
        route={route}
        user={user}
        loading={loading}
        loginHref={loginHref}
        onLogout={logout}
      />

      <AppShell.Main className="site-main">
        <Container size="xl" className="page-container">
          <PageForRoute
            route={route}
            apiBaseUrl={apiBaseUrl}
            canViewCharacters={canViewCharacters}
            canViewUsers={canViewUsers}
            user={user}
            sessionLoading={loading}
            sharedUserId={sharedUserId}
          />
        </Container>
      </AppShell.Main>
      <footer className="site-footer">
        <Container size="xl" className="site-footer-inner">
          <Text size="sm">
            Created by boardwalkhotel. To send feedback, visit the{' '}
            <a href="https://discord.gg/4Q2uFsjq2X" target="_blank">
              Trickcal official discord
            </a>{' '}
            and find the Community Tier List thread in #game-guides.
          </Text>
        </Container>
      </footer>
    </AppShell>
  );
}
