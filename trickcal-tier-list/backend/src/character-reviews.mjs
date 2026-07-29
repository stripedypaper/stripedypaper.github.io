import {
  BatchGetItemCommand,
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
  UpdateItemCommand
} from '@aws-sdk/client-dynamodb';

const CHARACTER_REVIEWS_TABLE_NAME = process.env.CHARACTER_REVIEWS_TABLE_NAME;
const REVIEW_VOTES_TABLE_NAME = process.env.REVIEW_VOTES_TABLE_NAME;
const CHARACTER_REVIEW_COUNTS_TABLE_NAME =
  process.env.CHARACTER_REVIEW_COUNTS_TABLE_NAME;
const REVIEW_COUNT_ENTITY_TYPE = 'CHARACTER_REVIEW_COUNT';

const ddbClient = new DynamoDBClient({});

export async function listCharacterReviews(
  characterVariantKey,
  viewerUserId = ''
) {
  assertConfigured();

  const normalizedCharacterVariantKey = normalizeRequiredString(
    characterVariantKey,
    'characterVariantKey'
  );
  const response = await ddbClient.send(
    new QueryCommand({
      TableName: CHARACTER_REVIEWS_TABLE_NAME,
      KeyConditionExpression: 'characterVariantKey = :characterVariantKey',
      ExpressionAttributeValues: {
        ':characterVariantKey': {
          S: normalizedCharacterVariantKey
        }
      }
    })
  );

  const reviews = (response.Items || []).map(parseReview);

  if (viewerUserId && reviews.length > 0) {
    const batchKeys = reviews.map((review) => ({
      reviewId: { S: review.reviewId },
      voterUserId: { S: viewerUserId }
    }));

    const batchResponse = await ddbClient.send(
      new BatchGetItemCommand({
        RequestItems: {
          [REVIEW_VOTES_TABLE_NAME]: {
            Keys: batchKeys
          }
        }
      })
    );

    const likedReviewIds = new Set(
      (batchResponse.Responses?.[REVIEW_VOTES_TABLE_NAME] || []).map(
        (item) => item.reviewId?.S || ''
      )
    );

    reviews.forEach((review) => {
      review.viewerHasThumbedUp = likedReviewIds.has(review.reviewId);
    });
  }

  reviews.sort((left, right) => {
    const countDifference =
      (right.thumbsUpCount || 0) - (left.thumbsUpCount || 0);
    if (countDifference !== 0) {
      return countDifference;
    }

    return String(left.createdAt || '').localeCompare(
      String(right.createdAt || '')
    );
  });

  return { reviews };
}

export async function listCharacterReviewCounts() {
  assertConfigured();

  const counts = [];
  let exclusiveStartKey;

  do {
    const response = await ddbClient.send(
      new QueryCommand({
        TableName: CHARACTER_REVIEW_COUNTS_TABLE_NAME,
        KeyConditionExpression: 'entityType = :entityType',
        ExpressionAttributeValues: {
          ':entityType': {
            S: REVIEW_COUNT_ENTITY_TYPE
          }
        },
        ExclusiveStartKey: exclusiveStartKey
      })
    );

    counts.push(...(response.Items || []).map(parseReviewCount));
    exclusiveStartKey = response.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return { counts };
}

export async function upsertCharacterReview({
  authUser,
  characterVariantKey,
  markdown
}) {
  assertConfigured();

  const normalizedCharacterVariantKey = normalizeRequiredString(
    characterVariantKey,
    'characterVariantKey'
  );
  const normalizedMarkdown = normalizeReviewMarkdown(markdown);
  const existingReview = await getCharacterReview(
    normalizedCharacterVariantKey,
    authUser.id
  );

  if (!existingReview && !canCreateReview(authUser)) {
    throw new Error('Forbidden');
  }

  const now = new Date().toISOString();
  const review = {
    reviewId: buildReviewId(normalizedCharacterVariantKey, authUser.id),
    characterVariantKey: normalizedCharacterVariantKey,
    authorUserId: authUser.id,
    authorUsername: authUser.username || '',
    markdown: normalizedMarkdown,
    createdAt: existingReview?.createdAt || now,
    updatedAt: now,
    thumbsUpCount: existingReview?.thumbsUpCount || 0
  };

  await ddbClient.send(
    new PutItemCommand({
      TableName: CHARACTER_REVIEWS_TABLE_NAME,
      Item: toReviewItem(review)
    })
  );

  if (!existingReview) {
    await incrementReviewCount(normalizedCharacterVariantKey, 1);
  }

  return review;
}

export async function deleteCharacterReview(reviewId, authUser) {
  assertConfigured();

  const parsed = parseReviewId(reviewId);
  const review = await getCharacterReview(
    parsed.characterVariantKey,
    parsed.authorUserId
  );

  if (!review) {
    return null;
  }

  const canDelete =
    review.authorUserId === authUser.id ||
    authUser.isAdmin ||
    authUser.role === 'manager';
  if (!canDelete) {
    throw new Error('Forbidden');
  }

  await ddbClient.send(
    new DeleteItemCommand({
      TableName: CHARACTER_REVIEWS_TABLE_NAME,
      Key: {
        characterVariantKey: { S: parsed.characterVariantKey },
        authorUserId: { S: parsed.authorUserId }
      }
    })
  );

  await deleteAllVotesForReview(review.reviewId);
  await incrementReviewCount(review.characterVariantKey, -1);
  return review;
}

export async function addReviewThumbsUp(reviewId, voterUserId) {
  assertConfigured();

  const normalizedReviewId = normalizeRequiredString(reviewId, 'reviewId');
  const normalizedVoterUserId = normalizeRequiredString(
    voterUserId,
    'voterUserId'
  );
  const parsed = parseReviewId(normalizedReviewId);

  if (parsed.authorUserId === normalizedVoterUserId) {
    throw new Error('You cannot thumbs up your own review.');
  }

  const review = await getCharacterReview(
    parsed.characterVariantKey,
    parsed.authorUserId
  );
  if (!review) {
    return null;
  }

  const existingVote = await getReviewVote(
    normalizedReviewId,
    normalizedVoterUserId
  );
  if (existingVote) {
    return review;
  }

  const now = new Date().toISOString();
  await ddbClient.send(
    new PutItemCommand({
      TableName: REVIEW_VOTES_TABLE_NAME,
      Item: {
        reviewId: { S: normalizedReviewId },
        voterUserId: { S: normalizedVoterUserId },
        createdAt: { S: now }
      },
      ConditionExpression:
        'attribute_not_exists(reviewId) AND attribute_not_exists(voterUserId)'
    })
  );

  await ddbClient.send(
    new UpdateItemCommand({
      TableName: CHARACTER_REVIEWS_TABLE_NAME,
      Key: {
        characterVariantKey: { S: parsed.characterVariantKey },
        authorUserId: { S: parsed.authorUserId }
      },
      UpdateExpression: 'ADD thumbsUpCount :increment',
      ExpressionAttributeValues: {
        ':increment': { N: '1' }
      }
    })
  );

  return getCharacterReview(parsed.characterVariantKey, parsed.authorUserId);
}

export async function removeReviewThumbsUp(reviewId, voterUserId) {
  assertConfigured();

  const normalizedReviewId = normalizeRequiredString(reviewId, 'reviewId');
  const normalizedVoterUserId = normalizeRequiredString(
    voterUserId,
    'voterUserId'
  );
  const parsed = parseReviewId(normalizedReviewId);

  const review = await getCharacterReview(
    parsed.characterVariantKey,
    parsed.authorUserId
  );
  if (!review) {
    return null;
  }

  const existingVote = await getReviewVote(
    normalizedReviewId,
    normalizedVoterUserId
  );
  if (!existingVote) {
    return review;
  }

  await ddbClient.send(
    new DeleteItemCommand({
      TableName: REVIEW_VOTES_TABLE_NAME,
      Key: {
        reviewId: { S: normalizedReviewId },
        voterUserId: { S: normalizedVoterUserId }
      }
    })
  );

  await ddbClient.send(
    new UpdateItemCommand({
      TableName: CHARACTER_REVIEWS_TABLE_NAME,
      Key: {
        characterVariantKey: { S: parsed.characterVariantKey },
        authorUserId: { S: parsed.authorUserId }
      },
      UpdateExpression: 'SET thumbsUpCount = :nextCount',
      ExpressionAttributeValues: {
        ':nextCount': {
          N: String(Math.max(0, (review.thumbsUpCount || 0) - 1))
        }
      }
    })
  );

  return getCharacterReview(parsed.characterVariantKey, parsed.authorUserId);
}

export function canCreateReview(user) {
  return Boolean(user?.isCurator || user?.isAdmin);
}

async function getCharacterReview(characterVariantKey, authorUserId) {
  const response = await ddbClient.send(
    new QueryCommand({
      TableName: CHARACTER_REVIEWS_TABLE_NAME,
      KeyConditionExpression:
        'characterVariantKey = :characterVariantKey AND authorUserId = :authorUserId',
      ExpressionAttributeValues: {
        ':characterVariantKey': { S: characterVariantKey },
        ':authorUserId': { S: authorUserId }
      },
      Limit: 1
    })
  );

  return response.Items?.[0] ? parseReview(response.Items[0]) : null;
}

async function getReviewVote(reviewId, voterUserId) {
  const response = await ddbClient.send(
    new QueryCommand({
      TableName: REVIEW_VOTES_TABLE_NAME,
      KeyConditionExpression:
        'reviewId = :reviewId AND voterUserId = :voterUserId',
      ExpressionAttributeValues: {
        ':reviewId': { S: reviewId },
        ':voterUserId': { S: voterUserId }
      },
      Limit: 1
    })
  );

  return response.Items?.[0] || null;
}

async function deleteAllVotesForReview(reviewId) {
  let exclusiveStartKey;

  do {
    const response = await ddbClient.send(
      new QueryCommand({
        TableName: REVIEW_VOTES_TABLE_NAME,
        KeyConditionExpression: 'reviewId = :reviewId',
        ExpressionAttributeValues: {
          ':reviewId': { S: reviewId }
        },
        ExclusiveStartKey: exclusiveStartKey
      })
    );

    for (const item of response.Items || []) {
      await ddbClient.send(
        new DeleteItemCommand({
          TableName: REVIEW_VOTES_TABLE_NAME,
          Key: {
            reviewId: { S: item.reviewId?.S || '' },
            voterUserId: { S: item.voterUserId?.S || '' }
          }
        })
      );
    }

    exclusiveStartKey = response.LastEvaluatedKey;
  } while (exclusiveStartKey);
}

function toReviewItem(review) {
  return {
    characterVariantKey: { S: review.characterVariantKey },
    authorUserId: { S: review.authorUserId },
    reviewId: { S: review.reviewId },
    authorUsername: { S: review.authorUsername || '' },
    markdown: { S: review.markdown },
    createdAt: { S: review.createdAt },
    updatedAt: { S: review.updatedAt },
    thumbsUpCount: { N: String(review.thumbsUpCount || 0) }
  };
}

function parseReview(item) {
  return {
    reviewId: item.reviewId?.S || '',
    characterVariantKey: item.characterVariantKey?.S || '',
    authorUserId: item.authorUserId?.S || '',
    authorUsername: item.authorUsername?.S || '',
    markdown: item.markdown?.S || '',
    createdAt: item.createdAt?.S || '',
    updatedAt: item.updatedAt?.S || '',
    thumbsUpCount: Number(item.thumbsUpCount?.N || 0),
    viewerHasThumbedUp: false
  };
}

function parseReviewCount(item) {
  return {
    characterVariantKey: item.characterVariantKey?.S || '',
    reviewCount: Number(item.reviewCount?.N || 0),
    updatedAt: item.updatedAt?.S || ''
  };
}

function buildReviewId(characterVariantKey, authorUserId) {
  return `${characterVariantKey}::${authorUserId}`;
}

function parseReviewId(reviewId) {
  const normalized = normalizeRequiredString(reviewId, 'reviewId');
  const separatorIndex = normalized.lastIndexOf('::');
  if (separatorIndex <= 0) {
    throw new Error('Invalid review id.');
  }

  return {
    characterVariantKey: normalized.slice(0, separatorIndex),
    authorUserId: normalized.slice(separatorIndex + 2)
  };
}

function normalizeReviewMarkdown(value) {
  const normalized = String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/\u0000/g, '')
    .trim();

  if (!normalized) {
    throw new Error('Review text is required.');
  }

  if (normalized.length > 2000) {
    throw new Error('Review text must be 2000 characters or fewer.');
  }

  if (
    /\[[^\]]+\]\([^)]+\)/.test(normalized) ||
    /!\[[^\]]*]\([^)]+\)/.test(normalized) ||
    /\bhttps?:\/\//i.test(normalized) ||
    /\bwww\./i.test(normalized) ||
    /<(a|img|iframe|video|audio|embed|object)\b/i.test(normalized)
  ) {
    throw new Error('Links and embeds are not allowed in reviews.');
  }

  return normalized;
}

function normalizeRequiredString(value, fieldName) {
  const normalized = String(value || '').trim();
  if (!normalized) {
    throw new Error(`Missing ${fieldName}.`);
  }

  return normalized;
}

function assertConfigured() {
  if (
    !CHARACTER_REVIEWS_TABLE_NAME ||
    !REVIEW_VOTES_TABLE_NAME ||
    !CHARACTER_REVIEW_COUNTS_TABLE_NAME
  ) {
    throw new Error('Review tables are not configured.');
  }
}

async function incrementReviewCount(characterVariantKey, delta) {
  const now = new Date().toISOString();

  if (delta >= 0) {
    await ddbClient.send(
      new UpdateItemCommand({
        TableName: CHARACTER_REVIEW_COUNTS_TABLE_NAME,
        Key: {
          entityType: {
            S: REVIEW_COUNT_ENTITY_TYPE
          },
          characterVariantKey: {
            S: characterVariantKey
          }
        },
        UpdateExpression: 'SET updatedAt = :updatedAt ADD reviewCount :delta',
        ExpressionAttributeValues: {
          ':updatedAt': {
            S: now
          },
          ':delta': {
            N: String(delta)
          }
        }
      })
    );
    return;
  }

  const response = await ddbClient.send(
    new GetItemCommand({
      TableName: CHARACTER_REVIEW_COUNTS_TABLE_NAME,
      Key: {
        entityType: {
          S: REVIEW_COUNT_ENTITY_TYPE
        },
        characterVariantKey: {
          S: characterVariantKey
        }
      }
    })
  );

  const nextCount = Math.max(
    0,
    Number(response.Item?.reviewCount?.N || 0) + delta
  );

  await ddbClient.send(
    new PutItemCommand({
      TableName: CHARACTER_REVIEW_COUNTS_TABLE_NAME,
      Item: {
        entityType: {
          S: REVIEW_COUNT_ENTITY_TYPE
        },
        characterVariantKey: {
          S: characterVariantKey
        },
        reviewCount: {
          N: String(nextCount)
        },
        updatedAt: {
          S: now
        }
      }
    })
  );
}
