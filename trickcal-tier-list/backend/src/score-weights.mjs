export const SCORE_WEIGHTS_V2 = {
  mono: 0.2,
  mixed: 0.5,
  raid: 0.3
};

export function calculateQuestionnaireV2Score({
  monoScore,
  mixedCrusadeScore,
  mixedFrontierScore
}) {
  const hasAnyScore =
    typeof monoScore === 'number' ||
    typeof mixedCrusadeScore === 'number' ||
    typeof mixedFrontierScore === 'number';

  if (!hasAnyScore) {
    return null;
  }

  return Number(
    (
      (typeof monoScore === 'number' ? monoScore : 0) * SCORE_WEIGHTS_V2.mono +
      (typeof mixedCrusadeScore === 'number' ? mixedCrusadeScore : 0) *
        SCORE_WEIGHTS_V2.mixed +
      (typeof mixedFrontierScore === 'number' ? mixedFrontierScore : 0) *
        SCORE_WEIGHTS_V2.raid
    ).toFixed(4)
  );
}
