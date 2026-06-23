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
  QUESTIONNAIRE_VERSION_V2,
  RANKING_QUESTIONS_BY_ID_V2,
  RANKING_QUESTIONS_V2,
  getTierScoreV2,
  isCharacterEligibleForQuestionV2,
  requiresCompleteAssignmentV2
} from './rankings-config-v2.mjs';
import {
  ACTIVE_QUESTIONNAIRE_VERSION,
  LEGACY_QUESTIONNAIRE_VERSION,
  isQuestionnaireVersionV2,
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

const ddbClient = new DynamoDBClient({});

export async function getRankingSubmission(userId, questionnaireVersionInput) {
  const questionnaireVersion = resolveQuestionnaireVersion(
    questionnaireVersionInput
  );

  if (isQuestionnaireVersionV2(questionnaireVersion)) {
    return getRankingSubmissionV2(userId, questionnaireVersion);
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

  if (isQuestionnaireVersionV2(questionnaireVersion)) {
    return saveRankingSubmissionV2(userId, answersInput, questionnaireVersion);
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

  if (isQuestionnaireVersionV2(questionnaireVersion)) {
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
    characters,
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
    nextScores.map((score) => score.characterId)
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
      .filter((score) => !nextCharacterIds.has(score.characterId))
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

async function getRankingSubmissionV2(userId, questionnaireVersion) {
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

async function saveRankingSubmissionV2(
  userId,
  answersInput,
  questionnaireVersion
) {
  assertV2RankingsConfigured();

  const characters = await listAllCharacters();
  const answers = validateAnswers({
    answersInput,
    characters,
    questions: RANKING_QUESTIONS_V2,
    isCharacterEligibleForQuestion: isCharacterEligibleForQuestionV2,
    requiresCompleteAssignment: requiresCompleteAssignmentV2,
    questionnaireLabel: questionnaireVersion
  });
  const now = new Date().toISOString();
  const existingScores = await listUserCharacterScoresV2(
    userId,
    questionnaireVersion
  );
  const nextScores = deriveCharacterScoresV2(
    userId,
    questionnaireVersion,
    answers,
    characters,
    now
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
    nextScores.map((score) => score.characterId)
  );

  await Promise.all(
    nextScores.map((score) =>
      ddbClient.send(
        new PutItemCommand({
          TableName: USER_CHARACTER_SCORES_V2_TABLE_NAME,
          Item: buildUserCharacterScoreItemV2(score)
        })
      )
    )
  );

  await Promise.all(
    existingScores
      .filter((score) => !nextCharacterIds.has(score.characterId))
      .map((score) =>
        ddbClient.send(
          new DeleteItemCommand({
            TableName: USER_CHARACTER_SCORES_V2_TABLE_NAME,
            Key: {
              userVersionKey: {
                S: buildUserVersionKey(userId, questionnaireVersion)
              },
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
  if (!USER_CHARACTER_SCORES_V2_TABLE_NAME || !userId) {
    return [];
  }

  const scores = [];
  let exclusiveStartKey;

  do {
    const response = await ddbClient.send(
      new QueryCommand({
        TableName: USER_CHARACTER_SCORES_V2_TABLE_NAME,
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
  characters,
  questions,
  isCharacterEligibleForQuestion: eligibilityFn,
  requiresCompleteAssignment: completeAssignmentFn
}) {
  const normalizedAnswers = {};
  const charactersById = new Map(
    characters.map((character) => [character.id, character])
  );

  for (const question of questions) {
    const rawPlacements = answersInput?.[question.id];
    const eligibleCharacterIds = new Set(
      characters
        .filter((character) => eligibilityFn(character, question))
        .map((character) => character.id)
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
      const character = charactersById.get(characterId);
      if (!character) {
        continue;
      }

      if (!eligibilityFn(character, question)) {
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

function deriveCharacterScoresV2(
  userId,
  questionnaireVersion,
  answers,
  characters,
  timestamp
) {
  const scores = [];

  for (const character of characters) {
    const monoScores = getCharacterMonoScoresV2(character, answers);
    const monoScore = getMaxNumericValue(Object.values(monoScores));
    const mixedCrusadeScore = getCharacterQuestionScoreV2(
      answers,
      MIXED_CRUSADE_QUESTION_IDS_V2.get(character.role),
      character.id
    );
    const mixedFrontierScore = getCharacterQuestionScoreV2(
      answers,
      MIXED_FRONTIER_QUESTION_IDS_V2.get(character.role),
      character.id
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
      characterId: character.id,
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

function getCharacterMonoScoresV2(character, answers) {
  const questionScores = {};

  for (const [
    personality,
    questionId
  ] of PERSONALITY_QUESTION_IDS_V2.entries()) {
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

    const question = RANKING_QUESTIONS_BY_ID_V2.get(questionId);
    const score = getTierScoreV2(question, tierId);
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

function getCharacterQuestionScoreV2(answers, questionId, characterId) {
  if (!questionId) {
    return null;
  }

  const tierId = answers?.[questionId]?.[characterId];
  if (!tierId) {
    return null;
  }

  const question = RANKING_QUESTIONS_BY_ID_V2.get(questionId);
  return getTierScoreV2(question, tierId);
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
    characterId: { S: score.characterId },
    questionnaireVersion: { S: score.questionnaireVersion },
    versionCharacterKey: { S: score.versionCharacterKey },
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

  if (favoriteCharacterId) {
    answers[questionId] = {
      [favoriteCharacterId]: 'favorite'
    };
  } else {
    delete answers[questionId];
  }

  const derivedScores = (submission?.derivedScores || []).map((score) => ({
    ...score,
    favorite: score.characterId === favoriteCharacterId
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
  return favoriteCharacterId || '';
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

  if (!USER_CHARACTER_SCORES_V2_TABLE_NAME) {
    throw new Error('V2 user character scores table is not configured.');
  }
}
