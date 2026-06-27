import { expandCharacterVariants } from './site.js';

function roundToTwo(value) {
  return Number((value || 0).toFixed(2));
}

export function mergeCharacterScores(characters, derivedScores) {
  const variants = expandCharacterVariants(characters);
  const charactersById = new Map(
    variants.map((character) => [
      character.characterVariantKey || character.id,
      character
    ])
  );

  return derivedScores
    .map((score) => {
      const character = charactersById.get(
        score.characterVariantKey || score.characterId
      );
      if (!character) {
        return null;
      }

      return {
        ...character,
        ...score,
        secondaryText: String(roundToTwo(score.calculatedScore || 0))
      };
    })
    .filter(Boolean);
}

export function addCommunitySecondaryText(characters) {
  return (characters || []).map((character) => ({
    ...character,
    secondaryText: String(
      roundToTwo(character.communityStats?.calculated?.average || 0)
    )
  }));
}

export function buildReadonlyTierListDisplay({
  allCharacters,
  scoredCharacters,
  showYearning,
  isCharacterRated
}) {
  const allVariants = expandCharacterVariants(allCharacters);
  const ratedVariantKeys = new Set(
    scoredCharacters.map(
      (character) => character.characterVariantKey || character.id
    )
  );
  const ratedCharacters = scoredCharacters.filter((character) =>
    isCharacterRated(character, ratedVariantKeys)
  );
  const visibleCharacters = showYearning
    ? ratedCharacters
    : ratedCharacters.filter((character) => !character.isYearning);
  const unratedCharacters = allVariants.filter(
    (character) =>
      (!character.isYearning || showYearning) &&
      !isCharacterRated(character, ratedVariantKeys)
  );

  return {
    visibleCharacters,
    unratedCharacters
  };
}

export function hasRatedVariant(character, ratedVariantKeys) {
  return ratedVariantKeys.has(character.characterVariantKey || character.id);
}

export function hasCommunityRating(character) {
  return (character.communityStats?.calculated?.count || 0) > 0;
}
