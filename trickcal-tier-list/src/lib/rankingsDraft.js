const RANKINGS_DRAFT_STORAGE_PREFIX = 'trickcal_rankings_draft_v4';
const ANONYMOUS_DRAFT_KEY = 'anonymous';

function hasAnyAnswers(answers) {
  return Object.values(answers || {}).some(
    (placements) => placements && Object.keys(placements).length > 0
  );
}

function getDraftStorageKey(userId) {
  return `${RANKINGS_DRAFT_STORAGE_PREFIX}:${userId || ANONYMOUS_DRAFT_KEY}`;
}

function canUseStorage() {
  return typeof window !== 'undefined' && !!window.localStorage;
}

function readDraftByKey(storageKey) {
  if (!canUseStorage()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(storageKey);
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    if (!parsedValue || typeof parsedValue !== 'object') {
      return null;
    }

    const answers =
      parsedValue.answers && typeof parsedValue.answers === 'object'
        ? parsedValue.answers
        : {};

    if (!hasAnyAnswers(answers)) {
      return null;
    }

    return {
      answers,
      updatedAt:
        typeof parsedValue.updatedAt === 'string' ? parsedValue.updatedAt : ''
    };
  } catch {
    return null;
  }
}

export function readRankingsDraft(userId) {
  if (userId) {
    const userDraft = readDraftByKey(getDraftStorageKey(userId));
    if (userDraft) {
      return {
        ...userDraft,
        scope: 'user'
      };
    }
  }

  const anonymousDraft = readDraftByKey(getDraftStorageKey());
  if (!anonymousDraft) {
    return null;
  }

  return {
    ...anonymousDraft,
    scope: 'anonymous'
  };
}

export function writeRankingsDraft(userId, answers) {
  if (!canUseStorage()) {
    return;
  }

  if (!hasAnyAnswers(answers)) {
    clearRankingsDraft(userId);
    return;
  }

  window.localStorage.setItem(
    getDraftStorageKey(userId),
    JSON.stringify({
      answers: answers || {},
      updatedAt: new Date().toISOString()
    })
  );
}

export function clearRankingsDraft(userId) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(getDraftStorageKey(userId));
}

export function clearAnonymousRankingsDraft() {
  clearRankingsDraft();
}
