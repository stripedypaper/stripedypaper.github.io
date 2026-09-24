import { Group, Image } from '@mantine/core';
import { getCharacterPersonalities, getStaticImageUrl } from '../lib/site.js';

function getPersonalityImageName(personality) {
  if (personality === 'innocent') {
    return 'element_innocence.webp';
  }

  if (personality === 'mad') {
    return 'element_madness.webp';
  }

  return `element_${personality}.webp`;
}

export function CharacterMetaIcons({
  character,
  size = 20,
  justify = 'center',
  gap = 'xs'
}) {
  const personalityIconNames = getCharacterPersonalities(character).map(
    getPersonalityImageName
  );
  const iconNames = [
    character?.position ? `position_${character.position}.webp` : '',
    character?.role ? `class_${character.role}.webp` : '',
    ...personalityIconNames
  ].filter(Boolean);

  if (!iconNames.length) {
    return null;
  }

  return (
    <Group gap={gap} justify={justify}>
      {iconNames.map((iconName) => (
        <Image
          key={iconName}
          src={getStaticImageUrl(iconName)}
          alt=""
          w={size}
          h={size}
        />
      ))}
    </Group>
  );
}
