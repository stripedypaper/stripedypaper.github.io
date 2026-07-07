import {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand
} from '@aws-sdk/client-dynamodb';
import crypto from 'node:crypto';

const AUDIT_EVENTS_TABLE_NAME = process.env.AUDIT_EVENTS_TABLE_NAME;
const AUDIT_PARTITION_KEY = 'AUDIT';

const ddbClient = new DynamoDBClient({});

export async function recordAuditEvent({
  category,
  actor,
  actorUsername,
  time,
  metadata = {}
}) {
  assertAuditEventsConfigured();

  const eventTime = normalizeAuditTime(time);
  const normalizedActor = normalizeActor(actor);
  const normalizedActorUsername = normalizeActorUsername(actorUsername);
  const normalizedMetadata = normalizeMetadata(metadata);

  await ddbClient.send(
    new PutItemCommand({
      TableName: AUDIT_EVENTS_TABLE_NAME,
      Item: {
        partitionKey: { S: AUDIT_PARTITION_KEY },
        eventKey: { S: `${eventTime}#${crypto.randomUUID()}` },
        category: { S: normalizeRequiredString(category, 'category') },
        actor: { S: normalizedActor },
        actorUsername: { S: normalizedActorUsername },
        time: { S: eventTime },
        metadata: toAttributeValue(normalizedMetadata)
      }
    })
  );

  return {
    category,
    actor: normalizedActor,
    actorUsername: normalizedActorUsername,
    time: eventTime,
    metadata: normalizedMetadata
  };
}

export async function listAuditEventsPage({ limit = 20, cursor = null } = {}) {
  assertAuditEventsConfigured();

  const response = await ddbClient.send(
    new QueryCommand({
      TableName: AUDIT_EVENTS_TABLE_NAME,
      KeyConditionExpression: 'partitionKey = :partitionKey',
      ExpressionAttributeValues: {
        ':partitionKey': {
          S: AUDIT_PARTITION_KEY
        }
      },
      Limit: limit,
      ScanIndexForward: false,
      ExclusiveStartKey: decodeCursor(cursor)
    })
  );

  return {
    events: (response.Items || []).map(parseAuditEvent),
    nextCursor: encodeCursor(response.LastEvaluatedKey || null)
  };
}

function parseAuditEvent(item) {
  return {
    category: item.category?.S || '',
    actor: item.actor?.S || '',
    actorUsername: item.actorUsername?.S || '',
    time: item.time?.S || '',
    metadata: fromAttributeValue(item.metadata)
  };
}

function normalizeActor(value) {
  return value ? String(value).trim() : 'system';
}

function normalizeActorUsername(value) {
  return value ? String(value).trim() : '';
}

function normalizeAuditTime(value) {
  if (!value) {
    return new Date().toISOString();
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid audit event time.');
  }

  return date.toISOString();
}

function normalizeMetadata(value) {
  const normalized = sanitizeJsonValue(value);
  return normalized &&
    typeof normalized === 'object' &&
    !Array.isArray(normalized)
    ? normalized
    : {};
}

function sanitizeJsonValue(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => sanitizeJsonValue(entry))
      .filter((entry) => entry !== undefined);
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, entry]) => [key, sanitizeJsonValue(entry)])
        .filter(([, entry]) => entry !== undefined)
    );
  }

  return String(value);
}

function toAttributeValue(value) {
  if (value === null) {
    return { NULL: true };
  }

  if (typeof value === 'string') {
    return { S: value };
  }

  if (typeof value === 'number') {
    return { N: String(value) };
  }

  if (typeof value === 'boolean') {
    return { BOOL: value };
  }

  if (Array.isArray(value)) {
    return {
      L: value.map((entry) => toAttributeValue(entry))
    };
  }

  return {
    M: Object.fromEntries(
      Object.entries(value || {}).map(([key, entry]) => [
        key,
        toAttributeValue(entry)
      ])
    )
  };
}

function fromAttributeValue(value) {
  if (!value) {
    return {};
  }

  if (value.S !== undefined) {
    return value.S;
  }

  if (value.N !== undefined) {
    return Number(value.N);
  }

  if (value.BOOL !== undefined) {
    return value.BOOL;
  }

  if (value.NULL) {
    return null;
  }

  if (value.L) {
    return value.L.map((entry) => fromAttributeValue(entry));
  }

  if (value.M) {
    return Object.fromEntries(
      Object.entries(value.M).map(([key, entry]) => [
        key,
        fromAttributeValue(entry)
      ])
    );
  }

  return {};
}

function normalizeRequiredString(value, fieldName) {
  const normalized = value ? String(value).trim() : '';
  if (!normalized) {
    throw new Error(`Missing ${fieldName}.`);
  }

  return normalized;
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

function assertAuditEventsConfigured() {
  if (!AUDIT_EVENTS_TABLE_NAME) {
    throw new Error('Audit events table is not configured.');
  }
}
