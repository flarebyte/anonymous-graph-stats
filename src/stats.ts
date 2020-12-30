import { Graph, StatsContext, StatsItem, Taggable } from './model';

interface StatsNameValueMap {
  [name: string]: number;
}
const nameConst = {
  nodeTagsCount: 'node tags count',
  edgeTagsCount: 'edge tags count',
  attributeMetadataTagsCount: 'attribute-metadata tags count',
  attributeMetadataUnitsCount: 'attribute-metadata units count',
  attributeMetadataEmptyCount: 'attribute-metadata empty count',
  attributeMetadataStringCount: 'attribute-metadata string count',
  graphCount: 'graph count',
  attributeCount: 'attribute count',
};

const asc = (a: number, b: number) => a - b;

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

const toStatsItemList = (
  name: string,
  action: string,
  tagCounter: StatsNameValueMap
): StatsItem[] =>
  Object.entries(tagCounter)
    .filter(v => v[1] > 0)
    .map(v => ({ name, action, text: v[0], value: v[1] }));

const extractTagSet = (list: Taggable[]): string[][] => list.map(a => a.tagSet);

const countTagsInList = (
  name: string,
  supportedTags: Set<string>,
  list: Taggable[]
): StatsItem[] => {
  const uniqList = extractTagSet(list).map(a =>
    uniqAndSupported(a, supportedTags)
  );
  const stats = uniqList.reduce(tagCounter, initCounter(supportedTags));
  return toStatsItemList(name, 'count', stats);
};

const countByTags = (ctx: StatsContext, graph: Graph): StatsItem[] => {
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
  return metaStats.concat(nodeStats).concat(edgeStats);
};

const countByUnitText = (ctx: StatsContext, graph: Graph): StatsItem[] => {
  const supportedUnitsSet = new Set(ctx.supportedUnits);
  const units: string[] = graph.attributeMetadataList
    .map(m => m.unitText.trim())
    .filter(u => supportedUnitsSet.has(u));
  const stats = units.reduce(categoryCounter, initCounter(new Set(units)));
  return toStatsItemList(nameConst.attributeMetadataUnitsCount, 'count', stats);
};

const isEmptyLength = (value: string): boolean => value.length === 0;
const isEmptyListLength = (values: any[]): boolean => values.length === 0;

const countEmptyMetadata = (graph: Graph): StatsItem[] => {
  const name = nameConst.attributeMetadataEmptyCount;
  const action = 'count';
  return [
    {
      name,
      action,
      text: 'name',
      value: graph.attributeMetadataList.map(m => m.name).filter(isEmptyLength)
        .length,
    },
    {
      name,
      action,
      text: 'alternateName',
      value: graph.attributeMetadataList
        .map(m => m.alternateName)
        .filter(isEmptyLength).length,
    },
    {
      name,
      action,
      text: 'unitText',
      value: graph.attributeMetadataList
        .map(m => m.unitText)
        .filter(isEmptyLength).length,
    },
    {
      name,
      action,
      text: 'tagSet',
      value: graph.attributeMetadataList
        .map(m => m.tagSet)
        .filter(isEmptyListLength).length,
    },
  ];
};

const countRootGraph = (graph: Graph): StatsItem[] => {
  const name = nameConst.graphCount;
  const action = 'count';
  return [
    {
      name,
      action,
      text: 'attributeMetadataList',
      value: graph.attributeMetadataList.length,
    },
    {
      name,
      action,
      text: 'nodeList',
      value: graph.nodeList.length,
    },
    {
      name,
      action,
      text: 'edgeList',
      value: graph.edgeList.length,
    },
  ];
};

const median = (counts: number[]): number => {
  const half = Math.floor(counts.length / 2);
  return counts.length % 2
    ? counts[half]
    : (counts[half - 1] + counts[half]) / 2.0;
};

const quantile = (counts: number[], q: number) => {
  const pos = (counts.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return counts[base + 1] !== undefined
    ? counts[base] + rest * (counts[base + 1] - counts[base])
    : counts[base];
};

const countAttrSerie = (name: string, counts: number[]): StatsItem[] => {
  const action = 'count';
  return counts.length < 3
    ? []
    : [
        {
          name,
          action,
          text: `${name} min`,
          value: counts[0],
        },
        {
          name,
          action,
          text: `${name} max`,
          value: counts.slice(-1)[0],
        },
        {
          name,
          action,
          text: `${name} median`,
          value: median(counts),
        },
        {
          name,
          action,
          text: `${name} frequency 1`,
          value: counts.filter(c => c === 1).length,
        },
        {
          name,
          action,
          text: `${name} frequency 2`,
          value: counts.filter(c => c === 2).length,
        },
        {
          name,
          action,
          text: `${name} frequency 3`,
          value: counts.filter(c => c === 3).length,
        },
        {
          name,
          action,
          text: `${name} frequency 4`,
          value: counts.filter(c => c === 4).length,
        },
        {
          name,
          action,
          text: `${name} frequency 5+`,
          value: counts.filter(c => c >= 5).length,
        },
      ];
};

const charToPage = (onechar: string): string => {
  const cp = onechar.codePointAt(0);
  return cp == null ? 'na' : Math.ceil(cp / 100).toString();
};

const stringToPages = (value: string): string[] => {
  const results: string[] = [];
  for (let codePoint of value) {
    results.push(charToPage(codePoint));
  }
  return results;
};
const countStringSerie = (name: string, values: string[]): StatsItem[] => {
  const charsCount = values.map(s => s.length).sort(asc);
  const wordsCount = values.map(s => s.split(' ').length).sort(asc);
  const charsByPage = values.flatMap(s => stringToPages(s));
  const pageStats = charsByPage.reduce(
    categoryCounter,
    initCounter(new Set(charsByPage))
  );
  const action = 'count';
  return values.length < 3
    ? []
    : [
        {
          name,
          action,
          text: `${name} chars min`,
          value: charsCount[0],
        },
        {
          name,
          action,
          text: `${name} chars max`,
          value: charsCount.slice(-1)[0],
        },
        {
          name,
          action,
          text: `${name} chars median`,
          value: median(charsCount),
        },
        {
          name,
          action,
          text: `${name} chars quartile first`,
          value: quantile(charsCount, 0.25),
        },
        {
          name,
          action,
          text: `${name} chars quartile third`,
          value: quantile(charsCount, 0.75),
        },
        {
          name,
          action,
          text: `${name} words min`,
          value: wordsCount[0],
        },
        {
          name,
          action,
          text: `${name} words max`,
          value: wordsCount.slice(-1)[0],
        },
        {
          name,
          action,
          text: `${name} words median`,
          value: median(wordsCount),
        },
      ].concat(toStatsItemList(`${name} charpage `, 'count', pageStats));
};

const countAttributes = (graph: Graph): StatsItem[] => {
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

  const attrCountByNode = graph.nodeList
    .map(n => n.attributeList.length)
    .sort(asc);
  const attrCountByEdge = graph.edgeList
    .map(n => n.attributeList.length)
    .sort(asc);

  const name = nameConst.attributeCount;
  const action = 'count';
  return [
    {
      name,
      action,
      text: 'duplicate',
      value: countDuplicateAttributeIds,
    },
    {
      name,
      action,
      text: 'unused',
      value: unusedAttrsCount,
    },
    {
      name,
      action,
      text: 'declared',
      value: attributeIds.length,
    },
    {
      name,
      action,
      text: 'undeclared',
      value: undeclaredAttrsCount,
    },
    {
      name,
      action,
      text: 'nodes unique used',
      value: attrInNodesSet.size,
    },
    {
      name,
      action,
      text: 'edges unique used',
      value: attrInEdgeSet.size,
    },
    {
      name,
      action,
      text: 'nodes edges unique intersection used',
      value: commonAttrsCount,
    },
    {
      name,
      action,
      text: 'nodes used',
      value: attrInNodes.length,
    },
    {
      name,
      action,
      text: 'edges used',
      value: attrInEdges.length,
    },
    {
      name,
      action,
      text: 'nodes min',
      value: attrInEdges.length,
    },
  ]
    .concat(countAttrSerie('nodes', attrCountByNode))
    .concat(countAttrSerie('edges', attrCountByEdge))
    .concat(
      countStringSerie(
        'nodes value',
        graph.nodeList.flatMap(n => n.attributeList).map(a => a.value)
      )
    )
    .concat(
      countStringSerie(
        'edges value',
        graph.edgeList.flatMap(n => n.attributeList).map(a => a.value)
      )
    )
    .concat(
      countStringSerie(
        'nodes optionalValueList',
        graph.nodeList
          .flatMap(n => n.attributeList)
          .flatMap(a => a.optionalValueList)
      )
    )
    .concat(
      countStringSerie(
        'edges optionalValueList',
        graph.edgeList
          .flatMap(n => n.attributeList)
          .flatMap(a => a.optionalValueList)
      )
    );
};

const countAttributeMetadata = (graph: Graph): StatsItem[] => {
  return countStringSerie(
    'name',
    graph.attributeMetadataList.map(a => a.name)
  ).concat(
    countStringSerie(
      'alternateName',
      graph.attributeMetadataList.map(a => a.alternateName)
    )
  );
};

const getStats = (): StatsItem[] => {
  return [];
};

export {
  countByTags,
  countByUnitText,
  countEmptyMetadata,
  countRootGraph,
  countAttributes,
  countAttributeMetadata,
  getStats,
};
