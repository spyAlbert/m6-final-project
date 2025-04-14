/** @typedef {import("../types").Callback} Callback */

/**
 * Map functions used for mapreduce
 * @callback Mapper
 * @param {any} key
 * @param {any} value
 * @returns {object[]}
 */

/**
 * Reduce functions used for mapreduce
 * @callback Reducer
 * @param {any} key
 * @param {Array} value
 * @returns {object}
 */

/**
 * @typedef {Object} MRConfig
 * @property {Mapper} map
 * @property {Reducer} reduce
 * @property {string[]} keys
 */

/*
  Note: The only method explicitly exposed in the `mr` service is `exec`.
  Other methods, such as `map`, `shuffle`, and `reduce`, should be dynamically
  installed on the remote nodes and not necessarily exposed to the user.
*/

function getDatasetKeys(dataset) {
  return dataset.map((o) => Object.keys(o)[0]);
}

let currId = 0;
function mr(config) {
  const context = {
    gid: config.gid || "all",
  };

  /**
   * @param {MRConfig} configuration
   * @param {Callback} cb
   * @return {void}
   */
  function exec(configuration, cb) {
    cb = cb || function () {};
    const { keys, map: mapper, reduce: reducer } = configuration;
    const mapReduceService = { map: mapper, reduce: reducer };
    const compactor = configuration.compact;
    const memWay = configuration.memory ? "mem" : "store";
    const mapOut = configuration.mapOut;
    const reduceOut = configuration.reduceOut;
    let rounds = configuration.rounds;
    if (rounds) console.log(`MAP REDUCE: ${rounds} ROUNDS LEFT`);
    currId++;
    const serviceName = "mr-" + currId;
    global.distribution.local.groups.get(context.gid, (e, v) => {
      if (e) {
        return cb(new Error(e), null);
      }
      const allNodes = Object.values(v);
      const nodeGroup = v;
      if (allNodes.length === 0) return cb(null, {});
      global.distribution[context.gid].routes.put(
        mapReduceService,
        serviceName,
        (e, v) => {
          //ready to do map
          const remote = { service: "mr", method: "map" };
          global.distribution[context.gid].comm.send(
            [serviceName, keys, context.gid, mapOut, memWay],
            remote,
            (e, v) => {
              remote.method = "shuffle";
              global.distribution[context.gid].comm.send(
                [keys, context.gid, nodeGroup, compactor, memWay],
                remote,
                (e, v) => {
                  const allNewKeys = new Set();
                  const allList = Object.values(v);
                  for (let currList of allList) {
                    for (let newKey of currList) {
                      allNewKeys.add(newKey);
                    }
                  }
                  remote.method = "reduce";
                  const allKeyList = Array.from(allNewKeys);
                  global.distribution[context.gid].comm.send(
                    [serviceName, allKeyList, context.gid, reduceOut, memWay],
                    remote,
                    (e, v) => {
                      let resultList = [];
                      const allValList = Object.values(v);
                      for (let currList of allValList) {
                        for (let objVal of currList) {
                          resultList.push(objVal);
                        }
                      }
                      //flat
                      resultList = resultList.flat();
                      const converged = resultList.reduce((acc, res) => acc && !!res.CONVERGING, true);
                      resultList = resultList.map(res => res.RESULT || res);
                      // deregister
                      global.distribution[context.gid].routes.rem(
                        serviceName,
                        (e, v) => {
                          if (!rounds || resultList.length === 0 || converged) {
                            return cb(null, resultList);
                          } else {
                            rounds--;
                            if (rounds === 0) {
                              return cb(null, resultList);
                            } else {
                              //next round
                              configuration.rounds = rounds;
                              //change dataset first
                              let cntr = 0;
                              console.log(resultList.length);

                              // Send the dataset to the cluster
                              resultList.forEach((o) => {
                                const key = Object.keys(o)[0];
                                const value = o[key];
                                global.distribution[context.gid].store.put(
                                  value,
                                  key,
                                  (e, v) => {
                                    cntr++;
                                    // Once the dataset is in place, run the map reduce
                                    if (cntr === resultList.length) {
                                      console.log(resultList.length);
                                      configuration.keys =
                                        getDatasetKeys(resultList);
                                      console.log(configuration.keys);
                                      exec(configuration, cb);
                                    }
                                  }
                                );
                              });
                            }
                          }
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  }

  return { exec };
}

module.exports = mr;
