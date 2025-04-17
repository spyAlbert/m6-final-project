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

test("M6: test that a simple pagerank graph converges", (done) => {
  const pageranker = require("../../distribution/engine/pageranker.js");

  const dataset = [
    { "A": { pagerank: 2, dependencies: ["B"] } },
    { "B": { pagerank: 0, dependencies: ["A"] } },
  ];

  const expected = [
    { A: 1 }, 
    { B: 1 }, 
  ];

  const doMapReduce = (cb) => {
    const mrPagerankConfig = {
      map: pageranker.map,
      reduce: pageranker.reduce,
      keys: ["A", "B"],
      rounds: 100,
    };
    distribution.index.mr.exec(mrPagerankConfig, (e, v) => {

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

test("M6: slightly more complicated pagerank graph", (done) => {
  const pageranker = require("../../distribution/engine/pageranker.js");

  const dataset = [
    { "1": { pagerank: 1, dependencies: ["2", "3", "4"] }},
    { "2": { pagerank: 1, dependencies: ["3", "4"] } },
    { "3": { pagerank: 1, dependencies: ["1"] }},
    { "4": { pagerank: 1, dependencies: ["1", "3"] }},
  ];

  const expected = [
    { "1": 1.47 },
    { "2": 0.57 },
    { "3": 1.15 },
    { "4": 0.81 },
  ];

  const doMapReduce = (cb) => {
    const mrPagerankConfig = {
      map: pageranker.map,
      reduce: pageranker.reduce,
      keys: ["1", "2", "3", "4"],
      rounds: 100,
    };
    distribution.index.mr.exec(mrPagerankConfig, (e, v) => {
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
