import { Avatar } from '@mantine/core';

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

export function CharacterAvatar({
  character,
  size = 54,
  radius = 'lg',
  variant = character?.isYearning ? 'yearning' : 'base'
}) {
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
          backgroundColor: getPersonalityAvatarColor(character?.personality),
          color: character?.personality === 'resonance' ? '#171021' : undefined
        }}
      />
      {variant === 'yearning' && character?.yearningImageUrl ? (
        <Avatar
          src={character.yearningImageUrl}
          alt=""
          radius={radius}
          size={size}
          className="character-avatar-overlay"
        />
      ) : null}
    </div>
  );
}
