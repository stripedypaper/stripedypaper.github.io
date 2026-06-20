import {
  Button,
  Group,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Text
} from '@mantine/core';
import { BarChart } from '@mantine/charts';
import { notifications } from '@mantine/notifications';
import { useEffect, useMemo, useState } from 'react';
import { ReadonlyTierList } from '../components/ReadonlyTierList.jsx';
import { SCORE_BUCKETS } from '../lib/tierBuckets.js';
import { getCharacterDisplayName } from '../lib/site.js';

function roundToTwo(value) {
  return Number((value || 0).toFixed(2));
}

function buildNumericDistributionData(distribution, start, end) {
  const rows = [];

  for (let value = start; value <= end; value += 1) {
    rows.push({
      label: String(value),
      votes: distribution?.[String(value)] || 0
    });
  }

  return rows;
}

function buildNicheDistributionData(distribution) {
  return [
    { label: 'false', votes: distribution?.false || 0 },
    { label: 'true', votes: distribution?.true || 0 }
  ];
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
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
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
                Mixed average
              </Text>
              <Text fw={700} size="xl">
                {roundToTwo(stats.mixed?.average || 0)}
              </Text>
            </Stack>
          </Paper>
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <CommunityChart
            title="Calculated Score Vote Distribution"
            data={buildNumericDistributionData(
              stats.calculated?.distribution,
              0,
              10
            )}
            valueKey="votes"
            color="teal.6"
            valueFormatter={(value) => String(value)}
          />
          <CommunityChart
            title="Mono Score Vote Distribution"
            data={buildNumericDistributionData(stats.mono?.distribution, 0, 5)}
            valueKey="votes"
            color="yellow.6"
            valueFormatter={(value) => String(value)}
          />
          <CommunityChart
            title="Mixed Score Vote Distribution"
            data={buildNumericDistributionData(stats.mixed?.distribution, 0, 5)}
            valueKey="votes"
            color="lime.6"
            valueFormatter={(value) => String(value)}
          />
          <CommunityChart
            title="Niche Vote Distribution"
            data={buildNicheDistributionData(stats.niche?.distribution)}
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
    <Stack gap={6}>
      <Text fw={700}>{getCharacterDisplayName(character)}</Text>
      <Text size="sm">
        Score: {roundToTwo(character.communityStats?.calculated?.average || 0)}
      </Text>
      <Text size="sm">
        Mono score: {roundToTwo(character.communityStats?.mono?.average || 0)}
      </Text>
      <Text size="sm">
        Mixed score: {roundToTwo(character.communityStats?.mixed?.average || 0)}
      </Text>
    </Stack>
  );
}

async function fetchCommunityCharacters(apiBaseUrl) {
  const response = await fetch(`${apiBaseUrl}/community/characters`);

  if (!response.ok) {
    throw new Error(
      `Community tier list failed with status ${response.status}.`
    );
  }

  return response.json();
}

async function triggerCommunityRebuild(apiBaseUrl) {
  const response = await fetch(`${apiBaseUrl}/community/rebuild`, {
    method: 'POST'
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
        const data = await fetchCommunityCharacters(apiBaseUrl);
        if (!active) {
          return;
        }

        setCommunityData(data);
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
    () => communityData?.characters || [],
    [communityData]
  );

  async function handleRebuild() {
    if (!apiBaseUrl || rebuilding) {
      return;
    }

    setRebuilding(true);

    try {
      const rebuildResult = await triggerCommunityRebuild(apiBaseUrl);
      const refreshed = await fetchCommunityCharacters(apiBaseUrl);
      setCommunityData(refreshed);
      notifications.show({
        title: 'Rebuilt',
        message: rebuildResult?.computedAt
          ? `Community tier list rebuilt at ${new Date(rebuildResult.computedAt).toLocaleString()}.`
          : 'Community tier list rebuilt.',
        color: 'grape'
      });
    } catch (rebuildError) {
      notifications.show({
        title: 'Rebuild unavailable',
        message: rebuildError?.retryAfterSeconds
          ? `Try again in ${rebuildError.retryAfterSeconds} seconds.`
          : rebuildError instanceof Error
            ? rebuildError.message
            : 'Unable to rebuild community tier list.',
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

        <ReadonlyTierList
          buckets={SCORE_BUCKETS}
          characters={characters}
          getScore={(character) =>
            character.communityStats?.calculated?.average || 0
          }
          renderTooltipContent={renderCommunityTooltip}
          onCharacterClick={setSelectedCharacter}
        />
      </Stack>

      <CharacterDetailsModal
        character={selectedCharacter}
        opened={Boolean(selectedCharacter)}
        onClose={() => setSelectedCharacter(null)}
      />
    </>
  );
}
