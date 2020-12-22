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
};

const intersection = (a: Set<string>, b: Set<string>) =>
  new Set([...a].filter(x => b.has(x)));

const uniqAndSupportedTags = (tags: string[], suppported: Set<string>) => [
  ...intersection(new Set(tags), suppported),
];

const initCounter = (suppported: Set<string>): StatsNameValueMap => {
  const result: StatsNameValueMap = {};
  suppported.forEach(s => (result[s] = 0));
  return result;
};
const tagCounter = (tagCounter: StatsNameValueMap, tagSet: string[]) => {
  tagSet.map(t => (tagCounter[t] += 1));
  return tagCounter;
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
    uniqAndSupportedTags(a, supportedTags)
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
  return [metaStats, nodeStats];
};

const getStats = (): StatsData[] => {
  return [];
};

export { countByTags, getStats };
