/*
    In this file, add your own test case that will confirm your correct implementation of the extra-credit functionality.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require("../../config.js");
const id = distribution.util.id;
const ncdcGroup = {};
const avgwrdlGroup = {};
const cfreqGroup = {};

/*
    The local node will be the orchestrator.
*/
let localServer = null;

const n1 = { ip: "127.0.0.1", port: 7110 };
const n2 = { ip: "127.0.0.1", port: 7111 };
const n3 = { ip: "127.0.0.1", port: 7112 };

test("(15 pts) implement compaction", (done) => {
  const mapper = (key, value) => {
    const words = value.split(/(\s+)/).filter((e) => e !== " ");
    const out = {};
    out[words[1]] = parseInt(words[3]);
    return [out];
  };

  const reducer = (key, values) => {
    const out = {};
    out[key] = values.reduce((a, b) => Math.max(a, b), -Infinity);
    return out;
  };

  const compactor = (values) => {
    const result = {};

    values.forEach((item) => {
      for (const key in item) {
        if (result.hasOwnProperty(key)) {
          // take max
          result[key] = Math.max(result[key], item[key]);
        } else {
          result[key] = item[key];
        }
      }
    });
    const resultList = [];
    for (const key in result) {
      let currObj = {};
      currObj[key] = result[key];
      resultList.push(currObj);
    }

    return resultList;
  };

  const dataset = [
    { "000": "006701199099999 1950 0515070049999999N9 +0000 1+9999" },
    { 106: "004301199099999 1950 0515120049999999N9 +0022 1+9999" },
    { 212: "004301199099999 1950 0515180049999999N9 -0011 1+9999" },
    { 318: "004301265099999 1949 0324120040500001N9 +0111 1+9999" },
    { 424: "004301265099999 1949 0324180040500001N9 +0078 1+9999" },
  ];

  const expected = [{ 1950: 22 }, { 1949: 111 }];

  const doMapReduce = (cb) => {
    distribution.ncdc.mr.exec(
      {
        keys: getDatasetKeys(dataset),
        map: mapper,
        reduce: reducer,
        compact: compactor,
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

test("(15 pts) add support for distributed persistence", (done) => {
  const mapper = (key, value) => {
    const words = value.split(/(\s+)/).filter((e) => e !== " ");
    const out = {};
    out[words[1]] = parseInt(words[3]);
    return [out];
  };

  const reducer = (key, values) => {
    const out = {};
    out[key] = values.reduce((a, b) => Math.max(a, b), -Infinity);
    return out;
  };

  const dataset = [
    { "000": "006701199099999 1950 0515070049999999N9 +0000 1+9999" },
    { 106: "004301199099999 1950 0515120049999999N9 +0022 1+9999" },
    { 212: "004301199099999 1950 0515180049999999N9 -0011 1+9999" },
    { 318: "004301265099999 1949 0324120040500001N9 +0111 1+9999" },
    { 424: "004301265099999 1949 0324180040500001N9 +0078 1+9999" },
  ];

  const expected = [{ 1950: 22 }, { 1949: 111 }];

  const doMapReduce = (cb) => {
    distribution.ncdc.mr.exec(
      {
        keys: getDatasetKeys(dataset),
        map: mapper,
        reduce: reducer,
        out: "newGroup",
      },
      (e, v) => {
        try {
          // get result from store
          const resultKeys = [1950, 1949];
          const result = [];
          let responseCount = 0;
          resultKeys.forEach((key) => {
            const outKey = `newGroup_${key}`;
            distribution.ncdc.store.get(outKey, (e, v) => {
              result.push(v);
              responseCount++;
              if (responseCount === resultKeys.length) {
                expect(result).toEqual(expect.arrayContaining(expected));
                done();
              }
            });
          });
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

test("(5 pts) add support for optional in-memory operation", (done) => {
  const mapper = (key, value) => {
    const words = value.split(/(\s+)/).filter((e) => e !== " ");
    const out = {};
    out[words[1]] = parseInt(words[3]);
    return [out];
  };

  const reducer = (key, values) => {
    const out = {};
    out[key] = values.reduce((a, b) => Math.max(a, b), -Infinity);
    return out;
  };

  const dataset = [
    { "000": "006701199099999 1950 0515070049999999N9 +0000 1+9999" },
    { 106: "004301199099999 1950 0515120049999999N9 +0022 1+9999" },
    { 212: "004301199099999 1950 0515180049999999N9 -0011 1+9999" },
    { 318: "004301265099999 1949 0324120040500001N9 +0111 1+9999" },
    { 424: "004301265099999 1949 0324180040500001N9 +0078 1+9999" },
  ];

  const expected = [{ 1950: 22 }, { 1949: 111 }];

  const doMapReduce = (cb) => {
    distribution.ncdc.mr.exec(
      {
        keys: getDatasetKeys(dataset),
        map: mapper,
        reduce: reducer,
        memory: true,
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

test("(15 pts) add support for iterative map-reduce", (done) => {
  const mapper = (key, value) => {
    if (typeof value === "string") {
      const words = value.split(/(\s+)/).filter((e) => e !== " ");
      const out = {};
      out[words[1]] = parseInt(words[3]);
      return [out];
    } else {
      //for muti rounds
      value--;
      const out = {};
      out[key] = value;
      return [out];
    }
  };

  const reducer = (key, values) => {
    const out = {};
    out[key] = values.reduce((a, b) => Math.max(a, b), -Infinity);
    return out;
  };

  const dataset = [
    { "000": "006701199099999 1950 0515070049999999N9 +0000 1+9999" },
    { 106: "004301199099999 1950 0515120049999999N9 +0022 1+9999" },
    { 212: "004301199099999 1950 0515180049999999N9 -0011 1+9999" },
    { 318: "004301265099999 1949 0324120040500001N9 +0111 1+9999" },
    { 424: "004301265099999 1949 0324180040500001N9 +0078 1+9999" },
  ];

  const expected = [{ 1950: 20 }, { 1949: 109 }];

  const doMapReduce = (cb) => {
    distribution.ncdc.mr.exec(
      {
        keys: getDatasetKeys(dataset),
        map: mapper,
        reduce: reducer,
        // exe for 3 rounds
        rounds: 3,
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

  avgwrdlGroup[id.getSID(n1)] = n1;
  avgwrdlGroup[id.getSID(n2)] = n2;
  avgwrdlGroup[id.getSID(n3)] = n3;

  cfreqGroup[id.getSID(n1)] = n1;
  cfreqGroup[id.getSID(n2)] = n2;
  cfreqGroup[id.getSID(n3)] = n3;

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
          const avgwrdlConfig = { gid: "avgwrdl" };
          distribution.local.groups.put(avgwrdlConfig, avgwrdlGroup, (e, v) => {
            distribution.avgwrdl.groups.put(
              avgwrdlConfig,
              avgwrdlGroup,
              (e, v) => {
                const cfreqConfig = { gid: "cfreq" };
                distribution.local.groups.put(
                  cfreqConfig,
                  cfreqGroup,
                  (e, v) => {
                    distribution.cfreq.groups.put(
                      cfreqConfig,
                      cfreqGroup,
                      (e, v) => {
                        done();
                      }
                    );
                  }
                );
              }
            );
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
