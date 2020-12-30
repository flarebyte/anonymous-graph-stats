import { Graph, StatsContext, StatsItem, Taggable } from './model';

interface StatsNameValueMap {
  [name: string]: number;
}

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
    'attributeMetadataList',
    supportedTags,
    graph.attributeMetadataList
  );
  const nodeStats = countTagsInList(
    'nodeList',
    supportedTags,
    graph.nodeList.flatMap(n => n.attributeList)
  );
  const edgeStats = countTagsInList(
    'edgeList',
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
  return toStatsItemList('attributeMetadataList unitText', 'count', stats);
};

const isEmptyLength = (value: string): boolean => value.length === 0;
const isEmptyListLength = (values: any[]): boolean => values.length === 0;

const countEmptyMetadata = (graph: Graph): StatsItem[] => {
  const name = 'attributeMetadataList';
  const action = 'empty count';
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
  const name = 'graph';
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
  return counts.length < 3
    ? []
    : [
        {
          name,
          action: 'count min',
          text: '',
          value: counts[0],
        },
        {
          name,
          action: 'count max',
          text: '',
          value: counts.slice(-1)[0],
        },
        {
          name,
          action: 'count median',
          text: '',
          value: median(counts),
        },
        {
          name,
          action: 'count',
          text: `frequency 1`,
          value: counts.filter(c => c === 1).length,
        },
        {
          name,
          action: 'count',
          text: `frequency 2`,
          value: counts.filter(c => c === 2).length,
        },
        {
          name,
          action: 'count',
          text: `frequency 3`,
          value: counts.filter(c => c === 3).length,
        },
        {
          name,
          action: 'count',
          text: `frequency 4`,
          value: counts.filter(c => c === 4).length,
        },
        {
          name,
          action: 'count',
          text: `frequency 5+`,
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
  return values.length < 3
    ? []
    : [
        {
          name,
          action: 'count min',
          text: 'chars',
          value: charsCount[0],
        },
        {
          name,
          action: 'count max',
          text: 'chars',
          value: charsCount.slice(-1)[0],
        },
        {
          name,
          action: 'count median',
          text: 'chars',
          value: median(charsCount),
        },
        {
          name,
          action: 'count quartile first',
          text: 'chars',
          value: quantile(charsCount, 0.25),
        },
        {
          name,
          action: 'count quartile third',
          text: 'chars',
          value: quantile(charsCount, 0.75),
        },
        {
          name,
          action: 'count min',
          text: 'words',
          value: wordsCount[0],
        },
        {
          name,
          action: 'count max',
          text: 'words',
          value: wordsCount.slice(-1)[0],
        },
        {
          name,
          action: 'count median',
          text: 'words',
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

  return [
    {
      name: 'attributeMetadataList',
      action: 'count',
      text: 'duplicate',
      value: countDuplicateAttributeIds,
    },
    {
      name: 'attributeMetadataList',
      action: 'count',
      text: 'unused',
      value: unusedAttrsCount,
    },
    {
      name: 'attributeMetadataList',
      action: 'count',
      text: 'declared',
      value: attributeIds.length,
    },
    {
      name: 'attributeMetadataList',
      action: 'count',
      text: 'undeclared',
      value: undeclaredAttrsCount,
    },
    {
      name: 'nodeList',
      action: 'unique count',
      text: 'used',
      value: attrInNodesSet.size,
    },
    {
      name: 'edgeList',
      action: 'unique count',
      text: 'used',
      value: attrInEdgeSet.size,
    },
    {
      name: 'nodeList edgeList',
      action: 'unique intersection',
      text: 'used',
      value: commonAttrsCount,
    },
    {
      name: 'nodeList',
      action: 'count',
      text: 'used',
      value: attrInNodes.length,
    },
    {
      name: 'edgeList',
      action: 'count',
      text: 'used',
      value: attrInEdges.length,
    },
    {
      name: 'nodeList',
      action: 'count min',
      text: '',
      value: attrInNodes.length,
    },
  ]
    .concat(countAttrSerie('nodeList', attrCountByNode))
    .concat(countAttrSerie('edgeList', attrCountByEdge))
    .concat(
      countStringSerie(
        'nodeList value',
        graph.nodeList.flatMap(n => n.attributeList).map(a => a.value)
      )
    )
    .concat(
      countStringSerie(
        'edgeList value',
        graph.edgeList.flatMap(n => n.attributeList).map(a => a.value)
      )
    )
    .concat(
      countStringSerie(
        'nodeList optionalValueList',
        graph.nodeList
          .flatMap(n => n.attributeList)
          .flatMap(a => a.optionalValueList)
      )
    )
    .concat(
      countStringSerie(
        'edgeList optionalValueList',
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

const getStats = (ctx: StatsContext, graph: Graph): StatsItem[] => {
  return countRootGraph(graph).concat(
    countByTags(ctx, graph),
    countByUnitText(ctx, graph),
    countEmptyMetadata(graph),
    countAttributes(graph),
    countAttributeMetadata(graph)
  );
};

export { getStats };
