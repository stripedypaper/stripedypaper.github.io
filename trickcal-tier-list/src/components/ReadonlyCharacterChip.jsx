import { Text } from '@mantine/core';
import { CharacterAvatar } from './CharacterAvatar.jsx';
import { getCharacterDisplayName } from '../lib/site.js';

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
      <CharacterAvatar character={character} />
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
