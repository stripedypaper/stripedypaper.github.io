import {
  Button,
  Group,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text
} from '@mantine/core';
import { BarChart } from '@mantine/charts';
import { notifications } from '@mantine/notifications';
import { useEffect, useMemo, useState } from 'react';
import { ReadonlyTierListSection } from '../components/ReadonlyTierListSection.jsx';
import { ReadonlyCharacterChip } from '../components/ReadonlyCharacterChip.jsx';
import { ScoreTooltip } from '../components/ScoreTooltip.jsx';
import {
  formatCalendarDate,
  formatDate,
  getCharacterDisplayName
} from '../lib/site.js';
import { fetchChangelogEntries } from '../lib/changelogApi.js';
import {
  addCommunitySecondaryText,
  buildReadonlyTierListDisplay,
  hasCommunityRating,
  hasCuratorCommunityRating
} from '../lib/readonlyTierList.js';

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

function CharacterDetailsModal({
  character,
  opened,
  onClose,
  showCuratorsOnly
}) {
  if (!character) {
    return null;
  }

  const stats = showCuratorsOnly
    ? character.communityStats?.curator || {}
    : character.communityStats || {};

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={getCharacterDisplayName(character)}
      size="80rem"
      centered
    >
      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, md: 4 }} spacing="md">
          <Paper className="question-card" p="md" radius="lg" withBorder>
            <Stack gap={4}>
              <Text c="dimmed" size="sm">
                Vote count
              </Text>
              <Text fw={700} size="xl">
                {stats.calculated?.count || 0}
              </Text>
            </Stack>
          </Paper>
          <Paper className="question-card" p="md" radius="lg" withBorder>
            <Stack gap={4}>
              <Text c="dimmed" size="sm">
                Total score average
              </Text>
              <Text fw={700} size="xl">
                {roundToTwo(stats.calculated?.average || 0)}
              </Text>
            </Stack>
          </Paper>
          <Paper className="question-card" p="md" radius="lg" withBorder>
            <Stack gap={4}>
              <Text c="dimmed" size="sm">
                Mono average
              </Text>
              <Text fw={700} size="xl">
                {roundToTwo(stats.mono?.average || 0)}
              </Text>
            </Stack>
          </Paper>
          <Paper className="question-card" p="md" radius="lg" withBorder>
            <Stack gap={4}>
              <Text c="dimmed" size="sm">
                Crusade average
              </Text>
              <Text fw={700} size="xl">
                {roundToTwo(stats.mixedCrusade?.average || 0)}
              </Text>
            </Stack>
          </Paper>
          <Paper className="question-card" p="md" radius="lg" withBorder>
            <Stack gap={4}>
              <Text c="dimmed" size="sm">
                Raid average
              </Text>
              <Text fw={700} size="xl">
                {roundToTwo(stats.mixedFrontier?.average || 0)}
              </Text>
            </Stack>
          </Paper>
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <CommunityChart
            title="Calculated Score Vote Histogram"
            data={buildCalculatedHistogramData(stats.calculated?.distribution)}
            valueKey="votes"
            color="grape.6"
            valueFormatter={(value) => String(value)}
            xAxisProps={{
              angle: -90,
              textAnchor: 'end',
              tickMargin: 12,
              interval: 0
            }}
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
            data={buildSortedDistributionData(stats.calculated?.distribution)}
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
            data={buildSortedDistributionData(stats.mixedCrusade?.distribution)}
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
    </Modal>
  );
}

function renderCommunityTooltip(character) {
  const stats = character.communityStats || {};
  const voteCount = stats.calculated?.count || 0;

  return (
    <ScoreTooltip
      title={getCharacterDisplayName(character)}
      subtitle={`${voteCount} ${voteCount === 1 ? 'vote' : 'votes'}`}
      score={roundToTwo(stats.calculated?.average || 0)}
      monoScore={roundToTwo(stats.mono?.average || 0)}
      mixedScore={roundToTwo(stats.mixedCrusade?.average || 0)}
      raidScore={roundToTwo(stats.mixedFrontier?.average || 0)}
      monoLabel="Mono"
      mixedLabel="Crusade"
      raidLabel="Raid"
    />
  );
}

function renderCuratorTooltip(character) {
  const stats = character.communityStats?.curator || {};
  const voteCount = stats.calculated?.count || 0;

  return (
    <ScoreTooltip
      title={getCharacterDisplayName(character)}
      subtitle={`${voteCount} ${voteCount === 1 ? 'vote' : 'votes'}`}
      score={roundToTwo(stats.calculated?.average || 0)}
      monoScore={roundToTwo(stats.mono?.average || 0)}
      mixedScore={roundToTwo(stats.mixedCrusade?.average || 0)}
      raidScore={roundToTwo(stats.mixedFrontier?.average || 0)}
      monoLabel="Mono"
      mixedLabel="Crusade"
      raidLabel="Raid"
    />
  );
}

async function fetchCommunityCharacters(apiBaseUrl) {
  const response = await fetch(`${apiBaseUrl}/community/characters`, {
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(
      `Community tier list failed with status ${response.status}.`
    );
  }

  return response.json();
}

async function fetchCommunityFavorites(apiBaseUrl) {
  const response = await fetch(`${apiBaseUrl}/community/favorites`, {
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(
      `Community favorites failed with status ${response.status}.`
    );
  }

  return response.json();
}

async function triggerCommunityRebuild(apiBaseUrl) {
  const response = await fetch(`${apiBaseUrl}/community/rebuild`, {
    method: 'POST',
    cache: 'no-store'
  });
  const data = await response.json().catch(() => null);

  if (response.status === 429) {
    const cooldownError = new Error(
      data?.error || 'Community rebuild is on cooldown.'
    );
    cooldownError.retryAfterSeconds = data?.retryAfterSeconds || 0;
    throw cooldownError;
  }

  if (!response.ok) {
    throw new Error(
      data?.error || `Community rebuild failed with status ${response.status}.`
    );
  }

  return data;
}

export function HomePage({ apiBaseUrl }) {
  const [communityData, setCommunityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [rebuilding, setRebuilding] = useState(false);
  const [favoriteData, setFavoriteData] = useState(null);
  const [latestChangelogEntry, setLatestChangelogEntry] = useState(null);
  const [showCuratorsOnly, setShowCuratorsOnly] = useState(false);
  const [showYearning, setShowYearning] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
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
        const [data, favorites, changelogResult] = await Promise.all([
          fetchCommunityCharacters(apiBaseUrl),
          fetchCommunityFavorites(apiBaseUrl),
          fetchChangelogEntries(apiBaseUrl).catch(() => null)
        ]);
        if (!active) {
          return;
        }

        setCommunityData(data);
        setFavoriteData(favorites);
        const changelogEntries = Array.isArray(changelogResult?.entries)
          ? changelogResult.entries
          : [];
        setLatestChangelogEntry(changelogEntries[0] || null);
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load community tier list.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [apiBaseUrl]);

  const characters = useMemo(
    () => addCommunitySecondaryText(communityData?.characters || []),
    [communityData]
  );
  const displayedCharacters = useMemo(
    () =>
      showCuratorsOnly
        ? (communityData?.characters || []).map((character) => ({
            ...character,
            secondaryText: String(
              roundToTwo(
                character.communityStats?.curator?.calculated?.average || 0
              )
            )
          }))
        : characters,
    [characters, communityData, showCuratorsOnly]
  );
  const { visibleCharacters, unratedCharacters } = useMemo(
    () =>
      buildReadonlyTierListDisplay({
        allCharacters: communityData?.characters || [],
        scoredCharacters: displayedCharacters,
        showYearning,
        isCharacterRated: showCuratorsOnly
          ? hasCuratorCommunityRating
          : hasCommunityRating
      }),
    [communityData, displayedCharacters, showCuratorsOnly, showYearning]
  );
  const favoriteCharacters = useMemo(
    () =>
      [...(favoriteData?.characters || [])]
        .sort((left, right) => {
          const favoriteDifference =
            (right.communityStats?.favoriteCount || 0) -
            (left.communityStats?.favoriteCount || 0);

          if (favoriteDifference !== 0) {
            return favoriteDifference;
          }

          return getCharacterDisplayName(left).localeCompare(
            getCharacterDisplayName(right),
            undefined,
            { sensitivity: 'base' }
          );
        })
        .slice(0, 20),
    [favoriteData]
  );

  async function handleRebuild() {
    if (!apiBaseUrl || rebuilding) {
      return;
    }

    setRebuilding(true);

    try {
      const rebuildResult = await triggerCommunityRebuild(apiBaseUrl);
      const refreshed = await fetchCommunityCharacters(apiBaseUrl);
      const refreshedFavorites = await fetchCommunityFavorites(apiBaseUrl);
      setCommunityData(refreshed);
      setFavoriteData(refreshedFavorites);
      notifications.show({
        title: 'Refreshed',
        message: rebuildResult?.computedAt
          ? `Community tier list refreshed at ${formatDate(rebuildResult.computedAt)}.`
          : 'Community tier list refreshed.',
        color: 'grape'
      });
    } catch (rebuildError) {
      notifications.show({
        title: 'Refresh unavailable',
        message: rebuildError?.retryAfterSeconds
          ? `Try again in ${rebuildError.retryAfterSeconds} seconds.`
          : rebuildError instanceof Error
            ? rebuildError.message
            : 'Unable to refresh community tier list.',
        color: 'red'
      });
    } finally {
      setRebuilding(false);
    }
  }

  if (loading) {
    return (
      <Paper className="question-card" p="lg" radius="lg" withBorder>
        <Text c="dimmed">Loading community tier list...</Text>
      </Paper>
    );
  }

  if (error) {
    return <Text c="red">{error}</Text>;
  }

  return (
    <>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end" gap="md">
          <div>
            <Text fw={700} size="xl">
              Community Tier List
            </Text>
            <Text c="dimmed" size="sm" mt={4}>
              Last refreshed {formatDate(communityData?.computedAt)}.
            </Text>
          </div>

          <Button onClick={handleRebuild} loading={rebuilding} color="grape">
            Refresh
          </Button>
        </Group>

        <ReadonlyTierListSection
          showCuratorsOnly={showCuratorsOnly}
          onShowCuratorsOnlyChange={setShowCuratorsOnly}
          showYearning={showYearning}
          onShowYearningChange={setShowYearning}
          characters={visibleCharacters}
          unratedCharacters={unratedCharacters}
          getScore={(character) =>
            showCuratorsOnly
              ? character.communityStats?.curator?.calculated?.average || 0
              : character.communityStats?.calculated?.average || 0
          }
          renderTooltipContent={
            showCuratorsOnly ? renderCuratorTooltip : renderCommunityTooltip
          }
          onCharacterClick={setSelectedCharacter}
          beforeToggleContent={
            latestChangelogEntry ? (
              <Paper className="question-card" p="md" radius="lg" withBorder>
                <Stack gap="xs">
                  <Text fw={700} size="sm">
                    {formatCalendarDate(latestChangelogEntry.createdAt)}
                  </Text>
                  <Text c="dimmed" size="sm">
                    {latestChangelogEntry.description}
                  </Text>
                </Stack>
              </Paper>
            ) : null
          }
        />

        <Stack gap="sm">
          <div>
            <Text fw={700} size="xl">
              Favorite Ranking
            </Text>
            <Text c="dimmed" size="sm" mt={4}>
              Top 20 by favorite votes.
            </Text>
          </div>

          <Paper className="question-card" p="md" radius="lg" withBorder>
            {favoriteCharacters.length ? (
              <Table highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Apostle</Table.Th>
                    <Table.Th>Favorites</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {favoriteCharacters.map((character) => (
                    <Table.Tr key={character.id}>
                      <Table.Td>
                        <ReadonlyCharacterChip character={character} />
                      </Table.Td>
                      <Table.Td>
                        {character.communityStats?.favoriteCount || 0}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <Text c="dimmed" size="sm">
                No favorite votes yet.
              </Text>
            )}
          </Paper>
        </Stack>
      </Stack>

      <CharacterDetailsModal
        character={selectedCharacter}
        opened={Boolean(selectedCharacter)}
        showCuratorsOnly={showCuratorsOnly}
        onClose={() => setSelectedCharacter(null)}
      />
    </>
  );
}
