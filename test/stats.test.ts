import { getStats } from '../src/stats';
import { Graph, StatsContext } from '../src/model';

const fixtureAlpha: Graph = require('./fixture-graph-alpha.json');
const fixtureExpectedAlpha = require('./fixture-graph-alpha-stats.expected.json');

describe('get statistics for graph', () => {
  it('count tags for each metadata, nodes and edges', () => {
    const ctx: StatsContext = {
      supportedTags: ['alpha', 'beta', 'delta'],
      supportedUnits: ['km', 'GBP'],
    };
    const actual = getStats(ctx, fixtureAlpha);
    expect(actual).toEqual(fixtureExpectedAlpha);
  });
});
