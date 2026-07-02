import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
  UpdateItemCommand
} from '@aws-sdk/client-dynamodb';
import crypto from 'node:crypto';

const CHANGELOG_TABLE_NAME = process.env.CHANGELOG_TABLE_NAME;
const CHANGELOG_ENTITY_TYPE = 'changelog';

const ddbClient = new DynamoDBClient({});

export async function listChangelogEntries() {
  assertChangelogConfigured();

  const entries = [];
  let exclusiveStartKey;

  do {
    const response = await ddbClient.send(
      new QueryCommand({
        TableName: CHANGELOG_TABLE_NAME,
        IndexName: 'ChangelogByCreatedAtIndex',
        KeyConditionExpression: 'entityType = :entityType',
        ExpressionAttributeValues: {
          ':entityType': {
            S: CHANGELOG_ENTITY_TYPE
          }
        },
        ScanIndexForward: false,
        ExclusiveStartKey: exclusiveStartKey
      })
    );

    entries.push(...(response.Items || []).map(parseChangelogEntry));
    exclusiveStartKey = response.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return {
    entries
  };
}

export async function createChangelogEntry(actorId, input) {
  assertChangelogConfigured();

  const description = normalizeDescription(input?.description);
  const createdAt = normalizeEntryDate(input?.createdAt);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await ddbClient.send(
    new PutItemCommand({
      TableName: CHANGELOG_TABLE_NAME,
      Item: {
        id: { S: id },
        entityType: { S: CHANGELOG_ENTITY_TYPE },
        description: { S: description },
        createdAt: { S: createdAt || now.slice(0, 10) },
        updatedAt: { S: now },
        updatedBy: { S: actorId }
      },
      ConditionExpression: 'attribute_not_exists(id)'
    })
  );

  return getChangelogEntry(id);
}

export async function updateChangelogEntry(actorId, id, input) {
  assertChangelogConfigured();

  const existingEntry = await getChangelogEntry(id);
  if (!existingEntry) {
    return null;
  }

  const description = normalizeDescription(input?.description);
  const createdAt =
    normalizeEntryDate(input?.createdAt) || existingEntry.createdAt;
  const now = new Date().toISOString();

  const response = await ddbClient.send(
    new UpdateItemCommand({
      TableName: CHANGELOG_TABLE_NAME,
      Key: {
        id: { S: id }
      },
      UpdateExpression:
        'SET entityType = :entityType, description = :description, createdAt = :createdAt, updatedAt = :updatedAt, updatedBy = :updatedBy',
      ExpressionAttributeValues: {
        ':entityType': { S: CHANGELOG_ENTITY_TYPE },
        ':description': { S: description },
        ':createdAt': { S: createdAt },
        ':updatedAt': { S: now },
        ':updatedBy': { S: actorId }
      },
      ConditionExpression: 'attribute_exists(id)',
      ReturnValues: 'ALL_NEW'
    })
  );

  return response.Attributes ? parseChangelogEntry(response.Attributes) : null;
}

export async function deleteChangelogEntry(id) {
  assertChangelogConfigured();

  const existingEntry = await getChangelogEntry(id);
  if (!existingEntry) {
    return null;
  }

  await ddbClient.send(
    new DeleteItemCommand({
      TableName: CHANGELOG_TABLE_NAME,
      Key: {
        id: { S: id }
      },
      ConditionExpression: 'attribute_exists(id)'
    })
  );

  return existingEntry;
}

async function getChangelogEntry(id) {
  if (!CHANGELOG_TABLE_NAME || !id) {
    return null;
  }

  const response = await ddbClient.send(
    new GetItemCommand({
      TableName: CHANGELOG_TABLE_NAME,
      Key: {
        id: { S: id }
      }
    })
  );

  return response.Item ? parseChangelogEntry(response.Item) : null;
}

function parseChangelogEntry(item) {
  return {
    id: item.id?.S || '',
    description: item.description?.S || '',
    createdAt: item.createdAt?.S || '',
    updatedAt: item.updatedAt?.S || '',
    updatedBy: item.updatedBy?.S || ''
  };
}

function normalizeDescription(value) {
  const normalized = String(value || '').trim();
  if (!normalized) {
    throw new Error('Missing description.');
  }

  return normalized;
}

function normalizeEntryDate(value) {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  const timestamp = Date.parse(normalized);
  if (Number.isNaN(timestamp)) {
    throw new Error('Invalid date.');
  }

  return new Date(timestamp).toISOString().slice(0, 10);
}

function assertChangelogConfigured() {
  if (!CHANGELOG_TABLE_NAME) {
    throw new Error('Changelog table is not configured.');
  }
}
