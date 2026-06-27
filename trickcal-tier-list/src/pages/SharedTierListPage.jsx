import { Paper, Stack, Text } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { ReadonlyTierListSection } from '../components/ReadonlyTierListSection.jsx';
import { fetchAllCharacters } from '../lib/charactersApi.js';
import { formatDate } from '../lib/site.js';
import {
  buildReadonlyTierListDisplay,
  hasRatedVariant,
  mergeCharacterScores
} from '../lib/readonlyTierList.js';

async function fetchSharedSubmission(apiBaseUrl, userId) {
  const response = await fetch(
    `${apiBaseUrl}/rankings/${encodeURIComponent(userId)}`
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

export function SharedTierListPage({ apiBaseUrl, sharedUserId }) {
  const [characters, setCharacters] = useState([]);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showYearning, setShowYearning] = useState(false);
  const derivedScores = Array.isArray(submission?.derivedScores)
    ? submission.derivedScores
    : [];
  const scoredCharacters = useMemo(
    () => mergeCharacterScores(characters, derivedScores),
    [characters, derivedScores]
  );
  const { visibleCharacters, unratedCharacters } = useMemo(
    () =>
      buildReadonlyTierListDisplay({
        allCharacters: characters,
        scoredCharacters,
        showYearning,
        isCharacterRated: hasRatedVariant
      }),
    [characters, scoredCharacters, showYearning]
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
          fetchSharedSubmission(apiBaseUrl, sharedUserId)
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
  }, [apiBaseUrl, sharedUserId]);

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
          Generated from rankings saved {formatDate(submission.updatedAt)}.
        </Text>
      </div>

      <ReadonlyTierListSection
        showYearning={showYearning}
        onShowYearningChange={setShowYearning}
        characters={visibleCharacters}
        unratedCharacters={unratedCharacters}
      />
    </Stack>
  );
}
