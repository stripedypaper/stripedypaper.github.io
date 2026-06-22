export const SCORE_BUCKETS = [
  {
    id: 'ss',
    label: 'SS tier',
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
    thresholdLabel: '7.5-8.49',
    matches: (score) => score >= 7.5 && score < 8.5
  },
  {
    id: 'b',
    label: 'B tier',
    color: 'green',
    thresholdLabel: '5.5-7.49',
    matches: (score) => score >= 5.5 && score < 7.5
  },
  {
    id: 'c',
    label: 'C tier',
    color: 'yellow',
    thresholdLabel: '3.5-5.49',
    matches: (score) => score >= 3.5 && score < 5.5
  },
  {
    id: 'd',
    label: 'D tier',
    color: 'red',
    thresholdLabel: '<3.5',
    matches: (score) => score < 3.5
  }
];
