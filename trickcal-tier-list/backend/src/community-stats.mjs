import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
  ScanCommand
} from '@aws-sdk/client-dynamodb';
import { listAllCharacters } from './characters.mjs';

const USER_CHARACTER_SCORES_TABLE_NAME =
  process.env.USER_CHARACTER_SCORES_TABLE_NAME;
const COMMUNITY_CHARACTER_STATS_TABLE_NAME =
  process.env.COMMUNITY_CHARACTER_STATS_TABLE_NAME;

const ddbClient = new DynamoDBClient({});
const COMMUNITY_STATS_TYPE = 'CHARACTER';
const COMMUNITY_WINDOW_DAYS = 60;
const COMMUNITY_META_TYPE = 'META';
const COMMUNITY_REBUILD_LOCK_ID = '__community_rebuild_lock__';
const COMMUNITY_REBUILD_COOLDOWN_MS = 5 * 60 * 1000;

export async function rebuildCommunityCharacterStats() {
  assertCommunityStatsConfigured();

  const characters = await listAllCharacters();
  const computedAt = new Date().toISOString();
  const windowStartDate = new Date(
    Date.now() - COMMUNITY_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );
  const windowStart = windowStartDate.toISOString();

  const statsItems = await Promise.all(
    characters.map(async (character) => {
      const recentScores = await listCharacterScoresSince(
        character.id,
        windowStart
      );
      const favoriteCount = await countCharacterFavorites(character.id);

      return buildCharacterStatsItem({
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
    charactersProcessed: statsItems.length,
    computedAt,
    windowStart
  };
}

export async function triggerPublicCommunityRebuild() {
  assertCommunityStatsConfigured();

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
      const lock = await getCommunityRebuildLock();
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

  const result = await rebuildCommunityCharacterStats();
  await writeCommunityRebuildLock({
    lastRequestedAt: nowIso,
    lastCompletedAt: result.computedAt
  });

  return {
    ...result,
    cooldownSeconds: COMMUNITY_REBUILD_COOLDOWN_MS / 1000
  };
}

export async function listCommunityCharacterStats() {
  assertCommunityStatsConfigured();

  const [characters, stats] = await Promise.all([
    listAllCharacters(),
    scanCommunityStats()
  ]);

  const statsByCharacterId = new Map(
    stats.map((item) => [item.characterId, item])
  );

  const mergedCharacters = characters.map((character) => ({
    ...character,
    communityStats:
      statsByCharacterId.get(character.id) ||
      makeEmptyCommunityStats(character.id)
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
    computedAt: stats[0]?.computedAt || null,
    windowStart: stats[0]?.windowStart || null,
    characters: mergedCharacters
  };
}

export async function listCommunityFavorites({ limit = 10 } = {}) {
  assertCommunityStatsConfigured();

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
    characters: (response.Items || [])
      .map(parseCommunityStats)
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

async function listCharacterScoresSince(characterId, windowStart) {
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

    scores.push(...(response.Items || []).map(parseUserCharacterScore));
    exclusiveStartKey = response.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return scores;
}

async function countCharacterFavorites(characterId) {
  let count = 0;
  let exclusiveStartKey;

  do {
    const response = await ddbClient.send(
      new QueryCommand({
        TableName: USER_CHARACTER_SCORES_TABLE_NAME,
        IndexName: 'FavoritesByCharacterIndex',
        KeyConditionExpression: 'favoriteCharacterId = :characterId',
        ExpressionAttributeValues: {
          ':characterId': { S: characterId }
        },
        Select: 'COUNT',
        ExclusiveStartKey: exclusiveStartKey
      })
    );

    count += response.Count || 0;
    exclusiveStartKey = response.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return count;
}

function buildCharacterStatsItem({
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
    recentScores.map((score) => score.calculatedScore)
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

async function scanCommunityStats() {
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

    items.push(...(response.Items || []).map(parseCommunityStats));
    exclusiveStartKey = response.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return items;
}

async function getCommunityRebuildLock() {
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

async function writeCommunityRebuildLock({ lastRequestedAt, lastCompletedAt }) {
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

function parseCommunityStats(item) {
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

function parseUserCharacterScore(item) {
  return {
    monoScore: parseOptionalNumber(item.monoScore),
    mixedScore: parseOptionalNumber(item.mixedScore),
    nicheScore: parseOptionalNumber(item.nicheScore),
    calculatedScore: parseOptionalNumber(item.calculatedScore)
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

function makeEmptyCommunityStats(characterId) {
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

function assertCommunityStatsConfigured() {
  if (!USER_CHARACTER_SCORES_TABLE_NAME) {
    throw new Error('User character scores table is not configured.');
  }

  if (!COMMUNITY_CHARACTER_STATS_TABLE_NAME) {
    throw new Error('Community character stats table is not configured.');
  }
}

function getRetryAfterSeconds(lastRequestedAt) {
  if (!lastRequestedAt) {
    return Math.ceil(COMMUNITY_REBUILD_COOLDOWN_MS / 1000);
  }

  const retryAt =
    new Date(lastRequestedAt).getTime() + COMMUNITY_REBUILD_COOLDOWN_MS;

  return Math.max(1, Math.ceil((retryAt - Date.now()) / 1000));
}
