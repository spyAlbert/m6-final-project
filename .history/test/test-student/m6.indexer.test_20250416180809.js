const { performance } = require('perf_hooks');
const distribution = require('../../config.js');
const id = distribution.util.id;
const indexGroup = {};

/*
    The local node will be the orchestrator.
*/
let localServer = null;

const { nodes } = require("../../distribution/engine/nodes");

jest.setTimeout(3600000);

test("M6: index test", (done) => {
  const indexer = require("../../distribution/engine/indexer.js");

  // Generate test data with repeatable n-grams
  const commonPhrases = [
    "distributed system processing",
    "data management framework",
    "scalable cloud computing",
    "real time analytics",
    "high performance database"
  ];

  const dataset = Array.from({length: 1000}, (_, i) => {
    // Use repeating phrases to ensure n-gram overlap
    const description = 
      commonPhrases[i % commonPhrases.length] + " " +
      commonPhrases[(i + 1) % commonPhrases.length] + " " +
      `version ${i}`;  // Add unique identifier

    const packageName = `package${i}`;
    return { 
      [packageName]: {
        package: packageName,
        description: description,
        pagerank: (i % 10) + 1  // Add pagerank for sorting
      }
    };
  });

  const MAX_LATENCY_PER_OP = 5;
  const MIN_THROUGHPUT = 200; 

  const doMapReduce = (cb) => {
    const startTime = performance.now();
    const keys = dataset.map(o => Object.keys(o)[0]);
    const mrIndexConfig = {
      map: indexer.map,
      reduce: indexer.reduce,
      keys: keys,
    };
    distribution.index.mr.exec(mrIndexConfig, (e, v) => {
      const endTime = performance.now();
      const totalLatency = endTime - startTime;
      const latencyPerOp = totalLatency / dataset.length;
      const throughput = (dataset.length * 1000) / totalLatency;
      
      console.log(`Performance Metrics:`);
      console.log(`- Total Latency: ${totalLatency.toFixed(2)}ms`);
      console.log(`- Latency per Operation: ${latencyPerOp.toFixed(2)}ms`);
      console.log(`- Throughput: ${throughput.toFixed(2)} operations/second`);
      
      try {
        // Verify performance metrics
        expect(latencyPerOp).toBeLessThan(MAX_LATENCY_PER_OP);
        expect(throughput).toBeGreaterThan(MIN_THROUGHPUT);
        done();
      } catch (e) {
        done(e);
      }
    });
  };

  let cntr = 0;
  // Send the dataset to the cluster
  dataset.forEach((o) => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.index.store.put(value, key, (e, v) => {
      cntr++;
      // Once the dataset is in place, run the map reduce
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

/*
    This is the setup for the test scenario.
    Do not modify the code below.
*/

beforeAll((done) => {
  nodes.forEach(node => {
    indexGroup[id.getSID(node)] = node;
  });

  const startNodes = (cb) => {
    const spawnNext = (index) => {
      if (index >= nodes.length) {
        cb();
        return;
      }
      distribution.local.status.spawn(nodes[index], (e, v) => {
        spawnNext(index + 1);
      });
    };
    spawnNext(0);
  };

  distribution.node.start((server) => {
    localServer = server;

    startNodes(() => {
      const indexConfig = { gid: "index" };
      distribution.local.groups.put(indexConfig, indexGroup, (e, v) => {
        distribution.index.groups.put(indexConfig, indexGroup, (e, v) => {
          done();
        });
      });
    });
  });
});

afterAll((done) => {
  const remote = {service: 'status', method: 'stop'};
  const stopNodes = (index) => {
    if (index >= nodes.length) {
      localServer.close();
      done();
      return;
    }
    remote.node = nodes[index];
    distribution.local.comm.send([], remote, (e, v) => {
      stopNodes(index + 1);
    });
  };
  stopNodes(0);
});
