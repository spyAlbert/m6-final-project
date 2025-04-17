/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require("../../config.js");
const id = distribution.util.id;

const crawlGroup = {};
const indexGroup = {};

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

  const dataset = [{ "express": false }];

  const expected = [
    'express',
    'qs',                  'etag',
    'once',                'send',
    'vary',                'debug',
    'fresh',               'cookie',
    'router',              'accepts',
    'type-is',             'parseurl',
    'statuses',            'encodeurl',
    'mime-types',          'proxy-addr',
    'body-parser',         'escape-html',
    'http-errors',         'on-finished',
    'content-type',        'finalhandler',
    'range-parser',        'serve-static',
    'cookie-signature',    'merge-descriptors',
    'content-disposition'
  ];

  const doMapReduce = (cb) => {
    distribution.crawl.mr.exec(
      {
        keys: getDatasetKeys(dataset),
        map: mapper,
        reduce: reducer,
        rounds: 2,
      },
      (e, v) => {
        distribution.crawl.store.get(null, (e, allKeys) => {
          const crawledPkgs = []
          let ctr = 0;
          const afterGet = (key, value) => {
            if (value) {
              crawledPkgs.push(key);
            }
            
            if (++ctr === allKeys.length) {
              try {
                expect(crawledPkgs).toEqual(expect.arrayContaining(expected));
                done();
              } catch (e) {
                done(e);
              }
            }
          }
          for (const key of allKeys) {
            distribution.crawl.store.get(key, (e, v) => afterGet(key, v));
          }
        });
      }
    );
  };

  let cntr = 0;
  // Send the dataset to the cluster
  dataset.forEach((o) => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.crawl.store.put(value, key, (e, v) => {
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
  crawlGroup[id.getSID(n1)] = n1;
  crawlGroup[id.getSID(n2)] = n2;
  crawlGroup[id.getSID(n3)] = n3;

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

    const crawlConfig = { gid: "crawl" };
    const indexConfig = { gid: "index" };
    startNodes(() => {
      distribution.local.groups.put(crawlConfig, crawlGroup, (e, v) => {
        distribution.crawl.groups.put(crawlConfig, crawlGroup, (e, v) => {
          distribution.local.groups.put(indexConfig, indexGroup, (e, v) => {
            distribution.index.groups.put(indexConfig, indexGroup, (e, v) => {
              done();
            });
          });
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
