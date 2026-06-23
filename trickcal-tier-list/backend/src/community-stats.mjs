import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
  ScanCommand
} from '@aws-sdk/client-dynamodb';
import { listAllCharacters } from './characters.mjs';
import { listFavoriteCountsByCharacter } from './favorites.mjs';
import {
  ACTIVE_QUESTIONNAIRE_VERSION,
  LEGACY_QUESTIONNAIRE_VERSION,
  isQuestionnaireVersionV2,
  isQuestionnaireVersionV4,
  resolveQuestionnaireVersion
} from './questionnaire-version.mjs';
import { calculateQuestionnaireV2Score } from './score-weights.mjs';

const USER_CHARACTER_SCORES_TABLE_NAME =
  process.env.USER_CHARACTER_SCORES_TABLE_NAME;
const COMMUNITY_CHARACTER_STATS_TABLE_NAME =
  process.env.COMMUNITY_CHARACTER_STATS_TABLE_NAME;
const USER_CHARACTER_SCORES_V2_TABLE_NAME =
  process.env.USER_CHARACTER_SCORES_V2_TABLE_NAME;
const COMMUNITY_CHARACTER_STATS_V2_TABLE_NAME =
  process.env.COMMUNITY_CHARACTER_STATS_V2_TABLE_NAME;
const USER_CHARACTER_SCORES_V4_TABLE_NAME =
  process.env.USER_CHARACTER_SCORES_V4_TABLE_NAME;
const COMMUNITY_CHARACTER_STATS_V4_TABLE_NAME =
  process.env.COMMUNITY_CHARACTER_STATS_V4_TABLE_NAME;

const ddbClient = new DynamoDBClient({});
const COMMUNITY_STATS_TYPE = 'CHARACTER';
const COMMUNITY_WINDOW_DAYS = 60;
const COMMUNITY_META_TYPE = 'META';
const COMMUNITY_REBUILD_LOCK_ID = '__community_rebuild_lock__';
const COMMUNITY_REBUILD_COOLDOWN_MS = 5 * 60 * 1000;

export async function rebuildCommunityCharacterStats(
  questionnaireVersionInput
) {
  const questionnaireVersion = resolveQuestionnaireVersion(
    questionnaireVersionInput
  );

  if (questionnaireVersion !== LEGACY_QUESTIONNAIRE_VERSION) {
    if (isQuestionnaireVersionV4(questionnaireVersion)) {
      return rebuildCommunityCharacterStatsV4(questionnaireVersion);
    }
    return rebuildCommunityCharacterStatsV2(questionnaireVersion);
  }

  return rebuildCommunityCharacterStatsLegacy();
}

export async function triggerPublicCommunityRebuild(questionnaireVersionInput) {
  const questionnaireVersion = resolveQuestionnaireVersion(
    questionnaireVersionInput
  );

  if (questionnaireVersion !== LEGACY_QUESTIONNAIRE_VERSION) {
    if (isQuestionnaireVersionV4(questionnaireVersion)) {
      return triggerPublicCommunityRebuildV4(questionnaireVersion);
    }
    return triggerPublicCommunityRebuildV2(questionnaireVersion);
  }

  return triggerPublicCommunityRebuildLegacy();
}

export async function listCommunityCharacterStats(questionnaireVersionInput) {
  const questionnaireVersion = resolveQuestionnaireVersion(
    questionnaireVersionInput
  );

  if (questionnaireVersion !== LEGACY_QUESTIONNAIRE_VERSION) {
    if (isQuestionnaireVersionV4(questionnaireVersion)) {
      return listCommunityCharacterStatsV4(questionnaireVersion);
    }
    return listCommunityCharacterStatsV2(questionnaireVersion);
  }

  return listCommunityCharacterStatsLegacy();
}

export async function listCommunityFavorites({
  limit = 10,
  questionnaireVersion: questionnaireVersionInput
} = {}) {
  const questionnaireVersion = resolveQuestionnaireVersion(
    questionnaireVersionInput
  );

  if (questionnaireVersion !== LEGACY_QUESTIONNAIRE_VERSION) {
    if (isQuestionnaireVersionV4(questionnaireVersion)) {
      return listCommunityFavoritesV4({ limit, questionnaireVersion });
    }
    return listCommunityFavoritesV2({ limit, questionnaireVersion });
  }

  return listCommunityFavoritesLegacy({ limit });
}

async function rebuildCommunityCharacterStatsLegacy() {
  assertLegacyCommunityStatsConfigured();

  const characters = await listAllCharacters();
  const computedAt = new Date().toISOString();
  const windowStartDate = new Date(
    Date.now() - COMMUNITY_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );
  const windowStart = windowStartDate.toISOString();
  const favoriteCountsByCharacterId = await listFavoriteCountsByCharacter();

  const statsItems = await Promise.all(
    characters.map(async (character) => {
      const recentScores = await listCharacterScoresSinceLegacy(
        character.id,
        windowStart
      );
      const favoriteCount = favoriteCountsByCharacterId.get(character.id) || 0;

      return buildCharacterStatsItemLegacy({
        characterId: character.id,
        computedAt,
        windowStart,
        favoriteCount,
        recentScores
      });
    })
  );

  await Promise.all(
    statsItems.map((item) =>
      ddbClient.send(
        new PutItemCommand({
          TableName: COMMUNITY_CHARACTER_STATS_TABLE_NAME,
          Item: item
        })
      )
    )
  );

  return {
    questionnaireVersion: resolveQuestionnaireVersion(),
    charactersProcessed: statsItems.length,
    computedAt,
    windowStart
  };
}

async function triggerPublicCommunityRebuildLegacy() {
  assertLegacyCommunityStatsConfigured();

  const now = new Date();
  const nowIso = now.toISOString();
  const allowedBefore = new Date(
    now.getTime() - COMMUNITY_REBUILD_COOLDOWN_MS
  ).toISOString();

  try {
    await ddbClient.send(
      new PutItemCommand({
        TableName: COMMUNITY_CHARACTER_STATS_TABLE_NAME,
        Item: {
          characterId: { S: COMMUNITY_REBUILD_LOCK_ID },
          statsType: { S: COMMUNITY_META_TYPE },
          lastRequestedAt: { S: nowIso }
        },
        ConditionExpression:
          'attribute_not_exists(characterId) OR lastRequestedAt <= :allowedBefore',
        ExpressionAttributeValues: {
          ':allowedBefore': { S: allowedBefore }
        }
      })
    );
  } catch (error) {
    if (error?.name === 'ConditionalCheckFailedException') {
      const lock = await getCommunityRebuildLockLegacy();
      const cooldownError = new Error('Community rebuild is on cooldown.');
      cooldownError.name = 'CommunityRebuildCooldownError';
      cooldownError.retryAfterSeconds = getRetryAfterSeconds(
        lock?.lastRequestedAt
      );
      cooldownError.lastRequestedAt = lock?.lastRequestedAt || '';
      throw cooldownError;
    }

    throw error;
  }

  const result = await rebuildCommunityCharacterStatsLegacy();
  await writeCommunityRebuildLockLegacy({
    lastRequestedAt: nowIso,
    lastCompletedAt: result.computedAt
  });

  return {
    ...result,
    cooldownSeconds: COMMUNITY_REBUILD_COOLDOWN_MS / 1000
  };
}

async function listCommunityCharacterStatsLegacy() {
  assertLegacyCommunityStatsConfigured();

  const [characters, stats] = await Promise.all([
    listAllCharacters(),
    scanCommunityStatsLegacy()
  ]);

  return mergeCommunityCharacters({
    characters,
    stats,
    questionnaireVersion: resolveQuestionnaireVersion()
  });
}

async function listCommunityFavoritesLegacy({ limit = 10 } = {}) {
  assertLegacyCommunityStatsConfigured();

  const characters = await listAllCharacters();
  const charactersById = new Map(
    characters.map((character) => [character.id, character])
  );
  const response = await ddbClient.send(
    new QueryCommand({
      TableName: COMMUNITY_CHARACTER_STATS_TABLE_NAME,
      IndexName: 'StatsByFavoriteCountIndex',
      KeyConditionExpression: 'statsType = :statsType',
      ExpressionAttributeValues: {
        ':statsType': {
          S: COMMUNITY_STATS_TYPE
        }
      },
      ScanIndexForward: false,
      Limit: limit
    })
  );

  return {
    questionnaireVersion: resolveQuestionnaireVersion(),
    characters: (response.Items || [])
      .map(parseCommunityStatsLegacy)
      .map((stats) => {
        const character = charactersById.get(stats.characterId);
        return character
          ? {
              ...character,
              communityStats: stats
            }
          : null;
      })
      .filter(Boolean)
  };
}

async function rebuildCommunityCharacterStatsV2(questionnaireVersion) {
  assertV2CommunityStatsConfigured();

  const characters = await listAllCharacters();
  const computedAt = new Date().toISOString();
  const windowStartDate = new Date(
    Date.now() - COMMUNITY_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );
  const windowStart = windowStartDate.toISOString();
  const favoriteCountsByCharacterId = await listFavoriteCountsByCharacter();

  const statsItems = await Promise.all(
    characters.map(async (character) => {
      const recentScores = await listCharacterScoresSinceV2(
        questionnaireVersion,
        character.id,
        windowStart
      );
      const favoriteCount = favoriteCountsByCharacterId.get(character.id) || 0;

      return buildCharacterStatsItemV2({
        questionnaireVersion,
        characterId: character.id,
        computedAt,
        windowStart,
        favoriteCount,
        recentScores
      });
    })
  );

  await Promise.all(
    statsItems.map((item) =>
      ddbClient.send(
        new PutItemCommand({
          TableName: COMMUNITY_CHARACTER_STATS_V2_TABLE_NAME,
          Item: item
        })
      )
    )
  );

  return {
    questionnaireVersion,
    charactersProcessed: statsItems.length,
    computedAt,
    windowStart
  };
}

async function rebuildCommunityCharacterStatsV4(questionnaireVersion) {
  assertV4CommunityStatsConfigured();

  const characters = buildScoreCandidates(await listAllCharacters());
  const computedAt = new Date().toISOString();
  const windowStartDate = new Date(
    Date.now() - COMMUNITY_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );
  const windowStart = windowStartDate.toISOString();

  const statsItems = await Promise.all(
    characters.map(async (character) => {
      const recentScores = await listCharacterScoresSinceV4(
        questionnaireVersion,
        character.characterVariantKey,
        windowStart
      );

      return buildCharacterStatsItemV4({
        questionnaireVersion,
        characterVariantKey: character.characterVariantKey,
        characterId: character.characterId,
        isYearning: character.isYearning,
        computedAt,
        windowStart,
        recentScores
      });
    })
  );

  await Promise.all(
    statsItems.map((item) =>
      ddbClient.send(
        new PutItemCommand({
          TableName: COMMUNITY_CHARACTER_STATS_V4_TABLE_NAME,
          Item: item
        })
      )
    )
  );

  return {
    questionnaireVersion,
    charactersProcessed: statsItems.length,
    computedAt,
    windowStart
  };
}

async function triggerPublicCommunityRebuildV2(questionnaireVersion) {
  assertV2CommunityStatsConfigured();

  const now = new Date();
  const nowIso = now.toISOString();
  const allowedBefore = new Date(
    now.getTime() - COMMUNITY_REBUILD_COOLDOWN_MS
  ).toISOString();

  try {
    await ddbClient.send(
      new PutItemCommand({
        TableName: COMMUNITY_CHARACTER_STATS_V2_TABLE_NAME,
        Item: {
          versionCharacterKey: {
            S: buildVersionCharacterKey(
              questionnaireVersion,
              COMMUNITY_REBUILD_LOCK_ID
            )
          },
          questionnaireVersion: { S: questionnaireVersion },
          characterId: { S: COMMUNITY_REBUILD_LOCK_ID },
          statsType: { S: COMMUNITY_META_TYPE },
          lastRequestedAt: { S: nowIso }
        },
        ConditionExpression:
          'attribute_not_exists(versionCharacterKey) OR lastRequestedAt <= :allowedBefore',
        ExpressionAttributeValues: {
          ':allowedBefore': { S: allowedBefore }
        }
      })
    );
  } catch (error) {
    if (error?.name === 'ConditionalCheckFailedException') {
      const lock = await getCommunityRebuildLockV2(questionnaireVersion);
      const cooldownError = new Error('Community rebuild is on cooldown.');
      cooldownError.name = 'CommunityRebuildCooldownError';
      cooldownError.retryAfterSeconds = getRetryAfterSeconds(
        lock?.lastRequestedAt
      );
      cooldownError.lastRequestedAt = lock?.lastRequestedAt || '';
      throw cooldownError;
    }

    throw error;
  }

  const result = await rebuildCommunityCharacterStatsV2(questionnaireVersion);
  await writeCommunityRebuildLockV2(questionnaireVersion, {
    lastRequestedAt: nowIso,
    lastCompletedAt: result.computedAt
  });

  return {
    ...result,
    cooldownSeconds: COMMUNITY_REBUILD_COOLDOWN_MS / 1000
  };
}

async function triggerPublicCommunityRebuildV4(questionnaireVersion) {
  assertV4CommunityStatsConfigured();

  const now = new Date();
  const nowIso = now.toISOString();
  const allowedBefore = new Date(
    now.getTime() - COMMUNITY_REBUILD_COOLDOWN_MS
  ).toISOString();

  try {
    await ddbClient.send(
      new PutItemCommand({
        TableName: COMMUNITY_CHARACTER_STATS_V4_TABLE_NAME,
        Item: {
          versionCharacterVariantKey: {
            S: buildVersionCharacterVariantKey(
              questionnaireVersion,
              COMMUNITY_REBUILD_LOCK_ID
            )
          },
          questionnaireVersion: { S: questionnaireVersion },
          characterVariantKey: { S: COMMUNITY_REBUILD_LOCK_ID },
          characterId: { S: COMMUNITY_REBUILD_LOCK_ID },
          statsType: { S: COMMUNITY_META_TYPE },
          lastRequestedAt: { S: nowIso }
        },
        ConditionExpression:
          'attribute_not_exists(versionCharacterVariantKey) OR lastRequestedAt <= :allowedBefore',
        ExpressionAttributeValues: {
          ':allowedBefore': { S: allowedBefore }
        }
      })
    );
  } catch (error) {
    if (error?.name === 'ConditionalCheckFailedException') {
      const lock = await getCommunityRebuildLockV4(questionnaireVersion);
      const cooldownError = new Error('Community rebuild is on cooldown.');
      cooldownError.name = 'CommunityRebuildCooldownError';
      cooldownError.retryAfterSeconds = getRetryAfterSeconds(
        lock?.lastRequestedAt
      );
      cooldownError.lastRequestedAt = lock?.lastRequestedAt || '';
      throw cooldownError;
    }

    throw error;
  }

  const result = await rebuildCommunityCharacterStatsV4(questionnaireVersion);
  await writeCommunityRebuildLockV4(questionnaireVersion, {
    lastRequestedAt: nowIso,
    lastCompletedAt: result.computedAt
  });

  return {
    ...result,
    cooldownSeconds: COMMUNITY_REBUILD_COOLDOWN_MS / 1000
  };
}

async function listCommunityCharacterStatsV2(questionnaireVersion) {
  assertV2CommunityStatsConfigured();

  const [characters, stats] = await Promise.all([
    listAllCharacters(),
    queryCommunityStatsV2(questionnaireVersion)
  ]);

  return mergeCommunityCharacters({
    characters,
    stats,
    questionnaireVersion
  });
}

async function listCommunityCharacterStatsV4(questionnaireVersion) {
  assertV4CommunityStatsConfigured();

  const [characters, stats] = await Promise.all([
    buildScoreCandidates(await listAllCharacters()),
    queryCommunityStatsV4(questionnaireVersion)
  ]);

  return mergeCommunityCharacters({
    characters,
    stats,
    questionnaireVersion,
    idField: 'characterVariantKey'
  });
}

async function listCommunityFavoritesV2({
  limit = 10,
  questionnaireVersion = ACTIVE_QUESTIONNAIRE_VERSION
} = {}) {
  assertV2CommunityStatsConfigured();

  const characters = await listAllCharacters();
  const charactersById = new Map(
    characters.map((character) => [character.id, character])
  );
  const response = await ddbClient.send(
    new QueryCommand({
      TableName: COMMUNITY_CHARACTER_STATS_V2_TABLE_NAME,
      IndexName: 'StatsByVersionFavoriteCountIndex',
      KeyConditionExpression: 'questionnaireVersion = :questionnaireVersion',
      ExpressionAttributeValues: {
        ':questionnaireVersion': { S: questionnaireVersion }
      },
      ScanIndexForward: false,
      Limit: limit
    })
  );

  return {
    questionnaireVersion,
    characters: (response.Items || [])
      .map(parseCommunityStatsV2)
      .map((stats) => {
        const character = charactersById.get(stats.characterId);
        return character
          ? {
              ...character,
              communityStats: stats
            }
          : null;
      })
      .filter(Boolean)
  };
}

async function listCommunityFavoritesV4({
  limit = 10,
  questionnaireVersion = ACTIVE_QUESTIONNAIRE_VERSION
} = {}) {
  const characters = await listAllCharacters();
  const counts = await listFavoriteCountsByCharacter();

  return {
    questionnaireVersion,
    characters: [...characters]
      .map((character) => ({
        ...character,
        communityStats: {
          favoriteCount: counts.get(character.id) || 0
        }
      }))
      .filter((character) => (character.communityStats.favoriteCount || 0) > 0)
      .sort(
        (left, right) =>
          (right.communityStats.favoriteCount || 0) -
          (left.communityStats.favoriteCount || 0)
      )
      .slice(0, limit)
  };
}

async function listCharacterScoresSinceLegacy(characterId, windowStart) {
  const scores = [];
  let exclusiveStartKey;

  do {
    const response = await ddbClient.send(
      new QueryCommand({
        TableName: USER_CHARACTER_SCORES_TABLE_NAME,
        IndexName: 'ScoresByCharacterSubmittedAtIndex',
        KeyConditionExpression:
          'characterId = :characterId AND submittedAt >= :windowStart',
        ExpressionAttributeValues: {
          ':characterId': { S: characterId },
          ':windowStart': { S: windowStart }
        },
        ExclusiveStartKey: exclusiveStartKey
      })
    );

    scores.push(...(response.Items || []).map(parseUserCharacterScoreLegacy));
    exclusiveStartKey = response.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return scores;
}

async function listCharacterScoresSinceV2(
  questionnaireVersion,
  characterId,
  windowStart
) {
  const scores = [];
  let exclusiveStartKey;

  do {
    const response = await ddbClient.send(
      new QueryCommand({
        TableName: USER_CHARACTER_SCORES_V2_TABLE_NAME,
        IndexName: 'ScoresByVersionCharacterSubmittedAtIndex',
        KeyConditionExpression:
          'versionCharacterKey = :versionCharacterKey AND submittedAt >= :windowStart',
        ExpressionAttributeValues: {
          ':versionCharacterKey': {
            S: buildVersionCharacterKey(questionnaireVersion, characterId)
          },
          ':windowStart': { S: windowStart }
        },
        ExclusiveStartKey: exclusiveStartKey
      })
    );

    scores.push(...(response.Items || []).map(parseUserCharacterScoreV2));
    exclusiveStartKey = response.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return scores;
}

async function listCharacterScoresSinceV4(
  questionnaireVersion,
  characterVariantKey,
  windowStart
) {
  const scores = [];
  let exclusiveStartKey;

  do {
    const response = await ddbClient.send(
      new QueryCommand({
        TableName: USER_CHARACTER_SCORES_V4_TABLE_NAME,
        IndexName: 'ScoresByVersionCharacterVariantSubmittedAtIndex',
        KeyConditionExpression:
          'versionCharacterVariantKey = :versionCharacterVariantKey AND submittedAt >= :windowStart',
        ExpressionAttributeValues: {
          ':versionCharacterVariantKey': {
            S: buildVersionCharacterVariantKey(
              questionnaireVersion,
              characterVariantKey
            )
          },
          ':windowStart': { S: windowStart }
        },
        ExclusiveStartKey: exclusiveStartKey
      })
    );

    scores.push(...(response.Items || []).map(parseUserCharacterScoreV4));
    exclusiveStartKey = response.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return scores;
}

function buildCharacterStatsItemLegacy({
  characterId,
  computedAt,
  windowStart,
  favoriteCount,
  recentScores
}) {
  const mono = buildScoreAggregate(
    recentScores.map((score) => score.monoScore)
  );
  const mixed = buildScoreAggregate(
    recentScores.map((score) => score.mixedScore)
  );
  const nicheDistribution = buildNicheDistribution(recentScores);
  const calculated = buildScoreAggregate(
    recentScores.map((score) =>
      calculateQuestionnaireV2Score({
        monoScore: score.monoScore,
        mixedCrusadeScore: score.mixedCrusadeScore,
        mixedFrontierScore: score.mixedFrontierScore
      })
    )
  );

  return {
    characterId: { S: characterId },
    statsType: { S: COMMUNITY_STATS_TYPE },
    computedAt: { S: computedAt },
    windowStart: { S: windowStart },
    favoriteCount: { N: String(favoriteCount) },
    monoCount: { N: String(mono.count) },
    monoAverage: { N: String(mono.average) },
    monoDistribution: toNumberMapAttribute(mono.distribution),
    mixedCount: { N: String(mixed.count) },
    mixedAverage: { N: String(mixed.average) },
    mixedDistribution: toNumberMapAttribute(mixed.distribution),
    nicheDistribution: toNumberMapAttribute(nicheDistribution),
    calculatedCount: { N: String(calculated.count) },
    calculatedAverage: { N: String(calculated.average) },
    calculatedDistribution: toNumberMapAttribute(calculated.distribution)
  };
}

function buildCharacterStatsItemV2({
  questionnaireVersion,
  characterId,
  computedAt,
  windowStart,
  favoriteCount,
  recentScores
}) {
  const mono = buildScoreAggregate(
    recentScores.map((score) => score.monoScore)
  );
  const mixedCrusade = buildScoreAggregate(
    recentScores.map((score) => score.mixedCrusadeScore)
  );
  const mixedFrontier = buildScoreAggregate(
    recentScores.map((score) => score.mixedFrontierScore)
  );
  const calculated = buildScoreAggregate(
    recentScores.map((score) => score.calculatedScore)
  );

  return {
    versionCharacterKey: {
      S: buildVersionCharacterKey(questionnaireVersion, characterId)
    },
    questionnaireVersion: { S: questionnaireVersion },
    characterId: { S: characterId },
    statsType: { S: COMMUNITY_STATS_TYPE },
    computedAt: { S: computedAt },
    windowStart: { S: windowStart },
    favoriteCount: { N: String(favoriteCount) },
    monoCount: { N: String(mono.count) },
    monoAverage: { N: String(mono.average) },
    monoDistribution: toNumberMapAttribute(mono.distribution),
    mixedCrusadeCount: { N: String(mixedCrusade.count) },
    mixedCrusadeAverage: { N: String(mixedCrusade.average) },
    mixedCrusadeDistribution: toNumberMapAttribute(mixedCrusade.distribution),
    mixedFrontierCount: { N: String(mixedFrontier.count) },
    mixedFrontierAverage: { N: String(mixedFrontier.average) },
    mixedFrontierDistribution: toNumberMapAttribute(mixedFrontier.distribution),
    calculatedCount: { N: String(calculated.count) },
    calculatedAverage: { N: String(calculated.average) },
    calculatedDistribution: toNumberMapAttribute(calculated.distribution)
  };
}

function buildCharacterStatsItemV4({
  questionnaireVersion,
  characterVariantKey,
  characterId,
  isYearning,
  computedAt,
  windowStart,
  recentScores
}) {
  const mono = buildScoreAggregate(recentScores.map((score) => score.monoScore));
  const mixedCrusade = buildScoreAggregate(
    recentScores.map((score) => score.mixedCrusadeScore)
  );
  const mixedFrontier = buildScoreAggregate(
    recentScores.map((score) => score.mixedFrontierScore)
  );
  const calculated = buildScoreAggregate(
    recentScores.map((score) => score.calculatedScore)
  );

  return {
    versionCharacterVariantKey: {
      S: buildVersionCharacterVariantKey(
        questionnaireVersion,
        characterVariantKey
      )
    },
    questionnaireVersion: { S: questionnaireVersion },
    characterVariantKey: { S: characterVariantKey },
    characterId: { S: characterId },
    isYearning: { BOOL: Boolean(isYearning) },
    statsType: { S: COMMUNITY_STATS_TYPE },
    computedAt: { S: computedAt },
    windowStart: { S: windowStart },
    favoriteCount: { N: '0' },
    monoCount: { N: String(mono.count) },
    monoAverage: { N: String(mono.average) },
    monoDistribution: toNumberMapAttribute(mono.distribution),
    mixedCrusadeCount: { N: String(mixedCrusade.count) },
    mixedCrusadeAverage: { N: String(mixedCrusade.average) },
    mixedCrusadeDistribution: toNumberMapAttribute(mixedCrusade.distribution),
    mixedFrontierCount: { N: String(mixedFrontier.count) },
    mixedFrontierAverage: { N: String(mixedFrontier.average) },
    mixedFrontierDistribution: toNumberMapAttribute(mixedFrontier.distribution),
    calculatedCount: { N: String(calculated.count) },
    calculatedAverage: { N: String(calculated.average) },
    calculatedDistribution: toNumberMapAttribute(calculated.distribution)
  };
}

function buildScoreAggregate(values) {
  const numericValues = values.filter((value) => typeof value === 'number');
  const distribution = {};

  for (const value of numericValues) {
    const key = String(value);
    distribution[key] = (distribution[key] || 0) + 1;
  }

  return {
    count: numericValues.length,
    average: numericValues.length
      ? Number(
          (
            numericValues.reduce((total, value) => total + value, 0) /
            numericValues.length
          ).toFixed(4)
        )
      : 0,
    distribution
  };
}

function buildNicheDistribution(scores) {
  const distribution = {
    false: 0,
    true: 0
  };

  for (const score of scores) {
    if (typeof score.nicheScore === 'number') {
      distribution.true += 1;
    } else {
      distribution.false += 1;
    }
  }

  return distribution;
}

async function scanCommunityStatsLegacy() {
  const items = [];
  let exclusiveStartKey;

  do {
    const response = await ddbClient.send(
      new ScanCommand({
        TableName: COMMUNITY_CHARACTER_STATS_TABLE_NAME,
        FilterExpression: 'statsType = :statsType',
        ExpressionAttributeValues: {
          ':statsType': {
            S: COMMUNITY_STATS_TYPE
          }
        },
        ExclusiveStartKey: exclusiveStartKey
      })
    );

    items.push(...(response.Items || []).map(parseCommunityStatsLegacy));
    exclusiveStartKey = response.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return items;
}

async function queryCommunityStatsV2(questionnaireVersion) {
  const items = [];
  let exclusiveStartKey;

  do {
    const response = await ddbClient.send(
      new QueryCommand({
        TableName: COMMUNITY_CHARACTER_STATS_V2_TABLE_NAME,
        IndexName: 'StatsByVersionCharacterIndex',
        KeyConditionExpression: 'questionnaireVersion = :questionnaireVersion',
        ExpressionAttributeValues: {
          ':questionnaireVersion': { S: questionnaireVersion }
        },
        ExclusiveStartKey: exclusiveStartKey
      })
    );

    items.push(
      ...(response.Items || [])
        .map(parseCommunityStatsV2)
        .filter((item) => item.statsType === COMMUNITY_STATS_TYPE)
    );
    exclusiveStartKey = response.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return items;
}

async function queryCommunityStatsV4(questionnaireVersion) {
  const items = [];
  let exclusiveStartKey;

  do {
    const response = await ddbClient.send(
      new QueryCommand({
        TableName: COMMUNITY_CHARACTER_STATS_V4_TABLE_NAME,
        IndexName: 'StatsByVersionCharacterVariantIndex',
        KeyConditionExpression: 'questionnaireVersion = :questionnaireVersion',
        ExpressionAttributeValues: {
          ':questionnaireVersion': { S: questionnaireVersion }
        },
        ExclusiveStartKey: exclusiveStartKey
      })
    );

    items.push(
      ...(response.Items || [])
        .map(parseCommunityStatsV4)
        .filter((item) => item.statsType === COMMUNITY_STATS_TYPE)
    );
    exclusiveStartKey = response.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return items;
}

async function getCommunityRebuildLockLegacy() {
  const response = await ddbClient.send(
    new GetItemCommand({
      TableName: COMMUNITY_CHARACTER_STATS_TABLE_NAME,
      Key: {
        characterId: { S: COMMUNITY_REBUILD_LOCK_ID }
      }
    })
  );

  return {
    lastRequestedAt: response.Item?.lastRequestedAt?.S || '',
    lastCompletedAt: response.Item?.lastCompletedAt?.S || ''
  };
}

async function writeCommunityRebuildLockLegacy({
  lastRequestedAt,
  lastCompletedAt
}) {
  await ddbClient.send(
    new PutItemCommand({
      TableName: COMMUNITY_CHARACTER_STATS_TABLE_NAME,
      Item: {
        characterId: { S: COMMUNITY_REBUILD_LOCK_ID },
        statsType: { S: COMMUNITY_META_TYPE },
        lastRequestedAt: { S: lastRequestedAt },
        lastCompletedAt: { S: lastCompletedAt }
      }
    })
  );
}

async function getCommunityRebuildLockV2(questionnaireVersion) {
  const response = await ddbClient.send(
    new GetItemCommand({
      TableName: COMMUNITY_CHARACTER_STATS_V2_TABLE_NAME,
      Key: {
        versionCharacterKey: {
          S: buildVersionCharacterKey(
            questionnaireVersion,
            COMMUNITY_REBUILD_LOCK_ID
          )
        }
      }
    })
  );

  return {
    lastRequestedAt: response.Item?.lastRequestedAt?.S || '',
    lastCompletedAt: response.Item?.lastCompletedAt?.S || ''
  };
}

async function getCommunityRebuildLockV4(questionnaireVersion) {
  const response = await ddbClient.send(
    new GetItemCommand({
      TableName: COMMUNITY_CHARACTER_STATS_V4_TABLE_NAME,
      Key: {
        versionCharacterVariantKey: {
          S: buildVersionCharacterVariantKey(
            questionnaireVersion,
            COMMUNITY_REBUILD_LOCK_ID
          )
        }
      }
    })
  );

  return {
    lastRequestedAt: response.Item?.lastRequestedAt?.S || '',
    lastCompletedAt: response.Item?.lastCompletedAt?.S || ''
  };
}

async function writeCommunityRebuildLockV2(
  questionnaireVersion,
  { lastRequestedAt, lastCompletedAt }
) {
  await ddbClient.send(
    new PutItemCommand({
      TableName: COMMUNITY_CHARACTER_STATS_V2_TABLE_NAME,
      Item: {
        versionCharacterKey: {
          S: buildVersionCharacterKey(
            questionnaireVersion,
            COMMUNITY_REBUILD_LOCK_ID
          )
        },
        questionnaireVersion: { S: questionnaireVersion },
        characterId: { S: COMMUNITY_REBUILD_LOCK_ID },
        statsType: { S: COMMUNITY_META_TYPE },
        lastRequestedAt: { S: lastRequestedAt },
        lastCompletedAt: { S: lastCompletedAt }
      }
    })
  );
}

async function writeCommunityRebuildLockV4(
  questionnaireVersion,
  { lastRequestedAt, lastCompletedAt }
) {
  await ddbClient.send(
    new PutItemCommand({
      TableName: COMMUNITY_CHARACTER_STATS_V4_TABLE_NAME,
      Item: {
        versionCharacterVariantKey: {
          S: buildVersionCharacterVariantKey(
            questionnaireVersion,
            COMMUNITY_REBUILD_LOCK_ID
          )
        },
        questionnaireVersion: { S: questionnaireVersion },
        characterVariantKey: { S: COMMUNITY_REBUILD_LOCK_ID },
        characterId: { S: COMMUNITY_REBUILD_LOCK_ID },
        statsType: { S: COMMUNITY_META_TYPE },
        lastRequestedAt: { S: lastRequestedAt },
        lastCompletedAt: { S: lastCompletedAt }
      }
    })
  );
}

function parseCommunityStatsLegacy(item) {
  return {
    characterId: item.characterId?.S || '',
    statsType: item.statsType?.S || '',
    computedAt: item.computedAt?.S || '',
    windowStart: item.windowStart?.S || '',
    favoriteCount: item.favoriteCount?.N ? Number(item.favoriteCount.N) : 0,
    mono: {
      count: item.monoCount?.N ? Number(item.monoCount.N) : 0,
      average: item.monoAverage?.N ? Number(item.monoAverage.N) : 0,
      distribution: parseNumberMap(item.monoDistribution)
    },
    mixed: {
      count: item.mixedCount?.N ? Number(item.mixedCount.N) : 0,
      average: item.mixedAverage?.N ? Number(item.mixedAverage.N) : 0,
      distribution: parseNumberMap(item.mixedDistribution)
    },
    niche: {
      distribution: parseNumberMap(item.nicheDistribution, {
        false: 0,
        true: 0
      })
    },
    calculated: {
      count: item.calculatedCount?.N ? Number(item.calculatedCount.N) : 0,
      average: item.calculatedAverage?.N ? Number(item.calculatedAverage.N) : 0,
      distribution: parseNumberMap(item.calculatedDistribution)
    }
  };
}

function parseCommunityStatsV2(item) {
  return {
    characterId: item.characterId?.S || '',
    questionnaireVersion:
      item.questionnaireVersion?.S || ACTIVE_QUESTIONNAIRE_VERSION,
    statsType: item.statsType?.S || '',
    computedAt: item.computedAt?.S || '',
    windowStart: item.windowStart?.S || '',
    favoriteCount: item.favoriteCount?.N ? Number(item.favoriteCount.N) : 0,
    mono: {
      count: item.monoCount?.N ? Number(item.monoCount.N) : 0,
      average: item.monoAverage?.N ? Number(item.monoAverage.N) : 0,
      distribution: parseNumberMap(item.monoDistribution)
    },
    mixedCrusade: {
      count: item.mixedCrusadeCount?.N ? Number(item.mixedCrusadeCount.N) : 0,
      average: item.mixedCrusadeAverage?.N
        ? Number(item.mixedCrusadeAverage.N)
        : 0,
      distribution: parseNumberMap(item.mixedCrusadeDistribution)
    },
    mixedFrontier: {
      count: item.mixedFrontierCount?.N ? Number(item.mixedFrontierCount.N) : 0,
      average: item.mixedFrontierAverage?.N
        ? Number(item.mixedFrontierAverage.N)
        : 0,
      distribution: parseNumberMap(item.mixedFrontierDistribution)
    },
    calculated: {
      count: item.calculatedCount?.N ? Number(item.calculatedCount.N) : 0,
      average: item.calculatedAverage?.N ? Number(item.calculatedAverage.N) : 0,
      distribution: parseNumberMap(item.calculatedDistribution)
    }
  };
}

function parseCommunityStatsV4(item) {
  return {
    characterVariantKey:
      item.characterVariantKey?.S || item.characterId?.S || '',
    characterId: item.characterId?.S || '',
    isYearning: item.isYearning?.BOOL || false,
    questionnaireVersion:
      item.questionnaireVersion?.S || ACTIVE_QUESTIONNAIRE_VERSION,
    statsType: item.statsType?.S || '',
    computedAt: item.computedAt?.S || '',
    windowStart: item.windowStart?.S || '',
    favoriteCount: item.favoriteCount?.N ? Number(item.favoriteCount.N) : 0,
    mono: {
      count: item.monoCount?.N ? Number(item.monoCount.N) : 0,
      average: item.monoAverage?.N ? Number(item.monoAverage.N) : 0,
      distribution: parseNumberMap(item.monoDistribution)
    },
    mixedCrusade: {
      count: item.mixedCrusadeCount?.N ? Number(item.mixedCrusadeCount.N) : 0,
      average: item.mixedCrusadeAverage?.N
        ? Number(item.mixedCrusadeAverage.N)
        : 0,
      distribution: parseNumberMap(item.mixedCrusadeDistribution)
    },
    mixedFrontier: {
      count: item.mixedFrontierCount?.N ? Number(item.mixedFrontierCount.N) : 0,
      average: item.mixedFrontierAverage?.N
        ? Number(item.mixedFrontierAverage.N)
        : 0,
      distribution: parseNumberMap(item.mixedFrontierDistribution)
    },
    calculated: {
      count: item.calculatedCount?.N ? Number(item.calculatedCount.N) : 0,
      average: item.calculatedAverage?.N ? Number(item.calculatedAverage.N) : 0,
      distribution: parseNumberMap(item.calculatedDistribution)
    }
  };
}

function parseUserCharacterScoreLegacy(item) {
  return {
    monoScore: parseOptionalNumber(item.monoScore),
    mixedScore: parseOptionalNumber(item.mixedScore),
    nicheScore: parseOptionalNumber(item.nicheScore),
    calculatedScore: parseOptionalNumber(item.calculatedScore)
  };
}

function parseUserCharacterScoreV2(item) {
  return {
    monoScore: parseOptionalNumber(item.monoScore),
    mixedCrusadeScore: parseOptionalNumber(item.mixedCrusadeScore),
    mixedFrontierScore: parseOptionalNumber(item.mixedFrontierScore),
    calculatedScore: calculateQuestionnaireV2Score({
      monoScore: parseOptionalNumber(item.monoScore),
      mixedCrusadeScore: parseOptionalNumber(item.mixedCrusadeScore),
      mixedFrontierScore: parseOptionalNumber(item.mixedFrontierScore)
    })
  };
}

function parseUserCharacterScoreV4(item) {
  return {
    monoScore: parseOptionalNumber(item.monoScore),
    mixedCrusadeScore: parseOptionalNumber(item.mixedCrusadeScore),
    mixedFrontierScore: parseOptionalNumber(item.mixedFrontierScore),
    calculatedScore: calculateQuestionnaireV2Score({
      monoScore: parseOptionalNumber(item.monoScore),
      mixedCrusadeScore: parseOptionalNumber(item.mixedCrusadeScore),
      mixedFrontierScore: parseOptionalNumber(item.mixedFrontierScore)
    })
  };
}

function parseOptionalNumber(attribute) {
  return attribute?.N !== undefined ? Number(attribute.N) : null;
}

function parseNumberMap(attribute, defaults = {}) {
  const value = { ...defaults };

  for (const [key, entry] of Object.entries(attribute?.M || {})) {
    if (entry?.N !== undefined) {
      value[key] = Number(entry.N);
    }
  }

  return value;
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

function mergeCommunityCharacters({
  characters,
  stats,
  questionnaireVersion,
  idField = 'characterId'
}) {
  const statsByCharacterId = new Map(
    stats.map((item) => [item[idField], item])
  );

  const mergedCharacters = characters.map((character) => ({
    ...character,
    communityStats:
      statsByCharacterId.get(character[idField] || character.id) ||
      makeEmptyCommunityStats(character[idField] || character.id, questionnaireVersion)
  }));

  mergedCharacters.sort((left, right) => {
    const averageDifference =
      (right.communityStats.calculated.average || 0) -
      (left.communityStats.calculated.average || 0);

    if (averageDifference !== 0) {
      return averageDifference;
    }

    const favoriteDifference =
      (right.communityStats.favoriteCount || 0) -
      (left.communityStats.favoriteCount || 0);

    if (favoriteDifference !== 0) {
      return favoriteDifference;
    }

    return (left.nameEn || left.id).localeCompare(right.nameEn || right.id);
  });

  return {
    questionnaireVersion,
    computedAt: stats[0]?.computedAt || null,
    windowStart: stats[0]?.windowStart || null,
    characters: mergedCharacters
  };
}

function makeEmptyCommunityStats(characterId, questionnaireVersion) {
  if (questionnaireVersion !== LEGACY_QUESTIONNAIRE_VERSION) {
    return {
      characterId,
      characterVariantKey: characterId,
      isYearning: characterId.endsWith?.('#yearning') || false,
      questionnaireVersion,
      statsType: COMMUNITY_STATS_TYPE,
      computedAt: '',
      windowStart: '',
      favoriteCount: 0,
      mono: {
        count: 0,
        average: 0,
        distribution: {}
      },
      mixedCrusade: {
        count: 0,
        average: 0,
        distribution: {}
      },
      mixedFrontier: {
        count: 0,
        average: 0,
        distribution: {}
      },
      calculated: {
        count: 0,
        average: 0,
        distribution: {}
      }
    };
  }

  return {
    characterId,
    statsType: COMMUNITY_STATS_TYPE,
    computedAt: '',
    windowStart: '',
    favoriteCount: 0,
    mono: {
      count: 0,
      average: 0,
      distribution: {}
    },
    mixed: {
      count: 0,
      average: 0,
      distribution: {}
    },
    niche: {
      distribution: {
        false: 0,
        true: 0
      }
    },
    calculated: {
      count: 0,
      average: 0,
      distribution: {}
    }
  };
}

function buildVersionCharacterKey(questionnaireVersion, characterId) {
  return `${questionnaireVersion}#${characterId}`;
}

function buildVersionCharacterVariantKey(
  questionnaireVersion,
  characterVariantKey
) {
  return `${questionnaireVersion}#${characterVariantKey}`;
}

function assertLegacyCommunityStatsConfigured() {
  if (!USER_CHARACTER_SCORES_TABLE_NAME) {
    throw new Error('User character scores table is not configured.');
  }

  if (!COMMUNITY_CHARACTER_STATS_TABLE_NAME) {
    throw new Error('Community character stats table is not configured.');
  }
}

function assertV2CommunityStatsConfigured() {
  if (!USER_CHARACTER_SCORES_V2_TABLE_NAME) {
    throw new Error('V2 user character scores table is not configured.');
  }

  if (!COMMUNITY_CHARACTER_STATS_V2_TABLE_NAME) {
    throw new Error('V2 community character stats table is not configured.');
  }
}

function assertV4CommunityStatsConfigured() {
  if (!USER_CHARACTER_SCORES_V4_TABLE_NAME) {
    throw new Error('V4 user character scores table is not configured.');
  }

  if (!COMMUNITY_CHARACTER_STATS_V4_TABLE_NAME) {
    throw new Error('V4 community character stats table is not configured.');
  }
}

function buildScoreCandidates(characters) {
  return characters.flatMap((character) => {
    const baseCandidate = {
      ...character,
      id: `${character.id}#base`,
      characterId: character.id,
      characterVariantKey: `${character.id}#base`,
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
        characterVariantKey: `${character.id}#yearning`,
        isYearning: true
      }
    ];
  });
}

function getRetryAfterSeconds(lastRequestedAt) {
  if (!lastRequestedAt) {
    return Math.ceil(COMMUNITY_REBUILD_COOLDOWN_MS / 1000);
  }

  const retryAt =
    new Date(lastRequestedAt).getTime() + COMMUNITY_REBUILD_COOLDOWN_MS;

  return Math.max(1, Math.ceil((retryAt - Date.now()) / 1000));
}
