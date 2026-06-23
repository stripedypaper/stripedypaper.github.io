export async function fetchAllCharacters(apiBaseUrl) {
  const allCharacters = [];
  let cursor = null;

  do {
    const params = new URLSearchParams({ limit: '100' });

    if (cursor) {
      params.set('cursor', cursor);
    }

    const response = await fetch(`${apiBaseUrl}/admin/characters?${params}`);
    if (!response.ok) {
      throw new Error(`Character list failed with status ${response.status}.`);
    }

    const data = await response.json();
    allCharacters.push(
      ...(Array.isArray(data.characters) ? data.characters : [])
    );
    cursor = data.nextCursor || null;
  } while (cursor);

  return allCharacters;
}
