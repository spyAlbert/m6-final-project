/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

global.nodeConfig = { ip: "127.0.0.1", port: 8085 };
const distribution = require("../../config.js");
const local = distribution.local;
const id = distribution.util.id;
let n1 = { ip: "127.0.0.1", port: 8085 };

test("(1 pts) student test", (done) => {
  // test for get in status
  Promise.all([
    new Promise((resolve, reject) => {
      // test ip
      local.status.get("ip", (e, v) => {
        try {
          expect(e).toBeFalsy();
          expect(v).toBe(n1.ip);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    }),
    new Promise((resolve, reject) => {
      // test port
      local.status.get("port", (e, v) => {
        try {
          expect(e).toBeFalsy();
          expect(v).toBe(n1.port);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    }),
    new Promise((resolve, reject) => {
      // test not valid
      local.status.get("NoneValid", (e, v) => {
        try {
          expect(e).toBeDefined();
          expect(e).toBeInstanceOf(Error);
          expect(v).toBeFalsy();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    }),
  ])
    .then(() => done())
    .catch((error) => done(error));
});

test("(1 pts) student test", (done) => {
  // test for get in routes

  Promise.all([
    new Promise((resolve, reject) => {
      // get status
      local.routes.get("status", (e, v) => {
        try {
          expect(e).toBeFalsy();
          expect(v).toBe(local.status);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    }),
    new Promise((resolve, reject) => {
      // get comm
      local.routes.get("comm", (e, v) => {
        try {
          expect(e).toBeFalsy();
          expect(v).toBe(local.comm);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    }),
  ])
    .then(() => done())
    .catch((error) => done(error));
});

test("(1 pts) student test", (done) => {
  // test for put and rem 1 service
  const iLove1380Service = {};

  iLove1380Service.love = () => {
    return "I love 1380!";
  };

  local.routes.put(iLove1380Service, "love", (e, v) => {
    local.routes.get("love", (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v.love()).toBe("I love 1380!");
        local.routes.rem("love", (e, v) => {
          local.status.get("love", (e, v) => {
            try {
              expect(e).toBeDefined();
              expect(e).toBeInstanceOf(Error);
              expect(v).toBeFalsy();
              done();
            } catch (error) {
              done(error);
            }
          });
        });
      } catch (error) {
        done(error);
      }
    });
  });
});

test("(1 pts) student test", (done) => {
  // test for put and rem 2 service
  const iLove1380Service = {};
  const iLove1385Service = {};

  iLove1380Service.love = () => {
    return "I love 1380!";
  };

  iLove1385Service.love = () => {
    return "I love 1385!";
  };

  local.routes.put(iLove1380Service, "love1", (e, v) => {
    local.routes.put(iLove1385Service, "love2", (e, v) => {
      Promise.all([
        new Promise((resolve, reject) => {
          // remove service 1
          local.routes.get("love1", (e, v) => {
            try {
              expect(e).toBeFalsy();
              expect(v.love()).toBe("I love 1380!");
              local.routes.rem("love1", (e, v) => {
                local.status.get("love1", (e, v) => {
                  try {
                    expect(e).toBeDefined();
                    expect(e).toBeInstanceOf(Error);
                    expect(v).toBeFalsy();
                    resolve();
                  } catch (error) {
                    reject(error);
                  }
                });
              });
            } catch (error) {
              reject(error);
            }
          });
        }),
        new Promise((resolve, reject) => {
          // remove service 2
          local.routes.get("love2", (e, v) => {
            try {
              expect(e).toBeFalsy();
              expect(v.love()).toBe("I love 1385!");
              local.routes.rem("love2", (e, v) => {
                local.status.get("love2", (e, v) => {
                  try {
                    expect(e).toBeDefined();
                    expect(e).toBeInstanceOf(Error);
                    expect(v).toBeFalsy();
                    resolve();
                  } catch (error) {
                    reject(error);
                  }
                });
              });
            } catch (error) {
              reject(error);
            }
          });
        }),
      ])
        .then(() => done())
        .catch((error) => done(error));
    });
  });
});

test("(1 pts) student test", (done) => {
  // test for send in comm
  Promise.all([
    new Promise((resolve, reject) => {
      // test send for get sid
      const remote = { node: n1, service: "status", method: "get" };
      const message = ["sid"];

      local.comm.send(message, remote, (e, v) => {
        try {
          expect(e).toBeFalsy();
          expect(v).toBe(id.getSID(n1));
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    }),
    new Promise((resolve, reject) => {
      // test send for not valid
      const remote = { node: n1, service: "nonValid", method: "get" };
      const message = ["status"];

      local.comm.send(message, remote, (e, v) => {
        try {
          expect(e).toBeTruthy();
          expect(e).toBeInstanceOf(Error);
          expect(v).toBeFalsy();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    }),
  ])
    .then(() => done())
    .catch((error) => done(error));
});

/* Test infrastructure */

let localServer = null;

beforeAll((done) => {
  distribution.node.start((server) => {
    localServer = server;
    done();
  });
});

afterAll((done) => {
  localServer.close();
  done();
});
