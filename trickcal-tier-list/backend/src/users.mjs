import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand
} from '@aws-sdk/client-dynamodb';

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME;

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

  try {
    await ddbClient.send(
      new PutItemCommand({
        TableName: USERS_TABLE_NAME,
        Item: {
          discordId: {
            S: discordUser.id
          },
          role: {
            S: USER_ROLE
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
  } catch (error) {
    if (error?.name !== 'ConditionalCheckFailedException') {
      throw error;
    }
  }

  return getUserRecord(discordUser.id);
}

export async function listUsersPage({ limit = 20, cursor = null } = {}) {
  if (!USERS_TABLE_NAME) {
    return {
      users: [],
      nextCursor: null
    };
  }

  const scanInput = {
    TableName: USERS_TABLE_NAME,
    Limit: limit,
    ProjectionExpression: 'discordId, #role, createdAt, updatedAt, updatedBy',
    ExpressionAttributeNames: {
      '#role': 'role'
    }
  };

  const exclusiveStartKey = decodeCursor(cursor);
  if (exclusiveStartKey) {
    scanInput.ExclusiveStartKey = exclusiveStartKey;
  }

  const response = await ddbClient.send(new ScanCommand(scanInput));

  return {
    users: (response.Items || []).map(parseUserRecord),
    nextCursor: encodeCursor(response.LastEvaluatedKey || null)
  };
}

export function isAdminRole(role) {
  return role === ADMIN_ROLE;
}

export function isManagerRole(role) {
  return role === MANAGER_ROLE;
}

function parseUserRecord(item) {
  return {
    discordId: item.discordId?.S || '',
    role: item.role?.S || USER_ROLE,
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
