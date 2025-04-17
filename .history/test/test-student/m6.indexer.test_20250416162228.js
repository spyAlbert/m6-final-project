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

  // Generate 1000 unique data points with varied descriptions
  const dataset = Array.from({length: 1000}, (_, i) => {
    const randomText = [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      "Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae;",
      "Nullam euismod, nisl eget aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nisl nunc eu nisl.",
      "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.",
      "Cras mattis consectetur purus sit amet fermentum.",
      "Donec sed odio dui. Donec ullamcorper nulla non metus auctor fringilla.",
      "Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum.",
      "Etiam porta sem malesuada magna mollis euismod.",
      "Maecenas sed diam eget risus varius blandit sit amet non magna.",
      "Nullam quis risus eget urna mollis ornare vel eu leo."
    ];
    
    const randomWords = [
      "foo", "bar", "baz", "qux", "quux", "corge", "grault", "garply", 
      "waldo", "fred", "plugh", "xyzzy", "thud", "wibble", "wobble", "wubble"
    ];
    
    const description = 
      randomText[i % randomText.length] + " " +
      Array.from({length: 5}, () => randomWords[Math.floor(Math.random() * randomWords.length)]).join(" ") + " " +
      `Additional info ${i}`;

    return { 
      [`package${i}`]: {
        package: `package${i}`,
        description: description,
        pagerank: i % 10 + 1
      }
    };
  });

  // Performance thresholds (in ms)
  const MAX_LATENCY = 5000;
  const MIN_THROUGHPUT = 200; // ops/sec

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
      console.log(`- NumResult: ${dataset.length}`);
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
