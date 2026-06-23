import { Badge, Group, Paper, Stack, Text, Tooltip } from '@mantine/core';
import { ReadonlyCharacterChip } from './ReadonlyCharacterChip.jsx';
import { ScoreTooltip } from './ScoreTooltip.jsx';
import { getCharacterDisplayName } from '../lib/site.js';

function formatScore(score) {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return '0';
  }

  return score > 0 ? `+${Number(score.toFixed(2))}` : '0';
}

function sortCharacters(items, getScore) {
  return [...items].sort((left, right) => {
    const leftScore = getScore(left);
    const rightScore = getScore(right);

    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    return getCharacterDisplayName(left).localeCompare(
      getCharacterDisplayName(right),
      undefined,
      { sensitivity: 'base' }
    );
  });
}

function buildBreakdownLines(character) {
  if (
    typeof character.mixedCrusadeScore === 'number' ||
    typeof character.mixedFrontierScore === 'number'
  ) {
    const lines = [];

    if (typeof character.monoScore === 'number') {
      lines.push({
        label: 'Mono',
        score: character.monoScore * 0.2
      });
    }

    if (typeof character.mixedCrusadeScore === 'number') {
      lines.push({
        label: 'Crusade',
        score: character.mixedCrusadeScore * 0.5
      });
    }

    if (typeof character.mixedFrontierScore === 'number') {
      lines.push({
        label: 'Raid',
        score: character.mixedFrontierScore * 0.3
      });
    }

    return lines;
  }

  const monoScore =
    typeof character.monoScore === 'number' ? character.monoScore : 0;
  const mixedScore =
    typeof character.mixedScore === 'number' ? character.mixedScore : 0;
  const hasNicheVote = typeof character.nicheScore === 'number';
  const nicheScore = hasNicheVote ? character.nicheScore : 0;
  const calculatedScore =
    typeof character.calculatedScore === 'number'
      ? character.calculatedScore
      : 0;
  const appliedNicheScore =
    calculatedScore > monoScore + mixedScore ? nicheScore : 0;

  const lines = [
    { label: 'Mono', score: monoScore },
    { label: 'Crusade', score: mixedScore }
  ];

  if (hasNicheVote) {
    lines.push({ label: 'Niche score', score: appliedNicheScore });
  }

  return lines;
}

function getDefaultTooltipContent(character) {
  if (
    typeof character.mixedCrusadeScore === 'number' ||
    typeof character.mixedFrontierScore === 'number'
  ) {
    return (
      <ScoreTooltip
        title={getCharacterDisplayName(character)}
        score={character.calculatedScore ?? 0}
        monoScore={character.monoScore ?? 0}
        mixedScore={character.mixedCrusadeScore ?? 0}
        raidScore={character.mixedFrontierScore ?? 0}
        monoLabel="Mono"
        mixedLabel="Crusade"
        raidLabel="Raid"
      />
    );
  }

  const breakdown = buildBreakdownLines(character);
  const breakdownByLabel = new Map(
    breakdown.map((item) => [item.label, item.score ?? 0])
  );

  return (
    <ScoreTooltip
      title={getCharacterDisplayName(character)}
      score={character.calculatedScore ?? 0}
      monoScore={character.monoScore ?? 0}
      mixedScore={character.mixedScore ?? 0}
      monoLabel="Mono"
      mixedLabel="Crusade"
    />
  );
}

function CharacterChip({ character, renderTooltipContent, onCharacterClick }) {
  const label = (renderTooltipContent || getDefaultTooltipContent)(character);
  const secondaryText = character.secondaryText || '';

  return (
    <Tooltip
      label={label}
      multiline
      withinPortal
      position="top"
      withArrow
      openDelay={60}
      classNames={{ tooltip: 'readonly-tier-tooltip' }}
    >
      <div>
        <div
          translate="no"
          onClick={
            onCharacterClick ? () => onCharacterClick(character) : undefined
          }
        >
          <ReadonlyCharacterChip
            character={character}
            secondaryText={secondaryText}
            className={
              onCharacterClick ? 'readonly-tier-candidate-clickable' : ''
            }
          />
        </div>
      </div>
    </Tooltip>
  );
}

export function ReadonlyTierList({
  buckets,
  characters,
  getScore = (character) => character.calculatedScore ?? 0,
  renderTooltipContent,
  onCharacterClick
}) {
  const bucketItems = buckets.map((bucket) => ({
    ...bucket,
    items: sortCharacters(
      characters.filter((character) => bucket.matches(getScore(character))),
      getScore
    )
  }));

  return (
    <Stack gap="sm" className="tier-list notranslate" translate="no">
      {bucketItems.map((bucket) => (
        <Paper
          key={bucket.id}
          className="tier-bucket"
          p="sm"
          radius="lg"
          withBorder
        >
          <Group justify="space-between" align="center" mb="sm" wrap="nowrap">
            <Group gap="sm" wrap="nowrap">
              <Badge
                color={bucket.color || 'grape'}
                variant="filled"
                size="lg"
                className="tier-bucket-label"
                radius="md"
                translate="no"
              >
                {bucket.label}
              </Badge>
              {bucket.thresholdLabel ? (
                <Text
                  size="sm"
                  fw={700}
                  c="dimmed"
                  className="tier-bucket-score"
                >
                  {bucket.thresholdLabel}
                </Text>
              ) : null}
            </Group>
            <Text c="dimmed" size="sm">
              {bucket.items.length} character
              {bucket.items.length === 1 ? '' : 's'}
            </Text>
          </Group>

          <div className="tier-bucket-items">
            {bucket.items.length ? (
              bucket.items.map((character) => (
                <CharacterChip
                  key={character.characterId || character.id}
                  character={character}
                  renderTooltipContent={renderTooltipContent}
                  onCharacterClick={onCharacterClick}
                />
              ))
            ) : (
              <Text c="dimmed" size="sm">
                No characters in this tier
              </Text>
            )}
          </div>
        </Paper>
      ))}
    </Stack>
  );
}
