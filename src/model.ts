interface AttributeMetadata {
  id: string;
  name: string;
  alternateName: string;
  unitText: string;
  tagSet: string[];
}

interface Attribute {
  id: string;
  value: string;
  optionalValueList: string[];
  tagSet: string[];
}

interface Node {
  id: string;
  attributeList: Attribute[];
}

interface Edge {
  fromNode: string;
  toNode: string;
  attributeList: Attribute[];
}

interface Graph {
  attributeMetadataList: AttributeMetadata[];
  nodeList: Node[];
  edgeList: Edge[];
}

interface StatsNameValue {
  name: string;
  value: number;
}

interface StatsNameValueMap {
  [name: string]: number;
}

interface StatsData {
  name: string;
  values: StatsNameValue[];
}

interface StatsContext {
  supportedTags: string[];
}

export {
  AttributeMetadata,
  Attribute,
  Node,
  Edge,
  Graph,
  StatsData,
  StatsContext,
  StatsNameValue,
  StatsNameValueMap,
};
