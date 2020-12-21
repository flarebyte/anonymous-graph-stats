import { countByTags } from '../src/stats';
import { Graph, StatsContext } from '../src/model';

const fixtureAlpha: Graph = require('./fixture-graph-alpha.json');

describe('count by tags', () => {
  it('works', () => {
    const ctx: StatsContext = { supportedTags: ['alpha', 'beta', 'delta'] };
    const actual = countByTags(ctx, fixtureAlpha);
    const expected = [
      {
        name: 'attribute-metas count',
        values: [
          { name: 'alpha', value: 3 },
          { name: 'beta', value: 1 },
        ],
      },
    ];
    expect(actual).toEqual(expected);
  });
});
