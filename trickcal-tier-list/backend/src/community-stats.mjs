import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  QueryCommand
} from '@aws-sdk/client-dynamodb';
import { getCharactersByIds, listAllCharacters } from './characters.mjs';
import { listTopFavoriteCounts } from './favorites.mjs';
import { getUserRecordsByIds } from './users.mjs';
import {
  ACTIVE_QUESTIONNAIRE_VERSION,
  resolveQuestionnaireVersion
} from './questionnaire-version.mjs';
import { calculateQuestionnaireV2Score } from './score-weights.mjs';

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
  return rebuildCommunityCharacterStatsV4(
    resolveQuestionnaireVersion(questionnaireVersionInput)
  );
}

export async function triggerPublicCommunityRebuild(questionnaireVersionInput) {
  return triggerPublicCommunityRebuildV4(
    resolveQuestionnaireVersion(questionnaireVersionInput)
  );
}

export async function listCommunityCharacterStats(questionnaireVersionInput) {
  return listCommunityCharacterStatsV4(
    resolveQuestionnaireVersion(questionnaireVersionInput)
  );
}

export async function listCommunityFavorites({
  limit = 10,
  questionnaireVersion: questionnaireVersionInput
} = {}) {
  return listCommunityFavoritesV4({
    limit,
    questionnaireVersion: resolveQuestionnaireVersion(questionnaireVersionInput)
  });
}

async function rebuildCommunityCharacterStatsV4(questionnaireVersion) {
  assertV4CommunityStatsConfigured();

  const characters = buildScoreCandidates(await listAllCharacters());
  const userRecordCache = new Map();
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
      const curatorScores = await filterCuratorScores(
        recentScores,
        userRecordCache
      );

      return buildCharacterStatsItemV4({
        questionnaireVersion,
        characterVariantKey: character.characterVariantKey,
        characterId: character.characterId,
        isYearning: character.isYearning,
        computedAt,
        windowStart,
        recentScores,
        curatorScores
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

async function listCommunityFavoritesV4({
  limit = 10,
  questionnaireVersion = ACTIVE_QUESTIONNAIRE_VERSION
} = {}) {
  const favoriteCounts = await listTopFavoriteCounts(limit);
  const characters = await getCharactersByIds(
    favoriteCounts.map((item) => item.characterId)
  );
  const charactersById = new Map(
    characters.map((character) => [character.id, character])
  );

  return {
    questionnaireVersion,
    characters: favoriteCounts
      .map((item) => {
        const character = charactersById.get(item.characterId);

        if (!character) {
          return null;
        }

        return {
          ...character,
          communityStats: {
            favoriteCount: item.favoriteCount
          }
        };
      })
      .filter(Boolean)
  };
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

function buildCharacterStatsItemV4({
  questionnaireVersion,
  characterVariantKey,
  characterId,
  isYearning,
  computedAt,
  windowStart,
  recentScores,
  curatorScores
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
  const curatorMono = buildScoreAggregate(
    curatorScores.map((score) => score.monoScore)
  );
  const curatorMixedCrusade = buildScoreAggregate(
    curatorScores.map((score) => score.mixedCrusadeScore)
  );
  const curatorMixedFrontier = buildScoreAggregate(
    curatorScores.map((score) => score.mixedFrontierScore)
  );
  const curatorCalculated = buildScoreAggregate(
    curatorScores.map((score) => score.calculatedScore)
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
    calculatedDistribution: toNumberMapAttribute(calculated.distribution),
    curatorMonoCount: { N: String(curatorMono.count) },
    curatorMonoAverage: { N: String(curatorMono.average) },
    curatorMonoDistribution: toNumberMapAttribute(curatorMono.distribution),
    curatorMixedCrusadeCount: { N: String(curatorMixedCrusade.count) },
    curatorMixedCrusadeAverage: { N: String(curatorMixedCrusade.average) },
    curatorMixedCrusadeDistribution: toNumberMapAttribute(
      curatorMixedCrusade.distribution
    ),
    curatorMixedFrontierCount: { N: String(curatorMixedFrontier.count) },
    curatorMixedFrontierAverage: { N: String(curatorMixedFrontier.average) },
    curatorMixedFrontierDistribution: toNumberMapAttribute(
      curatorMixedFrontier.distribution
    ),
    curatorCalculatedCount: { N: String(curatorCalculated.count) },
    curatorCalculatedAverage: { N: String(curatorCalculated.average) },
    curatorCalculatedDistribution: toNumberMapAttribute(
      curatorCalculated.distribution
    )
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
    },
    curator: {
      mono: {
        count: item.curatorMonoCount?.N ? Number(item.curatorMonoCount.N) : 0,
        average: item.curatorMonoAverage?.N
          ? Number(item.curatorMonoAverage.N)
          : 0,
        distribution: parseNumberMap(item.curatorMonoDistribution)
      },
      mixedCrusade: {
        count: item.curatorMixedCrusadeCount?.N
          ? Number(item.curatorMixedCrusadeCount.N)
          : 0,
        average: item.curatorMixedCrusadeAverage?.N
          ? Number(item.curatorMixedCrusadeAverage.N)
          : 0,
        distribution: parseNumberMap(item.curatorMixedCrusadeDistribution)
      },
      mixedFrontier: {
        count: item.curatorMixedFrontierCount?.N
          ? Number(item.curatorMixedFrontierCount.N)
          : 0,
        average: item.curatorMixedFrontierAverage?.N
          ? Number(item.curatorMixedFrontierAverage.N)
          : 0,
        distribution: parseNumberMap(item.curatorMixedFrontierDistribution)
      },
      calculated: {
        count: item.curatorCalculatedCount?.N
          ? Number(item.curatorCalculatedCount.N)
          : 0,
        average: item.curatorCalculatedAverage?.N
          ? Number(item.curatorCalculatedAverage.N)
          : 0,
        distribution: parseNumberMap(item.curatorCalculatedDistribution)
      }
    }
  };
}

function parseUserCharacterScoreV4(item) {
  const monoScore = parseOptionalNumber(item.monoScore);
  const mixedCrusadeScore = parseOptionalNumber(item.mixedCrusadeScore);
  const mixedFrontierScore = parseOptionalNumber(item.mixedFrontierScore);

  return {
    userId: parseUserIdFromUserVersionKey(item.userVersionKey?.S || ''),
    monoScore,
    mixedCrusadeScore,
    mixedFrontierScore,
    calculatedScore: calculateQuestionnaireV2Score({
      monoScore,
      mixedCrusadeScore,
      mixedFrontierScore
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
      makeEmptyCommunityStats(
        character[idField] || character.id,
        questionnaireVersion
      )
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
    },
    curator: {
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
    }
  };
}

async function filterCuratorScores(recentScores, userRecordCache) {
  const userIds = [
    ...new Set(recentScores.map((score) => score.userId).filter(Boolean))
  ];
  const missingUserIds = userIds.filter(
    (userId) => !userRecordCache.has(userId)
  );

  if (missingUserIds.length) {
    const fetchedUsers = await getUserRecordsByIds(missingUserIds);
    for (const userId of missingUserIds) {
      userRecordCache.set(userId, fetchedUsers.get(userId) || null);
    }
  }

  return recentScores.filter(
    (score) => score.userId && userRecordCache.get(score.userId)?.isCurator
  );
}

function parseUserIdFromUserVersionKey(value) {
  if (!value) {
    return '';
  }

  const separatorIndex = value.indexOf('#');
  return separatorIndex >= 0 ? value.slice(separatorIndex + 1) : value;
}

function buildVersionCharacterVariantKey(
  questionnaireVersion,
  characterVariantKey
) {
  return `${questionnaireVersion}#${characterVariantKey}`;
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
