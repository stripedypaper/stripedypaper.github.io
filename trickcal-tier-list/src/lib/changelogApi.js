import { buildAuthenticatedRequestInit } from './auth.js';

export async function fetchChangelogEntries(apiBaseUrl) {
  const response = await fetch(`${apiBaseUrl}/changelog`, {
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Changelog failed with status ${response.status}.`);
  }

  return response.json();
}

export async function createChangelogEntry(
  apiBaseUrl,
  { description, createdAt }
) {
  const response = await fetch(
    `${apiBaseUrl}/admin/changelog`,
    buildAuthenticatedRequestInit({
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ description, createdAt })
    })
  );

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      data?.error || `Changelog create failed with status ${response.status}.`
    );
  }

  return data;
}

export async function updateChangelogEntry(
  apiBaseUrl,
  id,
  { description, createdAt }
) {
  const response = await fetch(
    `${apiBaseUrl}/admin/changelog/${encodeURIComponent(id)}`,
    buildAuthenticatedRequestInit({
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ description, createdAt })
    })
  );

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      data?.error || `Changelog update failed with status ${response.status}.`
    );
  }

  return data;
}

export async function deleteChangelogEntry(apiBaseUrl, id) {
  const response = await fetch(
    `${apiBaseUrl}/admin/changelog/${encodeURIComponent(id)}`,
    buildAuthenticatedRequestInit({
      method: 'DELETE'
    })
  );

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      data?.error || `Changelog delete failed with status ${response.status}.`
    );
  }

  return data;
}
