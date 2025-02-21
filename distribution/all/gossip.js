const id = require("../util/id");
const gossip = function (config) {
  const context = {};
  context.gid = config.gid || "all";
  context.subset =
    config.subset ||
    function (lst) {
      return Math.ceil(Math.log(lst.length));
    };

  return {
    send: (message, remote, callback) => {
      const payload = {};
      const uniqueObj = {
        time: new Date(),
        node: global.nodeConfig,
      };
      payload.message = message;
      payload.gid = context.gid;
      payload.uniqueId = id.getID(uniqueObj);
      payload.subset = context.subset;
      // remote should have service and method
      payload.remote = remote;

      distribution.local.groups.get(context.gid, (e, v) => {
        if (e) {
          callback(e, null);
          return;
        }
        const allNodes = Object.values(v);
        if (allNodes.length === 0) return callback({}, {});
        distribution.local.comm.send(
          [payload],
          {
            service: "gossip",
            method: "recv",
            node: allNodes[0],
          },
          callback
        );
      });
    },

    at: (period, func, callback) => {
      distService.comm.send(
        [period, func],
        { service: "gossip", method: "at" },
        callback
      );
    },

    del: (intervalID, callback) => {
      distService.comm.send(
        [intervalID],
        { service: "gossip", method: "del" },
        callback
      );
    },
  };
};

module.exports = gossip;
