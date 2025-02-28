const gossip = {};
const id = require("../util/id");
const visited = new Set();
function randomSelect(nodes, n) {
  let result = [...nodes];
  for (let i = result.length - 1; i > result.length - 1 - n; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result.slice(-n);
}

gossip.recv = function (payload, callback) {
  callback = callback || function () {};
  const message = payload.message;
  const gid = payload.gid;
  const uniqueId = payload.uniqueId;
  const subset = payload.subset;
  // remote should have service and method
  const remote = payload.remote;
  let errorMap = {};
  let valueMap = {};
  if (visited.has(uniqueId)) {
    // already seen this message
    callback(errorMap, valueMap);
    return;
  }
  visited.add(uniqueId);
  //do the operation locally first
  global.distribution.local.comm.send(
    message,
    { node: global.nodeConfig, ...remote },
    (e, v) => {
      if (e) {
        errorMap[id.getSID(global.nodeConfig)] = e;
      }

      if (v) {
        valueMap[id.getSID(global.nodeConfig)] = v;
      }
      global.distribution.local.groups.get(gid, (e, v) => {
        if (e) {
          callback(errorMap, valueMap);
          return;
        }
        delete v[id.getSID(global.nodeConfig)];
        const allValuePairs = Object.entries(v);
        if (allValuePairs.length === 0) return callback(errorMap, valueMap);
        const numToSelect = Math.min(
          Math.max(1, subset(allValuePairs)),
          allValuePairs.length
        );
        const selectedPairs = randomSelect(allValuePairs, numToSelect);
        let sendCount = 0;
        //send all messages for selected pair
        selectedPairs.forEach(([_, node]) => {
          global.distribution.local.comm.send(
            [payload],
            { service: "gossip", method: "recv", node: node },
            (e, v) => {
              errorMap = { ...errorMap, ...e };
              valueMap = { ...valueMap, ...v };
              sendCount++;
              if (sendCount === selectedPairs.length) {
                callback(errorMap, valueMap);
              }
            }
          );
        });
      });
    }
  );
};

module.exports = gossip;
