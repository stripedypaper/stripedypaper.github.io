import { Avatar, Badge } from '@mantine/core';
import { getCharacterPersonalities } from '../lib/site.js';

function getPersonalityAvatarBackground(personalities) {
  const [personality] = personalities;
  if (personalities.length > 1) {
    return `linear-gradient(135deg, ${personalities
      .map(getPersonalityColor)
      .join(', ')})`;
  }

  return getPersonalityColor(personality);
}

function getPersonalityColor(personality) {
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
    default:
      return '#5b4a74';
  }
}

export function CharacterAvatar({
  character,
  size = 54,
  radius = 'lg',
  variant = character?.isYearning ? 'yearning' : 'base',
  showBorder = false
}) {
  const personalities = getCharacterPersonalities(character);
  const avatarBackground = getPersonalityAvatarBackground(personalities);
  const hasMultiplePersonalities = personalities.length > 1;

  return (
    <div
      className={`character-avatar${
        variant === 'yearning' ? ' character-avatar-yearning' : ''
      }`}
      style={{
        '--character-avatar-size': `${size}px`
      }}
    >
      <Avatar
        src={character?.imageUrl || undefined}
        alt=""
        radius={radius}
        size={size}
        style={{
          background: avatarBackground,
          backgroundOrigin: hasMultiplePersonalities ? 'border-box' : undefined,
          backgroundClip: hasMultiplePersonalities ? 'border-box' : undefined,
          color: hasMultiplePersonalities ? '#171021' : undefined,
          border: showBorder
            ? hasMultiplePersonalities
              ? '0.4rem solid transparent'
              : `0.4rem solid ${avatarBackground}`
            : undefined
        }}
      />
      {variant === 'yearning' && character?.yearningImageUrl ? (
        <Avatar
          src={character.yearningImageUrl}
          alt=""
          radius={radius}
          size={size}
          className={`character-avatar-overlay${showBorder ? ' big' : ''}`}
        />
      ) : null}
      {character?.showNewBadge ? (
        <Badge
          size="xs"
          variant="filled"
          color="grape"
          radius={0}
          className="character-avatar-new-badge"
        >
          New
        </Badge>
      ) : null}
    </div>
  );
}
