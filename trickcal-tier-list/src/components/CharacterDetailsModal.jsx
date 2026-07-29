import {
  ActionIcon,
  Anchor,
  Button,
  Group,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Tabs,
  Text
} from '@mantine/core';
import { BarChart } from '@mantine/charts';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconThumbUp, IconTrash } from '@tabler/icons-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CharacterAvatar } from './CharacterAvatar.jsx';
import { CharacterMetaIcons } from './CharacterMetaIcons.jsx';
import { ReviewEditorModal } from './ReviewEditorModal.jsx';
import { SafeMarkdown } from './SafeMarkdown.jsx';
import {
  addReviewThumbsUp,
  deleteCharacterReview,
  fetchCharacterReviews,
  removeReviewThumbsUp,
  saveMyCharacterReview
} from '../lib/reviewsApi.js';
import {
  buildCharacterVariantKey,
  formatDate,
  getCharacterDisplayName,
  getCharacterLongDisplayName
} from '../lib/site.js';

function roundToTwo(value) {
  return Number((value || 0).toFixed(2));
}

function buildSortedDistributionData(distribution) {
  return Object.entries(distribution || {})
    .map(([label, votes]) => ({
      label,
      votes
    }))
    .sort((left, right) => Number(left.label) - Number(right.label));
}

function buildCalculatedHistogramData(distribution) {
  const entries = Object.entries(distribution || {}).map(([label, votes]) => ({
    score: Number(label),
    votes
  }));
  const bins = [];

  for (let lowerBound = 9.5; lowerBound >= 0; lowerBound -= 0.5) {
    const roundedLowerBound = Number(lowerBound.toFixed(1));
    const upperBound =
      roundedLowerBound === 9.5 ? Infinity : roundedLowerBound + 0.49;
    const label =
      roundedLowerBound === 9.5
        ? '9.5+'
        : `${roundedLowerBound.toFixed(1)}-${upperBound.toFixed(2)}`;

    bins.push({
      label,
      sortValue: roundedLowerBound,
      votes: entries.reduce((total, entry) => {
        if (
          entry.score >= roundedLowerBound &&
          (roundedLowerBound === 9.5 || entry.score <= upperBound)
        ) {
          return total + entry.votes;
        }

        return total;
      }, 0)
    });
  }

  return bins.sort((left, right) => left.sortValue - right.sortValue);
}

function CommunityChart({
  title,
  data,
  valueKey,
  color,
  valueFormatter,
  yMax,
  xAxisProps,
  chartProps
}) {
  return (
    <Paper className="question-card" p="md" radius="lg" withBorder>
      <Stack gap="sm">
        <Text fw={700}>{title}</Text>
        <BarChart
          h={220}
          data={data}
          dataKey="label"
          series={[{ name: valueKey, color }]}
          tickLine="y"
          gridAxis="y"
          valueFormatter={valueFormatter}
          xAxisProps={xAxisProps}
          yAxisProps={yMax !== undefined ? { domain: [0, yMax] } : undefined}
          {...chartProps}
        />
      </Stack>
    </Paper>
  );
}

function scrollToSection(sectionRef) {
  sectionRef.current?.scrollIntoView({
    behavior: 'smooth'
  });
}

function StatCards({ stats }) {
  return (
    <SimpleGrid cols={{ base: 1, md: 4 }} spacing="md">
      {[
        ['Vote count', stats.calculated?.count || 0],
        ['Total score average', roundToTwo(stats.calculated?.average || 0)],
        ['Mono average', roundToTwo(stats.mono?.average || 0)],
        ['Crusade average', roundToTwo(stats.mixedCrusade?.average || 0)],
        ['Raid average', roundToTwo(stats.mixedFrontier?.average || 0)]
      ].map(([label, value]) => (
        <Paper
          key={label}
          className="question-card"
          p="md"
          radius="lg"
          withBorder
        >
          <Stack gap={4}>
            <Text c="dimmed" size="sm">
              {label}
            </Text>
            <Text fw={700} size="xl">
              {value}
            </Text>
          </Stack>
        </Paper>
      ))}
    </SimpleGrid>
  );
}

function canCreateOrEditReview(user, review) {
  if (!user) {
    return false;
  }

  if (review && review.authorUserId === user.id) {
    return true;
  }

  return Boolean(user.isCurator || user.isAdmin);
}

function canDeleteReview(user, review) {
  if (!user || !review) {
    return false;
  }

  return (
    review.authorUserId === user.id || user.isAdmin || user.role === 'manager'
  );
}

function ReviewsSection({
  apiBaseUrl,
  user,
  character,
  reviews,
  loading,
  onRefresh
}) {
  const [editorOpened, setEditorOpened] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busyReviewId, setBusyReviewId] = useState('');

  const myReview = useMemo(
    () => reviews.find((review) => review.authorUserId === user?.id) || null,
    [reviews, user?.id]
  );
  const canAddReview = Boolean(user?.isCurator || user?.isAdmin) && !myReview;

  async function handleSaveReview(markdown) {
    if (!apiBaseUrl || !character?.characterVariantKey) {
      return;
    }

    setSaving(true);

    try {
      await saveMyCharacterReview(
        apiBaseUrl,
        character.characterVariantKey,
        markdown
      );
      setEditorOpened(false);
      setEditingReview(null);
      await onRefresh();
      notifications.show({
        title: 'Saved',
        message: 'Review saved.',
        color: 'grape'
      });
    } catch (error) {
      notifications.show({
        title: 'Unable to save review',
        message:
          error instanceof Error ? error.message : 'Unable to save review.',
        color: 'red'
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteReview(review) {
    if (!apiBaseUrl) {
      return;
    }

    setBusyReviewId(review.reviewId);

    try {
      await deleteCharacterReview(apiBaseUrl, review.reviewId);
      await onRefresh();
      notifications.show({
        title: 'Deleted',
        message: 'Review deleted.',
        color: 'grape'
      });
    } catch (error) {
      notifications.show({
        title: 'Unable to delete review',
        message:
          error instanceof Error ? error.message : 'Unable to delete review.',
        color: 'red'
      });
    } finally {
      setBusyReviewId('');
    }
  }

  async function handleToggleThumbsUp(review) {
    if (!apiBaseUrl) {
      return;
    }

    setBusyReviewId(review.reviewId);

    try {
      if (review.viewerHasThumbedUp) {
        await removeReviewThumbsUp(apiBaseUrl, review.reviewId);
      } else {
        await addReviewThumbsUp(apiBaseUrl, review.reviewId);
      }

      await onRefresh();
    } catch (error) {
      notifications.show({
        title: 'Unable to update thumbs up',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to update thumbs up.',
        color: 'red'
      });
    } finally {
      setBusyReviewId('');
    }
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Text fw={700} size="lg">
          Curator Reviews
        </Text>
        {canAddReview ? (
          <Button size="xs" color="grape" onClick={() => setEditorOpened(true)}>
            Add review
          </Button>
        ) : null}
      </Group>

      {loading ? (
        <Text c="dimmed" size="sm">
          Loading reviews...
        </Text>
      ) : null}

      {!loading && !reviews.length ? (
        <Text c="dimmed" size="sm">
          No curator reviews yet.
        </Text>
      ) : null}

      {reviews.map((review) => (
        <Paper
          key={review.reviewId}
          className="question-card"
          p="md"
          radius="lg"
          withBorder
        >
          <Stack gap="sm">
            <SafeMarkdown markdown={review.markdown} />

            <Group justify="space-between" align="flex-end">
              <Text c="dimmed" size="xs">
                Review by{' '}
                <Anchor
                  href={`#/tier-list/${encodeURIComponent(review.authorUserId)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {review.authorUsername || review.authorUserId}
                </Anchor>
                . Last updated at{' '}
                {formatDate(review.updatedAt || review.createdAt)}.
              </Text>

              <Group gap="xs">
                {user && user.id !== review.authorUserId ? (
                  <Button
                    size="compact-sm"
                    variant={review.viewerHasThumbedUp ? 'filled' : 'light'}
                    leftSection={<IconThumbUp size={14} />}
                    onClick={() => handleToggleThumbsUp(review)}
                    loading={busyReviewId === review.reviewId}
                  >
                    {review.thumbsUpCount || 0}
                  </Button>
                ) : (
                  <Text c="dimmed" size="sm">
                    {review.thumbsUpCount || 0} thumbs up
                  </Text>
                )}

                {canCreateOrEditReview(user, review) &&
                review.authorUserId === user?.id ? (
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    onClick={() => {
                      setEditingReview(review);
                      setEditorOpened(true);
                    }}
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                ) : null}

                {canDeleteReview(user, review) ? (
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => handleDeleteReview(review)}
                    loading={busyReviewId === review.reviewId}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                ) : null}
              </Group>
            </Group>
          </Stack>
        </Paper>
      ))}

      <ReviewEditorModal
        opened={editorOpened}
        onClose={() => {
          setEditorOpened(false);
          setEditingReview(null);
        }}
        onSubmit={handleSaveReview}
        initialMarkdown={editingReview?.markdown || ''}
        loading={saving}
      />
    </Stack>
  );
}

export function CharacterDetailsModal({
  apiBaseUrl,
  user,
  characters,
  selectedCharacter,
  opened,
  onClose,
  showCuratorsOnly
}) {
  const [activeTab, setActiveTab] = useState('base');
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const infoRef = useRef(null);
  const reviewsRef = useRef(null);
  const statsRef = useRef(null);

  const baseCharacterId =
    selectedCharacter?.characterId ||
    String(selectedCharacter?.id || '')
      .replace(/#base$/, '')
      .replace(/#yearning$/, '');

  const baseCharacter = useMemo(
    () =>
      (characters || []).find(
        (character) =>
          (character.characterId || character.id) === baseCharacterId &&
          !character.isYearning
      ) || null,
    [baseCharacterId, characters]
  );
  const yearningCharacter = useMemo(
    () =>
      (characters || []).find(
        (character) =>
          (character.characterId || character.id) === baseCharacterId &&
          character.isYearning
      ) || null,
    [baseCharacterId, characters]
  );
  const activeCharacter =
    activeTab === 'yearning' ? yearningCharacter : baseCharacter;
  const stats = showCuratorsOnly
    ? activeCharacter?.communityStats?.curator || {}
    : activeCharacter?.communityStats || {};

  useEffect(() => {
    setActiveTab(selectedCharacter?.isYearning ? 'yearning' : 'base');
  }, [selectedCharacter?.id, selectedCharacter?.isYearning]);

  async function loadReviews() {
    if (!apiBaseUrl || !activeCharacter?.characterVariantKey) {
      setReviews([]);
      return;
    }

    setReviewsLoading(true);
    try {
      const result = await fetchCharacterReviews(
        apiBaseUrl,
        activeCharacter.characterVariantKey
      );
      setReviews(result.reviews || []);
    } catch (error) {
      notifications.show({
        title: 'Unable to load reviews',
        message:
          error instanceof Error ? error.message : 'Unable to load reviews.',
        color: 'red'
      });
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }

  useEffect(() => {
    if (!opened) {
      return;
    }
    let active = true;

    setReviews([]);
    setReviewsLoading(true);

    async function load() {
      if (!apiBaseUrl || !activeCharacter?.characterVariantKey) {
        if (active) {
          setReviews([]);
          setReviewsLoading(false);
        }
        return;
      }

      try {
        const result = await fetchCharacterReviews(
          apiBaseUrl,
          activeCharacter.characterVariantKey
        );

        if (!active) {
          return;
        }

        setReviews(result.reviews || []);
      } catch (error) {
        if (!active) {
          return;
        }

        notifications.show({
          title: 'Unable to load reviews',
          message:
            error instanceof Error ? error.message : 'Unable to load reviews.',
          color: 'red'
        });
        setReviews([]);
      } finally {
        if (active) {
          setReviewsLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [apiBaseUrl, opened, activeCharacter?.characterVariantKey]);

  if (!selectedCharacter || !activeCharacter) {
    return null;
  }

  const hasYearning = Boolean(yearningCharacter);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      classNames={{
        content: 'character-details-modal-content',
        body: 'character-details-modal-body'
      }}
      title={
        <Text fw={700} size="xl">
          {getCharacterDisplayName(activeCharacter)}
        </Text>
      }
      size="60rem"
      centered
    >
      <Stack gap="xl">
        {hasYearning ? (
          <Tabs
            value={activeTab}
            onChange={(value) => setActiveTab(value || 'base')}
          >
            <Tabs.List>
              <Tabs.Tab value="base">Base</Tabs.Tab>
              <Tabs.Tab value="yearning">Yearning</Tabs.Tab>
            </Tabs.List>
          </Tabs>
        ) : null}

        <section ref={infoRef}>
          <Stack gap="xs" align="center">
            <div className="character-details-portrait-frame">
              <CharacterAvatar
                character={activeCharacter}
                size={180}
                radius="xl"
                variant={activeCharacter.isYearning ? 'yearning' : 'base'}
                showBorder="true"
              />
            </div>
            <Text fw={700} size="xl" ta="center">
              {getCharacterLongDisplayName(activeCharacter)}
            </Text>
            <CharacterMetaIcons
              character={activeCharacter}
              size={24}
              justify="center"
              gap={4}
            />
          </Stack>
        </section>

        <Paper
          className="question-card"
          p="sm"
          radius="lg"
          withBorder
          style={{ alignSelf: 'flex-start' }}
        >
          <Stack gap={4} align="flex-start">
            <Button
              variant="subtle"
              size="compact-sm"
              onClick={() => scrollToSection(reviewsRef)}
            >
              Curator reviews
            </Button>
            <Button
              variant="subtle"
              size="compact-sm"
              onClick={() => scrollToSection(statsRef)}
            >
              Scoring stats
            </Button>
          </Stack>
        </Paper>

        <section ref={reviewsRef}>
          <ReviewsSection
            apiBaseUrl={apiBaseUrl}
            user={user}
            character={activeCharacter}
            reviews={reviews}
            loading={reviewsLoading}
            onRefresh={loadReviews}
          />
        </section>

        <section ref={statsRef}>
          <Stack gap="md">
            <Text fw={700} size="lg">
              Scoring Stats
            </Text>

            <StatCards stats={stats} />

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <CommunityChart
                title="Calculated Score Vote Histogram"
                data={buildCalculatedHistogramData(
                  stats.calculated?.distribution
                )}
                valueKey="votes"
                color="grape.6"
                valueFormatter={(value) => String(value)}
                chartProps={{
                  h: 210,
                  xAxisProps: {
                    angle: -90,
                    textAnchor: 'end',
                    tickMargin: 12,
                    interval: 0,
                    height: 70
                  }
                }}
              />
              <CommunityChart
                title="Calculated Score Vote Distribution"
                data={buildSortedDistributionData(
                  stats.calculated?.distribution
                )}
                valueKey="votes"
                color="teal.6"
                valueFormatter={(value) => String(value)}
              />
              <CommunityChart
                title="Mono Score Vote Distribution"
                data={buildSortedDistributionData(stats.mono?.distribution)}
                valueKey="votes"
                color="yellow.6"
                valueFormatter={(value) => String(value)}
              />
              <CommunityChart
                title="Crusade Score Vote Distribution"
                data={buildSortedDistributionData(
                  stats.mixedCrusade?.distribution
                )}
                valueKey="votes"
                color="lime.6"
                valueFormatter={(value) => String(value)}
              />
              <CommunityChart
                title="Raid Score Vote Distribution"
                data={buildSortedDistributionData(
                  stats.mixedFrontier?.distribution
                )}
                valueKey="votes"
                color="red.6"
                valueFormatter={(value) => String(value)}
              />
            </SimpleGrid>
          </Stack>
        </section>
      </Stack>
    </Modal>
  );
}
