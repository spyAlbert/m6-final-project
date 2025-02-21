/** @typedef {import("../types").Callback} Callback */
/**
 * NOTE: This Target is slightly different from local.all.Target
 * @typdef {Object} Target
 * @property {string} service
 * @property {string} method
 */

/**
 * @param {object} config
 * @return {object}
 */
function comm(config) {
  const context = {};
  context.gid = config.gid || "all";

  /**
   * @param {Array} message
   * @param {object} configuration
   * @param {Callback} callback
   */
  function send(message, configuration, callback) {
    //should somehow get all group nodes
    distribution.local.groups.get(context.gid, (e, v) => {
      if (e) {
        //error
        callback(e, null);
      } else {
        // get group
        const allNodes = v;
        const total = Object.values(allNodes).length;
        let responseCount = 0;
        const errorMap = {};
        const valueMap = {};
        if (total === responseCount) {
          // no node in group
          callback(errorMap, valueMap);
          return;
        }
        for (const sid in allNodes) {
          const node = allNodes[sid];
          const remote = { node: node, ...configuration };
          distribution.local.comm.send(message, remote, (e, v) => {
            if (e) {
              //add to error map
              errorMap[sid] = e;
            } else {
              //add to value map
              valueMap[sid] = v;
            }
            responseCount++;
            if (responseCount === total) {
              // collect enough response
              callback(errorMap, valueMap);
            }
          });
        }
      }
    });
  }

  return { send };
}

module.exports = comm;
