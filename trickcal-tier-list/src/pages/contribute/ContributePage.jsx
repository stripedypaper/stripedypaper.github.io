import { Group } from '@mantine/core';
import { useEffect, useState } from 'react';
import { ContributeSidebar } from '../../components/ContributeSidebar.jsx';
import { MyRankingsPage } from './MyRankingsPage.jsx';
import { MyTierListPage } from './MyTierListPage.jsx';

async function fetchAllCharacters(apiBaseUrl) {
  const allCharacters = [];
  let cursor = null;

  do {
    const params = new URLSearchParams({
      limit: '100'
    });

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

async function fetchMyRankings(apiBaseUrl) {
  const response = await fetch(`${apiBaseUrl}/rankings/me`, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Rankings load failed with status ${response.status}.`);
  }

  const data = await response.json();
  return data.submission || null;
}

async function saveMyRankings(apiBaseUrl, answers) {
  const response = await fetch(`${apiBaseUrl}/rankings/me`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ answers })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(
      data?.error || `Save failed with status ${response.status}.`
    );
  }

  const data = await response.json();
  return data.submission || null;
}

export function ContributePage({ apiBaseUrl, route, user, sessionLoading }) {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [placementsByQuestion, setPlacementsByQuestion] = useState({});
  const [rankingsLoading, setRankingsLoading] = useState(false);
  const [submission, setSubmission] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadCharacters() {
      if (!apiBaseUrl) {
        if (active) {
          setLoading(false);
        }
        return;
      }

      if (active) {
        setLoading(true);
        setError('');
      }

      try {
        const data = await fetchAllCharacters(apiBaseUrl);
        if (!active) {
          return;
        }

        setCharacters(data);
      } catch (fetchError) {
        if (active) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : 'Unable to load characters.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCharacters();

    return () => {
      active = false;
    };
  }, [apiBaseUrl]);

  useEffect(() => {
    let active = true;

    async function loadRankings() {
      if (!apiBaseUrl || !user?.id) {
        if (active) {
          setPlacementsByQuestion({});
          setSubmission(null);
          setRankingsLoading(false);
        }
        return;
      }

      if (active) {
        setRankingsLoading(true);
      }

      try {
        const nextSubmission = await fetchMyRankings(apiBaseUrl);
        if (!active) {
          return;
        }

        setSubmission(nextSubmission);
        setPlacementsByQuestion(nextSubmission?.answers || {});
      } catch {
        if (active) {
          setSubmission(null);
          setPlacementsByQuestion({});
        }
      } finally {
        if (active) {
          setRankingsLoading(false);
        }
      }
    }

    loadRankings();

    return () => {
      active = false;
    };
  }, [apiBaseUrl, user?.id]);

  function handleQuestionChange(questionId, nextPlacements) {
    setPlacementsByQuestion((currentValue) => ({
      ...currentValue,
      [questionId]: nextPlacements
    }));
  }

  async function handleSave() {
    const nextSubmission = await saveMyRankings(
      apiBaseUrl,
      placementsByQuestion
    );
    setSubmission(nextSubmission);
    setPlacementsByQuestion(nextSubmission?.answers || {});
    return nextSubmission;
  }

  const routeKey = route === 'contribute-tier-list' ? 'tier-list' : 'rankings';

  return (
    <Group align="flex-start" gap="xl" className="admin-layout" wrap="nowrap">
      <div className="admin-sidebar-wrap">
        <ContributeSidebar route={route} />
      </div>
      <div className="admin-content-wrap">
        {routeKey === 'tier-list' ? (
          <MyTierListPage
            characters={characters}
            loading={loading}
            rankingsLoading={rankingsLoading}
            submission={submission}
            user={user}
            sessionLoading={sessionLoading}
          />
        ) : (
          <MyRankingsPage
            characters={characters}
            loading={loading}
            error={error}
            user={user}
            sessionLoading={sessionLoading}
            rankingsLoading={rankingsLoading}
            placementsByQuestion={placementsByQuestion}
            submission={submission}
            onChange={handleQuestionChange}
            onSave={handleSave}
          />
        )}
      </div>
    </Group>
  );
}
