const groups = function (config) {
  const context = {};
  context.gid = config.gid || "all";

  return {
    put: (config, group, callback) => {
      const remote = { service: "groups", method: "put" };
      distribution[context.gid].comm.send([config, group], remote, callback);
    },

    del: (name, callback) => {
      const remote = { service: "groups", method: "del" };
      distribution[context.gid].comm.send([name], remote, callback);
    },

    get: (name, callback) => {
      const remote = { service: "groups", method: "get" };
      distribution[context.gid].comm.send([name], remote, callback);
    },

    add: (name, node, callback) => {
      const remote = { service: "groups", method: "add" };
      distribution[context.gid].comm.send([name, node], remote, callback);
    },

    rem: (name, node, callback) => {
      const remote = { service: "groups", method: "rem" };
      distribution[context.gid].comm.send([name, node], remote, callback);
    },
  };
};

module.exports = groups;
