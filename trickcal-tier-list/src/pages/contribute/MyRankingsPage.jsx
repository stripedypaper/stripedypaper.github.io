import { Button, Group, Paper, Skeleton, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LineupGrid } from '../../components/LineupGrid.jsx';
import { TierList } from '../../components/TierList.jsx';
import { getStaticImageUrl } from '../../lib/site.js';
import {
  PERSONA_GRID_COLORS,
  buildQuestionGroups,
  listPartialScoreViolations,
  listTierEligibilityViolations,
  listYearningBelowBaseViolations,
  listYearningWithoutBaseViolations,
  listQuestionsWithUnsatisfiedMinimums
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
  hasLocalDraft,
  onChange,
  onDiscardDraft,
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
  const ownedYearningPlacements = placementsByQuestion['ranking-y-1'] || {};

  const questionGroups = useMemo(
    () =>
      buildQuestionGroups(characters, {
        'ranking-y-1': ownedYearningPlacements
      }),
    [characters, ownedYearningPlacements]
  );
  const currentSnapshot = useMemo(
    () => serializeAnswers(placementsByQuestion),
    [placementsByQuestion]
  );
  const unsatisfiedMinimums = useMemo(
    () =>
      listQuestionsWithUnsatisfiedMinimums(
        questionGroups,
        placementsByQuestion
      ),
    [placementsByQuestion, questionGroups]
  );
  const yearningBelowBaseViolations = useMemo(
    () => listYearningBelowBaseViolations(questionGroups, placementsByQuestion),
    [placementsByQuestion, questionGroups]
  );
  const yearningWithoutBaseViolations = useMemo(
    () =>
      listYearningWithoutBaseViolations(questionGroups, placementsByQuestion),
    [placementsByQuestion, questionGroups]
  );
  const partialScoreViolations = useMemo(
    () => listPartialScoreViolations(questionGroups, placementsByQuestion),
    [placementsByQuestion, questionGroups]
  );
  const tierEligibilityViolations = useMemo(
    () => listTierEligibilityViolations(questionGroups, placementsByQuestion),
    [placementsByQuestion, questionGroups]
  );
  const minimumRequirementsMessage =
    unsatisfiedMinimums.length > 0
      ? unsatisfiedMinimums
          .map(
            ({ question, tier, assignedCount }) =>
              `${question.label} ${tier.label} must have at least ${tier.minimum} apostles (${assignedCount}/${tier.minimum}).`
          )
          .join(' ')
      : '';
  const yearningValidationMessage =
    yearningBelowBaseViolations.length > 0
      ? `${yearningBelowBaseViolations[0].characterName} has its Yearning version rated below its base version in ${yearningBelowBaseViolations[0].question.label}.`
      : '';
  const yearningWithoutBaseMessage =
    yearningWithoutBaseViolations.length > 0
      ? `${yearningWithoutBaseViolations[0].characterName} has its Yearning version rated in ${yearningWithoutBaseViolations[0].question.label}, but its base version is not rated.`
      : '';
  const partialScoreMessage =
    partialScoreViolations.length > 0
      ? `${partialScoreViolations[0].characterName} is only partially scored. Each character must be rated in all three categories or none: Mono (${partialScoreViolations[0].ratedMono ? 'rated' : 'not rated'}), Crusade (${partialScoreViolations[0].ratedCrusade ? 'rated' : 'not rated'}), Frontier (${partialScoreViolations[0].ratedFrontier ? 'rated' : 'not rated'}).`
      : '';
  const tierEligibilityMessage =
    tierEligibilityViolations.length > 0
      ? `${tierEligibilityViolations[0].characterName} cannot be placed in ${tierEligibilityViolations[0].tier.label}; only Yearning variants may use that tier.`
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
    if (minimumRequirementsMessage) {
      notifications.show({
        color: 'red',
        title: 'Unable to save rankings',
        message: minimumRequirementsMessage
      });
      setSaveState('error');
      setSaveMessage('');
      return;
    }

    if (yearningWithoutBaseMessage) {
      notifications.show({
        color: 'red',
        title: 'Unable to save rankings',
        message: yearningWithoutBaseMessage
      });
      setSaveState('error');
      setSaveMessage('');
      return;
    }

    if (yearningValidationMessage) {
      notifications.show({
        color: 'red',
        title: 'Unable to save rankings',
        message: yearningValidationMessage
      });
      setSaveState('error');
      setSaveMessage('');
      return;
    }

    if (partialScoreMessage) {
      notifications.show({
        color: 'red',
        title: 'Unable to save rankings',
        message: partialScoreMessage
      });
      setSaveState('error');
      setSaveMessage('');
      return;
    }

    if (tierEligibilityMessage) {
      notifications.show({
        color: 'red',
        title: 'Unable to save rankings',
        message: tierEligibilityMessage
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
          <Text span fw={800} c={PERSONA_GRID_COLORS[question.personality]}>
            restricted personality
          </Text>{' '}
          content, rate the performance of these apostles.
        </Text>
      );
    }

    if (question.kind === 'mixed-crusade') {
      return (
        <Text mt="xs">
          For Crusade-like content focusing on wave-based combat with restricted
          access to Senior skills versus multiple enemies, but{' '}
          <Text span fw={800}>
            ignoring personality bonuses
          </Text>
          , rate the performance of{' '}
          <Text span fw={800}>
            {question.role.toUpperCase()} apostles
          </Text>
          .
        </Text>
      );
    }

    if (question.kind === 'mixed-frontier') {
      return (
        <Text mt="xs">
          For Elias Frontier-like content focusing on raid-based combat versus a
          single powerful enemy,{' '}
          <Text span fw={800}>
            ignoring personality bonuses
          </Text>
          , rate the performance of{' '}
          <Text span fw={800}>
            {question.role.toUpperCase()} apostles
          </Text>
          .
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

    if (question.kind === 'owned-yearning') {
      return (
        <Text mt="xs">
          Select the apostles for which you own 2-star or higher Yearning and
          can evaluate them objectively and accurately.
        </Text>
      );
    }

    return null;
  }

  function handleCopyFromCrusade(question) {
    if (question.kind !== 'mixed-frontier') {
      return;
    }

    const sourceQuestionId = question.id.replace('ranking-c-', 'ranking-b-');
    const sourcePlacements = placementsByQuestion[sourceQuestionId] || {};
    onChange(question.id, { ...sourcePlacements });
    notifications.show({
      title: 'Copied',
      message: `Copied selections from ${question.label
        .replace('Ranking C', 'Ranking B')
        .replace('Frontier', 'Crusade')}.`,
      color: 'grape',
      autoClose: 2000
    });
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

          <Group gap="sm">
            {hasLocalDraft ? (
              <Button
                variant="subtle"
                color="gray"
                onClick={onDiscardDraft}
                disabled={saveState === 'saving' || rankingsLoading}
              >
                Discard draft
              </Button>
            ) : null}
            <Button
              onClick={handleSave}
              loading={saveState === 'saving' || rankingsLoading}
              disabled={saveDisabled}
            >
              Save rankings
            </Button>
          </Group>
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
              {hasLocalDraft ? (
                <Button
                  variant="subtle"
                  color="gray"
                  onClick={onDiscardDraft}
                  disabled={saveState === 'saving' || rankingsLoading}
                >
                  Discard draft
                </Button>
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
                        imageUrl={
                          question.headerImageName
                            ? getStaticImageUrl(question.headerImageName)
                            : ''
                        }
                        imageAlt={question.role || question.personality || ''}
                        columns={question.lineupGrid.columns}
                        cells={question.lineupGrid.cells}
                        highlightColumn={
                          question.lineupGrid.highlightColumn ?? null
                        }
                        trailingEmojiGrid={
                          question.lineupGrid.trailingEmojiGrid ?? null
                        }
                        trailingEmoji={question.lineupGrid.trailingEmoji ?? ''}
                      />
                    ) : null}
                  </Group>
                  {renderQuestionPrompt(question)}
                  {question.kind === 'mixed-frontier' ? (
                    <Button
                      mt="sm"
                      size="xs"
                      variant="light"
                      onClick={() => handleCopyFromCrusade(question)}
                    >
                      {question.label
                        .replace('Ranking C', 'Copy from Ranking B')
                        .replace('Frontier', 'Crusade')}
                    </Button>
                  ) : null}
                </div>

                <TierList
                  key={question.id}
                  tiers={question.tiers}
                  items={question.items}
                  initialPlacements={placementsByQuestion[question.id] || {}}
                  showLabels={false}
                  showReset
                  showScoringGuidelines={
                    question.kind === 'personality' ||
                    question.kind === 'mixed-crusade' ||
                    question.kind === 'mixed-frontier'
                  }
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
