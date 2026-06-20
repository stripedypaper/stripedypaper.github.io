import { Group, Paper, Skeleton, Stack, Text } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { LineupGrid } from '../components/LineupGrid.jsx';
import { TierList } from '../components/TierList.jsx';

const PERSONALITY_ORDER = [
  'depressed',
  'vivacious',
  'innocent',
  'composed',
  'mad'
];

const POSITION_ORDER = ['front', 'middle', 'back'];

const PERSONALITY_LABELS = {
  depressed: 'Depressed',
  vivacious: 'Vivacious',
  innocent: 'Innocent',
  composed: 'Composed',
  mad: 'Mad'
};

const POSITION_LABELS = {
  front: 'Front',
  middle: 'Middle',
  back: 'Back'
};

const PERSONA_GRID_COLORS = {
  depressed: '#c684ec',
  vivacious: '#ecdc84',
  innocent: '#91f2a8',
  composed: '#89beef',
  mad: '#ec849d'
};

const POSITION_LINEUP_GRID = [
  ['#c684ec', '#ecdc84', '#89beef'],
  ['#91f2a8', '#ec849d', '#c684ec'],
  ['#89beef', '#91f2a8', '#ecdc84']
];

const POSITION_HIGHLIGHT_COLUMNS = {
  front: 2,
  middle: 1,
  back: 0
};

function getQuestionTiers(questionKind) {
  if (questionKind === 'personality') {
    return [
      {
        id: 'top_6',
        label: 'Top 6',
        score: 5,
        color: 'grape',
        minimum: 6,
        maximum: 6
      },
      {
        id: 'good_alternatives',
        label: 'Good alternatives',
        score: 4,
        color: 'green'
      },
      {
        id: 'usable',
        label: 'Usable',
        score: 2,
        color: 'yellow'
      },
      { id: 'do_not_use', label: 'Do not use', score: 0, color: 'red' }
    ];
  }

  return [
    { id: 'exceptional', label: 'Exceptional', score: 5, color: 'grape' },
    { id: 'strong', label: 'Strong', score: 4, color: 'blue' },
    { id: 'good', label: 'Good', score: 3, color: 'green' },
    { id: 'usable', label: 'Usable', score: 2, color: 'yellow' },
    { id: 'do_not_use', label: 'Do not use', score: 0, color: 'red' }
  ];
}

function getNicheQuestionTiers() {
  return [{ id: 'niche', label: 'Niche', score: 1, color: 'grape' }];
}

function getFavoriteQuestionTiers() {
  return [
    {
      id: 'favorite',
      label: 'Favorite',
      score: 0,
      color: 'grape',
      minimum: 1,
      maximum: 1
    }
  ];
}

function matchesPersonality(character, personality) {
  return (
    character.personality === personality ||
    character.personality === 'resonance'
  );
}

function buildQuestionGroups(characters) {
  const groups = [];

  PERSONALITY_ORDER.forEach((personality, index) => {
    const items = characters.filter((character) =>
      matchesPersonality(character, personality)
    );

    groups.push({
      id: `ranking-a-${index + 1}`,
      label: `Ranking A${index + 1}`,
      kind: 'personality',
      personality,
      lineupGrid: {
        columns: 3,
        cells: Array.from({ length: 2 }, () =>
          Array.from({ length: 3 }, () => PERSONA_GRID_COLORS[personality])
        )
      },
      tiers: getQuestionTiers('personality'),
      items
    });
  });

  POSITION_ORDER.forEach((position, index) => {
    const items = characters.filter(
      (character) => character.position === position
    );

    groups.push({
      id: `ranking-b-${index + 1}`,
      label: `Ranking B${index + 1}`,
      kind: 'position',
      position,
      lineupGrid: {
        columns: 3,
        cells: POSITION_LINEUP_GRID,
        highlightColumn: POSITION_HIGHLIGHT_COLUMNS[position]
      },
      tiers: getQuestionTiers('position'),
      items
    });
  });

  groups.push({
    id: 'ranking-c-1',
    label: 'Ranking C1',
    kind: 'niche',
    tiers: getNicheQuestionTiers(),
    items: [...characters]
  });

  groups.push({
    id: 'ranking-d-1',
    label: 'Ranking D1',
    kind: 'favorite',
    tiers: getFavoriteQuestionTiers(),
    items: [...characters]
  });

  return groups;
}

async function fetchAllCharacters(apiBaseUrl) {
  const allCharacters = [];
  let cursor = null;

  do {
    const params = new URLSearchParams({
      limit: '100'
    });

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

export function ContributePage({ apiBaseUrl }) {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadCharacters() {
      if (!apiBaseUrl) {
        return;
      }

      if (active) {
        setLoading(true);
        setError('');
      }

      try {
        const data = await fetchAllCharacters(apiBaseUrl);
        if (!active) {
          return;
        }

        setCharacters(data);
      } catch (fetchError) {
        if (active) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : 'Unable to load characters.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCharacters();

    return () => {
      active = false;
    };
  }, [apiBaseUrl]);

  const questionGroups = useMemo(() => {
    return buildQuestionGroups(characters);
  }, [characters]);

  function renderQuestionPrompt(question) {
    if (question.kind === 'personality') {
      return (
        <Text mt="xs">
          For{' '}
          <Text span fw={700} c={PERSONA_GRID_COLORS[question.personality]}>
            6-person restricted personality
          </Text>{' '}
          content, choose the apostles you would use in your ideal lineup.
        </Text>
      );
    }

    if (question.kind === 'niche') {
      return (
        <Text mt="xs">
          Indicate any apostles which you think have niche usefulness or reason
          to pull outside of the above rankings. For example: PvP, A-Club,
          access to certain debuffs, cheesing certain stages, etc. Apostles who
          already have score of 7 or higher will not receive a score increase
          from this ranking.
        </Text>
      );
    }

    if (question.kind === 'favorite') {
      return (
        <Text mt="xs">
          Choose your favorite apostle! Does not affect score.
        </Text>
      );
    }

    return (
      <Text mt="xs">
        For{' '}
        <Text span fw={700}>
          9-person content with no personality bonus
        </Text>
        , rate the apostles based on their performance relative to others in the{' '}
        <Text span fw={700}>
          {POSITION_LABELS[question.position] || question.position} position
        </Text>
        .
      </Text>
    );
  }

  return (
    <Stack gap="lg">
      <div>
        <Text fw={700} size="xl">
          My Rankings
        </Text>
      </div>

      {error ? (
        <Text c="red">{error}</Text>
      ) : loading ? (
        <Stack gap="md">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={`question-skeleton-${index}`}
              height={240}
              radius="lg"
            />
          ))}
        </Stack>
      ) : (
        <Stack gap="md">
          {questionGroups.map((question) => (
            <Paper
              key={question.id}
              className="question-card"
              p="lg"
              radius="lg"
              withBorder
            >
              <Stack gap="md">
                <div>
                  <Group justify="space-between" align="flex-start" gap="md">
                    <div>
                      <Text fw={700} size="lg">
                        {question.label}
                      </Text>
                    </div>
                    {question.lineupGrid ? (
                      <LineupGrid
                        columns={question.lineupGrid.columns}
                        cells={question.lineupGrid.cells}
                        highlightColumn={
                          question.lineupGrid.highlightColumn ?? null
                        }
                      />
                    ) : null}
                  </Group>
                  {renderQuestionPrompt(question)}
                </div>

                <TierList
                  key={question.id}
                  tiers={question.tiers}
                  items={question.items}
                />
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
