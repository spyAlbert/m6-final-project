const { performance } = require("perf_hooks");
const distribution = require("../../config.js");
const id = distribution.util.id;

// Generate 1000 random key-value pairs
const generateData = (num) => {
  const data = {};
  for (let i = 0; i < num; i++) {
    const key = `key${i}`;
    const value = { content: Math.random().toString(36).substring(7) };
    data[key] = value;
  }
  return data;
};
jest.setTimeout(3600000);
test("(1 pts) student test", async () => {
  const numObjects = 1000;
  const data = generateData(numObjects);

  // Measure Insert Performance
  let insertStart = performance.now();
  await Promise.all(
    Object.entries(data).map(
      ([key, value]) =>
        new Promise((resolve) => {
          console.log(global.distribution.mygroup);
          global.distribution.mygroup.store.put(value, key, resolve);
        })
    )
  );
  let insertEnd = performance.now();
  let insertLatency = (insertEnd - insertStart) / numObjects;
  let insertThroughput = numObjects / ((insertEnd - insertStart) / 1000);

  // Measure Retrieval Performance
  let getStart = performance.now();
  await Promise.all(
    Object.keys(data).map(
      (key) =>
        new Promise((resolve) =>
          global.distribution.mygroup.store.get(key, resolve)
        )
    )
  );
  let getEnd = performance.now();
  let getLatency = (getEnd - getStart) / numObjects;
  let getThroughput = numObjects / ((getEnd - getStart) / 1000);

  console.log(`Insert Latency: ${insertLatency.toFixed(3)} ms/op`);
  console.log(`Insert Throughput: ${insertThroughput.toFixed(2)} ops/sec`);
  console.log(`Get Latency: ${getLatency.toFixed(3)} ms/op`);
  console.log(`Get Throughput: ${getThroughput.toFixed(2)} ops/sec`);
});

/*
  Testing infrastructure code.
*/

// This group is used for testing most of the functionality
const mygroupGroup = {};
/*
   This hack is necessary since we can not
   gracefully stop the local listening node.
   This is because the process that node is
   running in is the actual jest process
*/
let localServer = null;

const n1 = { ip: "13.59.52.232", port: 8001 };
const n2 = { ip: "18.224.64.191", port: 8001 };
const n3 = { ip: "18.219.109.226", port: 8001 };

beforeAll((done) => {
  // First, stop the nodes if they are running
  const remote = { service: "status", method: "stop" };
  console.log("hiii");

  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    remote.node = n2;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n3;
      distribution.local.comm.send([], remote, (e, v) => {});
    });
  });

  mygroupGroup[id.getSID(n1)] = n1;
  mygroupGroup[id.getSID(n2)] = n2;
  mygroupGroup[id.getSID(n3)] = n3;

  // Now, start the base listening node
  distribution.node.start((server) => {
    localServer = server;
    console.log("starrrrr");

    const groupInstantiation = (e, v) => {
      const mygroupConfig = { gid: "mygroup", hash: id.consistentHash };

      // Create some groups
      distribution.local.groups.put(mygroupConfig, mygroupGroup, (e, v) => {
        console.log(global.distribution.mygroup);

        done();
      });
    };

    // Start the nodes
    groupInstantiation();
  });
});
