export const QUESTIONNAIRE_VERSION = '2026-06-20-v1';

export const PERSONALITY_ORDER = [
  'depressed',
  'vivacious',
  'innocent',
  'composed',
  'mad'
];

export const POSITION_ORDER = ['front', 'middle', 'back'];

export const PERSONALITY_TIERS = [
  { id: 'top_6', score: 5, maximum: 6 },
  { id: 'good_alternatives', score: 4 },
  { id: 'usable', score: 2 },
  { id: 'do_not_use', score: 0 }
];

export const POSITION_TIERS = [
  { id: 'exceptional', score: 5 },
  { id: 'strong', score: 4 },
  { id: 'good', score: 3 },
  { id: 'usable', score: 2 },
  { id: 'do_not_use', score: 0 }
];

export const NICHE_TIERS = [{ id: 'niche', score: 2 }];
export const FAVORITE_TIERS = [{ id: 'favorite', score: 0, maximum: 1 }];

const PERSONALITY_QUESTIONS = PERSONALITY_ORDER.map((personality, index) => ({
  id: `ranking-a-${index + 1}`,
  kind: 'personality',
  personality,
  tiers: PERSONALITY_TIERS
}));

const POSITION_QUESTIONS = POSITION_ORDER.map((position, index) => ({
  id: `ranking-b-${index + 1}`,
  kind: 'position',
  position,
  tiers: POSITION_TIERS
}));

export const RANKING_QUESTIONS = [
  ...PERSONALITY_QUESTIONS,
  ...POSITION_QUESTIONS,
  {
    id: 'ranking-c-1',
    kind: 'niche',
    tiers: NICHE_TIERS
  },
  {
    id: 'ranking-d-1',
    kind: 'favorite',
    tiers: FAVORITE_TIERS
  }
];

export const RANKING_QUESTIONS_BY_ID = new Map(
  RANKING_QUESTIONS.map((question) => [question.id, question])
);

export const PERSONALITY_QUESTION_IDS = new Map(
  PERSONALITY_QUESTIONS.map((question) => [question.personality, question.id])
);

export const POSITION_QUESTION_IDS = new Map(
  POSITION_QUESTIONS.map((question) => [question.position, question.id])
);

export function isCharacterEligibleForQuestion(character, question) {
  if (question.kind === 'personality') {
    return (
      character.personality === question.personality ||
      character.personality === 'resonance'
    );
  }

  if (question.kind === 'position') {
    return character.position === question.position;
  }

  return true;
}

export function getTierScore(question, tierId) {
  const tier = question.tiers.find((item) => item.id === tierId);
  return tier ? tier.score : null;
}
