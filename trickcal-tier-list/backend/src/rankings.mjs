import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  QueryCommand
} from '@aws-sdk/client-dynamodb';
import { listAllCharacters } from './characters.mjs';
import {
  getUserFavoriteCharacterId,
  saveUserFavoriteCharacterId
} from './favorites.mjs';
import {
  PERSONALITY_QUESTION_IDS,
  POSITION_QUESTION_IDS,
  QUESTIONNAIRE_VERSION,
  RANKING_QUESTIONS,
  RANKING_QUESTIONS_BY_ID,
  getTierScore,
  isCharacterEligibleForQuestion,
  requiresCompleteAssignment
} from './rankings-config.mjs';
import {
  MIXED_CRUSADE_QUESTION_IDS_V2,
  MIXED_FRONTIER_QUESTION_IDS_V2,
  PERSONALITY_QUESTION_IDS_V2,
  RANKING_QUESTIONS_BY_ID_V2,
  RANKING_QUESTIONS_V2,
  getTierScoreV2,
  isCharacterEligibleForQuestionV2,
  requiresCompleteAssignmentV2
} from './rankings-config-v2.mjs';
import {
  MIXED_CRUSADE_QUESTION_IDS_V4,
  MIXED_FRONTIER_QUESTION_IDS_V4,
  OWNED_YEARNING_QUESTION_ID_V4,
  PERSONALITY_QUESTION_IDS_V4,
  RANKING_QUESTIONS_BY_ID_V4,
  RANKING_QUESTIONS_V4,
  getTierScoreV4,
  isCharacterEligibleForQuestionV4,
  requiresCompleteAssignmentV4
} from './rankings-config-v4.mjs';
import {
  ACTIVE_QUESTIONNAIRE_VERSION,
  LEGACY_QUESTIONNAIRE_VERSION,
  isQuestionnaireVersionV2,
  isQuestionnaireVersionV4,
  resolveQuestionnaireVersion
} from './questionnaire-version.mjs';
import { calculateQuestionnaireV2Score } from './score-weights.mjs';

const RANKING_SUBMISSIONS_TABLE_NAME =
  process.env.RANKING_SUBMISSIONS_TABLE_NAME;
const USER_CHARACTER_SCORES_TABLE_NAME =
  process.env.USER_CHARACTER_SCORES_TABLE_NAME;
const RANKING_SUBMISSIONS_V2_TABLE_NAME =
  process.env.RANKING_SUBMISSIONS_V2_TABLE_NAME;
const USER_CHARACTER_SCORES_V2_TABLE_NAME =
  process.env.USER_CHARACTER_SCORES_V2_TABLE_NAME;
const USER_CHARACTER_SCORES_V4_TABLE_NAME =
  process.env.USER_CHARACTER_SCORES_V4_TABLE_NAME;

const MODERN_RANKING_CONFIGS = {
  v2: {
    questions: RANKING_QUESTIONS_V2,
    questionsById: RANKING_QUESTIONS_BY_ID_V2,
    personalityQuestionIds: PERSONALITY_QUESTION_IDS_V2,
    mixedCrusadeQuestionIds: MIXED_CRUSADE_QUESTION_IDS_V2,
    mixedFrontierQuestionIds: MIXED_FRONTIER_QUESTION_IDS_V2,
    getTierScore: getTierScoreV2,
    isCharacterEligibleForQuestion: isCharacterEligibleForQuestionV2,
    requiresCompleteAssignment: requiresCompleteAssignmentV2,
    variantAware: false
  },
  v4: {
    questions: RANKING_QUESTIONS_V4,
    questionsById: RANKING_QUESTIONS_BY_ID_V4,
    personalityQuestionIds: PERSONALITY_QUESTION_IDS_V4,
    mixedCrusadeQuestionIds: MIXED_CRUSADE_QUESTION_IDS_V4,
    mixedFrontierQuestionIds: MIXED_FRONTIER_QUESTION_IDS_V4,
    getTierScore: getTierScoreV4,
    isCharacterEligibleForQuestion: isCharacterEligibleForQuestionV4,
    requiresCompleteAssignment: requiresCompleteAssignmentV4,
    variantAware: true
  }
};

const ddbClient = new DynamoDBClient({});

export async function getRankingSubmission(userId, questionnaireVersionInput) {
  const questionnaireVersion = resolveQuestionnaireVersion(
    questionnaireVersionInput
  );

  if (questionnaireVersion !== LEGACY_QUESTIONNAIRE_VERSION) {
    return getRankingSubmissionModern(userId, questionnaireVersion);
  }

  return getRankingSubmissionLegacy(userId);
}

export async function saveRankingSubmission(
  userId,
  answersInput,
  questionnaireVersionInput
) {
  const questionnaireVersion = resolveQuestionnaireVersion(
    questionnaireVersionInput
  );

  if (questionnaireVersion !== LEGACY_QUESTIONNAIRE_VERSION) {
    return saveRankingSubmissionModern(
      userId,
      answersInput,
      questionnaireVersion
    );
  }

  return saveRankingSubmissionLegacy(userId, answersInput);
}

export async function listUserCharacterScores(
  userId,
  questionnaireVersionInput
) {
  const questionnaireVersion = resolveQuestionnaireVersion(
    questionnaireVersionInput
  );

  if (questionnaireVersion !== LEGACY_QUESTIONNAIRE_VERSION) {
    return listUserCharacterScoresV2(userId, questionnaireVersion);
  }

  return listUserCharacterScoresLegacy(userId);
}

async function getRankingSubmissionLegacy(userId) {
  if (!RANKING_SUBMISSIONS_TABLE_NAME || !userId) {
    return null;
  }

  const response = await ddbClient.send(
    new GetItemCommand({
      TableName: RANKING_SUBMISSIONS_TABLE_NAME,
      Key: {
        userId: { S: userId }
      }
    })
  );

  const submission = response.Item
    ? parseRankingSubmission(response.Item)
    : null;

  if (!submission) {
    return null;
  }

  const [derivedScores, favoriteCharacterId] = await Promise.all([
    listUserCharacterScoresLegacy(userId),
    getUserFavoriteCharacterId(userId)
  ]);

  return withFavoriteSelection(
    {
      ...submission,
      questionnaireVersion: LEGACY_QUESTIONNAIRE_VERSION,
      derivedScores
    },
    favoriteCharacterId,
    'ranking-d-1'
  );
}

async function saveRankingSubmissionLegacy(userId, answersInput) {
  assertLegacyRankingsConfigured();

  const characters = await listAllCharacters();
  const answers = validateAnswers({
    answersInput,
    candidates: characters,
    questions: RANKING_QUESTIONS,
    isCharacterEligibleForQuestion,
    requiresCompleteAssignment,
    questionnaireLabel: QUESTIONNAIRE_VERSION
  });
  const now = new Date().toISOString();
  const existingScores = await listUserCharacterScoresLegacy(userId);
  const nextScores = deriveCharacterScoresLegacy(
    userId,
    answers,
    characters,
    now
  );
  const favoriteCharacterId = getFavoriteCharacterIdFromAnswers(
    answers,
    'ranking-d-1'
  );

  await ddbClient.send(
    new PutItemCommand({
      TableName: RANKING_SUBMISSIONS_TABLE_NAME,
      Item: buildRankingSubmissionItemLegacy({
        userId,
        questionnaireVersion: LEGACY_QUESTIONNAIRE_VERSION,
        answers,
        submittedAt: now,
        updatedAt: now
      })
    })
  );

  const nextCharacterIds = new Set(
    nextScores.map((score) => score.characterVariantKey || score.characterId)
  );

  await Promise.all(
    nextScores.map((score) =>
      ddbClient.send(
        new PutItemCommand({
          TableName: USER_CHARACTER_SCORES_TABLE_NAME,
          Item: buildUserCharacterScoreItemLegacy(score)
        })
      )
    )
  );

  await Promise.all(
    existingScores
      .filter(
        (score) =>
          !nextCharacterIds.has(score.characterVariantKey || score.characterId)
      )
      .map((score) =>
        ddbClient.send(
          new DeleteItemCommand({
            TableName: USER_CHARACTER_SCORES_TABLE_NAME,
            Key: {
              userId: { S: userId },
              characterId: { S: score.characterId }
            }
          })
        )
      )
  );

  await saveUserFavoriteCharacterId(userId, favoriteCharacterId, now);

  return {
    submission: withFavoriteSelection(
      {
        userId,
        questionnaireVersion: LEGACY_QUESTIONNAIRE_VERSION,
        answers,
        submittedAt: now,
        updatedAt: now,
        derivedScores: nextScores
      },
      favoriteCharacterId,
      'ranking-d-1'
    ),
    derivedScores: nextScores
  };
}

async function listUserCharacterScoresLegacy(userId) {
  if (!USER_CHARACTER_SCORES_TABLE_NAME || !userId) {
    return [];
  }

  const scores = [];
  let exclusiveStartKey;

  do {
    const response = await ddbClient.send(
      new QueryCommand({
        TableName: USER_CHARACTER_SCORES_TABLE_NAME,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': { S: userId }
        },
        ExclusiveStartKey: exclusiveStartKey
      })
    );

    scores.push(...(response.Items || []).map(parseUserCharacterScoreLegacy));
    exclusiveStartKey = response.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return scores;
}

async function getRankingSubmissionModern(userId, questionnaireVersion) {
  if (!RANKING_SUBMISSIONS_V2_TABLE_NAME || !userId) {
    return null;
  }

  const response = await ddbClient.send(
    new GetItemCommand({
      TableName: RANKING_SUBMISSIONS_V2_TABLE_NAME,
      Key: {
        userId: { S: userId },
        questionnaireVersion: { S: questionnaireVersion }
      }
    })
  );

  const submission = response.Item
    ? parseRankingSubmissionV2(response.Item)
    : null;

  if (!submission) {
    return null;
  }

  const [derivedScores, favoriteCharacterId] = await Promise.all([
    listUserCharacterScoresV2(userId, questionnaireVersion),
    getUserFavoriteCharacterId(userId)
  ]);

  return withFavoriteSelection(
    {
      ...submission,
      derivedScores: derivedScores.map(withCalculatedScoreV2)
    },
    favoriteCharacterId,
    'ranking-f-1'
  );
}

async function saveRankingSubmissionModern(
  userId,
  answersInput,
  questionnaireVersion
) {
  assertV2RankingsConfigured();
  const config = getModernRankingConfig(questionnaireVersion);

  const characters = await listAllCharacters();
  const candidates = buildScoreCandidates(characters, questionnaireVersion);
  const ownedYearningIds = getOwnedYearningCandidateIds(
    answersInput,
    questionnaireVersion
  );
  const answers = validateAnswers({
    answersInput,
    candidates,
    questions: config.questions,
    isCharacterEligibleForQuestion: config.isCharacterEligibleForQuestion,
    requiresCompleteAssignment: config.requiresCompleteAssignment,
    questionnaireLabel: questionnaireVersion,
    ownedYearningIds
  });
  const now = new Date().toISOString();
  const existingScores = await listUserCharacterScoresV2(
    userId,
    questionnaireVersion
  );
  const nextScores = deriveCharacterScoresModern(
    userId,
    questionnaireVersion,
    answers,
    candidates,
    now,
    config
  );
  const favoriteCharacterId = getFavoriteCharacterIdFromAnswers(
    answers,
    'ranking-f-1'
  );

  await ddbClient.send(
    new PutItemCommand({
      TableName: RANKING_SUBMISSIONS_V2_TABLE_NAME,
      Item: buildRankingSubmissionItemV2({
        userId,
        questionnaireVersion,
        answers,
        submittedAt: now,
        updatedAt: now
      })
    })
  );

  const nextCharacterIds = new Set(
    nextScores.map((score) => score.characterVariantKey || score.characterId)
  );

  await Promise.all(
    nextScores.map((score) =>
      ddbClient.send(
        new PutItemCommand({
          TableName:
            getModernUserCharacterScoresTableName(questionnaireVersion),
          Item: buildUserCharacterScoreItemV2(score)
        })
      )
    )
  );

  await Promise.all(
    existingScores
      .filter(
        (score) =>
          !nextCharacterIds.has(score.characterVariantKey || score.characterId)
      )
      .map((score) =>
        ddbClient.send(
          new DeleteItemCommand({
            TableName:
              getModernUserCharacterScoresTableName(questionnaireVersion),
            Key: {
              userVersionKey: {
                S: buildUserVersionKey(userId, questionnaireVersion)
              },
              [getModernCharacterKeyAttributeName(questionnaireVersion)]: {
                S: score.characterVariantKey || score.characterId
              }
            }
          })
        )
      )
  );

  await saveUserFavoriteCharacterId(userId, favoriteCharacterId, now);

  return {
    submission: withFavoriteSelection(
      {
        userId,
        questionnaireVersion,
        answers,
        submittedAt: now,
        updatedAt: now,
        derivedScores: nextScores.map(withCalculatedScoreV2)
      },
      favoriteCharacterId,
      'ranking-f-1'
    ),
    derivedScores: nextScores.map(withCalculatedScoreV2)
  };
}

async function listUserCharacterScoresV2(userId, questionnaireVersion) {
  const tableName = getModernUserCharacterScoresTableName(questionnaireVersion);
  if (!tableName || !userId) {
    return [];
  }

  const scores = [];
  let exclusiveStartKey;

  do {
    const response = await ddbClient.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'userVersionKey = :userVersionKey',
        ExpressionAttributeValues: {
          ':userVersionKey': {
            S: buildUserVersionKey(userId, questionnaireVersion)
          }
        },
        ExclusiveStartKey: exclusiveStartKey
      })
    );

    scores.push(...(response.Items || []).map(parseUserCharacterScoreV2));
    exclusiveStartKey = response.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return scores;
}

function validateAnswers({
  answersInput,
  candidates,
  questions,
  isCharacterEligibleForQuestion: eligibilityFn,
  requiresCompleteAssignment: completeAssignmentFn,
  ownedYearningIds = new Set()
}) {
  const normalizedAnswers = {};
  const candidatesById = new Map(
    candidates.map((candidate) => [candidate.id, candidate])
  );

  for (const question of questions) {
    const rawPlacements = answersInput?.[question.id];
    const eligibleCharacterIds = new Set(
      candidates
        .filter((candidate) =>
          isEligibleCandidateForQuestion(
            candidate,
            question,
            eligibilityFn,
            ownedYearningIds
          )
        )
        .map((candidate) => candidate.id)
    );

    if (!rawPlacements || typeof rawPlacements !== 'object') {
      if (completeAssignmentFn(question) && eligibleCharacterIds.size > 0) {
        throw new Error(`Every apostle must be assigned for ${question.id}.`);
      }

      continue;
    }

    const placements = {};
    const bucketCounts = new Map();

    for (const [characterId, tierIdValue] of Object.entries(rawPlacements)) {
      const candidate = candidatesById.get(characterId);
      if (!candidate) {
        continue;
      }

      if (
        !isEligibleCandidateForQuestion(
          candidate,
          question,
          eligibilityFn,
          ownedYearningIds
        )
      ) {
        throw new Error(
          `Character ${characterId} is not valid for ${question.id}.`
        );
      }

      const tierId = normalizeTierId(tierIdValue);
      const tier = question.tiers.find((item) => item.id === tierId);

      if (!tier) {
        throw new Error(`Invalid tier for ${question.id}.`);
      }

      const nextCount = (bucketCounts.get(tierId) || 0) + 1;
      if (typeof tier.maximum === 'number' && nextCount > tier.maximum) {
        throw new Error(`Too many characters in ${question.id} ${tierId}.`);
      }

      bucketCounts.set(tierId, nextCount);
      placements[characterId] = tierId;
    }

    if (
      completeAssignmentFn(question) &&
      Object.keys(placements).length !== eligibleCharacterIds.size
    ) {
      throw new Error(`Every apostle must be assigned for ${question.id}.`);
    }

    for (const tier of question.tiers) {
      if (typeof tier.minimum !== 'number') {
        continue;
      }

      const assignedCount = bucketCounts.get(tier.id) || 0;
      if (assignedCount < tier.minimum) {
        throw new Error(
          `${question.id} ${tier.id} requires at least ${tier.minimum} characters.`
        );
      }
    }

    normalizedAnswers[question.id] = placements;
  }

  return normalizedAnswers;
}

function deriveCharacterScoresLegacy(userId, answers, characters, timestamp) {
  const scores = [];

  for (const character of characters) {
    const monoScores = getCharacterMonoScoresLegacy(character, answers);
    const monoScore = getMaxNumericValue(Object.values(monoScores));
    const mixedScore = getCharacterMixedScoreLegacy(character, answers);
    const nicheScore = getCharacterNicheScoreLegacy(character, answers);
    const favorite = isCharacterFavorite(answers, 'ranking-d-1', character.id);
    const baseScore =
      (typeof monoScore === 'number' ? monoScore : 0) +
      (typeof mixedScore === 'number' ? mixedScore : 0);
    const calculatedScore =
      monoScore === null && mixedScore === null && nicheScore === null
        ? null
        : baseScore + (baseScore >= 6 ? 0 : nicheScore || 0);

    if (
      monoScore === null &&
      mixedScore === null &&
      nicheScore === null &&
      !favorite
    ) {
      continue;
    }

    scores.push({
      userId,
      characterId: character.id,
      questionnaireVersion: LEGACY_QUESTIONNAIRE_VERSION,
      monoScores,
      monoScore,
      mixedScore,
      nicheScore,
      calculatedScore,
      favorite,
      favoriteCharacterId: favorite ? character.id : null,
      submittedAt: timestamp,
      derivedAt: timestamp,
      updatedAt: timestamp
    });
  }

  return scores;
}

function deriveCharacterScoresModern(
  userId,
  questionnaireVersion,
  answers,
  candidates,
  timestamp,
  config
) {
  const scores = [];

  for (const character of candidates) {
    const monoScores = getCharacterMonoScoresModern(character, answers, config);
    const monoScore = getMaxNumericValue(Object.values(monoScores));
    const mixedCrusadeScore = getCharacterQuestionScoreV2(
      answers,
      config.mixedCrusadeQuestionIds.get(character.role),
      character.id,
      config
    );
    const mixedFrontierScore = getCharacterQuestionScoreV2(
      answers,
      config.mixedFrontierQuestionIds.get(character.role),
      character.id,
      config
    );
    const favorite = isCharacterFavorite(answers, 'ranking-f-1', character.id);

    const calculatedScore = calculateQuestionnaireV2Score({
      monoScore,
      mixedCrusadeScore,
      mixedFrontierScore
    });

    if (
      monoScore === null &&
      mixedCrusadeScore === null &&
      mixedFrontierScore === null &&
      !favorite
    ) {
      continue;
    }

    scores.push({
      userId,
      characterId: character.characterId || character.id,
      baseCharacterId: character.characterId || character.id,
      characterVariantKey: character.id,
      isYearning: Boolean(character.isYearning),
      questionnaireVersion,
      userVersionKey: buildUserVersionKey(userId, questionnaireVersion),
      versionCharacterKey: buildVersionCharacterKey(
        questionnaireVersion,
        character.id
      ),
      monoScores,
      monoScore,
      mixedCrusadeScore,
      mixedFrontierScore,
      calculatedScore,
      favorite,
      submittedAt: timestamp,
      derivedAt: timestamp,
      updatedAt: timestamp
    });
  }

  return scores;
}

function getCharacterMonoScoresLegacy(character, answers) {
  const questionScores = {};

  for (const [personality, questionId] of PERSONALITY_QUESTION_IDS.entries()) {
    if (
      character.personality !== personality &&
      character.personality !== 'resonance'
    ) {
      continue;
    }

    const tierId = answers?.[questionId]?.[character.id];
    if (!tierId) {
      continue;
    }

    const question = RANKING_QUESTIONS_BY_ID.get(questionId);
    const score = getTierScore(question, tierId);
    if (score !== null) {
      questionScores[questionId] = score;
    }
  }

  return questionScores;
}

function getCharacterMonoScoresModern(character, answers, config) {
  const questionScores = {};

  for (const [
    personality,
    questionId
  ] of config.personalityQuestionIds.entries()) {
    if (
      character.personality !== personality &&
      character.personality !== 'resonance'
    ) {
      continue;
    }

    const tierId = answers?.[questionId]?.[character.id];
    if (!tierId) {
      continue;
    }

    const question = config.questionsById.get(questionId);
    const score = config.getTierScore(question, tierId);
    if (score !== null) {
      questionScores[questionId] = score;
    }
  }

  return questionScores;
}

function getCharacterMixedScoreLegacy(character, answers) {
  const questionId = POSITION_QUESTION_IDS.get(character.position);
  if (!questionId) {
    return null;
  }

  const tierId = answers?.[questionId]?.[character.id];
  if (!tierId) {
    return null;
  }

  const question = RANKING_QUESTIONS_BY_ID.get(questionId);
  return getTierScore(question, tierId);
}

function getCharacterNicheScoreLegacy(character, answers) {
  const tierId = answers?.['ranking-c-1']?.[character.id];
  if (!tierId) {
    return null;
  }

  const question = RANKING_QUESTIONS_BY_ID.get('ranking-c-1');
  return getTierScore(question, tierId);
}

function getCharacterQuestionScoreV2(answers, questionId, characterId, config) {
  if (!questionId) {
    return null;
  }

  const tierId = answers?.[questionId]?.[characterId];
  if (!tierId) {
    return null;
  }

  const question = config.questionsById.get(questionId);
  return config.getTierScore(question, tierId);
}

function isCharacterFavorite(answers, questionId, characterId) {
  return answers?.[questionId]?.[characterId] === 'favorite';
}

function getMaxNumericValue(values) {
  const numericValues = values.filter((value) => typeof value === 'number');
  return numericValues.length ? Math.max(...numericValues) : null;
}

function buildRankingSubmissionItemLegacy(submission) {
  return {
    userId: { S: submission.userId },
    questionnaireVersion: { S: submission.questionnaireVersion },
    answers: toNestedMapAttribute(submission.answers),
    submittedAt: { S: submission.submittedAt },
    updatedAt: { S: submission.updatedAt }
  };
}

function buildRankingSubmissionItemV2(submission) {
  return {
    userId: { S: submission.userId },
    questionnaireVersion: { S: submission.questionnaireVersion },
    answers: toNestedMapAttribute(submission.answers),
    submittedAt: { S: submission.submittedAt },
    updatedAt: { S: submission.updatedAt }
  };
}

function buildUserCharacterScoreItemLegacy(score) {
  const item = {
    userId: { S: score.userId },
    characterId: { S: score.characterId },
    questionnaireVersion: { S: score.questionnaireVersion },
    submittedAt: { S: score.submittedAt },
    derivedAt: { S: score.derivedAt },
    updatedAt: { S: score.updatedAt },
    favorite: { BOOL: score.favorite }
  };

  if (Object.keys(score.monoScores).length) {
    item.monoScores = toNumberMapAttribute(score.monoScores);
  }
  if (typeof score.monoScore === 'number') {
    item.monoScore = { N: String(score.monoScore) };
  }
  if (typeof score.mixedScore === 'number') {
    item.mixedScore = { N: String(score.mixedScore) };
  }
  if (typeof score.nicheScore === 'number') {
    item.nicheScore = { N: String(score.nicheScore) };
  }
  if (typeof score.calculatedScore === 'number') {
    item.calculatedScore = { N: String(score.calculatedScore) };
  }
  if (score.favoriteCharacterId) {
    item.favoriteCharacterId = { S: score.favoriteCharacterId };
  }

  return item;
}

function buildUserCharacterScoreItemV2(score) {
  const item = {
    userVersionKey: { S: score.userVersionKey },
    [score.characterVariantKey ? 'characterVariantKey' : 'characterId']: {
      S: score.characterVariantKey || score.characterId
    },
    questionnaireVersion: { S: score.questionnaireVersion },
    [score.characterVariantKey
      ? 'versionCharacterVariantKey'
      : 'versionCharacterKey']: {
      S: score.versionCharacterKey
    },
    submittedAt: { S: score.submittedAt },
    derivedAt: { S: score.derivedAt },
    updatedAt: { S: score.updatedAt },
    favorite: { BOOL: score.favorite }
  };

  if (score.characterVariantKey) {
    item.characterId = { S: score.baseCharacterId || score.characterId };
    item.isYearning = { BOOL: Boolean(score.isYearning) };
  }

  if (Object.keys(score.monoScores).length) {
    item.monoScores = toNumberMapAttribute(score.monoScores);
  }
  if (typeof score.monoScore === 'number') {
    item.monoScore = { N: String(score.monoScore) };
  }
  if (typeof score.mixedCrusadeScore === 'number') {
    item.mixedCrusadeScore = { N: String(score.mixedCrusadeScore) };
  }
  if (typeof score.mixedFrontierScore === 'number') {
    item.mixedFrontierScore = { N: String(score.mixedFrontierScore) };
  }

  return item;
}

function parseRankingSubmission(item) {
  return {
    userId: item.userId?.S || '',
    questionnaireVersion: item.questionnaireVersion?.S || '',
    answers: parseNestedStringMap(item.answers),
    submittedAt: item.submittedAt?.S || '',
    updatedAt: item.updatedAt?.S || ''
  };
}

function parseRankingSubmissionV2(item) {
  return {
    userId: item.userId?.S || '',
    questionnaireVersion:
      item.questionnaireVersion?.S || ACTIVE_QUESTIONNAIRE_VERSION,
    answers: parseNestedStringMap(item.answers),
    submittedAt: item.submittedAt?.S || '',
    updatedAt: item.updatedAt?.S || ''
  };
}

function parseUserCharacterScoreLegacy(item) {
  return {
    userId: item.userId?.S || '',
    characterId: item.characterId?.S || '',
    questionnaireVersion: item.questionnaireVersion?.S || '',
    monoScores: parseNumberMap(item.monoScores),
    monoScore: parseOptionalNumber(item.monoScore),
    mixedScore: parseOptionalNumber(item.mixedScore),
    nicheScore: parseOptionalNumber(item.nicheScore),
    calculatedScore: parseOptionalNumber(item.calculatedScore),
    favorite: item.favorite?.BOOL || false,
    favoriteCharacterId: item.favoriteCharacterId?.S || '',
    submittedAt: item.submittedAt?.S || '',
    derivedAt: item.derivedAt?.S || '',
    updatedAt: item.updatedAt?.S || ''
  };
}

function parseUserCharacterScoreV2(item) {
  return withCalculatedScoreV2({
    characterId: item.characterId?.S || '',
    baseCharacterId: item.characterId?.S || '',
    characterVariantKey:
      item.characterVariantKey?.S || item.characterId?.S || '',
    isYearning: item.isYearning?.BOOL || false,
    questionnaireVersion:
      item.questionnaireVersion?.S || ACTIVE_QUESTIONNAIRE_VERSION,
    monoScores: parseNumberMap(item.monoScores),
    monoScore: parseOptionalNumber(item.monoScore),
    mixedCrusadeScore: parseOptionalNumber(item.mixedCrusadeScore),
    mixedFrontierScore: parseOptionalNumber(item.mixedFrontierScore),
    favorite: item.favorite?.BOOL || false,
    submittedAt: item.submittedAt?.S || '',
    derivedAt: item.derivedAt?.S || '',
    updatedAt: item.updatedAt?.S || ''
  });
}

function withFavoriteSelection(submission, favoriteCharacterId, questionId) {
  const answers = {
    ...(submission?.answers || {})
  };
  const favoriteAnswerKey = normalizeFavoriteAnswerKey(
    submission?.questionnaireVersion,
    favoriteCharacterId
  );

  if (favoriteAnswerKey) {
    answers[questionId] = {
      [favoriteAnswerKey]: 'favorite'
    };
  } else {
    delete answers[questionId];
  }

  const derivedScores = (submission?.derivedScores || []).map((score) => ({
    ...score,
    favorite:
      (score.characterVariantKey || score.characterId) === favoriteAnswerKey
  }));

  return {
    ...submission,
    answers,
    derivedScores
  };
}

function getFavoriteCharacterIdFromAnswers(answers, questionId) {
  const favoritePlacements = answers?.[questionId];
  if (!favoritePlacements || typeof favoritePlacements !== 'object') {
    return '';
  }

  const [favoriteCharacterId] = Object.keys(favoritePlacements);
  return normalizeBaseCharacterId(favoriteCharacterId || '');
}

function toNestedMapAttribute(value) {
  const entries = Object.entries(value || {}).map(([key, nestedValue]) => [
    key,
    {
      M: Object.fromEntries(
        Object.entries(nestedValue || {}).map(([nestedKey, nestedString]) => [
          nestedKey,
          { S: String(nestedString) }
        ])
      )
    }
  ]);

  return {
    M: Object.fromEntries(entries)
  };
}

function toNumberMapAttribute(value) {
  return {
    M: Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [
        key,
        { N: String(entryValue) }
      ])
    )
  };
}

function parseNestedStringMap(attribute) {
  const value = {};

  for (const [questionId, questionAttribute] of Object.entries(
    attribute?.M || {}
  )) {
    value[questionId] = {};

    for (const [characterId, tierAttribute] of Object.entries(
      questionAttribute?.M || {}
    )) {
      value[questionId][characterId] = tierAttribute?.S || '';
    }
  }

  return value;
}

function parseNumberMap(attribute) {
  const value = {};

  for (const [key, entry] of Object.entries(attribute?.M || {})) {
    if (entry?.N !== undefined) {
      value[key] = Number(entry.N);
    }
  }

  return value;
}

function parseOptionalNumber(attribute) {
  return attribute?.N !== undefined ? Number(attribute.N) : null;
}

function normalizeTierId(value) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) {
    throw new Error('Invalid tier.');
  }

  return normalized;
}

function buildUserVersionKey(userId, questionnaireVersion) {
  return `${questionnaireVersion}#${userId}`;
}

function buildVersionCharacterKey(questionnaireVersion, characterId) {
  return `${questionnaireVersion}#${characterId}`;
}

function withCalculatedScoreV2(score) {
  return {
    ...score,
    calculatedScore: calculateQuestionnaireV2Score(score)
  };
}

function assertLegacyRankingsConfigured() {
  if (!RANKING_SUBMISSIONS_TABLE_NAME) {
    throw new Error('Ranking submissions table is not configured.');
  }

  if (!USER_CHARACTER_SCORES_TABLE_NAME) {
    throw new Error('User character scores table is not configured.');
  }
}

function assertV2RankingsConfigured() {
  if (!RANKING_SUBMISSIONS_V2_TABLE_NAME) {
    throw new Error('V2 ranking submissions table is not configured.');
  }

  if (
    !USER_CHARACTER_SCORES_V2_TABLE_NAME &&
    !USER_CHARACTER_SCORES_V4_TABLE_NAME
  ) {
    throw new Error('Modern user character scores table is not configured.');
  }
}

function getModernRankingConfig(questionnaireVersion) {
  if (isQuestionnaireVersionV2(questionnaireVersion)) {
    return MODERN_RANKING_CONFIGS.v2;
  }

  if (isQuestionnaireVersionV4(questionnaireVersion)) {
    return MODERN_RANKING_CONFIGS.v4;
  }

  return MODERN_RANKING_CONFIGS.v4;
}

function buildScoreCandidates(characters, questionnaireVersion) {
  if (!isQuestionnaireVersionV4(questionnaireVersion)) {
    return characters.map((character) => ({
      ...character,
      id: character.id,
      characterId: character.id,
      isYearning: false
    }));
  }

  return characters.flatMap((character) => {
    const baseCandidate = {
      ...character,
      id: `${character.id}#base`,
      characterId: character.id,
      isYearning: false
    };

    if (!character.hasYearning || !character.yearningImageUrl) {
      return [baseCandidate];
    }

    return [
      baseCandidate,
      {
        ...character,
        id: `${character.id}#yearning`,
        characterId: character.id,
        isYearning: true
      }
    ];
  });
}

function getOwnedYearningCandidateIds(answersInput, questionnaireVersion) {
  if (!isQuestionnaireVersionV4(questionnaireVersion)) {
    return new Set();
  }

  const placements = answersInput?.[OWNED_YEARNING_QUESTION_ID_V4];
  if (!placements || typeof placements !== 'object') {
    return new Set();
  }

  return new Set(
    Object.entries(placements)
      .filter(([, tierId]) => normalizeTierId(tierId) === 'owned')
      .map(([characterId]) => characterId)
  );
}

function isEligibleCandidateForQuestion(
  candidate,
  question,
  eligibilityFn,
  ownedYearningIds
) {
  if (!eligibilityFn(candidate, question)) {
    return false;
  }

  if (question.kind === 'owned-yearning') {
    return candidate.isYearning;
  }

  if (candidate.isYearning) {
    return ownedYearningIds.has(candidate.id);
  }

  return true;
}

function getModernUserCharacterScoresTableName(questionnaireVersion) {
  return isQuestionnaireVersionV4(questionnaireVersion)
    ? USER_CHARACTER_SCORES_V4_TABLE_NAME
    : USER_CHARACTER_SCORES_V2_TABLE_NAME;
}

function getModernCharacterKeyAttributeName(questionnaireVersion) {
  return isQuestionnaireVersionV4(questionnaireVersion)
    ? 'characterVariantKey'
    : 'characterId';
}

function normalizeFavoriteAnswerKey(questionnaireVersion, favoriteCharacterId) {
  if (!favoriteCharacterId) {
    return '';
  }

  return isQuestionnaireVersionV4(questionnaireVersion)
    ? `${normalizeBaseCharacterId(favoriteCharacterId)}#base`
    : normalizeBaseCharacterId(favoriteCharacterId);
}

function normalizeBaseCharacterId(value) {
  const normalized = String(value || '').trim();
  if (normalized.endsWith('#base')) {
    return normalized.slice(0, -'#base'.length);
  }

  if (normalized.endsWith('#yearning')) {
    return normalized.slice(0, -'#yearning'.length);
  }

  return normalized;
}
