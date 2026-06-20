import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
  UpdateItemCommand
} from '@aws-sdk/client-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'node:crypto';

const CHARACTERS_TABLE_NAME = process.env.CHARACTERS_TABLE_NAME;
const CHARACTERS_IMAGES_BUCKET_NAME = process.env.CHARACTERS_IMAGES_BUCKET_NAME;
const CHARACTERS_CDN_BASE_URL = normalizeBaseUrl(
  process.env.CHARACTERS_CDN_BASE_URL
);

const ddbClient = new DynamoDBClient({});
const s3Client = new S3Client({});

export const CHARACTER_POSITION_VALUES = ['front', 'middle', 'back'];
export const CHARACTER_ROLE_VALUES = ['dps', 'tank', 'support'];
export const CHARACTER_PERSONALITY_VALUES = [
  'vivacious',
  'depressed',
  'innocent',
  'composed',
  'mad',
  'resonance'
];
export const CHARACTER_RARITY_VALUES = [1, 2, 3];
const CHARACTER_FILTER_TYPES = new Set(['', 'name', 'personality', 'position']);
const CHARACTER_NAME_INDEXES = [
  { indexName: 'CharactersByNameEnIndex', nameField: 'nameEnLower' },
  { indexName: 'CharactersByNameJaIndex', nameField: 'nameJaLower' },
  { indexName: 'CharactersByNameZhIndex', nameField: 'nameZhLower' },
  { indexName: 'CharactersByNameKoIndex', nameField: 'nameKoLower' }
];

export async function getCharacterRecord(id) {
  if (!CHARACTERS_TABLE_NAME || !id) {
    return null;
  }

  const response = await ddbClient.send(
    new GetItemCommand({
      TableName: CHARACTERS_TABLE_NAME,
      Key: {
        id: {
          S: id
        }
      }
    })
  );

  return response.Item ? parseCharacterRecord(response.Item) : null;
}

export async function listCharactersPage({
  limit = 20,
  cursor = null,
  filterType = '',
  filterValue = ''
} = {}) {
  if (!CHARACTERS_TABLE_NAME) {
    return {
      characters: [],
      nextCursor: null
    };
  }

  const normalizedFilterType = normalizeFilterType(filterType);
  const normalizedFilterValue = normalizeFilterValue(filterValue);

  if (normalizedFilterType === 'name') {
    return listCharactersByNamePrefixPage({
      limit,
      cursor,
      prefix: normalizedFilterValue
    });
  }

  const queryInput = buildSingleFilterQueryInput({
    limit,
    cursor,
    filterType: normalizedFilterType,
    filterValue: normalizedFilterValue
  });

  const response = await ddbClient.send(new QueryCommand(queryInput));

  return {
    characters: (response.Items || []).map(parseCharacterRecord),
    nextCursor: encodeCursor(response.LastEvaluatedKey || null)
  };
}

export async function listAllCharacters() {
  const characters = [];
  let cursor = null;

  do {
    const response = await listCharactersPage({
      limit: 100,
      cursor
    });

    characters.push(...response.characters);
    cursor = response.nextCursor || null;
  } while (cursor);

  return characters;
}

function buildSingleFilterQueryInput({
  limit,
  cursor,
  filterType,
  filterValue
}) {
  const baseProjectionExpression =
    'id, #position, #role, personality, rarity, nameEn, nameJa, nameZh, nameKo, createdAt, updatedAt, updatedBy, imageVersion';

  if (filterType === 'position') {
    const queryInput = {
      TableName: CHARACTERS_TABLE_NAME,
      IndexName: 'CharactersByPositionIndex',
      KeyConditionExpression: '#position = :position',
      ExpressionAttributeNames: {
        '#position': 'position',
        '#role': 'role'
      },
      ExpressionAttributeValues: {
        ':position': {
          S: filterValue
        }
      },
      Limit: limit,
      ScanIndexForward: false,
      ProjectionExpression: baseProjectionExpression
    };

    const exclusiveStartKey = decodeCursor(cursor);
    if (exclusiveStartKey) {
      queryInput.ExclusiveStartKey = exclusiveStartKey;
    }

    return queryInput;
  }

  if (filterType === 'personality') {
    const queryInput = {
      TableName: CHARACTERS_TABLE_NAME,
      IndexName: 'CharactersByPersonalityIndex',
      KeyConditionExpression: '#personality = :personality',
      ExpressionAttributeNames: {
        '#personality': 'personality',
        '#position': 'position',
        '#role': 'role'
      },
      ExpressionAttributeValues: {
        ':personality': {
          S: filterValue
        }
      },
      Limit: limit,
      ScanIndexForward: false,
      ProjectionExpression: baseProjectionExpression
    };

    const exclusiveStartKey = decodeCursor(cursor);
    if (exclusiveStartKey) {
      queryInput.ExclusiveStartKey = exclusiveStartKey;
    }

    return queryInput;
  }

  const queryInput = {
    TableName: CHARACTERS_TABLE_NAME,
    IndexName: 'CharactersByUpdatedAtIndex',
    KeyConditionExpression: '#entityType = :entityType',
    ExpressionAttributeNames: {
      '#entityType': 'entityType',
      '#position': 'position',
      '#role': 'role'
    },
    ExpressionAttributeValues: {
      ':entityType': {
        S: 'character'
      }
    },
    Limit: limit,
    ScanIndexForward: false,
    ProjectionExpression:
      'id, #position, #role, personality, rarity, nameEn, nameJa, nameZh, nameKo, createdAt, updatedAt, updatedBy, imageVersion'
  };

  const exclusiveStartKey = decodeCursor(cursor);
  if (exclusiveStartKey) {
    queryInput.ExclusiveStartKey = exclusiveStartKey;
  }

  return queryInput;
}

async function listCharactersByNamePrefixPage({ limit, cursor, prefix }) {
  const normalizedPrefix = prefix || '';
  if (!normalizedPrefix) {
    return {
      characters: [],
      nextCursor: null
    };
  }

  const state = decodeCursor(cursor) || {};
  let indexState = state.indexes || {};
  const seenIds = new Set(state.seenIds || []);
  const characters = [];
  const nextIndexState = {};

  while (characters.length < limit) {
    let progress = false;

    for (const index of CHARACTER_NAME_INDEXES) {
      if (characters.length >= limit) {
        break;
      }

      const currentState = indexState[index.indexName] || {};
      if (currentState.done) {
        nextIndexState[index.indexName] = currentState;
        continue;
      }

      const response = await ddbClient.send(
        new QueryCommand({
          TableName: CHARACTERS_TABLE_NAME,
          IndexName: index.indexName,
          KeyConditionExpression:
            '#entityType = :entityType AND begins_with(#name, :prefix)',
          ExpressionAttributeNames: {
            '#entityType': 'entityType',
            '#name': index.nameField,
            '#position': 'position',
            '#role': 'role'
          },
          ExpressionAttributeValues: {
            ':entityType': {
              S: 'character'
            },
            ':prefix': {
              S: normalizedPrefix
            }
          },
          ExclusiveStartKey: currentState.lastKey,
          Limit: Math.max(1, limit - characters.length),
          ProjectionExpression:
            'id, #position, #role, personality, rarity, nameEn, nameJa, nameZh, nameKo, createdAt, updatedAt, updatedBy, imageVersion',
          ScanIndexForward: false
        })
      );

      progress = progress || Boolean(response.Items?.length);
      nextIndexState[index.indexName] = {
        lastKey: response.LastEvaluatedKey || null,
        done: !response.LastEvaluatedKey
      };

      for (const item of response.Items || []) {
        const character = parseCharacterRecord(item);
        if (seenIds.has(character.id)) {
          continue;
        }

        seenIds.add(character.id);
        characters.push(character);
        if (characters.length >= limit) {
          break;
        }
      }
    }

    if (!progress) {
      break;
    }

    indexState = {
      ...indexState,
      ...nextIndexState
    };
  }

  const hasMore = Object.values(nextIndexState).some(
    (item) => item && !item.done
  );

  return {
    characters,
    nextCursor: hasMore
      ? encodeCursor({
          indexes: nextIndexState,
          seenIds: Array.from(seenIds)
        })
      : null
  };
}

export async function createCharacterRecord(actorId, input) {
  assertCharacterTableConfigured();
  const payload = validateCharacterInput(input);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const item = buildCharacterItem({
    id,
    ...payload,
    createdAt: now,
    updatedAt: now,
    updatedBy: actorId
  });

  await ddbClient.send(
    new PutItemCommand({
      TableName: CHARACTERS_TABLE_NAME,
      Item: item,
      ConditionExpression: 'attribute_not_exists(id)'
    })
  );

  return getCharacterRecord(id);
}

export async function updateCharacterRecord(actorId, id, input) {
  assertCharacterTableConfigured();
  const payload = validateCharacterInput(input);
  const now = new Date().toISOString();
  const update = buildUpdateExpression({
    ...payload,
    entityType: 'character',
    updatedAt: now,
    updatedBy: actorId
  });

  const response = await ddbClient.send(
    new UpdateItemCommand({
      TableName: CHARACTERS_TABLE_NAME,
      Key: {
        id: {
          S: id
        }
      },
      UpdateExpression: update.updateExpression,
      ExpressionAttributeNames: update.expressionAttributeNames,
      ExpressionAttributeValues: update.expressionAttributeValues,
      ConditionExpression: 'attribute_exists(id)',
      ReturnValues: 'ALL_NEW'
    })
  );

  return response.Attributes ? parseCharacterRecord(response.Attributes) : null;
}

export async function createCharacterImageUploadUrl(actorId, id, contentType) {
  assertCharacterUploadConfigured();
  validateImageContentType(contentType);

  const imageVersion = await touchCharacterImageVersion(actorId, id);
  const key = getCharacterImageKey(id);
  const command = new PutObjectCommand({
    Bucket: CHARACTERS_IMAGES_BUCKET_NAME,
    Key: key,
    ContentType: contentType
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 300
  });

  return {
    uploadUrl,
    imageUrl: makeCharacterImageUrl(id, imageVersion)
  };
}

export function makeCharacterImageUrl(id, version) {
  if (!CHARACTERS_CDN_BASE_URL) {
    return null;
  }

  const url = `${CHARACTERS_CDN_BASE_URL}/characters/${encodeURIComponent(
    id
  )}/image`;
  return version ? `${url}?v=${encodeURIComponent(version)}` : url;
}

function buildCharacterItem(character) {
  const item = {
    id: {
      S: character.id
    },
    entityType: {
      S: 'character'
    },
    position: {
      S: character.position
    },
    role: {
      S: character.role
    },
    personality: {
      S: character.personality
    },
    rarity: {
      N: String(character.rarity)
    },
    createdAt: {
      S: character.createdAt
    },
    updatedAt: {
      S: character.updatedAt
    },
    updatedBy: {
      S: character.updatedBy
    }
  };

  addOptionalString(item, 'nameEn', character.nameEn);
  addOptionalString(item, 'nameJa', character.nameJa);
  addOptionalString(item, 'nameZh', character.nameZh);
  addOptionalString(item, 'nameKo', character.nameKo);
  addOptionalString(item, 'nameEnLower', lowerOptionalString(character.nameEn));
  addOptionalString(item, 'nameJaLower', lowerOptionalString(character.nameJa));
  addOptionalString(item, 'nameZhLower', lowerOptionalString(character.nameZh));
  addOptionalString(item, 'nameKoLower', lowerOptionalString(character.nameKo));

  return item;
}

function buildUpdateExpression(character) {
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};
  const setParts = [];
  const removeParts = [];

  for (const [field, value] of Object.entries(character)) {
    if (value === undefined) {
      continue;
    }

    const tokenName = `#${field}`;
    expressionAttributeNames[tokenName] = field;

    if (value === null) {
      removeParts.push(tokenName);
      continue;
    }

    const tokenValue = `:${field}`;
    expressionAttributeValues[tokenValue] = toAttributeValue(value);
    setParts.push(`${tokenName} = ${tokenValue}`);
  }

  const updateExpressionParts = [];
  if (setParts.length) {
    updateExpressionParts.push(`SET ${setParts.join(', ')}`);
  }
  if (removeParts.length) {
    updateExpressionParts.push(`REMOVE ${removeParts.join(', ')}`);
  }

  return {
    updateExpression: updateExpressionParts.join(' '),
    expressionAttributeNames,
    expressionAttributeValues
  };
}

function parseCharacterRecord(item) {
  return {
    id: item.id?.S || '',
    nameEn: item.nameEn?.S || '',
    nameJa: item.nameJa?.S || '',
    nameZh: item.nameZh?.S || '',
    nameKo: item.nameKo?.S || '',
    position: item.position?.S || '',
    role: item.role?.S || '',
    personality: item.personality?.S || '',
    rarity: item.rarity?.N ? Number(item.rarity.N) : 0,
    createdAt: item.createdAt?.S || '',
    updatedAt: item.updatedAt?.S || '',
    updatedBy: item.updatedBy?.S || '',
    imageVersion: item.imageVersion?.S || '',
    imageUrl: makeCharacterImageUrl(
      item.id?.S || '',
      item.imageVersion?.S || item.updatedAt?.S || ''
    )
  };
}

function validateCharacterInput(input) {
  const nameEn = normalizeOptionalString(input?.nameEn);
  const nameJa = normalizeOptionalString(input?.nameJa);
  const nameZh = normalizeOptionalString(input?.nameZh);
  const nameKo = normalizeOptionalString(input?.nameKo);
  const position = normalizeRequiredChoice(
    input?.position,
    CHARACTER_POSITION_VALUES,
    'position'
  );
  const role = normalizeRequiredChoice(
    input?.role,
    CHARACTER_ROLE_VALUES,
    'role'
  );
  const personality = normalizeRequiredChoice(
    input?.personality,
    CHARACTER_PERSONALITY_VALUES,
    'personality'
  );
  const rarity = normalizeRequiredInteger(
    input?.rarity,
    CHARACTER_RARITY_VALUES,
    'rarity'
  );

  return {
    entityType: 'character',
    nameEn,
    nameJa,
    nameZh,
    nameKo,
    nameEnLower: lowerOptionalString(nameEn),
    nameJaLower: lowerOptionalString(nameJa),
    nameZhLower: lowerOptionalString(nameZh),
    nameKoLower: lowerOptionalString(nameKo),
    position,
    role,
    personality,
    rarity
  };
}

function normalizeRequiredChoice(value, allowedValues, fieldName) {
  const normalizedValue = normalizeRequiredString(value, fieldName);
  if (!allowedValues.includes(normalizedValue)) {
    throw new Error(`Invalid ${fieldName}.`);
  }

  return normalizedValue;
}

function normalizeRequiredInteger(value, allowedValues, fieldName) {
  const parsed = Number.parseInt(String(value), 10);
  if (!allowedValues.includes(parsed)) {
    throw new Error(`Invalid ${fieldName}.`);
  }

  return parsed;
}

function normalizeOptionalString(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function normalizeRequiredString(value, fieldName) {
  const normalized = normalizeOptionalString(value);
  if (!normalized) {
    throw new Error(`Missing ${fieldName}.`);
  }

  return normalized;
}

function addOptionalString(item, fieldName, value) {
  if (!value) {
    return;
  }

  item[fieldName] = {
    S: value
  };
}

function toAttributeValue(value) {
  if (typeof value === 'number') {
    return {
      N: String(value)
    };
  }

  return {
    S: String(value)
  };
}

function lowerOptionalString(value) {
  return value ? String(value).toLowerCase() : null;
}

function normalizeFilterType(value) {
  const normalized = value ? String(value).trim().toLowerCase() : '';

  if (!CHARACTER_FILTER_TYPES.has(normalized)) {
    throw new Error('Invalid filter type.');
  }

  return normalized;
}

function normalizeFilterValue(value) {
  return value ? String(value).trim().toLowerCase() : '';
}

function validateImageContentType(contentType) {
  const allowedContentTypes = new Set([
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif'
  ]);

  if (!allowedContentTypes.has(contentType)) {
    throw new Error('Invalid image type.');
  }
}

function getCharacterImageKey(id) {
  return `characters/${id}/image`;
}

function assertCharacterTableConfigured() {
  if (!CHARACTERS_TABLE_NAME) {
    throw new Error('Characters table is not configured.');
  }
}

function assertCharacterUploadConfigured() {
  assertCharacterTableConfigured();

  if (!CHARACTERS_IMAGES_BUCKET_NAME) {
    throw new Error('Characters image bucket is not configured.');
  }
}

async function touchCharacterImageVersion(actorId, id) {
  const now = new Date().toISOString();

  await ddbClient.send(
    new UpdateItemCommand({
      TableName: CHARACTERS_TABLE_NAME,
      Key: {
        id: {
          S: id
        }
      },
      UpdateExpression:
        'SET entityType = :entityType, imageVersion = :imageVersion, updatedAt = :updatedAt, updatedBy = :updatedBy',
      ExpressionAttributeValues: {
        ':entityType': {
          S: 'character'
        },
        ':imageVersion': {
          S: now
        },
        ':updatedAt': {
          S: now
        },
        ':updatedBy': {
          S: actorId
        }
      },
      ConditionExpression: 'attribute_exists(id)'
    })
  );

  return now;
}

function normalizeBaseUrl(value) {
  return value ? String(value).trim().replace(/\/$/, '') : '';
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
