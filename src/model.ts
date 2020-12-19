interface AttributeMetadata {
  id: string;
  description: string;
  alternateDescriptionList: string[];
  unitText: string;
  tagSet: String[];
}

interface Attribute {
  id: string;
  value: string;
  optionalValueList: string[];
  tagSet: String[];
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
