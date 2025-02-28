const id = require("../util/id");

const groups = {};
const pervGroup = {};
const idMap = {};

groups.get = function (name, callback) {
  callback = callback || function () {};
  let localName = id.getSID(global.nodeConfig);
  let localObj = {};
  localObj[localName] = global.nodeConfig;
  if (name === "local") {
    callback(null, localObj);
  } else if (name === "all") {
    let allObj = {};
    allObj[localName] = global.nodeConfig;
    for (const key in groups) {
      let currGroup = groups[key];
      for (const sid in currGroup) {
        allObj[sid] = currGroup[sid];
      }
    }
    callback(null, allObj);
  } else {
    if (groups[name] === undefined) {
      callback(new Error("no such group"), null);
    } else {
      callback(null, groups[name]);
    }
  }
};

function checkGroupEquilty(g1, g2) {
  const g1List = Object.keys(g1);
  const g2List = Object.keys(g2);
  if (g1List.length !== g2List.length) return false;
  const g1Set = new Set();
  g2List.forEach((sid) => g1Set.add(sid));
  for (let sid of g2List) {
    if (!g1Set.has(sid)) return false;
  }
  return true;
}

function deepCopy(obj1, obj2, gid) {
  obj2[gid] = {};
  for (let name in obj1) {
    obj2[gid][name] = obj1[name];
  }
}

groups.put = function (config, group, callback) {
  callback = callback || function () {};
  let gid = config;
  if (typeof config === "string") {
    //initiate
    global.distribution[config] = {};
    global.distribution[config].status = require("../all/status")({
      gid: config,
    });
    global.distribution[config].comm = require("../all/comm")({
      gid: config,
    });
    global.distribution[config].gossip = require("../all/gossip")({
      gid: config,
    });
    global.distribution[config].groups = require("../all/groups")({
      gid: config,
    });
    global.distribution[config].routes = require("../all/routes")({
      gid: config,
    });
    global.distribution[config].mem = require("../all/mem")({
      gid: config,
    });
    global.distribution[config].store = require("../all/store")({
      gid: config,
    });
    //store
    groups[config] = group;
  } else {
    if (typeof config !== "object" || config.gid === undefined) {
      callback(new Error("invalid config"), null);
    } else {
      //initiate
      global.distribution[config.gid] = {};
      global.distribution[config.gid].status = require("../all/status")(config);
      global.distribution[config.gid].comm = require("../all/comm")(config);
      global.distribution[config.gid].gossip = require("../all/gossip")(config);
      global.distribution[config.gid].groups = require("../all/groups")(config);
      global.distribution[config.gid].routes = require("../all/routes")(config);
      global.distribution[config.gid].mem = require("../all/mem")(config);
      global.distribution[config.gid].store = require("../all/store")(config);
      //store
      groups[config.gid] = group;
      gid = config.gid;
    }
  }
  deepCopy(group, pervGroup, gid);

  if (idMap[gid]) {
    global.distribution.all.gossip.del(idMap[gid], () => {
      console.log("Cleared previous interval for group:", gid);
    });
  }
  // check group nodes periodically
  global.distribution.all.gossip.at(
    1000,
    () => {
      const newGroup = groups[gid];
      const oldGroup = pervGroup[gid];
      if (!checkGroupEquilty(oldGroup, newGroup)) {
        console.log("Detected node change, triggering reconf...");
        global.distribution[gid].mem.reconf(oldGroup, () => {
          console.log("Reconfiguration complete mem.");
          global.distribution[gid].store.reconf(oldGroup, () => {
            console.log("Reconfiguration complete store.");
            deepCopy(newGroup, pervGroup, gid);
          });
        });
      }
    },
    (err, intervalID) => {
      console.log("Started periodic node check with ID:", intervalID);
      idMap[gid] = intervalID;
    }
  );
  callback(null, groups[gid]);
};

groups.del = function (name, callback) {
  callback = callback || function () {};
  let temp = groups[name];
  if (temp === undefined) {
    callback(new Error("no such group"), null);
  } else {
    delete groups[name];
    delete global.distribution[name];
    // also delete the gossip check
  }
};

groups.add = function (name, node, callback) {
  callback = callback || function () {};
  if (groups[name] === undefined) {
    callback(new Error("no such group"), null);
  } else {
    try {
      const sid = id.getSID(node);
      groups[name][sid] = node;
      callback(null, groups[name][sid]);
    } catch (error) {
      callback(error, null);
    }
  }
};

groups.rem = function (name, node, callback) {
  callback = callback || function () {};
  console.log(groups[name]);
  if (groups[name] === undefined) {
    callback(new Error("no such group"), null);
  } else {
    try {
      if (groups[name][node] === undefined) {
        callback(new Error("no such node"), null);
      } else {
        let temp = groups[name][node];
        delete groups[name][node];
        callback(null, temp);
      }
    } catch (error) {
      callback(error, null);
    }
  }
};

groups.clearAll = function (callback) {
  callback = callback || function () {};
  let pending = Object.keys(idMap).length;
  for (let name in idMap) {
    global.distribution.all.gossip.del(idMap[name], () => {
      delete idMap[name];
      pending--;
      //if (pending === 0) callback(null, "success");
    });
  }
  callback(null, "success");
};

module.exports = groups;
