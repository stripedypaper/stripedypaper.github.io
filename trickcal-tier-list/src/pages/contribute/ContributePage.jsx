import { Group } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { buildAuthenticatedRequestInit } from '../../lib/auth.js';
import { fetchAllCharacters } from '../../lib/charactersApi.js';
import {
  clearAnonymousRankingsDraft,
  clearRankingsDraft,
  readRankingsDraft,
  writeRankingsDraft
} from '../../lib/rankingsDraft.js';
import {
  buildQuestionGroups,
  sanitizePlacementsByQuestion
} from '../../lib/rankings.js';
import { ContributeSidebar } from '../../components/ContributeSidebar.jsx';
import { MyRankingsPage } from './MyRankingsPage.jsx';
import { MyTierListPage } from './MyTierListPage.jsx';

function serializeValue(value) {
  return JSON.stringify(value || {});
}

function buildSanitizedDraft(characters, nextPlacementsByQuestion) {
  const nextOwnedYearningPlacements =
    nextPlacementsByQuestion['ranking-y-1'] || {};
  const nextQuestionGroups = buildQuestionGroups(characters, {
    'ranking-y-1': nextOwnedYearningPlacements
  });

  return sanitizePlacementsByQuestion(
    nextQuestionGroups,
    nextPlacementsByQuestion
  );
}

async function fetchMyRankings(apiBaseUrl) {
  const response = await fetch(
    `${apiBaseUrl}/rankings/me`,
    buildAuthenticatedRequestInit()
  );

  if (!response.ok) {
    throw new Error(`Rankings load failed with status ${response.status}.`);
  }

  const data = await response.json();
  return data.submission || null;
}

async function saveMyRankings(apiBaseUrl, answers) {
  const response = await fetch(
    `${apiBaseUrl}/rankings/me`,
    buildAuthenticatedRequestInit({
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ answers })
    })
  );

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
  const [draftReady, setDraftReady] = useState(false);
  const [hasLocalDraft, setHasLocalDraft] = useState(false);
  const ownedYearningPlacements = placementsByQuestion['ranking-y-1'] || {};
  const ownedYearningPlacementsKey = serializeValue(ownedYearningPlacements);
  const questionGroups = useMemo(
    () =>
      buildQuestionGroups(characters, {
        'ranking-y-1': ownedYearningPlacements
      }),
    [characters, ownedYearningPlacementsKey]
  );

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
      if (!apiBaseUrl || !characters.length || sessionLoading) {
        if (active) {
          setRankingsLoading(false);
          setDraftReady(false);
          setHasLocalDraft(false);
        }
        return;
      }

      if (active) {
        setRankingsLoading(Boolean(user?.id));
        setDraftReady(false);
      }

      try {
        const nextSubmission = user?.id
          ? await fetchMyRankings(apiBaseUrl)
          : null;
        if (!active) {
          return;
        }

        const submissionQuestionGroups = buildQuestionGroups(
          characters,
          nextSubmission?.answers || {}
        );
        const sanitizedAnswers = sanitizePlacementsByQuestion(
          submissionQuestionGroups,
          nextSubmission?.answers || {}
        );
        const localDraft = readRankingsDraft(user?.id);
        const localDraftQuestionGroups = buildQuestionGroups(
          characters,
          localDraft?.answers || {}
        );
        const sanitizedDraftAnswers = sanitizePlacementsByQuestion(
          localDraftQuestionGroups,
          localDraft?.answers || {}
        );
        const nextPlacements = localDraft
          ? sanitizedDraftAnswers
          : sanitizedAnswers;

        if (user?.id && localDraft?.scope === 'anonymous') {
          writeRankingsDraft(user.id, nextPlacements);
          clearAnonymousRankingsDraft();
        }

        setSubmission(
          nextSubmission
            ? {
                ...nextSubmission,
                answers: sanitizedAnswers
              }
            : null
        );
        setPlacementsByQuestion(nextPlacements);
        setHasLocalDraft(Boolean(localDraft));
      } catch {
        if (active) {
          const localDraft = readRankingsDraft(user?.id);
          const draftQuestionGroups = buildQuestionGroups(
            characters,
            localDraft?.answers || {}
          );
          const sanitizedDraftAnswers = sanitizePlacementsByQuestion(
            draftQuestionGroups,
            localDraft?.answers || {}
          );

          setSubmission(null);
          setPlacementsByQuestion(localDraft ? sanitizedDraftAnswers : {});
          setHasLocalDraft(Boolean(localDraft));
        }
      } finally {
        if (active) {
          setRankingsLoading(false);
          setDraftReady(true);
        }
      }
    }

    loadRankings();

    return () => {
      active = false;
    };
  }, [apiBaseUrl, characters, sessionLoading, user?.id]);

  useEffect(() => {
    if (!draftReady || !questionGroups.length || sessionLoading) {
      return;
    }

    const sanitizedPlacements = sanitizePlacementsByQuestion(
      questionGroups,
      placementsByQuestion
    );
    const sanitizedSubmission = sanitizePlacementsByQuestion(
      questionGroups,
      submission?.answers || {}
    );

    if (
      user?.id &&
      serializeValue(sanitizedPlacements) ===
        serializeValue(sanitizedSubmission)
    ) {
      clearRankingsDraft(user.id);
      setHasLocalDraft(false);
      return;
    }

    writeRankingsDraft(user?.id, sanitizedPlacements);
    setHasLocalDraft(true);
  }, [
    draftReady,
    placementsByQuestion,
    questionGroups,
    sessionLoading,
    submission,
    user?.id
  ]);

  useEffect(() => {
    if (!questionGroups.length) {
      return;
    }

    setPlacementsByQuestion((currentValue) => {
      const nextValue = sanitizePlacementsByQuestion(
        questionGroups,
        currentValue
      );
      return serializeValue(nextValue) === serializeValue(currentValue)
        ? currentValue
        : nextValue;
    });
    setSubmission((currentValue) => {
      if (!currentValue) {
        return currentValue;
      }

      const nextAnswers = sanitizePlacementsByQuestion(
        questionGroups,
        currentValue.answers || {}
      );

      return serializeValue(nextAnswers) ===
        serializeValue(currentValue.answers || {})
        ? currentValue
        : {
            ...currentValue,
            answers: nextAnswers
          };
    });
  }, [questionGroups]);

  function handleQuestionChange(questionId, nextPlacements) {
    setPlacementsByQuestion((currentValue) => {
      const nextValue = {
        ...currentValue,
        [questionId]: nextPlacements
      };
      const sanitizedNextValue = buildSanitizedDraft(characters, nextValue);

      if (draftReady && !sessionLoading) {
        const sanitizedSubmission = buildSanitizedDraft(
          characters,
          submission?.answers || {}
        );

        if (
          user?.id &&
          serializeValue(sanitizedNextValue) ===
            serializeValue(sanitizedSubmission)
        ) {
          clearRankingsDraft(user.id);
          setHasLocalDraft(false);
        } else {
          writeRankingsDraft(user?.id, sanitizedNextValue);
          setHasLocalDraft(true);
        }
      }

      return sanitizedNextValue;
    });
  }

  async function handleSave() {
    const nextSubmission = await saveMyRankings(
      apiBaseUrl,
      sanitizePlacementsByQuestion(questionGroups, placementsByQuestion)
    );
    const sanitizedAnswers = sanitizePlacementsByQuestion(
      questionGroups,
      nextSubmission?.answers || {}
    );
    setSubmission(
      nextSubmission
        ? {
            ...nextSubmission,
            answers: sanitizedAnswers
          }
        : null
    );
    setPlacementsByQuestion(sanitizedAnswers);
    clearRankingsDraft(user?.id);
    clearAnonymousRankingsDraft();
    setHasLocalDraft(false);
    return nextSubmission;
  }

  function handleDiscardDraft() {
    const resetAnswers = sanitizePlacementsByQuestion(
      questionGroups,
      submission?.answers || {}
    );

    clearRankingsDraft(user?.id);
    clearAnonymousRankingsDraft();
    setHasLocalDraft(false);
    setPlacementsByQuestion(resetAnswers);
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
            hasLocalDraft={hasLocalDraft}
            onChange={handleQuestionChange}
            onDiscardDraft={handleDiscardDraft}
            onSave={handleSave}
          />
        )}
      </div>
    </Group>
  );
}
