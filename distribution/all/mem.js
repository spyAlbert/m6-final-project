const id = require("../util/id");
function mem(config) {
  const context = {};
  context.gid = config.gid || "all";
  context.hash = config.hash || global.distribution.util.id.naiveHash;

  /* For the distributed mem service, the configuration will
          always be a string */
  return {
    get: (configuration, callback) => {
      //get group first
      callback = callback || function () {};
      if (!configuration) {
        global.distribution.local.groups.get(context.gid, (e, v) => {
          const message = [{ key: null, gid: context.gid }];
          global.distribution[context.gid].comm.send(
            message,
            { service: "mem", method: "get" },
            (e, v) => {
              const finalKeyList = Object.values(v).reduce(
                (acc, val) => acc.concat(val),
                []
              );
              callback(e, finalKeyList);
            }
          );
        });
      } else {
        global.distribution.local.groups.get(context.gid, (e, v) => {
          if (e) {
            return callback(new Error(e), null);
          }
          // get nids
          const allNodes = Object.values(v);
          const nids = allNodes.map((n) => id.getNID(n));
          if (nids.length === 0) {
            return callback(new Error("no node in group"), null);
          }
          const nidMap = {};
          for (let n of allNodes) {
            nidMap[id.getID(n)] = n;
          }
          const key = configuration;
          const kid = id.getID(key);
          const nodeNID = context.hash(kid, nids);
          const node = nidMap[nodeNID];
          const remote = { node: node, service: "mem", method: "get" };
          const newConfig = { gid: context.gid, key: key };
          global.distribution.local.comm.send([newConfig], remote, callback);
        });
      }
    },

    put: (state, configuration, callback) => {
      //get group first
      callback = callback || function () {};
      if (!configuration) configuration = id.getID(state);
      global.distribution.local.groups.get(context.gid, (e, v) => {
        if (e) {
          return callback(new Error(e), null);
        }
        // get nids
        const allNodes = Object.values(v);
        const nids = allNodes.map((n) => id.getNID(n));
        if (nids.length === 0) {
          return callback(new Error("no node in group"), null);
        }
        const nidMap = {};
        for (let n of allNodes) {
          nidMap[id.getID(n)] = n;
        }
        const key = configuration;
        const kid = id.getID(key);
        const nodeNID = context.hash(kid, nids);
        const node = nidMap[nodeNID];
        const remote = { node: node, service: "mem", method: "put" };
        const newConfig = { gid: context.gid, key: key };
        global.distribution.local.comm.send(
          [state, newConfig],
          remote,
          callback
        );
      });
    },

    del: (configuration, callback) => {
      //get group first
      callback = callback || function () {};
      if (!configuration) return callback(new Error("no key provided"), null);
      global.distribution.local.groups.get(context.gid, (e, v) => {
        if (e) {
          return callback(new Error(e), null);
        }
        // get nids
        const allNodes = Object.values(v);
        const nids = allNodes.map((n) => id.getNID(n));
        if (nids.length === 0) {
          return callback(new Error("no node in group"), null);
        }
        const nidMap = {};
        for (let n of allNodes) {
          nidMap[id.getID(n)] = n;
        }
        const key = configuration;
        const kid = id.getID(key);
        const nodeNID = context.hash(kid, nids);
        const node = nidMap[nodeNID];
        const remote = { node: node, service: "mem", method: "del" };
        const newConfig = { gid: context.gid, key: key };
        global.distribution.local.comm.send([newConfig], remote, callback);
      });
    },

    reconf: (configuration, callback) => {
      const oldGroups = configuration;
      const oldGroupsNids = Object.values(oldGroups).map((node) =>
        id.getNID(node)
      );
      global.distribution[context.gid].mem.get(null, (e, v) => {
        const allKeys = v;
        global.distribution.local.groups.get(context.gid, (e, v) => {
          if (e) {
            return callback(e, null);
          }
          const newGroups = v;
          const newGroupsNids = Object.values(newGroups).map((node) =>
            id.getNID(node)
          );
          const total = allKeys.length;
          let check = 0;
          if (total === 0) return callback(null, "no keys to reconfig");
          for (let key of allKeys) {
            const kid = id.getID(key);
            const oldNid = context.hash(kid, oldGroupsNids);

            const newNid = context.hash(kid, newGroupsNids);
            const newConfig = { gid: context.gid, key: key };
            if (oldNid !== newNid) {
              //need to reconfig
              const oldNode = oldGroups[oldNid.substring(0, 5)];
              const newNode = newGroups[newNid.substring(0, 5)];
              const remote = { service: "mem", method: "get", node: oldNode };
              global.distribution.local.comm.send(
                [newConfig],
                remote,
                (e, valObj) => {
                  remote.method = "del";

                  global.distribution.local.comm.send(
                    [newConfig],
                    remote,
                    (e, v) => {
                      remote.method = "put";
                      remote.node = newNode;
                      global.distribution.local.comm.send(
                        [valObj, newConfig],
                        remote,
                        (e, v) => {
                          check++;
                          if (check === total)
                            return callback(null, "reconfig sucess");
                        }
                      );
                    }
                  );
                }
              );
            } else {
              check++;
              if (check === total) return callback(null, "reconfig sucess");
            }
          }
        });
      });
    },
  };
}

module.exports = mem;
