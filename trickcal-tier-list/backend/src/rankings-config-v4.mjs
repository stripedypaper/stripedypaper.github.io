export const QUESTIONNAIRE_VERSION_V4 = '2026-06-22-v4';

export const PERSONALITY_ORDER_V4 = [
  'depressed',
  'vivacious',
  'innocent',
  'composed',
  'mad'
];

export const ROLE_ORDER_V4 = ['dps', 'support', 'tank'];

export const PERSONALITY_TIERS_V4 = [
  { id: 'meta_defining_plus', score: 11, yearningOnly: true },
  { id: 'meta_defining', score: 10 },
  { id: 'exceptional', score: 9 },
  { id: 'strong', score: 8 },
  { id: 'good', score: 6 },
  { id: 'usable', score: 4 },
  { id: 'do_not_use', score: 0 }
];

export const MIXED_META_TIERS_V4 = [
  { id: 'meta_defining_plus', score: 11, yearningOnly: true },
  { id: 'meta_defining', score: 10 },
  { id: 'exceptional', score: 9 },
  { id: 'strong', score: 8 },
  { id: 'good', score: 6 },
  { id: 'usable', score: 4 },
  { id: 'do_not_use', score: 0 }
];

export const FAVORITE_TIERS_V4 = [{ id: 'favorite', score: 0, maximum: 1 }];
export const OWNED_YEARNING_TIERS_V4 = [{ id: 'owned', score: 0 }];
export const OWNED_YEARNING_QUESTION_ID_V4 = 'ranking-y-1';

const OWNED_YEARNING_QUESTION_V4 = {
  id: OWNED_YEARNING_QUESTION_ID_V4,
  kind: 'owned-yearning',
  tiers: OWNED_YEARNING_TIERS_V4
};

const PERSONALITY_QUESTIONS_V4 = PERSONALITY_ORDER_V4.map(
  (personality, index) => ({
    id: `ranking-a-${index + 1}`,
    kind: 'personality',
    personality,
    tiers: PERSONALITY_TIERS_V4
  })
);

const MIXED_CRUSADE_QUESTIONS_V4 = ROLE_ORDER_V4.map((role, index) => ({
  id: `ranking-b-${index + 1}`,
  kind: 'mixed-crusade',
  role,
  tiers: MIXED_META_TIERS_V4
}));

const MIXED_FRONTIER_QUESTIONS_V4 = ROLE_ORDER_V4.map((role, index) => ({
  id: `ranking-c-${index + 1}`,
  kind: 'mixed-frontier',
  role,
  tiers: MIXED_META_TIERS_V4
}));

export const RANKING_QUESTIONS_V4 = [
  OWNED_YEARNING_QUESTION_V4,
  ...PERSONALITY_QUESTIONS_V4,
  ...MIXED_CRUSADE_QUESTIONS_V4,
  ...MIXED_FRONTIER_QUESTIONS_V4,
  {
    id: 'ranking-f-1',
    kind: 'favorite',
    tiers: FAVORITE_TIERS_V4
  }
];

export const RANKING_QUESTIONS_BY_ID_V4 = new Map(
  RANKING_QUESTIONS_V4.map((question) => [question.id, question])
);

export const PERSONALITY_QUESTION_IDS_V4 = new Map(
  PERSONALITY_QUESTIONS_V4.map((question) => [
    question.personality,
    question.id
  ])
);

export const MIXED_CRUSADE_QUESTION_IDS_V4 = new Map(
  MIXED_CRUSADE_QUESTIONS_V4.map((question) => [question.role, question.id])
);

export const MIXED_FRONTIER_QUESTION_IDS_V4 = new Map(
  MIXED_FRONTIER_QUESTIONS_V4.map((question) => [question.role, question.id])
);

export function isCharacterEligibleForQuestionV4(character, question) {
  if (question.kind === 'owned-yearning') {
    return character.isYearning;
  }

  if (question.kind === 'personality') {
    return (
      character.personality === question.personality ||
      character.personality === 'resonance'
    );
  }

  if (
    (question.kind === 'mixed-crusade' || question.kind === 'mixed-frontier') &&
    question.role
  ) {
    return character.role === question.role;
  }

  if (question.kind === 'favorite') {
    return !character.isYearning;
  }

  return true;
}

export function getTierScoreV4(question, tierId) {
  const tier = question.tiers.find((item) => item.id === tierId);
  return tier ? tier.score : null;
}

export function requiresCompleteAssignmentV4(question) {
  return (
    question?.kind === 'personality' ||
    question?.kind === 'mixed-crusade' ||
    question?.kind === 'mixed-frontier'
  );
}
