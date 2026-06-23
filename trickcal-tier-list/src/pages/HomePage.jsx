import {
  Button,
  Group,
  Modal,
  Paper,
  SimpleGrid,
  Switch,
  Stack,
  Table,
  Text
} from '@mantine/core';
import { BarChart } from '@mantine/charts';
import { notifications } from '@mantine/notifications';
import { useEffect, useMemo, useState } from 'react';
import { ReadonlyTierList } from '../components/ReadonlyTierList.jsx';
import { ReadonlyCharacterChip } from '../components/ReadonlyCharacterChip.jsx';
import { ScoreTooltip } from '../components/ScoreTooltip.jsx';
import { SCORE_BUCKETS } from '../lib/tierBuckets.js';
import { getCharacterDisplayName } from '../lib/site.js';

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

function CommunityChart({
  title,
  data,
  valueKey,
  color,
  valueFormatter,
  yMax
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
          yAxisProps={yMax !== undefined ? { domain: [0, yMax] } : undefined}
        />
      </Stack>
    </Paper>
  );
}

function CharacterDetailsModal({ character, opened, onClose }) {
  if (!character) {
    return null;
  }

  const stats = character.communityStats || {};

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
            title="Calculated Score Vote Distribution"
            data={buildSortedDistributionData(stats.calculated?.distribution)}
            valueKey="votes"
            color="teal.6"
            valueFormatter={(value) => String(value)}
          />
          <CommunityChart
            title="Mono Score Vote Distribution (A1-A5)"
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
  return (
    <ScoreTooltip
      title={getCharacterDisplayName(character)}
      score={roundToTwo(character.communityStats?.calculated?.average || 0)}
      monoScore={roundToTwo(character.communityStats?.mono?.average || 0)}
      mixedScore={roundToTwo(
        character.communityStats?.mixedCrusade?.average || 0
      )}
      raidScore={roundToTwo(
        character.communityStats?.mixedFrontier?.average || 0
      )}
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
        const [data, favorites] = await Promise.all([
          fetchCommunityCharacters(apiBaseUrl),
          fetchCommunityFavorites(apiBaseUrl)
        ]);
        if (!active) {
          return;
        }

        setCommunityData(data);
        setFavoriteData(favorites);
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
    () =>
      (communityData?.characters || []).map((character) => ({
        ...character,
        secondaryText: String(
          roundToTwo(character.communityStats?.calculated?.average || 0)
        )
      })),
    [communityData]
  );
  const visibleCharacters = useMemo(
    () =>
      characters.filter((character) => {
        if (!showYearning) {
          return !character.isYearning;
        }

        return (
          !character.isYearning ||
          (character.communityStats?.calculated?.count || 0) > 0
        );
      }),
    [characters, showYearning]
  );
  const unratedYearnings = useMemo(
    () =>
      showYearning
        ? characters.filter(
            (character) =>
              character.isYearning &&
              (character.communityStats?.calculated?.count || 0) === 0
          )
        : [],
    [characters, showYearning]
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
          ? `Community tier list refreshed at ${new Date(rebuildResult.computedAt).toLocaleString()}.`
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
              Last updated{' '}
              {communityData?.computedAt
                ? new Date(communityData.computedAt).toLocaleString()
                : '—'}
              .
            </Text>
          </div>

          <Button onClick={handleRebuild} loading={rebuilding} color="grape">
            Refresh
          </Button>
        </Group>

        <Switch
          checked={showYearning}
          onChange={(event) => setShowYearning(event.currentTarget.checked)}
          label="Show Yearning"
        />

        <ReadonlyTierList
          buckets={SCORE_BUCKETS}
          characters={visibleCharacters}
          getScore={(character) =>
            character.communityStats?.calculated?.average || 0
          }
          renderTooltipContent={renderCommunityTooltip}
          onCharacterClick={setSelectedCharacter}
          extraBucket={
            showYearning
              ? {
                  id: 'unrated-yearnings',
                  label: 'Unrated Yearnings',
                  color: 'gray',
                  items: unratedYearnings
                }
              : null
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
        onClose={() => setSelectedCharacter(null)}
      />
    </>
  );
}
