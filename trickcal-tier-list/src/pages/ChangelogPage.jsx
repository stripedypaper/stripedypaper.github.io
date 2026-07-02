import { Paper, Stack, Text } from '@mantine/core';
import { CHANGELOG_ENTRIES } from '../lib/changelog.js';

function sortEntriesNewestFirst(entries) {
  return [...entries].sort(
    (left, right) =>
      new Date(right.date).getTime() - new Date(left.date).getTime()
  );
}

export function ChangelogPage() {
  const entries = sortEntriesNewestFirst(CHANGELOG_ENTRIES);

  return (
    <Stack gap="lg">
      <div>
        <Text fw={700} size="xl">
          Changelog
        </Text>
      </div>

      <Stack gap="md">
        {entries.map((entry) => (
          <Paper
            key={`${entry.date}-${entry.description}`}
            className="question-card"
            p="md"
            radius="lg"
            withBorder
          >
            <Stack gap="xs">
              <Text fw={700} size="sm">
                {entry.date}
              </Text>
              <Text c="dimmed" size="sm">
                {entry.description}
              </Text>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Stack>
  );
}
