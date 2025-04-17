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
    let rounds = configuration.rounds || 1;
    let carryOver = 0;
    if (rounds) console.log(`MAP REDUCE: ${rounds} ROUNDS LEFT, ${keys.length} KEYS`);
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
              const carrySum = Object.values(v).reduce((acc, c) => acc + c, 0);
              carryOver = carrySum / keys.length;
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
                    [serviceName, allKeyList, context.gid, reduceOut, memWay, carryOver],
                    remote,
                    (e, v) => {
                      let responses = Object.values(v);
                      const resultList = responses.map(resp => resp.results).flat();
                      const converged = responses.reduce((acc, resp) => (resp.converged !== undefined) && resp.converged && acc, true);
                      // deregister
                      global.distribution[context.gid].routes.rem(
                        serviceName,
                        (e, v) => {
                          if (!rounds || resultList.length === 0 || converged || --rounds === 0) {
                            return cb(null, resultList);
                          } else {
                            configuration.rounds = rounds;
                            configuration.keys = resultList.map(res => Object.keys(res)[0]);
                            exec(configuration, cb);
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
