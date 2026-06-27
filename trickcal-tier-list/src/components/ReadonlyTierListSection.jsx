import { Switch, Stack } from '@mantine/core';
import { ReadonlyTierList } from './ReadonlyTierList.jsx';
import { SCORE_BUCKETS } from '../lib/tierBuckets.js';

export function ReadonlyTierListSection({
  showYearning,
  onShowYearningChange,
  characters,
  getScore,
  renderTooltipContent,
  onCharacterClick,
  unratedCharacters = []
}) {
  return (
    <Stack gap="lg">
      <Switch
        checked={showYearning}
        onChange={(event) => onShowYearningChange(event.currentTarget.checked)}
        label="Show Yearning"
      />

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
