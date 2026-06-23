export const QUESTIONNAIRE_VERSION_V2 = '2026-06-22-v2';

export const PERSONALITY_ORDER_V2 = [
  'depressed',
  'vivacious',
  'innocent',
  'composed',
  'mad'
];

export const ROLE_ORDER_V2 = ['dps', 'support', 'tank'];

export const PERSONALITY_TIERS_V2 = [
  { id: 'top_6', score: 10, maximum: 6 },
  { id: 'good_alternatives', score: 8 },
  { id: 'good', score: 6 },
  { id: 'usable', score: 4 },
  { id: 'do_not_use', score: 0 }
];

export const MIXED_META_TIERS_V2 = [
  { id: 'meta_defining', score: 10 },
  { id: 'exceptional', score: 9 },
  { id: 'strong', score: 8 },
  { id: 'good', score: 6 },
  { id: 'usable', score: 4 },
  { id: 'do_not_use', score: 0 }
];

export const FAVORITE_TIERS_V2 = [{ id: 'favorite', score: 0, maximum: 1 }];

const PERSONALITY_QUESTIONS_V2 = PERSONALITY_ORDER_V2.map(
  (personality, index) => ({
    id: `ranking-a-${index + 1}`,
    kind: 'personality',
    personality,
    tiers: PERSONALITY_TIERS_V2
  })
);

const MIXED_CRUSADE_QUESTIONS_V2 = ROLE_ORDER_V2.map((role, index) => ({
  id: `ranking-b-${index + 1}`,
  kind: 'mixed-crusade',
  role,
  tiers: MIXED_META_TIERS_V2
}));

const MIXED_FRONTIER_QUESTIONS_V2 = ROLE_ORDER_V2.map((role, index) => ({
  id: `ranking-c-${index + 1}`,
  kind: 'mixed-frontier',
  role,
  tiers: MIXED_META_TIERS_V2
}));

export const RANKING_QUESTIONS_V2 = [
  ...PERSONALITY_QUESTIONS_V2,
  ...MIXED_CRUSADE_QUESTIONS_V2,
  ...MIXED_FRONTIER_QUESTIONS_V2,
  {
    id: 'ranking-f-1',
    kind: 'favorite',
    tiers: FAVORITE_TIERS_V2
  }
];

export const RANKING_QUESTIONS_BY_ID_V2 = new Map(
  RANKING_QUESTIONS_V2.map((question) => [question.id, question])
);

export const PERSONALITY_QUESTION_IDS_V2 = new Map(
  PERSONALITY_QUESTIONS_V2.map((question) => [
    question.personality,
    question.id
  ])
);

export const MIXED_CRUSADE_QUESTION_IDS_V2 = new Map(
  MIXED_CRUSADE_QUESTIONS_V2.map((question) => [question.role, question.id])
);

export const MIXED_FRONTIER_QUESTION_IDS_V2 = new Map(
  MIXED_FRONTIER_QUESTIONS_V2.map((question) => [question.role, question.id])
);

export function isCharacterEligibleForQuestionV2(character, question) {
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

  return true;
}

export function getTierScoreV2(question, tierId) {
  const tier = question.tiers.find((item) => item.id === tierId);
  return tier ? tier.score : null;
}

export function requiresCompleteAssignmentV2(question) {
  return (
    question?.kind === 'personality' ||
    question?.kind === 'mixed-crusade' ||
    question?.kind === 'mixed-frontier'
  );
}
