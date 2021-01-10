import {
  getStats,
  toCSV,
  fromCSV,
  validate,
  parseAsGraph,
  compareStats,
  dateTimeToStats,
} from '../src';
import fs from 'fs';

const fixtureAlpha = parseAsGraph(
  fs.readFileSync('./test/fixture-graph-alpha.json', 'utf8')
);
const fixtureExpectedAlpha = require('./fixture-graph-alpha-stats-expected.json');
const fixtureExpectedAlphaCsv = fs.readFileSync(
  './test/fixture-graph-alpha-stats-expected.csv',
  'utf8'
);
const range = (size: number, startAt: number = 0): number[] =>
  [...Array(size).keys()].map(i => i + startAt);

const defaultCtx = {
  supportedTags: ['alpha', 'beta', 'delta'],
  supportedUnits: ['km', 'GBP'],
};
describe('get statistics for graph', () => {
  it('provide statistics as a json file', () => {
    const actual = getStats(defaultCtx, fixtureAlpha);
    //console.log(JSON.stringify(actual, null, 2));
    expect(actual).toEqual(fixtureExpectedAlpha);
  });

  it('provide statistics as a csv file', () => {
    const actual = toCSV(getStats(defaultCtx, fixtureAlpha), ',').join('\n');
    //console.log(actual);
    expect(actual).toEqual(fixtureExpectedAlphaCsv);
  });

  it('provide csv conversion', () => {
    const lines = fixtureExpectedAlphaCsv.split('\n');
    const asItems = fromCSV(lines, ',');
    const asLines = toCSV(asItems, ',');
    expect(asItems).toHaveLength(lines.length);
    expect(asLines).toHaveLength(lines.length);
    expect(asLines).toEqual(lines);
  });
});

describe('validation for statistics', () => {
  it('validate successfully', () => {
    const lines = fixtureExpectedAlphaCsv.split('\n');
    const actual = validate(defaultCtx, fromCSV(lines, ','));
    expect(actual).toEqual('');
  });
  it('detects truncated stats', () => {
    const cut = 10;
    const lines = fixtureExpectedAlphaCsv.split('\n').splice(0, cut);
    const actual = validate(defaultCtx, fromCSV(lines, ','));
    expect(actual).toEqual(`Too few stats items recorded: ${cut}`);
  });
  it('detects stats that looks too big', () => {
    const size = 10000;
    const sample = fixtureExpectedAlphaCsv.split('\n')[0];
    const inflated = range(size).map(_ => sample);
    const actual = validate(defaultCtx, fromCSV(inflated, ','));
    expect(actual).toEqual(`Too many stats items recorded: ${size}`);
  });

  it('detects stats with invalid records', () => {
    const samples = fixtureExpectedAlphaCsv.split('\n');
    const incorrect = 'incorrect,count min,,1';
    samples.push(incorrect);
    const actual = validate(defaultCtx, fromCSV(samples, ','));
    expect(actual.split(' -->')[0]).toEqual('Found 1 invalid items');
  });
  it('detects stats with duplicate', () => {
    const samples = fixtureExpectedAlphaCsv.split('\n');
    const duplicate = samples[1];
    samples.push(duplicate);
    const actual = validate(defaultCtx, fromCSV(samples, ','));
    expect(actual.split(' -->')[0]).toEqual('Found 1 unexpected duplicates');
  });
});

describe('compare statistics for graph', () => {
  it('detects no changes', () => {
    const defaultStats = getStats(defaultCtx, fixtureAlpha);
    const actual = compareStats(defaultStats, defaultStats);
    expect(actual.changes).toEqual(0);
    expect(actual.added).toHaveLength(0);
    expect(actual.removed).toHaveLength(0);
    expect(actual.modified).toHaveLength(0);
    expect(actual.identical).toHaveLength(defaultStats.length);
  });

  it('detects added stats', () => {
    const defaultStats = getStats(defaultCtx, fixtureAlpha);
    const addedStatsValue = {
      name: 'new',
      action: 'count',
      text: '',
      value: 1,
    };
    const newStats = [addedStatsValue].concat(defaultStats);
    const actual = compareStats(defaultStats, newStats);
    expect(actual.changes).toEqual(1);
    expect(actual.added).toHaveLength(1);
    expect(actual.removed).toHaveLength(0);
    expect(actual.modified).toHaveLength(0);
    expect(actual.identical).toHaveLength(defaultStats.length);
    expect(actual.added[0]).toEqual(addedStatsValue);
  });

  it('detects removed stats', () => {
    const defaultStats = getStats(defaultCtx, fixtureAlpha);
    const [removed, ...newStats] = defaultStats;
    const actual = compareStats(defaultStats, newStats);
    expect(actual.changes).toEqual(1);
    expect(actual.added).toHaveLength(0);
    expect(actual.removed).toHaveLength(1);
    expect(actual.modified).toHaveLength(0);
    expect(actual.identical).toHaveLength(defaultStats.length - 1);
    expect(actual.removed[0]).toEqual(removed);
  });

  it('detects modified stats', () => {
    const defaultStats = getStats(defaultCtx, fixtureAlpha);
    const [...newStats] = defaultStats;
    newStats[0] = {
      name: defaultStats[0].name,
      action: defaultStats[0].action,
      text: defaultStats[0].text,
      value: 100,
    };
    const actual = compareStats(defaultStats, newStats);
    expect(actual.changes).toEqual(1);
    expect(actual.added).toHaveLength(0);
    expect(actual.removed).toHaveLength(0);
    expect(actual.modified).toHaveLength(1);
    expect(actual.identical).toHaveLength(defaultStats.length - 1);
    expect(actual.modified[0].value).toEqual(100);
  });
});

describe('extract the date time info', () => {
  it('accepts an ISO date', () => {
    const defaultStats = getStats(defaultCtx, fixtureAlpha);
    const dateValue = new Date('2021-01-05T10:05:55Z');
    const actualDateStats = dateTimeToStats('date', 'alpha', dateValue);
    const validation = validate(
      defaultCtx,
      defaultStats.concat(actualDateStats)
    );
    const expected = [
      { name: 'date', action: 'year', text: 'alpha', value: 2021 },
      { name: 'date', action: 'month', text: 'alpha', value: 1 },
      { name: 'date', action: 'weekday', text: 'alpha', value: 2 },
      { name: 'date', action: 'hours', text: 'alpha', value: 10 },
      { name: 'date', action: 'epoch days', text: 'alpha', value: 18632 },
    ];
    expect(validation).toHaveLength(0);
    expect(actualDateStats).toHaveLength(5);
    expect(actualDateStats).toEqual(expected);
  });
});
