/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require("../../config.js");
const id = distribution.util.id;

test("(1 pts) student test", (done) => {
  // local group test
  const newGroup = {
    al57j: { ip: "127.0.0.1", port: 9092 },
    q5mn8: { ip: "127.0.0.1", port: 8083 },
    q5mn9: { ip: "127.0.0.1", port: 9093 },
  };

  distribution.local.groups.put("newGroup", newGroup, (e, v) => {
    distribution.local.groups.get("newGroup", (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v).toBe(newGroup);
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});

test("(1 pts) student test", (done) => {
  // group all test
  const g = {
    al57j: { ip: "127.0.0.1", port: 9092 },
    q5mn9: { ip: "127.0.0.1", port: 9093 },
  };

  distribution.group4.groups.put("groupTest2", g, (e, v) => {
    const n2 = { ip: "127.0.0.1", port: 9094 };

    distribution.group4.groups.add("groupTest2", n2, (e, v) => {
      const expectedGroup = {
        ...g,
        ...{ [id.getSID(n2)]: n2 },
      };

      distribution.group4.groups.get("groupTest2", (e, v) => {
        try {
          expect(e).toEqual({});
          expect(v[id.getSID(n5)]).toEqual(expectedGroup);
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
});

test("(1 pts) student test", (done) => {
  // comm all test
  const nids = Object.values(mygroupGroup).map((node) => id.getNID(node));
  const remote = { service: "status", method: "get" };
  distribution.mygroup.comm.send(["nid"], remote, (e, v) => {
    expect(e).toEqual({});
    try {
      expect(Object.values(v).length).toBe(nids.length);
      expect(Object.values(v)).toEqual(expect.arrayContaining(nids));
      done();
    } catch (error) {
      done(error);
    }
  });
});

test("(1 pts) student test", (done) => {
  // status all test
  const nids = Object.values(mygroupGroup).map((node) => id.getNID(node));

  distribution.mygroup.status.get("nid", (e, v) => {
    try {
      expect(e).toEqual({});
      expect(Object.values(v).length).toBe(nids.length);
      expect(Object.values(v)).toEqual(expect.arrayContaining(nids));
      done();
    } catch (error) {
      done(error);
    }
  });
});

test("(1 pts) student test", (done) => {
  // gossip test
  distribution.mygroup.groups.put("newgroup2", {}, (e, v) => {
    const newNode = { ip: "127.0.0.1", port: 5869 };
    const message = ["newgroup2", newNode];

    const remote = { service: "groups", method: "add" };
    const start = performance.now();
    distribution.mygroup.gossip.send(message, remote, (e, v) => {
      const end = performance.now();
      console.log(`Latency: ${(end - start).toFixed(3)} ms`);
      distribution.mygroup.groups.get("newgroup2", (e, v) => {
        let count = 0;
        for (const k in v) {
          if (Object.keys(v[k]).length > 0) {
            count++;
          }
        }
        /* Gossip only provides weak guarantees */
        try {
          expect(count).toBeGreaterThanOrEqual(5);
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
});

/* Infrastructure for the tests */

// This group is used for testing most of the functionality
const mygroupGroup = {};
// These groups are used for testing hashing
const group1Group = {};
const group2Group = {};
const group4Group = {};
const group3Group = {};

/*
   This hack is necessary since we can not
   gracefully stop the local listening node.
   This is because the process that node is
   running in is the actual jest process
*/
let localServer = null;

const n1 = { ip: "127.0.0.1", port: 8000 };
const n2 = { ip: "127.0.0.1", port: 8001 };
const n3 = { ip: "127.0.0.1", port: 8002 };
const n4 = { ip: "127.0.0.1", port: 8003 };
const n5 = { ip: "127.0.0.1", port: 8004 };
const n6 = { ip: "127.0.0.1", port: 8005 };

beforeAll((done) => {
  // First, stop the nodes if they are running
  const remote = { service: "status", method: "stop" };

  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    remote.node = n2;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n3;
      distribution.local.comm.send([], remote, (e, v) => {
        remote.node = n4;
        distribution.local.comm.send([], remote, (e, v) => {
          remote.node = n5;
          distribution.local.comm.send([], remote, (e, v) => {
            remote.node = n6;
            distribution.local.comm.send([], remote, (e, v) => {});
          });
        });
      });
    });
  });

  mygroupGroup[id.getSID(n1)] = n1;
  mygroupGroup[id.getSID(n2)] = n2;
  mygroupGroup[id.getSID(n3)] = n3;
  mygroupGroup[id.getSID(n4)] = n4;
  mygroupGroup[id.getSID(n5)] = n5;
  mygroupGroup[id.getSID(n6)] = n6;

  group1Group[id.getSID(n4)] = n4;
  group1Group[id.getSID(n5)] = n5;
  group1Group[id.getSID(n6)] = n6;

  group4Group[id.getSID(n1)] = n1;
  group4Group[id.getSID(n3)] = n3;
  group4Group[id.getSID(n5)] = n5;

  group3Group[id.getSID(n2)] = n2;
  group3Group[id.getSID(n4)] = n4;
  group3Group[id.getSID(n6)] = n6;

  group4Group[id.getSID(n1)] = n1;
  group4Group[id.getSID(n2)] = n2;
  group4Group[id.getSID(n4)] = n4;

  // Now, start the base listening node
  distribution.node.start((server) => {
    localServer = server;

    const groupInstantiation = (e, v) => {
      const mygroupConfig = { gid: "mygroup" };
      const group1Config = { gid: "group1" };
      const group2Config = { gid: "group2" };
      const group3Config = { gid: "group3" };
      const group4Config = { gid: "group4" };

      // Create some groups
      distribution.local.groups.put(mygroupConfig, mygroupGroup, (e, v) => {
        distribution.local.groups.put(group1Config, group1Group, (e, v) => {
          distribution.local.groups.put(group2Config, group2Group, (e, v) => {
            distribution.local.groups.put(group3Config, group3Group, (e, v) => {
              distribution.mygroup.groups.put(
                mygroupConfig,
                mygroupGroup,
                (e, v) => {
                  distribution.local.groups.put(
                    group4Config,
                    group4Group,
                    (e, v) => {
                      done();
                    }
                  );
                }
              );
            });
          });
        });
      });
    };

    // Start the nodes
    distribution.local.status.spawn(n1, (e, v) => {
      distribution.local.status.spawn(n2, (e, v) => {
        distribution.local.status.spawn(n3, (e, v) => {
          distribution.local.status.spawn(n4, (e, v) => {
            distribution.local.status.spawn(n5, (e, v) => {
              distribution.local.status.spawn(n6, groupInstantiation);
            });
          });
        });
      });
    });
  });
});

afterAll((done) => {
  distribution.mygroup.status.stop((e, v) => {
    const remote = { service: "status", method: "stop" };
    remote.node = n1;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n2;
      distribution.local.comm.send([], remote, (e, v) => {
        remote.node = n3;
        distribution.local.comm.send([], remote, (e, v) => {
          remote.node = n4;
          distribution.local.comm.send([], remote, (e, v) => {
            remote.node = n5;
            distribution.local.comm.send([], remote, (e, v) => {
              remote.node = n6;
              distribution.local.comm.send([], remote, (e, v) => {
                localServer.close();
                done();
              });
            });
          });
        });
      });
    });
  });
});
