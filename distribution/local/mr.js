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
      return callback(null, allKeys);
    }
    let responseCount = 0;
    const handleResponse = (e, v) => {
      if (++responseCount === allKeys.length) {
        callback(e, v);
      }
    }
    for (let key of allKeys) {
      global.distribution.local.store.get({ key: key, gid: gid }, (e, val) => {
        if (e) return handleResponse(e, val);
        global.distribution.local.routes.get(serviceName, (e, v) => {
          // change the val to new val
          let mapper = v.map;
          const mapOutput = mapper(key, val);
          v = mapOutput.output || mapOutput;
          let newKey = key + "_intermidate";
          global.distribution.local[memWay].put(
            v,
            { key: newKey, gid: gid },
            (e, v) => {
              global.distribution.local.store.del(
                { key: key, gid: gid },
                (e, v) => {
                  if (out && mapOutput.forStoring) {
                    global.distribution[out].store.put(mapOutput.forStoring, key, (e, v) => {
                      if (e) console.log(`failed to store ${key} for ${out}`, e);
                      handleResponse(e, v);
                    });
                  } else {
                    return handleResponse(e, v);
                  }
                },
              );
            }
          );
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
    let responseCount = 0;
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
            responseCount++;
            if (responseCount === allNewKeys.length) {
              return callback(null, allNewKeys);
            }
          }
        );
      }
    }
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

mr.reduce = function (serviceName, keys, gid, out, memWay, callback) {
  callback = callback || function () {};
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
    const result = [];
    let responseCount = 0;
    const handleResponse = (e, v) => {
      if (++responseCount === allKeys.length) {
        callback(e, result);
      }
    }
    for (let key of allKeys) {
      global.distribution.local[memWay].get(
        { key: key, gid: gid },
        (e, obj) => {
          let valList = obj.val;
          if (e) return handleResponse(e, obj);
          global.distribution.local.routes.get(serviceName, (e, v) => {
            const reducer = v.reduce;
            const reducerOutput = reducer(obj.key, valList);
            result.push(reducerOutput);
            const res = reducerOutput.RESULT || reducerOutput;
            global.distribution.local[memWay].del({ key: key, gid: gid }, (e, v) => {
              if (out && (reducerOutput.CONVERGING === undefined || reducerOutput.CONVERGING)) {
              // if (out) {
                let newKey = Object.keys(res)[0];
                global.distribution[out].store.put(res[newKey], newKey, (e, v) => {
                  if (e) console.log(`failed to store ${newKey} for ${out}`, e)
                  return handleResponse(e, v);
                });
              } else {
                return handleResponse(e, v);
              }
            });
          });
        }
      );
    }
  });
};
module.exports = mr;
