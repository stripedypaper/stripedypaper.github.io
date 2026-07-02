import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
  UpdateItemCommand
} from '@aws-sdk/client-dynamodb';

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME;
const USERS_ENTITY_TYPE = 'user';

const ddbClient = new DynamoDBClient({});

export const USER_ROLE = 'user';
export const MANAGER_ROLE = 'manager';
export const ADMIN_ROLE = 'admin';

export async function getUserRecord(discordId) {
  if (!USERS_TABLE_NAME || !discordId) {
    return null;
  }

  const response = await ddbClient.send(
    new GetItemCommand({
      TableName: USERS_TABLE_NAME,
      Key: {
        discordId: {
          S: discordId
        }
      }
    })
  );

  return response.Item ? parseUserRecord(response.Item) : null;
}

export async function ensureUserRecord(discordUser) {
  if (!USERS_TABLE_NAME || !discordUser?.id) {
    return null;
  }

  const now = new Date().toISOString();
  const existingUser = await getUserRecord(discordUser.id);

  if (!existingUser) {
    await ddbClient.send(
      new PutItemCommand({
        TableName: USERS_TABLE_NAME,
        Item: {
          discordId: {
            S: discordUser.id
          },
          entityType: {
            S: USERS_ENTITY_TYPE
          },
          role: {
            S: USER_ROLE
          },
          username: {
            S: discordUser.username || ''
          },
          isCurator: {
            BOOL: false
          },
          createdAt: {
            S: now
          },
          updatedAt: {
            S: now
          },
          updatedBy: {
            S: discordUser.id
          }
        },
        ConditionExpression: 'attribute_not_exists(discordId)'
      })
    );

    return {
      user: await getUserRecord(discordUser.id),
      created: true,
      usernameUpdated: false
    };
  }

  const nextUsername = discordUser.username || '';
  const usernameUpdated = existingUser.username !== nextUsername;

  await ddbClient.send(
    new UpdateItemCommand({
      TableName: USERS_TABLE_NAME,
      Key: {
        discordId: {
          S: discordUser.id
        }
      },
      UpdateExpression: 'SET entityType = :entityType, username = :username',
      ExpressionAttributeValues: {
        ':entityType': {
          S: USERS_ENTITY_TYPE
        },
        ':username': {
          S: nextUsername
        }
      },
      ConditionExpression: 'attribute_exists(discordId)'
    })
  );

  return {
    user: await getUserRecord(discordUser.id),
    created: false,
    usernameUpdated
  };
}

export async function listUsersPage({ limit = 20, cursor = null } = {}) {
  if (!USERS_TABLE_NAME) {
    return {
      users: [],
      nextCursor: null
    };
  }

  const response = await ddbClient.send(
    new QueryCommand({
      TableName: USERS_TABLE_NAME,
      IndexName: 'UsersByUpdatedAtIndex',
      KeyConditionExpression: 'entityType = :entityType',
      ExpressionAttributeValues: {
        ':entityType': {
          S: USERS_ENTITY_TYPE
        }
      },
      Limit: limit,
      ScanIndexForward: false,
      ExclusiveStartKey: decodeCursor(cursor)
    })
  );

  return {
    users: (response.Items || []).map(parseUserRecord),
    nextCursor: encodeCursor(response.LastEvaluatedKey || null)
  };
}

export async function updateUserRecord(actorId, discordId, updates) {
  if (!USERS_TABLE_NAME || !discordId) {
    return null;
  }

  const existingUser = await getUserRecord(discordId);
  if (!existingUser) {
    return null;
  }

  const role = normalizeRole(updates?.role ?? existingUser.role);
  const isCurator =
    typeof updates?.isCurator === 'boolean'
      ? updates.isCurator
      : existingUser.isCurator;
  const now = new Date().toISOString();

  await ddbClient.send(
    new UpdateItemCommand({
      TableName: USERS_TABLE_NAME,
      Key: {
        discordId: {
          S: discordId
        }
      },
      UpdateExpression:
        'SET entityType = :entityType, #role = :role, isCurator = :isCurator, updatedAt = :updatedAt, updatedBy = :updatedBy',
      ExpressionAttributeNames: {
        '#role': 'role'
      },
      ExpressionAttributeValues: {
        ':entityType': {
          S: USERS_ENTITY_TYPE
        },
        ':role': {
          S: role
        },
        ':isCurator': {
          BOOL: isCurator
        },
        ':updatedAt': {
          S: now
        },
        ':updatedBy': {
          S: actorId
        }
      },
      ConditionExpression: 'attribute_exists(discordId)'
    })
  );

  return getUserRecord(discordId);
}

export function isAdminRole(role) {
  return role === ADMIN_ROLE;
}

export function isManagerRole(role) {
  return role === MANAGER_ROLE;
}

function normalizeRole(role) {
  if (role === ADMIN_ROLE || role === MANAGER_ROLE || role === USER_ROLE) {
    return role;
  }

  throw new Error('Invalid role.');
}

function parseUserRecord(item) {
  return {
    discordId: item.discordId?.S || '',
    role: item.role?.S || USER_ROLE,
    username: item.username?.S || '',
    isCurator: item.isCurator?.BOOL || false,
    createdAt: item.createdAt?.S || '',
    updatedAt: item.updatedAt?.S || '',
    updatedBy: item.updatedBy?.S || ''
  };
}

function encodeCursor(key) {
  if (!key) {
    return null;
  }

  return Buffer.from(JSON.stringify(key)).toString('base64url');
}

function decodeCursor(cursor) {
  if (!cursor) {
    return undefined;
  }

  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  } catch {
    return undefined;
  }
}
