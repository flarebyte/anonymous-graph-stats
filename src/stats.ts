import { Graph, StatsData, StatsContext, StatsNameValueMap } from './model';

// count of nodes/edges/attributes
// count of letters, count of range of letters (name, number), count of words
// count by tags (name, number)
// count by unit (name, number)
// count by infer data type (str, int, float, fraction, url, uri)
// count of string when expecting number
// percentile low, high, median for number of letters for description, value and alt
// percentile low, high, median for array size for alternateDescriptionList, optionalValueList

const nameConst = {
  nodesCount: 'nodes count',
  edgesCount: 'edges count',
  attributeMetadataCount: 'attribute-metas count',
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
const countByTags = (ctx: StatsContext, graph: Graph): StatsData[] => {
  const supportedTags = new Set<string>(ctx.supportedTags);
  const metaTagSet = graph.attributeMetadataList.map(a =>
    uniqAndSupportedTags(a.tagSet, supportedTags)
  );
  const statsMeta = metaTagSet.reduce(tagCounter, initCounter(supportedTags));
  const statsMetaData: StatsData = {
    name: nameConst.attributeMetadataCount,
    values: Object.entries(statsMeta)
      .filter(v => v[1] > 0)
      .map(v => ({ name: v[0], value: v[1] })),
  };

  return [statsMetaData];
};

const getStats = (): StatsData[] => {
  return [];
};

export { countByTags, getStats };
