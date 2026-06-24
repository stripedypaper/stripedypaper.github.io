import { Stack, Text } from '@mantine/core';
import { SCORE_WEIGHT_LABELS, SCORE_WEIGHTS } from '../lib/scoreWeights.js';

function formatNumber(value) {
  return typeof value === 'number' ? Number(value.toFixed(2)) : 0;
}

function formatContribution(value, weightKey) {
  const weight = SCORE_WEIGHTS[weightKey] || 0;
  return formatNumber((value || 0) * weight);
}

export function ScoreTooltip({
  title,
  subtitle,
  score,
  monoScore,
  mixedScore,
  raidScore,
  monoLabel = 'Mono',
  mixedLabel = 'Crusade',
  raidLabel = 'Raid'
}) {
  return (
    <Stack gap={6}>
      <Text fw={700}>{title}</Text>
      {subtitle ? (
        <Text size="sm" c="dimmed">
          {subtitle}
        </Text>
      ) : null}
      <Text size="sm">
        {monoLabel}:{' '}
        <Text span c="dimmed">
          {formatNumber(monoScore)} × {SCORE_WEIGHT_LABELS.mono} =
        </Text>{' '}
        +{formatNumber(formatContribution(monoScore, 'mono'))}
      </Text>
      <Text size="sm">
        {mixedLabel}:{' '}
        <Text span c="dimmed">
          {formatNumber(mixedScore)} × {SCORE_WEIGHT_LABELS.mixed} =
        </Text>{' '}
        +{formatNumber(formatContribution(mixedScore, 'mixed'))}
      </Text>
      {typeof raidScore === 'number' ? (
        <Text size="sm">
          {raidLabel}:{' '}
          <Text span c="dimmed">
            {formatNumber(raidScore)} × {SCORE_WEIGHT_LABELS.raid} =
          </Text>{' '}
          +{formatNumber(formatContribution(raidScore, 'raid'))}
        </Text>
      ) : null}
      <Text size="sm">Total score: {formatNumber(score)}</Text>
    </Stack>
  );
}
