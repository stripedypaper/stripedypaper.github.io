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
    thresholdLabel: '9.0-9.4',
    matches: (score) => score >= 9 && score < 9.5
  },
  {
    id: 'a',
    label: 'A tier',
    color: 'teal',
    thresholdLabel: '8.0-8.9',
    matches: (score) => score >= 8 && score < 9
  },
  {
    id: 'b',
    label: 'B tier',
    color: 'green',
    thresholdLabel: '6.0-7.9',
    matches: (score) => score >= 6 && score < 8
  },
  {
    id: 'c',
    label: 'C tier',
    color: 'yellow',
    thresholdLabel: '4.0-5.9',
    matches: (score) => score >= 4 && score < 6
  },
  {
    id: 'd',
    label: 'D tier',
    color: 'red',
    thresholdLabel: '<4.0',
    matches: (score) => score < 4
  }
];
