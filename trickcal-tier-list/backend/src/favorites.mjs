import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
  ScanCommand
} from '@aws-sdk/client-dynamodb';

const USER_FAVORITES_TABLE_NAME = process.env.USER_FAVORITES_TABLE_NAME;
const USER_CHARACTER_SCORES_TABLE_NAME =
  process.env.USER_CHARACTER_SCORES_TABLE_NAME;

const ddbClient = new DynamoDBClient({});

export async function getUserFavoriteCharacterId(userId) {
  if (!userId) {
    return '';
  }

  const currentFavorite = await getCurrentFavoriteCharacterId(userId);
  if (currentFavorite) {
    return currentFavorite;
  }

  return getLegacyFavoriteCharacterId(userId);
}

export async function saveUserFavoriteCharacterId(
  userId,
  favoriteCharacterId,
  updatedAt
) {
  if (!USER_FAVORITES_TABLE_NAME || !userId) {
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
}

export async function countCharacterFavorites(characterId) {
  if (!characterId) {
    return 0;
  }

  const favoriteUserIds = new Set();

  for (const userId of await listCurrentFavoriteUserIds(characterId)) {
    favoriteUserIds.add(userId);
  }

  for (const userId of await listLegacyFavoriteUserIds(characterId)) {
    favoriteUserIds.add(userId);
  }

  return favoriteUserIds.size;
}

export async function listFavoriteCountsByCharacter() {
  const currentFavoritesByUserId = await listCurrentFavoritesByUserId();
  const legacyFavoritesByUserId = await listLegacyFavoritesByUserId();
  const countsByCharacterId = new Map();

  for (const [userId, legacyCharacterId] of legacyFavoritesByUserId.entries()) {
    if (currentFavoritesByUserId.has(userId)) {
      continue;
    }

    incrementFavoriteCount(countsByCharacterId, legacyCharacterId);
  }

  for (const currentCharacterId of currentFavoritesByUserId.values()) {
    incrementFavoriteCount(countsByCharacterId, currentCharacterId);
  }

  return countsByCharacterId;
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

async function getLegacyFavoriteCharacterId(userId) {
  if (!USER_CHARACTER_SCORES_TABLE_NAME) {
    return '';
  }

  let exclusiveStartKey;

  do {
    const response = await ddbClient.send(
      new QueryCommand({
        TableName: USER_CHARACTER_SCORES_TABLE_NAME,
        KeyConditionExpression: 'userId = :userId',
        FilterExpression: 'favorite = :favorite',
        ExpressionAttributeValues: {
          ':userId': { S: userId },
          ':favorite': { BOOL: true }
        },
        ExclusiveStartKey: exclusiveStartKey
      })
    );

    const favoriteItem = (response.Items || []).find(
      (item) => item.favorite?.BOOL && item.characterId?.S
    );

    if (favoriteItem?.characterId?.S) {
      return favoriteItem.characterId.S;
    }

    exclusiveStartKey = response.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return '';
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

async function listLegacyFavoriteUserIds(characterId) {
  if (!USER_CHARACTER_SCORES_TABLE_NAME) {
    return [];
  }

  const userIds = [];
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

async function listCurrentFavoritesByUserId() {
  if (!USER_FAVORITES_TABLE_NAME) {
    return new Map();
  }

  const favoritesByUserId = new Map();
  let exclusiveStartKey;

  do {
    const response = await ddbClient.send(
      new ScanCommand({
        TableName: USER_FAVORITES_TABLE_NAME,
        ProjectionExpression: 'userId, characterId',
        ExclusiveStartKey: exclusiveStartKey
      })
    );

    for (const item of response.Items || []) {
      const userId = item.userId?.S || '';
      const characterId = item.characterId?.S || '';

      if (userId && characterId) {
        favoritesByUserId.set(userId, characterId);
      }
    }

    exclusiveStartKey = response.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return favoritesByUserId;
}

async function listLegacyFavoritesByUserId() {
  if (!USER_CHARACTER_SCORES_TABLE_NAME) {
    return new Map();
  }

  const favoritesByUserId = new Map();
  let exclusiveStartKey;

  do {
    const response = await ddbClient.send(
      new ScanCommand({
        TableName: USER_CHARACTER_SCORES_TABLE_NAME,
        ProjectionExpression: 'userId, characterId, favorite',
        FilterExpression: 'favorite = :favorite',
        ExpressionAttributeValues: {
          ':favorite': { BOOL: true }
        },
        ExclusiveStartKey: exclusiveStartKey
      })
    );

    for (const item of response.Items || []) {
      const userId = item.userId?.S || '';
      const characterId = item.characterId?.S || '';

      if (userId && characterId && !favoritesByUserId.has(userId)) {
        favoritesByUserId.set(userId, characterId);
      }
    }

    exclusiveStartKey = response.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return favoritesByUserId;
}

function incrementFavoriteCount(countsByCharacterId, characterId) {
  if (!characterId) {
    return;
  }

  countsByCharacterId.set(
    characterId,
    (countsByCharacterId.get(characterId) || 0) + 1
  );
}
