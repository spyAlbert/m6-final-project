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

test("(1 pts) student test", (done) => {
  // test example word count
  const mapper = (key, value) => {
    const wordList = value.split(/\s+/).filter((w) => w.length > 0);
    const out = wordList.map((word) => {
      const o = {};
      o[word] = 1;
      return o;
    });
    return out;
  };

  const reducer = (key, values) => {
    return { [key]: values.length };
  };
  const dataset = [
    { doc1: "nice cs1380" },
    { doc2: "cs1380" },
    { doc3: "cs1380 good" },
  ];

  const expected = [{ nice: 1 }, { good: 1 }, { cs1380: 3 }];

  const doMapReduce = (cb) => {
    distribution.ncdc.mr.exec(
      { keys: getDatasetKeys(dataset), map: mapper, reduce: reducer },
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

test("(1 pts) student test", (done) => {
  //  test example average
  const mapper = (key, value) => {
    let out = {};
    out.avg = value;
    return out;
  };

  const reducer = (key, values) => {
    return { [key]: values.reduce((sum, val) => sum + val, 0) / values.length };
  };
  const dataset = [{ data1: 10 }, { data2: 20 }, { data3: 30 }];

  const expected = [{ avg: 20 }];

  const doMapReduce = (cb) => {
    distribution.ncdc.mr.exec(
      { keys: getDatasetKeys(dataset), map: mapper, reduce: reducer },
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

test("(1 pts) student test", (done) => {
  // test sum

  const mapper = (key, value) => {
    let out = {};
    out.sum = value;
    return out;
  };

  const reducer = (key, values) => {
    return { [key]: values.reduce((sum, val) => sum + val, 0) };
  };
  const dataset = [{ data1: 10 }, { data2: 20 }, { data3: 30 }];

  const expected = [{ sum: 60 }];

  const doMapReduce = (cb) => {
    distribution.ncdc.mr.exec(
      { keys: getDatasetKeys(dataset), map: mapper, reduce: reducer },
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

test("(1 pts) student test", (done) => {
  // count the words of each doc

  const mapper = (key, value) => {
    const wordList = value.split(/\s+/).filter((w) => w.length > 0);
    const out = {};
    out[key] = wordList.length;
    return out;
  };

  const reducer = (key, values) => {
    return { [key]: values[0] };
  };
  const dataset = [
    { doc1: "nice cs1380" },
    { doc2: "cs1380" },
    { doc3: "cs1380 good" },
  ];

  const expected = [{ doc1: 2 }, { doc2: 1 }, { doc3: 2 }];

  const doMapReduce = (cb) => {
    distribution.ncdc.mr.exec(
      { keys: getDatasetKeys(dataset), map: mapper, reduce: reducer },
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

test("(1 pts) student test", (done) => {
  //unique words

  const mapper = (key, value) => {
    const wordList = value.split(/\s+/).filter((w) => w.length > 0);
    const out = {};
    out.unique = [...new Set(wordList)];
    return out;
  };

  const reducer = (key, values) => {
    const visited = new Set();
    values.forEach((valList) => {
      valList.forEach((word) => {
        visited.add(word);
      });
    });
    return { [key]: [...visited] };
  };
  const dataset = [
    { doc1: "machine learning is amazing" },
    { doc2: "deep learning powers amazing systems" },
    { doc3: "machine learning and deep learning are related" },
  ];
  const expected = [
    {
      unique: [
        "machine",
        "learning",
        "is",
        "amazing",
        "deep",
        "powers",
        "systems",
        "and",
        "are",
        "related",
      ],
    },
  ];

  const doMapReduce = (cb) => {
    distribution.ncdc.mr.exec(
      { keys: getDatasetKeys(dataset), map: mapper, reduce: reducer },
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
