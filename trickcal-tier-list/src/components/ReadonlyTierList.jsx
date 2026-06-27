import { Badge, Group, Paper, Stack, Text, Tooltip } from '@mantine/core';
import { useMemo, useState } from 'react';
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

function sortCharactersAlphabetically(items) {
  return [...items].sort((left, right) =>
    getCharacterDisplayName(left).localeCompare(
      getCharacterDisplayName(right),
      undefined,
      { sensitivity: 'base' }
    )
  );
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

function getBaseCharacterId(character) {
  if (character.baseCharacterId) {
    return character.baseCharacterId;
  }

  if (character.characterId) {
    return character.characterId;
  }

  return String(character.id || '')
    .replace(/#base$/, '')
    .replace(/#yearning$/, '');
}

function CharacterChip({
  character,
  renderTooltipContent,
  onCharacterClick,
  highlighted,
  onHoverChange
}) {
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
          onMouseEnter={() => onHoverChange?.(character, true)}
          onMouseLeave={() => onHoverChange?.(character, false)}
          onClick={
            onCharacterClick ? () => onCharacterClick(character) : undefined
          }
        >
          <ReadonlyCharacterChip
            character={character}
            secondaryText={secondaryText}
            className={[
              onCharacterClick ? 'readonly-tier-candidate-clickable' : '',
              highlighted ? 'readonly-tier-candidate-highlighted' : ''
            ]
              .filter(Boolean)
              .join(' ')}
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
  onCharacterClick,
  extraBuckets = []
}) {
  const [hoveredBaseCharacterId, setHoveredBaseCharacterId] = useState('');
  const bucketItems = buckets.map((bucket) => ({
    ...bucket,
    items: sortCharacters(
      characters.filter((character) => bucket.matches(getScore(character))),
      getScore
    )
  }));
  const resolvedExtraBuckets = (extraBuckets || [])
    .map((bucket) => ({
      ...bucket,
      items: sortCharactersAlphabetically(bucket.items || [])
    }))
    .filter((bucket) => bucket.items.length > 0);
  const pairedBaseCharacterIds = useMemo(() => {
    const counts = new Map();

    [
      ...characters,
      ...resolvedExtraBuckets.flatMap((bucket) => bucket.items || [])
    ].forEach((character) => {
      const baseCharacterId = getBaseCharacterId(character);
      counts.set(baseCharacterId, (counts.get(baseCharacterId) || 0) + 1);
    });

    return new Set(
      [...counts.entries()]
        .filter(([, count]) => count > 1)
        .map(([baseCharacterId]) => baseCharacterId)
    );
  }, [characters, resolvedExtraBuckets]);

  function handleHoverChange(character, isHovered) {
    const baseCharacterId = getBaseCharacterId(character);
    if (!pairedBaseCharacterIds.has(baseCharacterId)) {
      return;
    }

    setHoveredBaseCharacterId(isHovered ? baseCharacterId : '');
  }

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
                  key={
                    character.characterVariantKey ||
                    character.characterId ||
                    character.id
                  }
                  character={character}
                  renderTooltipContent={renderTooltipContent}
                  onCharacterClick={onCharacterClick}
                  highlighted={
                    hoveredBaseCharacterId === getBaseCharacterId(character)
                  }
                  onHoverChange={handleHoverChange}
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
      {resolvedExtraBuckets.map((extraBucket) => (
        <Paper
          key={extraBucket.id}
          className="tier-bucket"
          p="sm"
          radius="lg"
          withBorder
        >
          <Group justify="space-between" align="center" mb="sm" wrap="nowrap">
            <Group gap="sm" wrap="nowrap">
              <Badge
                color={extraBucket.color || 'gray'}
                variant="filled"
                size="lg"
                className="tier-bucket-label"
                radius="md"
                translate="no"
              >
                {extraBucket.label}
              </Badge>
            </Group>
            <Text c="dimmed" size="sm">
              {extraBucket.items.length} character
              {extraBucket.items.length === 1 ? '' : 's'}
            </Text>
          </Group>

          <div className="tier-bucket-items">
            {extraBucket.items.map((character) => (
              <CharacterChip
                key={
                  character.characterVariantKey ||
                  character.characterId ||
                  character.id
                }
                character={character}
                renderTooltipContent={renderTooltipContent}
                onCharacterClick={onCharacterClick}
                highlighted={
                  hoveredBaseCharacterId === getBaseCharacterId(character)
                }
                onHoverChange={handleHoverChange}
              />
            ))}
          </div>
        </Paper>
      ))}
    </Stack>
  );
}
