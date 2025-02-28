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

      global.distribution.local.groups.get(context.gid, (e, v) => {
        if (e) {
          callback(e, null);
          return;
        }
        const allNodes = Object.values(v);
        if (allNodes.length === 0) return callback({}, {});
        global.distribution.local.comm.send(
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
      const intervalID = setInterval(func, period);
      callback(null, intervalID);
      return intervalID;
    },

    del: (intervalID, callback) => {
      callback = callback || function () {};
      clearInterval(intervalID);
      callback(null, "sucessfully clear");
    },
  };
};

module.exports = gossip;
