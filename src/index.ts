interface Taggable {
  tagSet: string[];
}

interface AttributeMetadata extends Taggable {
  id: string;
  name: string;
  alternateName: string;
  unitText: string;
  tagSet: string[];
}

interface Attribute extends Taggable {
  id: string;
  value: string;
  optionalValueList: string[];
  tagSet: string[];
}

interface WithAttributeList {
  attributeList: Attribute[];
}

interface Node extends WithAttributeList {
  id: string;
  attributeList: Attribute[];
}

interface Edge extends WithAttributeList {
  fromNode: string;
  toNode: string;
  attributeList: Attribute[];
}

interface Graph {
  attributeMetadataList: AttributeMetadata[];
  nodeList: Node[];
  edgeList: Edge[];
}

interface StatsItem {
  name: string;
  text: string;
  action: string;
  value: number;
}

interface StatsContext {
  supportedTags: string[];
  supportedUnits: string[];
}

interface StatsNameValueMap {
  [name: string]: number;
}

interface StatsItemDiff {
  added: StatsItem[];
  removed: StatsItem[];
  modified: StatsItem[];
  identical: StatsItem[];
  changes: number;
}

const asc = (a: number, b: number) => a - b;

const parseAsGraph = (content: string): Graph => JSON.parse(content);

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
    'attributeMetadataList tagSet',
    supportedTags,
    graph.attributeMetadataList
  );
  const nodeStats = countTagsInList(
    'nodeList tagSet',
    supportedTags,
    graph.nodeList.flatMap(n => n.attributeList)
  );
  const edgeStats = countTagsInList(
    'edgeList tagSet',
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
  const action = 'empty count';
  const text = '';
  return [
    {
      name: 'attributeMetadataList name',
      action,
      text,
      value: graph.attributeMetadataList.map(m => m.name).filter(isEmptyLength)
        .length,
    },
    {
      name: 'attributeMetadataList alternateName',
      action,
      text,
      value: graph.attributeMetadataList
        .map(m => m.alternateName)
        .filter(isEmptyLength).length,
    },
    {
      name: 'attributeMetadataList unitText',
      action,
      text,
      value: graph.attributeMetadataList
        .map(m => m.unitText)
        .filter(isEmptyLength).length,
    },
    {
      name: 'attributeMetadataList tagSet',
      action,
      text,
      value: graph.attributeMetadataList
        .map(m => m.tagSet)
        .filter(isEmptyListLength).length,
    },
  ];
};

const countRootGraph = (graph: Graph): StatsItem[] => {
  const text = '';
  const action = 'count';
  return [
    {
      name: 'attributeMetadataList',
      action,
      text,
      value: graph.attributeMetadataList.length,
    },
    {
      name: 'nodeList',
      action,
      text,
      value: graph.nodeList.length,
    },
    {
      name: 'edgeList',
      action,
      text,
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
      ].concat(toStatsItemList(`${name} charpage`, 'count', pageStats));
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
      name: 'nodeList attributeList',
      action: 'unique count',
      text: 'used',
      value: attrInNodesSet.size,
    },
    {
      name: 'edgeList attributeList',
      action: 'unique count',
      text: 'used',
      value: attrInEdgeSet.size,
    },
    {
      name: 'nodeList+edgeList attributeList',
      action: 'unique intersection',
      text: 'used',
      value: commonAttrsCount,
    },
    {
      name: 'nodeList attributeList',
      action: 'count',
      text: 'used',
      value: attrInNodes.length,
    },
    {
      name: 'edgeList attributeList',
      action: 'count',
      text: 'used',
      value: attrInEdges.length,
    },
  ]
    .concat(countAttrSerie('nodeList attributeList', attrCountByNode))
    .concat(countAttrSerie('edgeList attributeList', attrCountByEdge))
    .concat(
      countStringSerie(
        'nodeList attributeList value',
        graph.nodeList.flatMap(n => n.attributeList).map(a => a.value)
      )
    )
    .concat(
      countStringSerie(
        'edgeList attributeList value',
        graph.edgeList.flatMap(n => n.attributeList).map(a => a.value)
      )
    )
    .concat(
      countStringSerie(
        'nodeList attributeList optionalValueList',
        graph.nodeList
          .flatMap(n => n.attributeList)
          .flatMap(a => a.optionalValueList)
      )
    )
    .concat(
      countStringSerie(
        'edgeList attributeList optionalValueList',
        graph.edgeList
          .flatMap(n => n.attributeList)
          .flatMap(a => a.optionalValueList)
      )
    );
};

const countAttributeMetadata = (graph: Graph): StatsItem[] => {
  return countStringSerie(
    'attributeMetadataList name',
    graph.attributeMetadataList.map(a => a.name)
  ).concat(
    countStringSerie(
      'attributeMetadataList alternateName',
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

const toCSV = (items: StatsItem[], delimiter: string): string[] => {
  return items
    .map(
      i =>
        `${i.name}${delimiter}${i.action}${delimiter}${i.text}${delimiter}${i.value}`
    )
    .sort();
};

const checkFormatStatsItem = (delimiter: string) => (line: string): boolean =>
  line.split(delimiter).length === 4;

const parseStatsItem = (delimiter: string) => (line: string): StatsItem => {
  const [name, action, text, value] = line.split(delimiter);
  return { name, action, text, value: Number(value) };
};

const fromCSV = (lines: string[], delimiter: string): StatsItem[] => {
  return lines
    .filter(checkFormatStatsItem(delimiter))
    .map(parseStatsItem(delimiter));
};

const validNames = new Set([
  'attributeMetadataList alternateName charpage',
  'attributeMetadataList alternateName',
  'attributeMetadataList name charpage',
  'attributeMetadataList name',
  'attributeMetadataList tagSet',
  'attributeMetadataList unitText',
  'attributeMetadataList',
  'edgeList attributeList optionalValueList charpage',
  'edgeList attributeList optionalValueList',
  'edgeList attributeList value charpage',
  'edgeList attributeList value',
  'edgeList attributeList',
  'edgeList tagSet',
  'edgeList',
  'nodeList attributeList optionalValueList charpage',
  'nodeList attributeList optionalValueList',
  'nodeList attributeList value charpage',
  'nodeList attributeList value',
  'nodeList attributeList',
  'nodeList tagSet',
  'nodeList',
  'nodeList+edgeList attributeList',
]);

const validActions = new Set([
  'count',
  'count max',
  'count median',
  'count min',
  'count quartile first',
  'count quartile third',
  'empty count',
  'unique count',
  'unique intersection',
]);

const validCustomText = new RegExp('^[A-Za-z0-9 +]{2,30}$').compile();

const makeSimpleId = (item: StatsItem) =>
  `${item.name}---${item.action}---${item.text}`;

const findDuplicateStrings = (arr: string[]): string[] => {
  const sorted_arr = arr.slice().sort();
  let results = [];
  for (let i = 0; i < sorted_arr.length - 1; i++) {
    if (sorted_arr[i + 1] === sorted_arr[i]) {
      results.push(sorted_arr[i]);
    }
  }
  return results;
};
const validate = (ctx: StatsContext, items: StatsItem[]): string => {
  if (items.length < 30) {
    return `Too few stats items recorded: ${items.length}`;
  }
  if (items.length > 1000) {
    return `Too many stats items recorded: ${items.length}`;
  }
  const validText = new Set(ctx.supportedTags.concat(ctx.supportedUnits));
  const validateStatsItem = (value: StatsItem): boolean =>
    !(
      validNames.has(value.name) &&
      validActions.has(value.action) &&
      !isNaN(Number(value.value)) &&
      (validText.has(value.text) || validCustomText.test(value.text))
    );

  const invalidItems = items.filter(validateStatsItem);
  const invalidItemCount = invalidItems.length;
  if (invalidItemCount > 0) {
    const invalidInfo = invalidItems.map(makeSimpleId).join(';');
    return `Found ${invalidItemCount} invalid items --> ${invalidInfo}`;
  }

  const statsKeys = items.map(makeSimpleId);
  const uniqSize = new Set(statsKeys).size;

  if (uniqSize !== items.length) {
    const duplicates = findDuplicateStrings(statsKeys);
    return `Found ${items.length -
      uniqSize} unexpected duplicates --> ${duplicates}`;
  }

  return '';
};

const itemToMap = (keyNumber: StatsNameValueMap, item: StatsItem) => {
  keyNumber[makeSimpleId(item)] = item.value;
  return keyNumber;
};
const fromStatsItemListToMap = (items: StatsItem[]): StatsNameValueMap =>
  items.reduce(itemToMap, {});

const compareStats = (ref: StatsItem[], other: StatsItem[]): StatsItemDiff => {
  const refMap = fromStatsItemListToMap(ref);
  const otherMap = fromStatsItemListToMap(other);

  const added = other.filter(item => !(makeSimpleId(item) in refMap));
  const removed = ref.filter(item => !(makeSimpleId(item) in otherMap));
  const possiblyModified = other.filter(item => makeSimpleId(item) in refMap);
  const identical = possiblyModified.filter(
    item => refMap[makeSimpleId(item)] === item.value
  );
  const modified = possiblyModified.filter(
    item => refMap[makeSimpleId(item)] !== item.value
  );
  const changes = added.length + removed.length + modified.length;

  return {
    added,
    removed,
    modified,
    identical,
    changes,
  };
};

export { getStats, toCSV, fromCSV, validate, compareStats, parseAsGraph };
