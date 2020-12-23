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

const getStats = (): StatsData[] => {
  return [];
};

export {
  countByTags,
  countByUnitText,
  countEmptyMetadata,
  countRootGraph,
  getStats,
};
