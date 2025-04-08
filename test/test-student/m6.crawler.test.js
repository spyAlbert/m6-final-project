/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require("../../config.js");
const id = distribution.util.id;

const ncdcGroup = {};

let localServer = null;

const n1 = { ip: "127.0.0.1", port: 7110 };
const n2 = { ip: "127.0.0.1", port: 7111 };
const n3 = { ip: "127.0.0.1", port: 7112 };
jest.setTimeout(3600000);
test("(1 pts) student test", (done) => {
  // test example word count
  const crawler = require("../../distribution/engine/crawler");
  const mapper = crawler.map;
  const reducer = crawler.reduce;
  console.log(mapper);

  const dataset = [{ express: "null" }];

  const expected = [
    { "side-channel": "qs" },
    { debug: "send" },
    { encodeurl: "send" },
    { "escape-html": "send" },
    { etag: "send" },
    { fresh: "send" },
    { "http-errors": "send" },
    { "mime-types": "send" },
    { ms: "send" },
    { "on-finished": "send" },
    { "range-parser": "send" },
    { statuses: "send" },
    { debug: "finalhandler" },
    { parseurl: "finalhandler" },
    { statuses: "finalhandler" },
    { encodeurl: "finalhandler" },
    { "escape-html": "finalhandler" },
    { "on-finished": "finalhandler" },
    { ms: "debug" },
    { "mime-types": "accepts" },
    { negotiator: "accepts" },
    { wrappy: "once" },
    { debug: "router" },
    { depd: "router" },
    { "is-promise": "router" },
    { parseurl: "router" },
    { "path-to-regexp": "router" },
  ];

  const doMapReduce = (cb) => {
    distribution.ncdc.mr.exec(
      {
        keys: getDatasetKeys(dataset),
        map: mapper,
        reduce: reducer,
        rounds: 2,
      },
      (e, v) => {
        try {
          expect(v).toEqual(expect.arrayContaining(expected));
          done();
        } catch (e) {
          done(e);
        }
      }
    );
  };

  let cntr = 0;
  // Send the dataset to the cluster
  dataset.forEach((o) => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.ncdc.store.put(value, key, (e, v) => {
      cntr++;
      // Once the dataset is in place, run the map reduce
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

/*
    Test setup and teardown
*/

// Helper function to extract keys from dataset (in case the get(null) funnctionality has not been implemented)
function getDatasetKeys(dataset) {
  return dataset.map((o) => Object.keys(o)[0]);
}

beforeAll((done) => {
  ncdcGroup[id.getSID(n1)] = n1;
  ncdcGroup[id.getSID(n2)] = n2;
  ncdcGroup[id.getSID(n3)] = n3;

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

    const ncdcConfig = { gid: "ncdc" };
    startNodes(() => {
      distribution.local.groups.put(ncdcConfig, ncdcGroup, (e, v) => {
        distribution.ncdc.groups.put(ncdcConfig, ncdcGroup, (e, v) => {
          done();
        });
      });
    });
  });
});

afterAll((done) => {
  const remote = { service: "status", method: "stop" };
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
