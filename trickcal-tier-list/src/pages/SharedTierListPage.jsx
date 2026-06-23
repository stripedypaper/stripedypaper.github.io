import { Paper, Stack, Switch, Text } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { ReadonlyTierList } from '../components/ReadonlyTierList.jsx';
import { withQuestionnaireVersion } from '../lib/questionnaireVersion.js';
import { expandCharacterVariants } from '../lib/site.js';
import { SCORE_BUCKETS } from '../lib/tierBuckets.js';

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

async function fetchAllCharacters(apiBaseUrl) {
  const allCharacters = [];
  let cursor = null;

  do {
    const params = new URLSearchParams({ limit: '100' });

    if (cursor) {
      params.set('cursor', cursor);
    }

    const response = await fetch(`${apiBaseUrl}/admin/characters?${params}`);
    if (!response.ok) {
      throw new Error(`Character list failed with status ${response.status}.`);
    }

    const data = await response.json();
    allCharacters.push(
      ...(Array.isArray(data.characters) ? data.characters : [])
    );
    cursor = data.nextCursor || null;
  } while (cursor);

  return allCharacters;
}

async function fetchSharedSubmission(apiBaseUrl, userId, questionnaireVersion) {
  const response = await fetch(
    `${apiBaseUrl}${withQuestionnaireVersion(
      `/rankings/${encodeURIComponent(userId)}`,
      questionnaireVersion
    )}`
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Shared tier list failed with status ${response.status}.`);
  }

  const data = await response.json();
  return data.submission || null;
}

export function SharedTierListPage({
  apiBaseUrl,
  sharedUserId,
  questionnaireVersion
}) {
  const [characters, setCharacters] = useState([]);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showYearning, setShowYearning] = useState(false);
  const derivedScores = Array.isArray(submission?.derivedScores)
    ? submission.derivedScores
    : [];
  const scoredCharacters = useMemo(
    () =>
      mergeCharacterScores(characters, derivedScores, questionnaireVersion),
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
              scoredVariantKeys.has(character.characterVariantKey || character.id)
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
              !scoredVariantKeys.has(character.characterVariantKey || character.id)
          )
        : [],
    [allVariants, scoredVariantKeys, showYearning]
  );

  useEffect(() => {
    let active = true;

    async function load() {
      if (!apiBaseUrl || !sharedUserId) {
        if (active) {
          setLoading(false);
        }
        return;
      }

      if (active) {
        setLoading(true);
        setError('');
      }

      try {
        const [nextCharacters, nextSubmission] = await Promise.all([
          fetchAllCharacters(apiBaseUrl),
          fetchSharedSubmission(apiBaseUrl, sharedUserId, questionnaireVersion)
        ]);

        if (!active) {
          return;
        }

        setCharacters(nextCharacters);
        setSubmission(nextSubmission);
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load shared tier list.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [apiBaseUrl, questionnaireVersion, sharedUserId]);

  if (loading) {
    return (
      <Paper className="question-card" p="lg" radius="lg" withBorder>
        <Text c="dimmed">Loading shared tier list...</Text>
      </Paper>
    );
  }

  if (error) {
    return <Text c="red">{error}</Text>;
  }

  if (!submission?.updatedAt || !Array.isArray(submission.derivedScores)) {
    return (
      <Paper className="question-card" p="lg" radius="lg" withBorder>
        <Stack gap="xs">
          <Text fw={700} size="xl">
            Shared Tier List
          </Text>
          <Text c="dimmed">
            No submitted rankings were found for this user.
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack gap="lg">
      <div>
        <Text fw={700} size="xl">
          Shared Tier List
        </Text>
        <Text c="dimmed" size="sm" mt={4}>
          Generated from rankings saved{' '}
          {new Date(submission.updatedAt).toLocaleString()}.
        </Text>
      </div>

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
