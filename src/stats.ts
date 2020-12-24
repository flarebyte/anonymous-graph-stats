import {
  Graph,
  StatsData,
  StatsContext,
  StatsNameValue,
  StatsNameValueMap,
  Taggable,
} from './model';

// count of nodes/edges/attributes
// count of letters, count of range of letters (name, number), count of words
// count by tags (name, number)
// count by unit (name, number)
// count by infer data type (str, int, float, fraction, url, uri)
// count of string when expecting number
// percentile low, high, median for number of letters for description, value and alt
// percentile low, high, median for array size for alternateDescriptionList, optionalValueList

const nameConst = {
  nodeTagsCount: 'node tags count',
  edgeTagsCount: 'edge tags count',
  attributeMetadataTagsCount: 'attribute-metadata tags count',
  attributeMetadataUnitsCount: 'attribute-metadata units count',
  attributeMetadataEmptyCount: 'attribute-metadata empty count',
  graphCount: 'graph count',
  attributeCount: 'attribute count',
};

const intersection = (a: Set<string>, b: Set<string>) =>
  new Set([...a].filter(x => b.has(x)));

const uniqAndSupported = (tags: string[], suppported: Set<string>) => [
  ...intersection(new Set(tags), suppported),
];

const initCounter = (suppported: Set<string>): StatsNameValueMap => {
  const result: StatsNameValueMap = {};
  suppported.forEach(s => (result[s] = 0));
  return result;
};
const tagCounter = (counter: StatsNameValueMap, tagSet: string[]) => {
  tagSet.map(t => (counter[t] += 1));
  return counter;
};

const categoryCounter = (counter: StatsNameValueMap, category: string) => {
  counter[category] += 1;
  return counter;
};

const toStatsNameValueList = (
  tagCounter: StatsNameValueMap
): StatsNameValue[] =>
  Object.entries(tagCounter)
    .filter(v => v[1] > 0)
    .map(v => ({ name: v[0], value: v[1] }));

const extractTagSet = (list: Taggable[]): string[][] => list.map(a => a.tagSet);

const countTagsInList = (
  name: string,
  supportedTags: Set<string>,
  list: Taggable[]
): StatsData => {
  const uniqList = extractTagSet(list).map(a =>
    uniqAndSupported(a, supportedTags)
  );
  const stats = uniqList.reduce(tagCounter, initCounter(supportedTags));
  return {
    name,
    values: toStatsNameValueList(stats),
  };
};

const countByTags = (ctx: StatsContext, graph: Graph): StatsData[] => {
  const supportedTags = new Set<string>(ctx.supportedTags);
  const metaStats = countTagsInList(
    nameConst.attributeMetadataTagsCount,
    supportedTags,
    graph.attributeMetadataList
  );
  const nodeStats = countTagsInList(
    nameConst.nodeTagsCount,
    supportedTags,
    graph.nodeList.flatMap(n => n.attributeList)
  );
  const edgeStats = countTagsInList(
    nameConst.edgeTagsCount,
    supportedTags,
    graph.edgeList.flatMap(n => n.attributeList)
  );
  return [metaStats, nodeStats, edgeStats];
};

const countByUnitText = (ctx: StatsContext, graph: Graph): StatsData => {
  const supportedUnitsSet = new Set(ctx.supportedUnits);
  const units: string[] = graph.attributeMetadataList
    .map(m => m.unitText.trim())
    .filter(u => supportedUnitsSet.has(u));
  const stats = units.reduce(categoryCounter, initCounter(new Set(units)));
  return {
    name: nameConst.attributeMetadataUnitsCount,
    values: toStatsNameValueList(stats),
  };
};

const countEmptyMetadata = (graph: Graph): StatsData => {
  return {
    name: nameConst.attributeMetadataEmptyCount,
    values: [
      {
        name: 'name',
        value: graph.attributeMetadataList
          .map(m => m.name)
          .filter(n => n.length === 0).length,
      },
      {
        name: 'alternateName',
        value: graph.attributeMetadataList
          .map(m => m.alternateName)
          .filter(n => n.length === 0).length,
      },
      {
        name: 'unitText',
        value: graph.attributeMetadataList
          .map(m => m.unitText)
          .filter(n => n.length === 0).length,
      },
      {
        name: 'tagSet',
        value: graph.attributeMetadataList
          .map(m => m.tagSet)
          .filter(n => n.length === 0).length,
      },
    ],
  };
};

const countRootGraph = (graph: Graph): StatsData => {
  return {
    name: nameConst.graphCount,
    values: [
      {
        name: 'attributeMetadataList',
        value: graph.attributeMetadataList.length,
      },
      {
        name: 'nodeList',
        value: graph.nodeList.length,
      },
      {
        name: 'edgeList',
        value: graph.edgeList.length,
      },
    ],
  };
};

const median = (counts: number[]): number => {
  const half = Math.floor(counts.length / 2);
  return counts.length % 2
    ? counts[half]
    : (counts[half - 1] + counts[half]) / 2.0;
};

const countAttrSerie = (name: string, counts: number[]): StatsNameValue[] => {
  return counts.length < 3
    ? []
    : [
        {
          name: `${name} min`,
          value: counts[0],
        },
        {
          name: `${name} max`,
          value: counts.slice(-1)[0],
        },
        {
          name: `${name} median`,
          value: median(counts),
        },
        {
          name: `${name} frequency 1`,
          value: counts.filter(c => c === 1).length,
        },
        {
          name: `${name} frequency 2`,
          value: counts.filter(c => c === 2).length,
        },
        {
          name: `${name} frequency 3`,
          value: counts.filter(c => c === 3).length,
        },
        {
          name: `${name} frequency 4`,
          value: counts.filter(c => c === 4).length,
        },
        {
          name: `${name} frequency 5+`,
          value: counts.filter(c => c >= 5).length,
        },
      ];
};

const countAttributes = (graph: Graph): StatsData => {
  const attributeIds = graph.attributeMetadataList.map(a => a.id);
  const attributeIdsSet = new Set(attributeIds);
  const countDuplicateAttributeIds = attributeIds.length - attributeIdsSet.size;
  const attrInNodes = graph.nodeList
    .flatMap(n => n.attributeList)
    .map(a => a.id);
  const attrInNodesSet = new Set(attrInNodes);
  const attrInEdges = graph.edgeList
    .flatMap(n => n.attributeList)
    .map(a => a.id);
  const attrInEdgeSet = new Set(attrInEdges);
  const attrAllSet = new Set([...attrInNodesSet, ...attrInEdgeSet]);
  const unusedAttrsCount = [...attributeIdsSet].filter(
    id => !attrAllSet.has(id)
  ).length;
  const undeclaredAttrsCount = [...attrAllSet].filter(
    id => !attributeIdsSet.has(id)
  ).length;
  const commonAttrsCount = [...attrInNodesSet].filter(id =>
    attrInEdgeSet.has(id)
  ).length;
  const asc = (a: number, b: number) => a - b;

  const attrCountByNode = graph.nodeList
    .map(n => n.attributeList.length)
    .sort(asc);
  const attrCountByEdge = graph.edgeList
    .map(n => n.attributeList.length)
    .sort(asc);

  return {
    name: nameConst.attributeCount,
    values: [
      {
        name: 'duplicate',
        value: countDuplicateAttributeIds,
      },
      {
        name: 'unused',
        value: unusedAttrsCount,
      },
      {
        name: 'declared',
        value: attributeIds.length,
      },
      {
        name: 'undeclared',
        value: undeclaredAttrsCount,
      },
      {
        name: 'nodes unique used',
        value: attrInNodesSet.size,
      },
      {
        name: 'edges unique used',
        value: attrInEdgeSet.size,
      },
      {
        name: 'nodes edges unique intersection used',
        value: commonAttrsCount,
      },
      {
        name: 'nodes used',
        value: attrInNodes.length,
      },
      {
        name: 'edges used',
        value: attrInEdges.length,
      },
      {
        name: 'nodes min',
        value: attrInEdges.length,
      },
    ]
      .concat(countAttrSerie('nodes', attrCountByNode))
      .concat(countAttrSerie('edges', attrCountByEdge)),
  };
};

const getStats = (): StatsData[] => {
  return [];
};

export {
  countByTags,
  countByUnitText,
  countEmptyMetadata,
  countRootGraph,
  countAttributes,
  getStats,
};
