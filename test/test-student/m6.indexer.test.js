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

test("M6: basic index test", (done) => {
  const indexer = require("../../distribution/engine/indexer.js");

  const dataset = [
    { "packageA": { description: "single" }},
    { "packageB": { description: "document scenario" } },
    { "packageC": { description: "document scenario document scenario distributed" } },
  ];

  const expected = [
    { packageA: [{package: "packageA", count: 1}] }, 
    { packageB: [{package: "packageB", count: 1}] }, 
    { packageC: [{package: "packageC", count: 1}] }, 
    { singl: [{package: "packageA", count: 1}] }, 
    { document: [{package: "packageC", count: 2}, {package: "packageB", count: 1}] }, 
    { scenario: [{package: "packageC", count: 2}, {package: "packageB", count: 1}] }, 
    { distribut: [{package: "packageC", count: 1}] }, 
    { "document scenario": [{package: "packageC", count: 3}, {package: "packageB", count: 1}] },
    { "distribut scenario": [{package: "packageC", count: 1}] },
    { "document document scenario": [{package: "packageC", count: 1}] },
    { "document scenario scenario": [{package: "packageC", count: 1}] },
    { "distribut document scenario": [{package: "packageC", count: 1}] },
  ];

  const doMapReduce = (cb) => {
    indexer.performIndexing((e, v) => {
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
      distribution.local.groups.put(indexConfig, indexGroup, (e, v) => {
        distribution.index.groups.put(indexConfig, indexGroup, (e, v) => {
          const queryConfig = { gid: "query" };
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
