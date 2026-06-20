import { Button, Group, Paper, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconShare } from '@tabler/icons-react';
import { ReadonlyTierList } from '../../components/ReadonlyTierList.jsx';
import { SCORE_BUCKETS } from '../../lib/tierBuckets.js';

function mergeCharacterScores(characters, derivedScores) {
  const charactersById = new Map(
    characters.map((character) => [character.id, character])
  );

  return derivedScores
    .map((score) => {
      const character = charactersById.get(score.characterId);
      if (!character) {
        return null;
      }

      return {
        ...character,
        ...score
      };
    })
    .filter(Boolean);
}

export function MyTierListPage({
  characters,
  loading,
  rankingsLoading,
  submission,
  user,
  sessionLoading
}) {
  const shareHref =
    user?.id && typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}${window.location.search}#/tier-list/${encodeURIComponent(user.id)}`
      : '';

  async function handleShare() {
    if (!shareHref) {
      return;
    }

    await navigator.clipboard.writeText(shareHref);
    notifications.show({
      title: 'Copied',
      message: 'Share link copied',
      color: 'grape',
      autoClose: 2200
    });
  }

  if (!sessionLoading && !user) {
    return <Text c="dimmed">Log in to view your personal tier list.</Text>;
  }

  if (loading || rankingsLoading) {
    return (
      <Paper className="question-card" p="lg" radius="lg" withBorder>
        <Text c="dimmed">Loading your tier list...</Text>
      </Paper>
    );
  }

  if (!submission?.updatedAt || !Array.isArray(submission.derivedScores)) {
    return (
      <Paper className="question-card" p="lg" radius="lg" withBorder>
        <Stack gap="xs">
          <Text fw={700} size="xl">
            My Tier List
          </Text>
          <Text c="dimmed">
            Submit your rankings first to generate your personal tier list.
          </Text>
        </Stack>
      </Paper>
    );
  }

  const scoredCharacters = mergeCharacterScores(
    characters,
    submission.derivedScores
  );

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end" gap="md">
        <div>
          <Text fw={700} size="xl">
            My Tier List
          </Text>
          <Text c="dimmed" size="sm" mt={4}>
            Generated from rankings saved{' '}
            {new Date(submission.updatedAt).toLocaleString()}.
          </Text>
        </div>

        <Button
          leftSection={<IconShare size={16} />}
          onClick={handleShare}
          disabled={!shareHref}
        >
          Share
        </Button>
      </Group>

      <ReadonlyTierList buckets={SCORE_BUCKETS} characters={scoredCharacters} />
    </Stack>
  );
}
