import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
  UpdateItemCommand
} from '@aws-sdk/client-dynamodb';

const USER_FAVORITES_TABLE_NAME = process.env.USER_FAVORITES_TABLE_NAME;
const CHARACTER_FAVORITE_COUNTS_TABLE_NAME =
  process.env.CHARACTER_FAVORITE_COUNTS_TABLE_NAME;
const FAVORITE_COUNT_ENTITY_TYPE = 'characterFavoriteCount';

const ddbClient = new DynamoDBClient({});

export async function getUserFavoriteCharacterId(userId) {
  if (!userId) {
    return '';
  }

  return getCurrentFavoriteCharacterId(userId);
}

export async function saveUserFavoriteCharacterId(
  userId,
  favoriteCharacterId,
  updatedAt
) {
  if (!USER_FAVORITES_TABLE_NAME || !userId) {
    return;
  }

  const existingFavoriteCharacterId =
    await getCurrentFavoriteCharacterId(userId);

  if ((existingFavoriteCharacterId || '') === (favoriteCharacterId || '')) {
    return;
  }

  if (!favoriteCharacterId) {
    await ddbClient.send(
      new DeleteItemCommand({
        TableName: USER_FAVORITES_TABLE_NAME,
        Key: {
          userId: { S: userId }
        }
      })
    );

    if (existingFavoriteCharacterId) {
      await adjustFavoriteCount(existingFavoriteCharacterId, -1, updatedAt);
    }

    return;
  }

  await ddbClient.send(
    new PutItemCommand({
      TableName: USER_FAVORITES_TABLE_NAME,
      Item: {
        userId: { S: userId },
        characterId: { S: favoriteCharacterId },
        updatedAt: { S: updatedAt }
      }
    })
  );

  if (existingFavoriteCharacterId) {
    await adjustFavoriteCount(existingFavoriteCharacterId, -1, updatedAt);
  }

  await adjustFavoriteCount(favoriteCharacterId, 1, updatedAt);
}

export async function countCharacterFavorites(characterId) {
  if (!characterId) {
    return 0;
  }

  if (!CHARACTER_FAVORITE_COUNTS_TABLE_NAME) {
    return (await listCurrentFavoriteUserIds(characterId)).length;
  }

  const response = await ddbClient.send(
    new GetItemCommand({
      TableName: CHARACTER_FAVORITE_COUNTS_TABLE_NAME,
      Key: {
        characterId: { S: characterId }
      }
    })
  );

  return response.Item?.favoriteCount?.N
    ? Number(response.Item.favoriteCount.N)
    : 0;
}

export async function listFavoriteCountsByCharacter() {
  const countsByCharacterId = new Map();

  if (!CHARACTER_FAVORITE_COUNTS_TABLE_NAME) {
    return countsByCharacterId;
  }

  let exclusiveStartKey;

  do {
    const response = await ddbClient.send(
      new QueryCommand({
        TableName: CHARACTER_FAVORITE_COUNTS_TABLE_NAME,
        IndexName: 'FavoriteCountsByCountIndex',
        KeyConditionExpression: 'entityType = :entityType',
        ExpressionAttributeValues: {
          ':entityType': { S: FAVORITE_COUNT_ENTITY_TYPE }
        },
        ScanIndexForward: false,
        ExclusiveStartKey: exclusiveStartKey
      })
    );

    for (const item of response.Items || []) {
      const characterId = item.characterId?.S || '';
      const favoriteCount = item.favoriteCount?.N
        ? Number(item.favoriteCount.N)
        : 0;

      if (characterId) {
        countsByCharacterId.set(characterId, favoriteCount);
      }
    }

    exclusiveStartKey = response.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return countsByCharacterId;
}

export async function listTopFavoriteCounts(limit = 10) {
  if (!CHARACTER_FAVORITE_COUNTS_TABLE_NAME || limit <= 0) {
    return [];
  }

  const response = await ddbClient.send(
    new QueryCommand({
      TableName: CHARACTER_FAVORITE_COUNTS_TABLE_NAME,
      IndexName: 'FavoriteCountsByCountIndex',
      KeyConditionExpression: 'entityType = :entityType',
      ExpressionAttributeValues: {
        ':entityType': { S: FAVORITE_COUNT_ENTITY_TYPE }
      },
      ScanIndexForward: false,
      Limit: limit
    })
  );

  return (response.Items || [])
    .map((item) => ({
      characterId: item.characterId?.S || '',
      favoriteCount: item.favoriteCount?.N ? Number(item.favoriteCount.N) : 0
    }))
    .filter((item) => item.characterId && item.favoriteCount > 0);
}

async function getCurrentFavoriteCharacterId(userId) {
  if (!USER_FAVORITES_TABLE_NAME) {
    return '';
  }

  const response = await ddbClient.send(
    new GetItemCommand({
      TableName: USER_FAVORITES_TABLE_NAME,
      Key: {
        userId: { S: userId }
      }
    })
  );

  return response.Item?.characterId?.S || '';
}

async function listCurrentFavoriteUserIds(characterId) {
  if (!USER_FAVORITES_TABLE_NAME) {
    return [];
  }

  const userIds = [];
  let exclusiveStartKey;

  do {
    const response = await ddbClient.send(
      new QueryCommand({
        TableName: USER_FAVORITES_TABLE_NAME,
        IndexName: 'FavoritesByCharacterIndex',
        KeyConditionExpression: 'characterId = :characterId',
        ExpressionAttributeValues: {
          ':characterId': { S: characterId }
        },
        ExclusiveStartKey: exclusiveStartKey
      })
    );

    userIds.push(
      ...(response.Items || [])
        .map((item) => item.userId?.S || '')
        .filter(Boolean)
    );
    exclusiveStartKey = response.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return userIds;
}

async function adjustFavoriteCount(characterId, delta, updatedAt) {
  if (!CHARACTER_FAVORITE_COUNTS_TABLE_NAME || !characterId || !delta) {
    return;
  }

  await ddbClient.send(
    new UpdateItemCommand({
      TableName: CHARACTER_FAVORITE_COUNTS_TABLE_NAME,
      Key: {
        characterId: { S: characterId }
      },
      UpdateExpression:
        'SET entityType = :entityType, updatedAt = :updatedAt ADD favoriteCount :delta',
      ExpressionAttributeValues: {
        ':entityType': { S: FAVORITE_COUNT_ENTITY_TYPE },
        ':updatedAt': { S: updatedAt || new Date().toISOString() },
        ':delta': { N: String(delta) }
      }
    })
  );
}
