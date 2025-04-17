const id = require("../util/id");

const mr = {};
mr.map = function (serviceName, keys, gid, out, memWay, callback) {
  callback = callback || function () {};
  //get all keys in store
  global.distribution.local.store.get({ gid: gid }, (e, v) => {
    // focus on the key match the keys
    if (e) return callback(e, null);
    const allKeys = [];
    for (let key of v) {
      if (keys.includes(key)) {
        allKeys.push(key);
      }
    }
    if (allKeys.length === 0) {
      return callback(null, 0);
    }
    let totalCarry = 0;
    let numResponses = 0;
    let handleResponse = () => {
      if (++numResponses === allKeys.length) {
        callback(null, totalCarry);
      }
    }
    for (const key of allKeys) {
      global.distribution.local.store.get({ key: key, gid: gid }, (e, val) => {
        if (e) return handleResponse();
        global.distribution.local.routes.get(serviceName, (e, v) => {
          // change the val to new val
          let mapper = v.map;
          mapper(key, val, (e, mapResults) => {
            //if (gid === "index") console.log(`${key} PR-MAP RESULTS:`, mapResults);
            if (mapResults && mapResults.CARRY !== undefined) {
              totalCarry += mapResults.CARRY;
              mapResults = mapResults.OUTPUT;
            }
            if (mapResults.length === 0) return handleResponse();
            let newKey = key + "_intermidate";
            global.distribution.local[memWay].put(
              mapResults,
              { key: newKey, gid: gid  },
              (e, v) => {
                if (e) console.log(`MAP: failed to store ${newKey} intermediate result`);
                return handleResponse();
              }
            );
          });
        });
      });
    }
  });
};

mr.shuffle = function (keys, gid, nodeGroup, compactor, memWay, callback) {
  callback = callback || function () {};
  keys = keys.map((key) => key + "_intermidate");
  //get all keys in store
  global.distribution.local[memWay].get({ gid: gid }, (e, v) => {
    // focus on the key match the keys
    if (e) return callback(e, null);
    const allKeys = [];
    for (let key of v) {
      if (keys.includes(key)) {
        allKeys.push(key);
      }
    }
    if (allKeys.length === 0) {
      return callback(null, allKeys);
    }
    const resultMap = {};
    const performShuffle = () => {
      //shuffle now
      const allNewKeys = [];
      let responseCount = 0;
      for (let newKey of Object.keys(resultMap)) {
        const kid = id.getID(newKey);
        allNewKeys.push(kid);
        const allNodes = Object.values(nodeGroup);
        const nids = Object.values(allNodes).map((node) =>
          id.getNID(node)
        );
        const nid = id.consistentHash(kid, nids);
        const node = nodeGroup[nid.substring(0, 5)];
        const remote = {
          node: node,
          service: memWay,
          method: "append",
        };
        const currObj = { key: newKey, val: resultMap[newKey] };
        global.distribution.local.comm.send(
          [currObj, { key: kid, gid: gid }],
          remote,
          (e, v) => {
            if (++responseCount === allNewKeys.length) {
              return callback(null, allNewKeys);
            }
          }
        );
      }
    }
    let responseCount = 0;
    const handleResponse = (e, v) => {
      if (++responseCount === allKeys.length) {
        performShuffle();
      }
    }
    for (let key of allKeys) {
      global.distribution.local[memWay].get(
        { key: key, gid: gid },
        (e, val) => {
          if (e) return handleResponse(e, val);
          if (compactor) {
            val = compactor(val);
          }
          if (Array.isArray(val)) {
            for (let objVal of val) {
              const list = Object.keys(objVal);
              if (list.length !== 0) {
                let newKey = list[0];
                const value = objVal[newKey];
                if (!resultMap[newKey]) {
                  resultMap[newKey] = [];
                }
                resultMap[newKey].push(value);
              }
            }
          } else {
            const list = Object.keys(val);
            if (list.length !== 0) {
              let newKey = list[0];
              const value = val[newKey];
              if (!resultMap[newKey]) {
                resultMap[newKey] = [];
              }
              resultMap[newKey].push(value);
            }
          }
          //delete the intermidate
          global.distribution.local[memWay].del(
            { key: key, gid: gid },
            handleResponse,
          );
          //
        }
      );
    }
  });
};

mr.reduce = function (serviceName, keys, gid, out, memWay, carryOver, callback) {
  callback = callback || function () {};
  global.distribution.local[memWay].get({ gid: gid }, (e, v) => {
    // focus on the key match the keys
    if (e) return callback(e, {results: [], converged: true});
    const allKeys = [];
    for (let key of v) {
      if (keys.includes(key)) {
        allKeys.push(key);
      }
    }
    if (allKeys.length === 0) {
      return callback({results: [], converged: true});
    }
    let results = [];
    let converged = undefined;
    let responseCount = 0;
    const handleResponse = (e, v) => {
      if (v) {
        if (v.CONVERGED !== undefined) {
          if (converged !== undefined) {
            converged = converged && v.CONVERGED;
          } else {
            converged = v.CONVERGED;
          }
          v = v.OUTPUT;
        }
        results.push(v);
      }
      if (++responseCount === allKeys.length) {
        //ed reducing`, results);
        callback(e, {results: results, converged: converged});
      }
    }
    for (let key of allKeys) {
      global.distribution.local[memWay].get(
        { key: key, gid: gid },
        (e, obj) => {
          if (!obj || !obj.val || e) {
            //console.log("ERROR IN REDUCER?", key, e, obj);
            return handleResponse(null, null);
          }
          let valList = obj.val;
          global.distribution.local.routes.get(serviceName, (e, v) => {
            const reducer = v.reduce;
            if (carryOver) {
              valList = {CARRY: carryOver, VALUES: valList};
            }
            reducer(obj.key, valList, (e, reducerOutput) => {
              global.distribution.local[memWay].del({ key: key, gid: gid }, (e, v) => {
                handleResponse(null, reducerOutput);
              });
            });
          });
        }
      );
    }
  });
};
module.exports = mr;
