import {
  AppShell,
  Avatar,
  Button,
  Container,
  Group,
  Loader,
  Menu,
  UnstyledButton
} from '@mantine/core';
import { IconCopy, IconLogout } from '@tabler/icons-react';
import { TOP_NAV, avatarUrl, canManageCharacters } from '../lib/site.js';

function NavLink({ label, href, active }) {
  return (
    <UnstyledButton
      component="a"
      href={href}
      className={`nav-link${active ? ' nav-link-active' : ''}`}
    >
      {label}
    </UnstyledButton>
  );
}

export function TopNavbar({ route, user, loading, loginHref, onLogout }) {
  const showAdminLink = !loading && canManageCharacters(user);
  const visiblePages = showAdminLink
    ? TOP_NAV
    : TOP_NAV.filter((item) => item.key !== 'admin');

  async function handleCopyId() {
    if (!user?.id) {
      return;
    }

    await navigator.clipboard.writeText(user.id);
  }

  return (
    <AppShell.Header className="topbar">
      <Container size="xl" className="topbar-inner">
        <Group justify="space-between" wrap="nowrap" className="topbar-group">
          <Group gap="sm" wrap="nowrap" className="nav-left">
            {visiblePages.map((item) => (
              <NavLink
                key={item.key}
                label={item.label}
                href={item.hash}
                active={
                  item.key === 'admin'
                    ? route.startsWith('admin')
                    : item.key === 'contribute'
                      ? route.startsWith('contribute')
                      : item.key === 'changelog'
                        ? route === 'changelog'
                        : route === item.key
                }
              />
            ))}
          </Group>

          <Group gap="sm" wrap="nowrap" className="nav-right">
            {loading ? (
              <Loader size="sm" color="grape" />
            ) : user ? (
              <Menu
                trigger="hover"
                openDelay={80}
                closeDelay={120}
                withinPortal
                position="bottom-end"
                offset={10}
              >
                <Menu.Target>
                  <Group gap="sm" className="user-menu-trigger" wrap="nowrap">
                    <Avatar
                      src={avatarUrl(user)}
                      alt=""
                      size="md"
                      radius="xl"
                    />
                  </Group>
                </Menu.Target>

                <Menu.Dropdown className="user-menu-dropdown">
                  <Menu.Label>Discord</Menu.Label>
                  <Menu.Item
                    leftSection={<IconCopy size={14} />}
                    onClick={handleCopyId}
                  >
                    Copy ID
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconLogout size={14} />}
                    onClick={onLogout}
                  >
                    Logout
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : (
              <Button
                component="a"
                href={loginHref}
                variant="filled"
                color="grape"
              >
                Login
              </Button>
            )}
          </Group>
        </Group>
      </Container>
    </AppShell.Header>
  );
}
