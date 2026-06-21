import { Button, Group, Paper, Skeleton, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LineupGrid } from '../../components/LineupGrid.jsx';
import { TierList } from '../../components/TierList.jsx';
import {
  PERSONA_GRID_COLORS,
  POSITION_LABELS,
  buildQuestionGroups,
  listIncompleteRequiredQuestions
} from '../../lib/rankings.js';

function normalizeAnswers(answers) {
  const normalized = {};

  for (const questionId of Object.keys(answers || {}).sort()) {
    const placements = answers?.[questionId];
    if (!placements || typeof placements !== 'object') {
      continue;
    }

    const normalizedPlacements = {};

    for (const characterId of Object.keys(placements).sort()) {
      const tierId = placements[characterId];
      if (typeof tierId !== 'string') {
        continue;
      }

      const trimmedTierId = tierId.trim();
      if (!trimmedTierId || trimmedTierId === 'unassigned') {
        continue;
      }

      normalizedPlacements[characterId] = trimmedTierId;
    }

    if (Object.keys(normalizedPlacements).length > 0) {
      normalized[questionId] = normalizedPlacements;
    }
  }

  return normalized;
}

function serializeAnswers(answers) {
  return JSON.stringify(normalizeAnswers(answers));
}

function formatSavedAt(value) {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleString();
}

export function MyRankingsPage({
  characters,
  loading,
  error,
  user,
  sessionLoading,
  rankingsLoading,
  placementsByQuestion,
  submission,
  onChange,
  onSave
}) {
  const [saveState, setSaveState] = useState('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState('');
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(
    serializeAnswers({})
  );
  const [isTopSaveVisible, setIsTopSaveVisible] = useState(true);
  const saveActionsRef = useRef(null);

  const questionGroups = useMemo(
    () => buildQuestionGroups(characters),
    [characters]
  );
  const currentSnapshot = useMemo(
    () => serializeAnswers(placementsByQuestion),
    [placementsByQuestion]
  );
  const incompleteRequiredQuestions = useMemo(
    () => listIncompleteRequiredQuestions(questionGroups, placementsByQuestion),
    [placementsByQuestion, questionGroups]
  );
  const missingAssignmentsMessage =
    incompleteRequiredQuestions.length > 0
      ? `${incompleteRequiredQuestions
          .map((question) => question.label)
          .join(', ')} must assign every apostle before saving.`
      : '';
  const hasUnsavedChanges = currentSnapshot !== lastSavedSnapshot;
  const saveDisabled =
    !user?.id ||
    sessionLoading ||
    rankingsLoading ||
    saveState === 'saving' ||
    !hasUnsavedChanges;

  useEffect(() => {
    setLastSavedAt(submission?.updatedAt || submission?.submittedAt || '');
    setLastSavedSnapshot(serializeAnswers(submission?.answers || {}));
    if (!submission) {
      setSaveState('idle');
    }
  }, [submission]);

  useEffect(() => {
    const node = saveActionsRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsTopSaveVisible(entry?.isIntersecting ?? true);
      },
      {
        threshold: 0.1
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  async function handleSave() {
    if (missingAssignmentsMessage) {
      notifications.show({
        color: 'red',
        title: 'Unable to save rankings',
        message: missingAssignmentsMessage
      });
      setSaveState('error');
      setSaveMessage('');
      return;
    }

    if (saveDisabled) {
      return;
    }

    setSaveState('saving');
    setSaveMessage('');

    try {
      const nextSubmission = await onSave();
      setLastSavedAt(
        nextSubmission?.updatedAt || nextSubmission?.submittedAt || ''
      );
      setLastSavedSnapshot(serializeAnswers(nextSubmission?.answers || {}));
      setSaveState('saved');
      setSaveMessage('Saved.');
    } catch (saveError) {
      setSaveState('error');
      setSaveMessage(
        saveError instanceof Error ? saveError.message : 'Unable to save.'
      );
    }
  }

  function renderQuestionPrompt(question) {
    if (question.kind === 'personality') {
      return (
        <Text mt="xs">
          For{' '}
          <Text span fw={700} c={PERSONA_GRID_COLORS[question.personality]}>
            6-person restricted personality
          </Text>{' '}
          content, choose the apostles you would use in your ideal lineup.
        </Text>
      );
    }

    if (question.kind === 'niche') {
      return (
        <Text mt="xs">
          Indicate any apostles which you think have niche usefulness or reason
          to pull outside of the above rankings. For example: PvP, A-Club,
          access to certain debuffs, cheesing certain stages, etc. Apostles who
          already have score of 6 or higher will not receive a score increase
          from this ranking.
        </Text>
      );
    }

    if (question.kind === 'favorite') {
      return (
        <Text mt="xs">
          Choose your favorite apostle! Does not affect score.
        </Text>
      );
    }

    return (
      <Text mt="xs">
        For{' '}
        <Text span fw={700}>
          9-person content with no personality bonus
        </Text>
        , rate the apostles based on their performance relative to others in the{' '}
        <Text span fw={700}>
          {POSITION_LABELS[question.position] || question.position} position
        </Text>
        .
      </Text>
    );
  }

  return (
    <Stack gap="lg">
      <div>
        <Group
          ref={saveActionsRef}
          justify="space-between"
          align="flex-end"
          gap="md"
        >
          <div>
            <Text fw={700} size="xl">
              My Rankings
            </Text>
            {!sessionLoading && !user ? (
              <Text c="dimmed" size="sm" mt={4}>
                Log in to save your rankings.
              </Text>
            ) : lastSavedAt ? (
              <Text c="dimmed" size="sm" mt={4}>
                Last saved {formatSavedAt(lastSavedAt)}.
              </Text>
            ) : null}
            {saveMessage ? (
              <Text
                c={saveState === 'error' ? 'red' : 'dimmed'}
                size="sm"
                mt={4}
              >
                {saveMessage}
              </Text>
            ) : null}
          </div>

          <Button
            onClick={handleSave}
            loading={saveState === 'saving' || rankingsLoading}
            disabled={saveDisabled}
          >
            Save rankings
          </Button>
        </Group>
      </div>

      {!isTopSaveVisible && !loading && !rankingsLoading ? (
        <div className="contribute-sticky-save">
          <Paper
            className="contribute-sticky-save-panel"
            p="sm"
            radius="xl"
            withBorder
          >
            <Group gap="sm" wrap="nowrap">
              {lastSavedAt ? (
                <Text
                  c="dimmed"
                  size="sm"
                  className="contribute-sticky-save-text"
                >
                  Last saved {formatSavedAt(lastSavedAt)}
                </Text>
              ) : null}
              <Button
                onClick={handleSave}
                loading={saveState === 'saving' || rankingsLoading}
                disabled={saveDisabled}
              >
                Save rankings
              </Button>
            </Group>
          </Paper>
        </div>
      ) : null}

      {error ? (
        <Text c="red">{error}</Text>
      ) : loading || rankingsLoading ? (
        <Stack gap="md">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={`question-skeleton-${index}`}
              height={240}
              radius="lg"
            />
          ))}
        </Stack>
      ) : (
        <Stack gap="md">
          {questionGroups.map((question) => (
            <Paper
              key={question.id}
              className="question-card"
              p="lg"
              radius="lg"
              withBorder
            >
              <Stack gap="md">
                <div>
                  <Group justify="space-between" align="flex-start" gap="md">
                    <div>
                      <Text fw={700} size="lg">
                        {question.label}
                      </Text>
                    </div>
                    {question.lineupGrid ? (
                      <LineupGrid
                        columns={question.lineupGrid.columns}
                        cells={question.lineupGrid.cells}
                        highlightColumn={
                          question.lineupGrid.highlightColumn ?? null
                        }
                      />
                    ) : null}
                  </Group>
                  {renderQuestionPrompt(question)}
                </div>

                <TierList
                  key={question.id}
                  tiers={question.tiers}
                  items={question.items}
                  initialPlacements={placementsByQuestion[question.id] || {}}
                  onChange={(nextPlacements) =>
                    onChange(question.id, nextPlacements)
                  }
                />
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
