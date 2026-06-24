import { expandCharacterVariants } from './site.js';

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

const OWNED_YEARNING_QUESTION_ID_V4 = 'ranking-y-1';

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

function getQuestionTiers() {
  return [
    {
      id: 'meta_defining_plus',
      label: 'Meta-defining+',
      score: 11,
      color: 'grape',
      gradient: { from: 'pink', to: 'violet', deg: 90 },
      guidelineDescription:
        "Non-Yearning apostles cannot be placed into this tier. The purpose of this tier is for apostles whose base form is already Meta-defining (10), but for which their Yearning still provides a substantial increase in power. For example, if you believe A and B are both Meta-defining (10) in their base form but A's Yearning provides a large boost to performance in a certain context while B's provides a moderate boost, place A's Yearning in Meta-defining+ (11) and B's Yearning in Meta-defining (10).",
      yearningOnly: true
    },
    {
      id: 'meta_defining',
      label: 'Meta-defining',
      score: 10,
      color: 'grape',
      guidelineDescription:
        'Apostles that you immediately add to your team without thinking about it. Irreplaceable in their role in the current state of the game and likely to remain so for the next 6 months or longer.'
    },
    {
      id: 'exceptional',
      label: 'Exceptional',
      score: 9,
      color: 'blue',
      guidelineDescription:
        'Apostles that can easily carry the team with their utility or strength. If you substituted one of these apostles for one in a lower tier, the team would become substantially worse. Unlikely to be power crept in the next 6 months.'
    },
    {
      id: 'strong',
      label: 'Strong',
      score: 8,
      color: 'teal',
      guidelineDescription:
        'Solid and reliable apostles that perform their role at a high level, but rarely carry the team without a lot of items or specific circumstances. Strong, but not so strong that it would be a disaster if replaced with a similar apostle from the Good category.'
    },
    {
      id: 'good',
      label: 'Good',
      score: 6,
      color: 'green',
      guidelineDescription:
        'Baseline for a "good" unit. Apostles that are outclassed by others in the same category but perform their role well nonetheless. Likely to be power-crept in the next 6 months.'
    },
    {
      id: 'usable',
      label: 'Usable',
      score: 4,
      color: 'yellow',
      guidelineDescription:
        "Apostles that are functional but you generally wouldn't use if you owned anyone in the Good or higher tiers. Or, apostles who are weak in all areas but still have a niche such as a useful debuff (e.g. Festa for Frontier category)."
    },
    {
      id: 'do_not_use',
      label: 'Do not use',
      score: 0,
      color: 'red',
      guidelineDescription:
        'Outclassed in nearly every way. No niche or situational usefulness.'
    }
  ];
}

function getFavoriteQuestionTiers() {
  return [
    {
      id: 'favorite',
      label: 'Favorite',
      score: 0,
      showScore: false,
      color: 'grape',
      minimum: 1,
      maximum: 1
    }
  ];
}

function getOwnedYearningQuestionTiers() {
  return [
    {
      id: 'owned',
      label: 'Owned',
      score: 0,
      showScore: false,
      color: 'grape'
    }
  ];
}

function matchesPersonality(character, personality) {
  return (
    character.personality === personality ||
    character.personality === 'resonance'
  );
}

export function buildQuestionGroups(characters, answers = {}) {
  const candidates = expandCharacterVariants(characters);
  const ownedYearningIds = new Set(
    Object.entries(answers?.[OWNED_YEARNING_QUESTION_ID_V4] || {})
      .filter(([, tierId]) => tierId === 'owned')
      .map(([characterId]) => characterId)
  );
  const selectableCandidates = candidates.filter(
    (candidate) => !candidate.isYearning || ownedYearningIds.has(candidate.id)
  );
  const groups = [];

  groups.push({
    id: OWNED_YEARNING_QUESTION_ID_V4,
    label: 'Owned Yearnings',
    kind: 'owned-yearning',
    tiers: getOwnedYearningQuestionTiers(),
    items: candidates.filter((candidate) => candidate.isYearning)
  });

  PERSONALITY_ORDER.forEach((personality, index) => {
    const items = selectableCandidates.filter((character) =>
      matchesPersonality(character, personality)
    );

    groups.push({
      id: `ranking-a-${index + 1}`,
      label: `Ranking A${index + 1}: Mono`,
      kind: 'personality',
      personality,
      lineupGrid: {
        columns: 3,
        cells: Array.from({ length: 3 }, () =>
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
      items: selectableCandidates.filter((character) => character.role === role)
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
      items: selectableCandidates.filter((character) => character.role === role)
    });
  });

  groups.push({
    id: 'ranking-f-1',
    label: 'Ranking F: Favorite',
    kind: 'favorite',
    tiers: getFavoriteQuestionTiers(),
    items: selectableCandidates.filter((candidate) => !candidate.isYearning)
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

export function listTierEligibilityViolations(questionGroups, answers) {
  return questionGroups.flatMap((question) => {
    const placements = normalizeAssignedPlacements(answers?.[question.id]);
    if (!Object.keys(placements).length) {
      return [];
    }

    const questionItemsById = new Map(
      (question.items || []).map((item) => [item.id, item])
    );
    const tiersById = new Map(
      (question.tiers || []).map((tier) => [tier.id, tier])
    );

    return Object.entries(placements).flatMap(([characterId, tierId]) => {
      const character = questionItemsById.get(characterId);
      const tier = tiersById.get(tierId);

      if (!character || !tier?.yearningOnly || character.isYearning) {
        return [];
      }

      return [
        {
          question,
          tier,
          characterName:
            character.nameEn ||
            character.name ||
            character.characterId ||
            character.id
        }
      ];
    });
  });
}

export function listYearningBelowBaseViolations(questionGroups, answers) {
  return questionGroups.flatMap((question) => {
    const placements = normalizeAssignedPlacements(answers?.[question.id]);
    if (!Object.keys(placements).length) {
      return [];
    }

    const tierScores = new Map(
      (question.tiers || []).map((tier) => [tier.id, tier.score ?? null])
    );
    const placementsByCharacterId = new Map(Object.entries(placements));

    return (question.items || [])
      .filter((item) => item?.isYearning)
      .flatMap((item) => {
        const yearningTierId = placementsByCharacterId.get(item.id);
        if (!yearningTierId) {
          return [];
        }

        const baseCharacterId = `${item.characterId || item.id.replace(/#yearning$/, '')}#base`;
        const baseTierId = placementsByCharacterId.get(baseCharacterId);
        if (!baseTierId) {
          return [];
        }

        const yearningScore = tierScores.get(yearningTierId);
        const baseScore = tierScores.get(baseTierId);

        if (
          typeof yearningScore !== 'number' ||
          typeof baseScore !== 'number' ||
          yearningScore >= baseScore
        ) {
          return [];
        }

        return [
          {
            question,
            baseCharacterId,
            yearningCharacterId: item.id,
            characterName:
              item.nameEn || item.name || item.characterId || item.id
          }
        ];
      });
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
