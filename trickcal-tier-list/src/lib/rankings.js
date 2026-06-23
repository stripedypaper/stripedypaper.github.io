export const PERSONALITY_ORDER = [
  'depressed',
  'vivacious',
  'innocent',
  'composed',
  'mad'
];

export const POSITION_ORDER = ['front', 'middle', 'back'];
export const ROLE_ORDER = ['dps', 'support', 'tank'];

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

export const ROLE_LABELS = {
  dps: 'DPS',
  support: 'Support',
  tank: 'Tank'
};

export const PERSONA_GRID_COLORS = {
  depressed: '#c684ec',
  vivacious: '#ecdc84',
  innocent: '#91f2a8',
  composed: '#89beef',
  mad: '#ec849d'
};

const MIXED_CRUSADE_LINEUP_GRID = [
  ['#ecdc84', '#89beef', '#ec849d'],
  ['#91f2a8', '#c684ec', '#ecdc84']
];

const MIXED_FRONTIER_LINEUP_GRID = [
  ['#c684ec', '#ecdc84', '#89beef'],
  ['#91f2a8', '#ec849d', '#c684ec'],
  ['#89beef', '#91f2a8', '#ecdc84']
];

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
        score: 10,
        color: 'grape',
        minimum: 6,
        maximum: 6
      },
      {
        id: 'good_alternatives',
        label: 'Best alternatives',
        score: 8,
        color: 'blue'
      },
      {
        id: 'good',
        label: 'Good',
        score: 6,
        color: 'teal'
      },
      {
        id: 'usable',
        label: 'Usable',
        score: 4,
        color: 'yellow'
      },
      { id: 'do_not_use', label: 'Do not use', score: 0, color: 'red' }
    ];
  }

  return [
    {
      id: 'meta_defining',
      label: 'Meta-defining',
      score: 10,
      color: 'grape'
    },
    { id: 'exceptional', label: 'Exceptional', score: 9, color: 'blue' },
    { id: 'strong', label: 'Strong', score: 8, color: 'teal' },
    { id: 'good', label: 'Good', score: 6, color: 'green' },
    { id: 'usable', label: 'Usable', score: 4, color: 'yellow' },
    { id: 'do_not_use', label: 'Do not use', score: 0, color: 'red' }
  ];
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
      label: `Ranking A${index + 1}: Mono`,
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

  ROLE_ORDER.forEach((role, index) => {
    groups.push({
      id: `ranking-b-${index + 1}`,
      label: `Ranking B${index + 1}: Crusade (${ROLE_LABELS[role]})`,
      kind: 'mixed-crusade',
      role,
      headerImageName: `class_${role}.webp`,
      lineupGrid: {
        columns: 3,
        cells: MIXED_CRUSADE_LINEUP_GRID,
        trailingEmojiGrid: {
          columns: 2,
          items: ['🐻', '👻', '🐻', '👻']
        }
      },
      tiers: getQuestionTiers('mixed'),
      items: characters.filter((character) => character.role === role)
    });
  });

  ROLE_ORDER.forEach((role, index) => {
    groups.push({
      id: `ranking-c-${index + 1}`,
      label: `Ranking C${index + 1}: Frontier (${ROLE_LABELS[role]})`,
      kind: 'mixed-frontier',
      role,
      headerImageName: `class_${role}.webp`,
      lineupGrid: {
        columns: 3,
        cells: MIXED_FRONTIER_LINEUP_GRID,
        trailingEmoji: '👾'
      },
      tiers: getQuestionTiers('mixed'),
      items: characters.filter((character) => character.role === role)
    });
  });

  groups.push({
    id: 'ranking-f-1',
    label: 'Ranking F: Favorite',
    kind: 'favorite',
    tiers: getFavoriteQuestionTiers(),
    items: [...characters]
  });

  return groups;
}

export function requiresCompleteAssignment(question) {
  return (
    question?.kind === 'personality' ||
    question?.kind === 'mixed-crusade' ||
    question?.kind === 'mixed-frontier'
  );
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

export function listQuestionsWithUnsatisfiedMinimums(questionGroups, answers) {
  return questionGroups.flatMap((question) => {
    const placements = normalizeAssignedPlacements(answers?.[question.id]);
    const countsByTierId = Object.values(placements).reduce(
      (counts, tierId) => {
        counts[tierId] = (counts[tierId] || 0) + 1;
        return counts;
      },
      {}
    );

    return (question.tiers || [])
      .filter(
        (tier) =>
          typeof tier.minimum === 'number' &&
          (countsByTierId[tier.id] || 0) < tier.minimum
      )
      .map((tier) => ({
        question,
        tier,
        assignedCount: countsByTierId[tier.id] || 0
      }));
  });
}

export function sanitizePlacementsByQuestion(questionGroups, answers) {
  const sanitized = {};

  for (const question of questionGroups) {
    const rawPlacements = answers?.[question.id];
    if (!rawPlacements || typeof rawPlacements !== 'object') {
      continue;
    }

    const eligibleCharacterIds = new Set(
      (question.items || []).map((item) => item.id)
    );
    const allowedTierIds = new Set(
      (question.tiers || []).map((tier) => tier.id)
    );
    const nextPlacements = {};

    for (const [characterId, tierId] of Object.entries(
      normalizeAssignedPlacements(rawPlacements)
    )) {
      if (
        !eligibleCharacterIds.has(characterId) ||
        !allowedTierIds.has(tierId)
      ) {
        continue;
      }

      nextPlacements[characterId] = tierId;
    }

    if (Object.keys(nextPlacements).length > 0) {
      sanitized[question.id] = nextPlacements;
    }
  }

  return sanitized;
}
