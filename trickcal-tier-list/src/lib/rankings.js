export const PERSONALITY_ORDER = [
  'depressed',
  'vivacious',
  'innocent',
  'composed',
  'mad'
];

export const POSITION_ORDER = ['front', 'middle', 'back'];

export const PERSONALITY_LABELS = {
  depressed: 'Depressed',
  vivacious: 'Vivacious',
  innocent: 'Innocent',
  composed: 'Composed',
  mad: 'Mad'
};

export const POSITION_LABELS = {
  front: 'Front',
  middle: 'Middle',
  back: 'Back'
};

export const PERSONA_GRID_COLORS = {
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

function normalizeAssignedPlacements(placements) {
  const assignedPlacements = {};

  for (const [characterId, tierId] of Object.entries(placements || {})) {
    if (typeof tierId !== 'string') {
      continue;
    }

    const normalizedTierId = tierId.trim();
    if (!normalizedTierId || normalizedTierId === 'unassigned') {
      continue;
    }

    assignedPlacements[characterId] = normalizedTierId;
  }

  return assignedPlacements;
}

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
        color: 'blue'
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
  return [{ id: 'niche', label: 'Niche', score: 2, color: 'grape' }];
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

export function buildQuestionGroups(characters) {
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

export function requiresCompleteAssignment(question) {
  return question?.kind === 'personality' || question?.kind === 'position';
}

export function listIncompleteRequiredQuestions(questionGroups, answers) {
  return questionGroups
    .filter((question) => requiresCompleteAssignment(question))
    .filter((question) => {
      const assignedCount = Object.keys(
        normalizeAssignedPlacements(answers?.[question.id])
      ).length;

      return assignedCount !== question.items.length;
    });
}
