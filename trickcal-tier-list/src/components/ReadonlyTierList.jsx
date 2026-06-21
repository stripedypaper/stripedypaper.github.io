import {
  Avatar,
  Badge,
  Group,
  Paper,
  Stack,
  Text,
  Tooltip
} from '@mantine/core';
import { getCharacterDisplayName } from '../lib/site.js';

function getPersonalityAvatarColor(personality) {
  switch (personality) {
    case 'vivacious':
      return '#ecdc84';
    case 'mad':
      return '#ec849d';
    case 'composed':
      return '#89beef';
    case 'depressed':
      return '#c684ec';
    case 'innocent':
      return '#91f2a8';
    case 'resonance':
      return '#ffffff';
    default:
      return '#5b4a74';
  }
}

function formatScore(score) {
  return typeof score === 'number' && score > 0 ? `+${score}` : '0';
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
    { label: 'Mono score', score: monoScore },
    { label: 'Mixed score', score: mixedScore }
  ];

  if (hasNicheVote) {
    lines.push({ label: 'Niche score', score: appliedNicheScore });
  }

  return lines;
}

function getDefaultTooltipContent(character) {
  const breakdown = buildBreakdownLines(character);

  return (
    <Stack gap={6}>
      <Text fw={700}>{getCharacterDisplayName(character)}</Text>
      <Text size="sm">Total score: {character.calculatedScore ?? 0}</Text>
      {breakdown.length ? (
        breakdown.map((item) => (
          <Group
            key={item.label}
            justify="space-between"
            gap="md"
            wrap="nowrap"
          >
            <Text size="sm" c="dimmed">
              {item.label}
            </Text>
            <Text size="sm" fw={600}>
              {formatScore(item.score)}
            </Text>
          </Group>
        ))
      ) : (
        <Text size="sm" c="dimmed">
          No contributing rankings.
        </Text>
      )}
    </Stack>
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
          className={`tier-candidate readonly-tier-candidate${
            onCharacterClick ? ' readonly-tier-candidate-clickable' : ''
          }`}
          translate="no"
          onClick={
            onCharacterClick ? () => onCharacterClick(character) : undefined
          }
        >
          <Avatar
            src={character.imageUrl || undefined}
            alt=""
            radius="lg"
            size={54}
            style={{
              backgroundColor: getPersonalityAvatarColor(character.personality),
              color:
                character.personality === 'resonance' ? '#171021' : undefined
            }}
          />
          <div>
            <Text size="sm" fw={600} className="tier-candidate-label">
              {getCharacterDisplayName(character)}
            </Text>
            {secondaryText ? (
              <Text size="xs" c="dimmed">
                {secondaryText}
              </Text>
            ) : null}
          </div>
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
