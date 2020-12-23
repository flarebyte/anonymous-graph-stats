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
  supportedUnits: string[];
}

export {
  Taggable,
  WithAttributeList,
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
