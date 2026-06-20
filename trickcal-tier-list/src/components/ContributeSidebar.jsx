import { Paper, Stack, Text, UnstyledButton } from '@mantine/core';
import { CONTRIBUTE_NAV } from '../lib/site.js';

function ContributeNavLink({ label, href, active }) {
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

export function ContributeSidebar({ route }) {
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
          Contribute
        </Text>
        {CONTRIBUTE_NAV.map((item) => (
          <ContributeNavLink
            key={item.key}
            label={item.label}
            href={item.hash}
            active={route === item.route}
          />
        ))}
      </Stack>
    </Paper>
  );
}
