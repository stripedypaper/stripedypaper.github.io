import { Button, Group, Paper, Stack, Switch, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconShare } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { ReadonlyTierList } from '../../components/ReadonlyTierList.jsx';
import { DEFAULT_QUESTIONNAIRE_VERSION } from '../../lib/questionnaireVersion.js';
import { expandCharacterVariants } from '../../lib/site.js';
import { SCORE_BUCKETS } from '../../lib/tierBuckets.js';

function roundToTwo(value) {
  return Number((value || 0).toFixed(2));
}

function mergeCharacterScores(characters, derivedScores, questionnaireVersion) {
  const variants = expandCharacterVariants(characters, questionnaireVersion);
  const charactersById = new Map(
    variants.map((character) => [
      character.characterVariantKey || character.id,
      character
    ])
  );

  return derivedScores
    .map((score) => {
      const character = charactersById.get(
        score.characterVariantKey || score.characterId
      );
      if (!character) {
        return null;
      }

      return {
        ...character,
        ...score,
        secondaryText: String(roundToTwo(score.calculatedScore || 0))
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
  sessionLoading,
  questionnaireVersion = DEFAULT_QUESTIONNAIRE_VERSION
}) {
  const [showYearning, setShowYearning] = useState(false);
  const shareHref =
    user?.id && typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?questionnaireVersion=${encodeURIComponent(questionnaireVersion)}#/tier-list/${encodeURIComponent(user.id)}`
      : '';
  const derivedScores = Array.isArray(submission?.derivedScores)
    ? submission.derivedScores
    : [];
  const scoredCharacters = useMemo(
    () => mergeCharacterScores(characters, derivedScores, questionnaireVersion),
    [characters, derivedScores, questionnaireVersion]
  );
  const allVariants = useMemo(
    () => expandCharacterVariants(characters, questionnaireVersion),
    [characters, questionnaireVersion]
  );
  const scoredVariantKeys = useMemo(
    () =>
      new Set(
        scoredCharacters.map(
          (character) => character.characterVariantKey || character.id
        )
      ),
    [scoredCharacters]
  );
  const visibleCharacters = useMemo(
    () =>
      showYearning
        ? scoredCharacters.filter(
            (character) =>
              !character.isYearning ||
              scoredVariantKeys.has(
                character.characterVariantKey || character.id
              )
          )
        : scoredCharacters.filter((character) => !character.isYearning),
    [scoredCharacters, scoredVariantKeys, showYearning]
  );
  const unratedYearnings = useMemo(
    () =>
      showYearning
        ? allVariants.filter(
            (character) =>
              character.isYearning &&
              !scoredVariantKeys.has(
                character.characterVariantKey || character.id
              )
          )
        : [],
    [allVariants, scoredVariantKeys, showYearning]
  );

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

      <Switch
        checked={showYearning}
        onChange={(event) => setShowYearning(event.currentTarget.checked)}
        label="Show Yearning"
      />

      <ReadonlyTierList
        buckets={SCORE_BUCKETS}
        characters={visibleCharacters}
        extraBucket={
          showYearning
            ? {
                id: 'unrated-yearnings',
                label: 'Unrated Yearnings',
                color: 'gray',
                items: unratedYearnings
              }
            : null
        }
      />
    </Stack>
  );
}
