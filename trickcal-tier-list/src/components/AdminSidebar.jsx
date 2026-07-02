import { Paper, Stack, Text, UnstyledButton } from '@mantine/core';
import { ADMIN_NAV } from '../lib/site.js';

function AdminNavLink({ label, href, active }) {
  return (
    <UnstyledButton
      component="a"
      href={href}
      className={`admin-nav-link${active ? ' admin-nav-link-active' : ''}`}
    >
      {label}
    </UnstyledButton>
  );
}

export function AdminSidebar({ route, canViewUsers, canViewCharacters }) {
  return (
    <Paper className="admin-sidebar" p="md" radius="lg" withBorder>
      <Stack gap="xs">
        <Text
          fw={700}
          c="dimmed"
          size="sm"
          tt="uppercase"
          className="admin-sidebar-label"
        >
          Admin
        </Text>
        {canViewCharacters ? (
          <AdminNavLink
            label={ADMIN_NAV[1].label}
            href={ADMIN_NAV[1].hash}
            active={route === 'admin-characters'}
          />
        ) : null}
        {canViewUsers ? (
          <AdminNavLink
            label={ADMIN_NAV[2].label}
            href={ADMIN_NAV[2].hash}
            active={route === 'admin-community'}
          />
        ) : null}
        {canViewUsers ? (
          <AdminNavLink
            label={ADMIN_NAV[3].label}
            href={ADMIN_NAV[3].hash}
            active={route === 'admin-events'}
          />
        ) : null}
        {canViewUsers ? (
          <AdminNavLink
            label={ADMIN_NAV[0].label}
            href={ADMIN_NAV[0].hash}
            active={route === 'admin-users'}
          />
        ) : null}
      </Stack>
    </Paper>
  );
}
