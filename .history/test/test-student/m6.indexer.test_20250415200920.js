const distribution = require('../../config.js');
const id = distribution.util.id;
const indexGroup = {};

/*
    The local node will be the orchestrator.
*/
let localServer = null;

const generateNodes = (count) =>
  Array.from({ length: count }, (_, i) => ({
    ip: '127.0.0.1',
    port: 7110 + i
  }));

const nodes = generateNodes(5);

jest.setTimeout(3600000);

test("M6: index test", (done) => {
  const indexer = require("../../distribution/engine/indexer.js");

  const pkgA = { package: "packageA", description: "single individual", pagerank: 10 };
  const pkgB = { package: "packageB", description: "document scenario single", pagerank:  5};
  const pkgC = { package: "packageC", description: "single document scenario document scenario distributed", pagerank: 1 };

  const baseDataset = [
    { "packageA": pkgA},
    { "packageB": pkgB },
    { "packageC": pkgC },
  ];
  const dataset = Array(100).fill(baseDataset).flat();

  const expected = [
    { packageA: [pkgA] }, 
    { packageB: [pkgB] }, 
    { packageC: [pkgC] }, 
    { individu: [pkgA]},
    { singl: [pkgA, pkgB, pkgC] }, 
    { document: [pkgB, pkgC] }, 
    { scenario: [pkgB, pkgC] }, 
    { distribut: [pkgC] }, 
    { "individu singl": [pkgA] },
    { "document scenario": [pkgB, pkgC] },
    { "scenario singl": [pkgB] },
    { "document singl": [pkgC] },
    { "distribut scenario": [pkgC] },
    { "document scenario singl": [pkgB, pkgC] },
    { "document document scenario": [pkgC] },
    { "document scenario scenario": [pkgC] },
    { "distribut document scenario": [pkgC] },
  ];

  const doMapReduce = (cb) => {
    const startTime = Date.now();
    const mrIndexConfig = {
      map: indexer.map,
      reduce: indexer.reduce,
      keys: ["packageA", "packageB", "packageC"],
    };
    distribution.index.mr.exec(mrIndexConfig, (e, v) => {
      const endTime = Date.now();
      const latency = endTime - startTime;
      const throughput = (dataset.length * 1000) / latency;
      
      console.log(`Performance Metrics:`);
      console.log(`- Latency: ${latency}ms`);
      console.log(`- Throughput: ${throughput.toFixed(2)} operations/second`);
      
      try {
        expect(v).toEqual(expect.arrayContaining(expected));
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
