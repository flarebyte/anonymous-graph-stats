# anonymous-graph-stats

> Anonymous statistics for graph objects in Typescript for node.js and browser

Graph stats produces metrics for a small graph object made of nodes, edges and attributes. These metrics are useful for understanding the size and the shape of the graph. The metrics should never contain any private content, but mostly counts of elements. However, these metrics are pretty detailed to reduce ambiguity and facilitate decisions making. A [csv example](test/fixture-graph-alpha-stats-expected.csv) and [json example](test/fixture-graph-alpha-stats-expected.json) based on the following [json input](test/fixture-graph-alpha.json).

## Usage

You will have to provide a context that expects a list of tags and units:
Only these predefined tags and units will be used for stats purpose. 

```
const defaultCtx = {
  supportedTags: ['alpha', 'beta', 'delta'],
  supportedUnits: ['km', 'GBP'],
};
```

Produce the stats:

```
const statsRows = getStats(defaultCtx, jsonGraph);
const csvRows = toCSV(statsRows, ',');
```

## License

MIT © [2020 Flarebyte - Olivier Huin]()
