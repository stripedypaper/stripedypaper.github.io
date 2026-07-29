import { Text } from '@mantine/core';
import { HiMiniChatBubbleBottomCenterText } from 'react-icons/hi2';
import { CharacterAvatar } from './CharacterAvatar.jsx';
import { getCharacterDisplayName } from '../lib/site.js';

export function ReadonlyCharacterChip({
  character,
  secondaryText = '',
  className = '',
  showReviewIndicator = character?.showReviewIndicator
}) {
  const showMetaRow = secondaryText || showReviewIndicator;

  return (
    <div
      className={`tier-candidate readonly-tier-candidate${
        className ? ` ${className}` : ''
      }`}
    >
      <CharacterAvatar character={character} />
      <div className="readonly-chip-text">
        <Text size="sm" fw={600} className="tier-candidate-label">
          {getCharacterDisplayName(character)}
        </Text>
        {showMetaRow ? (
          <div className="readonly-chip-meta-row">
            {secondaryText ? (
              <Text size="xs" c="dimmed">
                {secondaryText}
              </Text>
            ) : null}
            {showReviewIndicator ? (
              <span className="readonly-chip-review-indicator">
                <HiMiniChatBubbleBottomCenterText size={12} />
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
