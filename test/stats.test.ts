import { getStats, toCSV, fromCSV, validate } from '../src/stats';
import { Graph, StatsContext } from '../src/model';
import fs from 'fs';

const fixtureAlpha: Graph = require('./fixture-graph-alpha.json');
const fixtureExpectedAlpha = require('./fixture-graph-alpha-stats-expected.json');
const fixtureExpectedAlphaCsv = fs.readFileSync(
  './test/fixture-graph-alpha-stats-expected.csv',
  'utf8'
);

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
});
