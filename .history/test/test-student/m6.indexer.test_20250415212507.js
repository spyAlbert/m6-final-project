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

  // Generate 1000 unique simple data points
  const dataset = Array.from({length: 1000}, (_, i) => {
    return { 
      [`package${i}`]: {
        package: `package${i}`,
        description: `desc${i}`,
        pagerank: i % 10 + 1
      }
    };
  });

  // Performance thresholds (in ms)
  const MAX_LATENCY = 5000;
  const MIN_THROUGHPUT = 200000; // ops/sec

  const doMapReduce = (cb) => {
    const startTime = performance.now();
    const mrIndexConfig = {
      map: indexer.map,
      reduce: indexer.reduce,
      keys: ["packageA", "packageB", "packageC"],
    };
    distribution.index.mr.exec(mrIndexConfig, (e, v) => {
      const endTime = performance.now();
      const latency = endTime - startTime;
      const throughput = (dataset.length * 1000) / latency;
      
      console.log(`Performance Metrics:`);
      console.log(`- Latency: ${latency}ms`);
      console.log(`- Throughput: ${throughput.toFixed(2)} operations/second`);
      
      try {
        // Verify performance metrics
        expect(latency).toBeLessThan(MAX_LATENCY);
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
