import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Container,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconBrandDiscordFilled,
  IconCircleCheck,
  IconExternalLink,
  IconSparkles,
  IconShieldLock,
  IconLogout
} from '@tabler/icons-react';

function resolveApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  const runtimeConfig =
    typeof window !== 'undefined' ? window.TRICKCAL_CONFIG : undefined;
  return (envUrl || runtimeConfig?.apiBaseUrl || '').trim().replace(/\/$/, '');
}

function avatarUrl(user) {
  if (!user.avatar) {
    return 'https://cdn.discordapp.com/embed/avatars/0.png';
  }

  const extension = user.avatar.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extension}?size=160`;
}

function buildReturnToUrl() {
  const returnTo = new URL(window.location.href);
  returnTo.search = '';
  returnTo.hash = '';
  return returnTo.href;
}

function SessionState({ apiBaseUrl }) {
  const [status, setStatus] = useState('loading');
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [logoutPending, setLogoutPending] = useState(false);

  const loginHref = useMemo(() => {
    if (!apiBaseUrl || typeof window === 'undefined') {
      return '#';
    }

    return `${apiBaseUrl}/auth/start?return_to=${encodeURIComponent(buildReturnToUrl())}`;
  }, [apiBaseUrl]);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      if (!apiBaseUrl) {
        if (!active) {
          return;
        }

        setStatus('signed-out');
        setMessage(
          'Set the API base URL in `public/config.json` or `VITE_API_BASE_URL`.'
        );
        return;
      }

      if (active) {
        setStatus('loading');
        setMessage('');
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

        if (data.user) {
          setUser(data.user);
          setStatus('signed-in');
        } else {
          setUser(null);
          setStatus('signed-out');
        }
      } catch (error) {
        if (!active) {
          return;
        }

        setUser(null);
        setStatus('signed-out');
        setMessage(
          error instanceof Error ? error.message : 'Failed to load session.'
        );
      }
    }

    loadSession();

    return () => {
      active = false;
    };
  }, [apiBaseUrl]);

  async function handleLogout() {
    if (!apiBaseUrl) {
      return;
    }

    setLogoutPending(true);
    setMessage('');

    try {
      const response = await fetch(`${apiBaseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Logout failed with status ${response.status}.`);
      }

      setUser(null);
      setStatus('signed-out');
      setMessage('Signed out.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Logout failed.');
    } finally {
      setLogoutPending(false);
    }
  }

  return (
    <Paper className="auth-card" radius="xl" p="xl" withBorder>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Badge
              color={status === 'signed-in' ? 'teal' : 'orange'}
              variant="light"
              size="lg"
            >
              {status === 'loading'
                ? 'Checking session'
                : status === 'signed-in'
                  ? 'Session ready'
                  : 'Signed out'}
            </Badge>
            <Title order={2} mt="sm">
              Discord access
            </Title>
            <Text c="dimmed" mt={6}>
              Authenticate through the backend, then return here with your
              Discord session.
            </Text>
          </div>

          <ThemeIcon size={48} radius="xl" variant="light" color="orange">
            <IconBrandDiscordFilled size={24} />
          </ThemeIcon>
        </Group>

        {status === 'loading' ? (
          <Group gap="sm">
            <Loader color="orange" size="sm" />
            <Text c="dimmed">Checking session with the API...</Text>
          </Group>
        ) : status === 'signed-in' && user ? (
          <Group align="center" wrap="nowrap" className="session-row">
            <Avatar
              src={avatarUrl(user)}
              alt={`${user.global_name || user.username}'s Discord avatar`}
              size={88}
              radius="xl"
            />
            <div className="session-copy">
              <Group gap={8} align="center">
                <Text fw={700} size="lg">
                  {user.global_name || user.username}
                </Text>
                <IconCircleCheck size={18} className="status-icon" />
              </Group>
              <Text c="dimmed">@{user.username}</Text>
              <Text c="dimmed" size="sm" className="user-id">
                {user.id}
              </Text>
            </div>
          </Group>
        ) : (
          <Stack gap="sm">
            <Text fw={700}>Not signed in</Text>
            <Text c="dimmed">
              Use Discord OAuth to create or resume your session. The backend
              should be deployed before this button works.
            </Text>
            <Button
              component="a"
              href={loginHref}
              leftSection={<IconExternalLink size={16} />}
              size="md"
              color="orange"
              variant="gradient"
              gradient={{ from: 'orange', to: 'yellow', deg: 135 }}
              disabled={!apiBaseUrl}
            >
              Log in with Discord
            </Button>
          </Stack>
        )}

        {status === 'signed-in' && (
          <Button
            onClick={handleLogout}
            loading={logoutPending}
            leftSection={<IconLogout size={16} />}
            variant="light"
            color="red"
          >
            Log out
          </Button>
        )}

        {message ? (
          <Alert
            color="red"
            variant="light"
            title="Session notice"
            icon={<IconAlertTriangle size={16} />}
          >
            {message}
          </Alert>
        ) : null}
      </Stack>
    </Paper>
  );
}

export function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState(() => resolveApiBaseUrl());

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

        if (!active) {
          return;
        }

        if (typeof data.apiBaseUrl === 'string' && data.apiBaseUrl.trim()) {
          setApiBaseUrl(data.apiBaseUrl.trim().replace(/\/$/, ''));
        }
      } catch {
        // Leave the API URL empty; the auth panel will explain the missing config.
      }
    }

    loadRuntimeConfig();

    return () => {
      active = false;
    };
  }, [apiBaseUrl]);

  return (
    <div className="page-shell">
      <div className="page-glow page-glow-left" />
      <div className="page-glow page-glow-right" />

      <Container size="lg" className="page-container">
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" verticalSpacing="xl">
          <Stack gap="xl" className="hero-copy">
            <div>
              <Badge
                size="lg"
                radius="xl"
                variant="gradient"
                gradient={{ from: 'orange', to: 'yellow', deg: 135 }}
                leftSection={<IconSparkles size={14} />}
              >
                Trickcal Tier List
              </Badge>
              <Title order={1} className="hero-title" mt="md">
                Discord login, rebuilt in React.
              </Title>
              <Text c="dimmed" size="lg" mt="md" maw={560}>
                A Vite front end with Mantine UI that checks the backend
                session, opens Discord OAuth, and displays the signed-in user
                when the session cookie is present.
              </Text>
            </div>

            <Paper className="feature-card" p="lg" radius="xl" withBorder>
              <Group align="flex-start" wrap="nowrap">
                <ThemeIcon size={44} radius="xl" variant="light" color="orange">
                  <IconShieldLock size={22} />
                </ThemeIcon>
                <div>
                  <Text fw={700} size="lg">
                    Clean auth surface
                  </Text>
                  <Text c="dimmed" mt={4}>
                    Runtime config still works through `public/config.json`,
                    while Vite can also bake the API URL in at build time.
                  </Text>
                </div>
              </Group>
            </Paper>
          </Stack>

          <SessionState apiBaseUrl={apiBaseUrl} />
        </SimpleGrid>
      </Container>
    </div>
  );
}
