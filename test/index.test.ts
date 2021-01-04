import {
  getStats,
  toCSV,
  fromCSV,
  validate,
  Graph,
  StatsContext,
} from '../src';
import fs from 'fs';

const fixtureAlpha: Graph = require('./fixture-graph-alpha.json');
const fixtureExpectedAlpha = require('./fixture-graph-alpha-stats-expected.json');
const fixtureExpectedAlphaCsv = fs.readFileSync(
  './test/fixture-graph-alpha-stats-expected.csv',
  'utf8'
);
const range = (size: number, startAt: number = 0): number[] =>
  [...Array(size).keys()].map(i => i + startAt);

describe('get statistics for graph', () => {
  it('provide statistics as a json file', () => {
    const ctx: StatsContext = {
      supportedTags: ['alpha', 'beta', 'delta'],
      supportedUnits: ['km', 'GBP'],
    };
    const actual = getStats(ctx, fixtureAlpha);
    //console.log(JSON.stringify(actual, null, 2));
    expect(actual).toEqual(fixtureExpectedAlpha);
  });

  it('provide statistics as a csv file', () => {
    const ctx: StatsContext = {
      supportedTags: ['alpha', 'beta', 'delta'],
      supportedUnits: ['km', 'GBP'],
    };
    const actual = toCSV(getStats(ctx, fixtureAlpha), ',').join('\n');
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
    const ctx: StatsContext = {
      supportedTags: ['alpha', 'beta', 'delta'],
      supportedUnits: ['km', 'GBP'],
    };
    const lines = fixtureExpectedAlphaCsv.split('\n');
    const actual = validate(ctx, fromCSV(lines, ','));
    expect(actual).toEqual('');
  });
  it('detects truncated stats', () => {
    const ctx: StatsContext = {
      supportedTags: ['alpha', 'beta', 'delta'],
      supportedUnits: ['km', 'GBP'],
    };
    const cut = 10;
    const lines = fixtureExpectedAlphaCsv.split('\n').splice(0, cut);
    const actual = validate(ctx, fromCSV(lines, ','));
    expect(actual).toEqual(`Too few stats items recorded: ${cut}`);
  });
  it('detects stats that looks too big', () => {
    const ctx: StatsContext = {
      supportedTags: ['alpha', 'beta', 'delta'],
      supportedUnits: ['km', 'GBP'],
    };

    const size = 10000;
    const sample = fixtureExpectedAlphaCsv.split('\n')[0];
    const inflated = range(size).map(_ => sample);
    const actual = validate(ctx, fromCSV(inflated, ','));
    expect(actual).toEqual(`Too many stats items recorded: ${size}`);
  });

  it('detects stats with invalid records', () => {
    const ctx: StatsContext = {
      supportedTags: ['alpha', 'beta', 'delta'],
      supportedUnits: ['km', 'GBP'],
    };

    const samples = fixtureExpectedAlphaCsv.split('\n');
    const incorrect = 'incorrect,count min,,1';
    samples.push(incorrect);
    const actual = validate(ctx, fromCSV(samples, ','));
    expect(actual.split(' -->')[0]).toEqual('Found 1 invalid items');
  });
  it('detects stats with duplicate', () => {
    const ctx: StatsContext = {
      supportedTags: ['alpha', 'beta', 'delta'],
      supportedUnits: ['km', 'GBP'],
    };

    const samples = fixtureExpectedAlphaCsv.split('\n');
    const duplicate = samples[1];
    samples.push(duplicate);
    const actual = validate(ctx, fromCSV(samples, ','));
    expect(actual.split(' -->')[0]).toEqual('Found 1 unexpected duplicates');
  });
});
