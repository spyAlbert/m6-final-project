const distribution = require('../../config.js');
const id = distribution.util.id;
const indexGroup = {};
const queryGroup = {};

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

  const pkgA = { name: "packageA", description: "single individual", pagerank: 10 };
  const pkgB = { name: "packageB", description: "document scenario single", pagerank:  5};
  const pkgC = { name: "packageC", description: "single document scenario document scenario distributed", pagerank: 1 };

  const dataset = [
    { "packageA": pkgA},
    { "packageB": pkgB },
    { "packageC": pkgC },
  ];

  const expected = [
    { packageA: ["packageA"] }, 
    { packageB: ["packageB"] }, 
    { packageC: ["packageC"] }, 
    { individu: ["packageA"]},
    { singl: ["packageA", "packageB", "packageC"] }, 
    { document: ["packageB", "packageC"] }, 
    { scenario: ["packageB", "packageC"] }, 
    { distribut: ["packageC"] }, 
    { "individu singl": ["packageA"] },
    { "document scenario": ["packageB", "packageC"] },
    { "scenario singl": ["packageB"] },
    { "document singl": ["packageC"] },
    { "distribut scenario": ["packageC"] },
    { "document scenario singl": ["packageB", "packageC"] },
    { "document document scenario": ["packageC"] },
    { "document scenario scenario": ["packageC"] },
    { "distribut document scenario": ["packageC"] },
  ];

  const doMapReduce = (cb) => {
    const mrIndexConfig = {
      map: indexer.map,
      reduce: indexer.reduce,
      keys: ["packageA", "packageB", "packageC"],
    };
    distribution.index.mr.exec(mrIndexConfig, (e, v) => {
      // for (const item of expected) {
      //   const key = Object.keys(item)[0];
      //   console.log("NGRAM:", key);
      //   console.log("EXPECTED:", item[key]);
      //   console.log("ACTUAL:", v.find(i => Object.keys(i)[0] === key));
      // }
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

  queryGroup[id.getSID(n1)] = n1;
  queryGroup[id.getSID(n2)] = n2;
  queryGroup[id.getSID(n3)] = n3;

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
      const queryConfig = { gid: "query" };
      distribution.local.groups.put(indexConfig, indexGroup, (e, v) => {
        distribution.index.groups.put(indexConfig, indexGroup, (e, v) => {
          distribution.local.groups.put(queryConfig, queryGroup, (e, v) => {
            distribution.query.groups.put(queryConfig, queryGroup, (e, v) => {
              done();
            });
          });
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
