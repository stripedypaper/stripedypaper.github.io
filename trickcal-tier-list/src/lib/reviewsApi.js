import { buildAuthenticatedRequestInit } from './auth.js';

async function parseJsonResponse(response, fallbackMessage) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || fallbackMessage);
  }

  return data;
}

export async function fetchCharacterReviews(apiBaseUrl, characterVariantKey) {
  const response = await fetch(
    `${apiBaseUrl}/community/reviews?characterVariantKey=${encodeURIComponent(characterVariantKey)}`,
    buildAuthenticatedRequestInit({
      cache: 'no-store'
    })
  );

  return parseJsonResponse(response, 'Unable to load reviews.');
}

export async function saveMyCharacterReview(
  apiBaseUrl,
  characterVariantKey,
  markdown
) {
  const response = await fetch(
    `${apiBaseUrl}/reviews/me`,
    buildAuthenticatedRequestInit({
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        characterVariantKey,
        markdown
      })
    })
  );

  return parseJsonResponse(response, 'Unable to save review.');
}

export async function deleteCharacterReview(apiBaseUrl, reviewId) {
  const response = await fetch(
    `${apiBaseUrl}/reviews/${encodeURIComponent(reviewId)}`,
    buildAuthenticatedRequestInit({
      method: 'DELETE'
    })
  );

  return parseJsonResponse(response, 'Unable to delete review.');
}

export async function addReviewThumbsUp(apiBaseUrl, reviewId) {
  const response = await fetch(
    `${apiBaseUrl}/reviews/${encodeURIComponent(reviewId)}/thumbs-up`,
    buildAuthenticatedRequestInit({
      method: 'PUT'
    })
  );

  return parseJsonResponse(response, 'Unable to add thumbs up.');
}

export async function removeReviewThumbsUp(apiBaseUrl, reviewId) {
  const response = await fetch(
    `${apiBaseUrl}/reviews/${encodeURIComponent(reviewId)}/thumbs-up`,
    buildAuthenticatedRequestInit({
      method: 'DELETE'
    })
  );

  return parseJsonResponse(response, 'Unable to remove thumbs up.');
}
