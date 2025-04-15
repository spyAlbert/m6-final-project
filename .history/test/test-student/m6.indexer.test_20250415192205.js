const distribution = require('../../config.js');
const id = distribution.util.id;
const indexGroup = {};

/*
    The local node will be the orchestrator.
*/
let localServer = null;

const n1 = {ip: '127.0.0.1', port: 7110};
const n2 = {ip: '127.0.0.1', port: 7111};
const n3 = {ip: '127.0.0.1', port: 7112};

jest.setTimeout(3600000);

test("M6: index test", (done) => {
  const indexer = require("../../distribution/engine/indexer.js");

  const pkgA = { package: "packageA", description: "single individual", pagerank: 10 };
  const pkgB = { package: "packageB", description: "document scenario single", pagerank:  5};
  const pkgC = { package: "packageC", description: "single document scenario document scenario distributed", pagerank: 1 };

  const dataset = [
    { "packageA": pkgA},
    { "packageB": pkgB },
    { "packageC": pkgC },
  ];

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
  indexGroup[id.getSID(n1)] = n1;
  indexGroup[id.getSID(n2)] = n2;
  indexGroup[id.getSID(n3)] = n3;

  const startNodes = (cb) => {
    distribution.local.status.spawn(n1, (e, v) => {
      distribution.local.status.spawn(n2, (e, v) => {
        distribution.local.status.spawn(n3, (e, v) => {
          cb();
        });
      });
    });
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
  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    remote.node = n2;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n3;
      distribution.local.comm.send([], remote, (e, v) => {
        localServer.close();
        done();
      });
    });
  });
});
