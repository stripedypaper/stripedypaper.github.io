import { Switch, Stack } from '@mantine/core';
import { ReadonlyTierList } from './ReadonlyTierList.jsx';
import { SCORE_BUCKETS } from '../lib/tierBuckets.js';

export function ReadonlyTierListSection({
  showYearning,
  onShowYearningChange,
  showCuratorsOnly = false,
  onShowCuratorsOnlyChange,
  characters,
  getScore,
  renderTooltipContent,
  onCharacterClick,
  unratedCharacters = [],
  beforeToggleContent = null
}) {
  return (
    <Stack gap="lg">
      {beforeToggleContent}
      <Switch
        checked={showYearning}
        onChange={(event) => onShowYearningChange(event.currentTarget.checked)}
        label="Show Yearning"
      />
      {onShowCuratorsOnlyChange ? (
        <Switch
          checked={showCuratorsOnly}
          onChange={(event) =>
            onShowCuratorsOnlyChange(event.currentTarget.checked)
          }
          label="Include curator scores only"
        />
      ) : null}

      <ReadonlyTierList
        buckets={SCORE_BUCKETS}
        characters={characters}
        getScore={getScore}
        renderTooltipContent={renderTooltipContent}
        onCharacterClick={onCharacterClick}
        extraBuckets={[
          {
            id: 'not-yet-rated',
            label: 'Not yet rated',
            color: 'gray',
            items: unratedCharacters
          }
        ]}
      />
    </Stack>
  );
}
