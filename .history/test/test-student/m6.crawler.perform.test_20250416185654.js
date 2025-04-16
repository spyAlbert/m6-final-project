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

const { nodes } = require("../../distribution/engine/nodes.js");
const basePackages = [
  "cncjs",
  "anymatch",
  "backo2",
  "bootstrap",
  "buble",
  "bubleify",
  "chalk",
  "classnames",
  "commander",
  "connect",
  "consolidate",
  "cookie",
  "cors",
  "dateformat",
  "depcheck",
  "enzyme",
  "fleg",
  "gm",
  "history",
  "husky",
  "immer",
  "isfunction",
  "isnumber",
  "isobject",
  "isstream",
  "jest",
  "json3",
  "jsonfile",
  "jsonpointer",
  "jsonwebtoken",
  "jsprim",
  "lcid",
  "mkdirp",
  "moment",
  "morgan",
  "nodemon",
  "normalizr",
  "openurl",
  "opn",
  "options",
  "path",
  "postcss",
  "preact",
  "progress",
  "qs",
  "rescope",
  "rimraf",
  "send",
  "serialport",
  "stylis",
  "khoom",
  "mhy",
  "aws4",
  "axios",
  "browserslist",
  "callsite",
  "commonizer",
  "concurrently",
  "cssnano",
  "dayjs",
  "debounce",
  "debug",
  "deepmerge",
  "destroy",
  "escodegen",
  "eslint",
  "etag",
  "eventemitter3",
  "events",
  "express",
  "finalhandler",
  "getpass",
  "happypack",
  "isstring",
  "jsuri",
  "lodash",
  "miragejs",
  "mongodb",
  "mousetrap",
  "parseqs",
  "passport",
  "portscanner",
  "range_check",
  "recompose",
  "redux",
  "request",
  "stringstream",
  "superagent",
  "taskflows",
  "tfunk",
  "tslib",
  "tweetnacl",
  "ultron",
  "underscore",
  "undici",
  "validate",
  "ws",
  "xterm",
  "y18n",
  "yargs",
];
jest.setTimeout(3600000);
test("(1 pts) student test", (done) => {
  // test example word count
  const crawler = require("../../distribution/engine/crawler");
  const mapper = crawler.map;
  const reducer = crawler.reduce;

  const dataset = basePackages.map((v) => ({ [v]: "null" }));

  const doMapReduce = (cb) => {
    const startTime = performance.now();
    distribution.ncdc.mr.exec(
      {
        keys: getDatasetKeys(dataset),
        map: mapper,
        reduce: reducer,
        rounds: 1,
      },
      (e, v) => {
        try {
          const numRecords = dataset.length;
          const endTime = performance.now();
          const timeInSeconds = (endTime - startTime) / 1000;
          const throughput = numRecords / timeInSeconds;
          const latency = endTime - startTime;
          const perResultLatency = latency / numRecords;
          console.log(numRecords);

          console.log(`Throughput: ${throughput.toFixed(2)} records/second`);
          console.log(`Latency per result: ${perResultLatency.toFixed(2)} ms`);
          expect(v).toEqual(expect.arrayContaining(v));
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
  for (const node of nodes) {
    const sid = id.getSID(node);
    ncdcGroup[sid] = node;
  }
  const startNodes = (cb) => {
    let numResponses = 0;
    function onSpawn(node, e, v) {
      if (e) console.log("error spawning node", node, e);
      if (++numResponses === nodes.length) cb();
    }
    for (const node of nodes) {
      distribution.local.status.spawn(node, (e, v) => onSpawn(node, e, v));
    }
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

function cleanUpNodes(cb) {
  let numResponses = 0;
  function onStop(node, e, v) {
    if (e) console.log("error stopping node", node, e);
    if (++numResponses === nodes.length) localServer.close();
  }
  const remote = { service: "status", method: "stop" };
  let count = 0;
  for (const node of nodes) {
    const stopRemote = { ...remote, node: node };
    distribution.local.comm.send([], stopRemote, (e, v) => {
      count++;
      onStop(node, e, v);
      if (count == nodes.length - 1) {
        cb();
      }
    });
  }
}

afterAll((done) => {
  cleanUpNodes(done);
});
