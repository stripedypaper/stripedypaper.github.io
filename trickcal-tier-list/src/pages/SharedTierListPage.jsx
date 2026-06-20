import { Paper, Stack, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import { ReadonlyTierList } from '../components/ReadonlyTierList.jsx';
import { SCORE_BUCKETS } from '../lib/tierBuckets.js';

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

  const scoredCharacters = mergeCharacterScores(
    characters,
    submission.derivedScores
  );

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

      <ReadonlyTierList buckets={SCORE_BUCKETS} characters={scoredCharacters} />
    </Stack>
  );
}
