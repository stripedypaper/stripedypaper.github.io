export const SCORE_BUCKETS = [
  {
    id: 's-plus',
    label: 'S+ tier',
    color: 'grape',
    thresholdLabel: '9.5+',
    matches: (score) => score >= 9.5
  },
  {
    id: 's',
    label: 'S tier',
    color: 'blue',
    thresholdLabel: '8.5-9.49',
    matches: (score) => score >= 8.5 && score < 9.5
  },
  {
    id: 'a',
    label: 'A tier',
    color: 'teal',
    thresholdLabel: '6.5-8.49',
    matches: (score) => score >= 6.5 && score < 8.5
  },
  {
    id: 'b',
    label: 'B tier',
    color: 'green',
    thresholdLabel: '4.5-6.49',
    matches: (score) => score >= 4.5 && score < 6.5
  },
  {
    id: 'c',
    label: 'C tier',
    color: 'yellow',
    thresholdLabel: '2.5-4.49',
    matches: (score) => score >= 2.5 && score < 4.5
  },
  {
    id: 'd',
    label: 'D tier',
    color: 'red',
    thresholdLabel: '<2.5',
    matches: (score) => score < 2.5
  }
];
