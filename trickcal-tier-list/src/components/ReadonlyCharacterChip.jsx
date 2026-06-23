import { Avatar, Text } from '@mantine/core';
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

export function ReadonlyCharacterChip({
  character,
  secondaryText = '',
  className = ''
}) {
  return (
    <div
      className={`tier-candidate readonly-tier-candidate${
        className ? ` ${className}` : ''
      }`}
    >
      <Avatar
        src={character.imageUrl || undefined}
        alt=""
        radius="lg"
        size={54}
        style={{
          backgroundColor: getPersonalityAvatarColor(character.personality),
          color: character.personality === 'resonance' ? '#171021' : undefined
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
  );
}
