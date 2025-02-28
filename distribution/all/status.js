const id = require("../util/id");
const status = function (config) {
  const context = {};
  context.gid = config.gid || "all";

  return {
    get: (configuration, callback) => {
      const remote = { service: "status", method: "get" };
      global.distribution[context.gid].comm.send(
        [configuration],
        remote,
        (e, v) => {
          if (
            configuration === "counts" ||
            configuration === "heapTotal" ||
            configuration === "heapUsed"
          ) {
            callback(
              e,
              Object.values(v).reduce((acc, val) => acc + val, 0)
            );
          } else {
            callback(e, v);
          }
        }
      );
    },

    spawn: (configuration, callback) => {
      global.distribution.local.status.spawn(configuration, (e, v) => {
        //add node to group
        if (e) {
          callback(e, null);
          return;
        }
        global.distribution.all.groups.add(context.gid, v, (e, v) => {
          callback(null, configuration);
        });
      });
    },

    stop: (callback) => {
      global.distribution[context.gid].comm.send(
        [],
        { service: "status", method: "stop" },
        callback
      );
    },
  };
};

module.exports = status;
