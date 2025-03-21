const id = require("../util/id");

const mr = {};
mr.map = function (serviceName, keys, gid, memWay, callback) {
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
    for (let key of allKeys) {
      global.distribution.local.store.get({ key: key, gid: gid }, (e, val) => {
        if (e) return callback(e, null);
        global.distribution.local.routes.get(serviceName, (e, v) => {
          // change the val to new val
          let mapper = v.map;
          v = mapper(key, val);
          let newKey = key + "_intermidate";
          global.distribution.local[memWay].put(
            v,
            { key: newKey, gid: gid },
            (e, v) => {
              global.distribution.local.store.del(
                { key: key, gid: gid },
                (e, v) => {
                  responseCount++;
                  if (responseCount === allKeys.length) {
                    return callback(null, allKeys);
                  }
                }
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
    for (let key of allKeys) {
      global.distribution.local[memWay].get(
        { key: key, gid: gid },
        (e, val) => {
          if (e) return callback(e, null);
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
            (e, v) => {
              responseCount++;
              if (responseCount === allKeys.length) {
                //shuffle now
                const allNewKeys = [];
                responseCount = 0;
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
                      // let valList = [];
                      // if (!e && Array.isArray(v)) {
                      //   valList = v;
                      // }
                      // valList = [...valList, ...resultMap[newKey]];
                      // console.log(
                      //   `neeeeewkey: ${newKey}, valList: ${valList}, orrrrrrignz ${v}`
                      // );
                      // //store the new valList
                      // remote.method = "put";
                      // global.distribution.local.comm.send(
                      //   [valList, { key: newKey, gid: gid }],
                      //   remote,
                      //   (e, v) => {
                      //     if (newKey === "1949" || newKey === "1950")
                      //       console.log(
                      //         `responseCount ::::::::::::::: ${responseCount}/${allNewKeys.length} e::::::::${e}`
                      //       );
                      //     console.log();
                      //     responseCount++;
                      //     if (responseCount === allNewKeys.length) {
                      //       return callback(null, allNewKeys);
                      //     }
                      //   }
                      // );
                      responseCount++;
                      if (responseCount === allNewKeys.length) {
                        return callback(null, allNewKeys);
                      }
                    }
                  );
                }
              }
            }
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
    for (let key of allKeys) {
      global.distribution.local[memWay].get(
        { key: key, gid: gid },
        (e, obj) => {
          let valList = obj.val;
          if (e) return callback(e, null);
          global.distribution.local.routes.get(serviceName, (e, v) => {
            reducer = v.reduce;
            v = reducer(obj.key, valList);

            result.push(v);
            if (out) {
              let newKey = `${out}_${obj.key}`;
              global.distribution[gid].store.put(v, newKey, (e, v) => {
                global.distribution.local[memWay].del(
                  { key: key, gid: gid },
                  (e, v) => {
                    responseCount++;
                    if (responseCount === allKeys.length) {
                      return callback(null, result);
                    }
                  }
                );
              });
            } else {
              global.distribution.local[memWay].del(
                { key: key, gid: gid },
                (e, v) => {
                  responseCount++;
                  if (responseCount === allKeys.length) {
                    return callback(null, result);
                  }
                }
              );
            }
          });
        }
      );
    }
  });
};
module.exports = mr;
