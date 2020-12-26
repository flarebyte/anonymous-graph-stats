import {
  countAttributes,
  countByTags,
  countByUnitText,
  countEmptyMetadata,
  countRootGraph,
  countAttributeMetadata,
} from '../src/stats';
import { Graph, StatsContext } from '../src/model';

const fixtureAlpha: Graph = require('./fixture-graph-alpha.json');

describe('count by tags', () => {
  it('count tags for each metadata, nodes and edges', () => {
    const ctx: StatsContext = {
      supportedTags: ['alpha', 'beta', 'delta'],
      supportedUnits: [],
    };
    const actual = countByTags(ctx, fixtureAlpha);
    const expected = [
      {
        name: 'attribute-metadata tags count',
        values: [
          { name: 'alpha', value: 3 },
          { name: 'beta', value: 1 },
        ],
      },
      {
        name: 'node tags count',
        values: [{ name: 'alpha', value: 2 }],
      },
      {
        name: 'edge tags count',
        values: [
          { name: 'alpha', value: 3 },
          { name: 'delta', value: 1 },
        ],
      },
    ];
    expect(actual).toEqual(expected);
  });
});

describe('count by unit text', () => {
  it('count units for each metadata', () => {
    const ctx: StatsContext = {
      supportedTags: [],
      supportedUnits: ['km', 'GBP'],
    };
    const actual = countByUnitText(ctx, fixtureAlpha);
    const expected = {
      name: 'attribute-metadata units count',
      values: [
        { name: 'km', value: 1 },
        { name: 'GBP', value: 2 },
      ],
    };
    expect(actual).toEqual(expected);
  });
});

describe('count empty metadata', () => {
  it('count empty fields for each metadata', () => {
    const actual = countEmptyMetadata(fixtureAlpha);
    const expected = {
      name: 'attribute-metadata empty count',
      values: [
        { name: 'name', value: 1 },
        { name: 'alternateName', value: 4 },
        { name: 'unitText', value: 2 },
        { name: 'tagSet', value: 2 },
      ],
    };
    expect(actual).toEqual(expected);
  });
});

describe('count root graph', () => {
  it('count graph fields', () => {
    const actual = countRootGraph(fixtureAlpha);
    const expected = {
      name: 'graph count',
      values: [
        { name: 'attributeMetadataList', value: 6 },
        { name: 'nodeList', value: 4 },
        { name: 'edgeList', value: 3 },
      ],
    };
    expect(actual).toEqual(expected);
  });
});

describe('count attributes', () => {
  it('count attributes', () => {
    const actual = countAttributes(fixtureAlpha);
    const expected = {
      name: 'attribute count',
      values: [
        { name: 'duplicate', value: 0 },
        { name: 'unused', value: 3 },
        { name: 'declared', value: 6 },
        { name: 'undeclared', value: 1 },
        { name: 'nodes unique used', value: 1 },
        { name: 'edges unique used', value: 3 },
        { name: 'nodes edges unique intersection used', value: 0 },
        { name: 'nodes used', value: 4 },
        { name: 'edges used', value: 5 },
        { name: 'nodes min', value: 5 },
        { name: 'nodes min', value: 1 },
        { name: 'nodes max', value: 1 },
        { name: 'nodes median', value: 1 },
        { name: 'nodes frequency 1', value: 4 },
        { name: 'nodes frequency 2', value: 0 },
        { name: 'nodes frequency 3', value: 0 },
        { name: 'nodes frequency 4', value: 0 },
        { name: 'nodes frequency 5+', value: 0 },
        { name: 'edges min', value: 1 },
        { name: 'edges max', value: 2 },
        { name: 'edges median', value: 2 },
        { name: 'edges frequency 1', value: 1 },
        { name: 'edges frequency 2', value: 2 },
        { name: 'edges frequency 3', value: 0 },
        { name: 'edges frequency 4', value: 0 },
        { name: 'edges frequency 5+', value: 0 },
      ],
    };
    expect(actual).toEqual(expected);
  });
});

describe('count attribute metadata', () => {
  it('count attribute metadata', () => {
    const actual = countAttributeMetadata(fixtureAlpha);
    const expected = {
      name: 'attribute-metadata string count',
      values: [
        { name: 'name chars min', value: 0 },
        { name: 'name chars max', value: 16 },
        { name: 'name chars median', value: 7.5 },
        { name: 'name chars quartile first', value: 4.25 },
        { name: 'name chars quartile third', value: 10.75 },
        { name: 'name words min', value: 1 },
        { name: 'name words max', value: 3 },
        { name: 'name words median', value: 1.5 },
        { name: 'name charpage 1', value: 15 },
        { name: 'name charpage 2', value: 31 },
        { name: 'alternateName chars min', value: 0 },
        { name: 'alternateName chars max', value: 5 },
        { name: 'alternateName chars median', value: 0 },
        { name: 'alternateName chars quartile first', value: 0 },
        { name: 'alternateName chars quartile third', value: 1.5 },
        { name: 'alternateName words min', value: 1 },
        { name: 'alternateName words max', value: 1 },
        { name: 'alternateName words median', value: 1 },
        { name: 'alternateName charpage 1', value: 2 },
        { name: 'alternateName charpage 2', value: 3 },
        { name: 'alternateName charpage 243', value: 1 },
        { name: 'alternateName charpage 369', value: 1 },
      ],
    };
    expect(actual).toEqual(expected);
  });
});
