import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  QueryCommand
} from '@aws-sdk/client-dynamodb';
import { listAllCharacters } from './characters.mjs';
import {
  PERSONALITY_QUESTION_IDS,
  POSITION_QUESTION_IDS,
  QUESTIONNAIRE_VERSION,
  RANKING_QUESTIONS,
  RANKING_QUESTIONS_BY_ID,
  getTierScore,
  isCharacterEligibleForQuestion
} from './rankings-config.mjs';

const RANKING_SUBMISSIONS_TABLE_NAME =
  process.env.RANKING_SUBMISSIONS_TABLE_NAME;
const USER_CHARACTER_SCORES_TABLE_NAME =
  process.env.USER_CHARACTER_SCORES_TABLE_NAME;

const ddbClient = new DynamoDBClient({});

export async function getRankingSubmission(userId) {
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

  const derivedScores = await listUserCharacterScores(userId);

  return {
    ...submission,
    derivedScores
  };
}

export async function saveRankingSubmission(userId, answersInput) {
  assertRankingsConfigured();

  const characters = await listAllCharacters();
  const answers = validateAnswers(answersInput, characters);
  const now = new Date().toISOString();
  const existingScores = await listUserCharacterScores(userId);
  const nextScores = deriveCharacterScores(userId, answers, characters, now);

  await ddbClient.send(
    new PutItemCommand({
      TableName: RANKING_SUBMISSIONS_TABLE_NAME,
      Item: buildRankingSubmissionItem({
        userId,
        questionnaireVersion: QUESTIONNAIRE_VERSION,
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
          Item: buildUserCharacterScoreItem(score)
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

  return {
    submission: {
      userId,
      questionnaireVersion: QUESTIONNAIRE_VERSION,
      answers,
      submittedAt: now,
      updatedAt: now,
      derivedScores: nextScores
    },
    derivedScores: nextScores
  };
}

export async function listUserCharacterScores(userId) {
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

    scores.push(...(response.Items || []).map(parseUserCharacterScore));
    exclusiveStartKey = response.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return scores;
}

function validateAnswers(answersInput, characters) {
  const normalizedAnswers = {};
  const charactersById = new Map(
    characters.map((character) => [character.id, character])
  );

  for (const question of RANKING_QUESTIONS) {
    const rawPlacements = answersInput?.[question.id];
    if (!rawPlacements || typeof rawPlacements !== 'object') {
      continue;
    }

    const placements = {};
    const bucketCounts = new Map();

    for (const [characterId, tierIdValue] of Object.entries(rawPlacements)) {
      const character = charactersById.get(characterId);
      if (!character) {
        continue;
      }

      if (!isCharacterEligibleForQuestion(character, question)) {
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

    normalizedAnswers[question.id] = placements;
  }

  return normalizedAnswers;
}

function deriveCharacterScores(userId, answers, characters, timestamp) {
  const scores = [];

  for (const character of characters) {
    const monoScores = getCharacterMonoScores(character, answers);
    const monoScore = getMaxNumericValue(Object.values(monoScores));
    const mixedScore = getCharacterMixedScore(character, answers);
    const nicheScore = getCharacterNicheScore(character, answers);
    const favorite = isCharacterFavorite(character, answers);
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
      questionnaireVersion: QUESTIONNAIRE_VERSION,
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

function getCharacterMonoScores(character, answers) {
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

function getCharacterMixedScore(character, answers) {
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

function getCharacterNicheScore(character, answers) {
  const questionId = 'ranking-c-1';
  const tierId = answers?.[questionId]?.[character.id];
  if (!tierId) {
    return null;
  }

  const question = RANKING_QUESTIONS_BY_ID.get(questionId);
  return getTierScore(question, tierId);
}

function isCharacterFavorite(character, answers) {
  return answers?.['ranking-d-1']?.[character.id] === 'favorite';
}

function getMaxNumericValue(values) {
  const numericValues = values.filter((value) => typeof value === 'number');
  return numericValues.length ? Math.max(...numericValues) : null;
}

function buildRankingSubmissionItem(submission) {
  return {
    userId: { S: submission.userId },
    questionnaireVersion: { S: submission.questionnaireVersion },
    answers: toNestedMapAttribute(submission.answers),
    submittedAt: { S: submission.submittedAt },
    updatedAt: { S: submission.updatedAt }
  };
}

function buildUserCharacterScoreItem(score) {
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

function parseRankingSubmission(item) {
  return {
    userId: item.userId?.S || '',
    questionnaireVersion: item.questionnaireVersion?.S || '',
    answers: parseNestedStringMap(item.answers),
    submittedAt: item.submittedAt?.S || '',
    updatedAt: item.updatedAt?.S || ''
  };
}

function parseUserCharacterScore(item) {
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

function assertRankingsConfigured() {
  if (!RANKING_SUBMISSIONS_TABLE_NAME) {
    throw new Error('Ranking submissions table is not configured.');
  }

  if (!USER_CHARACTER_SCORES_TABLE_NAME) {
    throw new Error('User character scores table is not configured.');
  }
}
