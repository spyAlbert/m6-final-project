const id = require("../util/id");

const groups = {};

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

groups.put = function (config, group, callback) {
  callback = callback || function () {};
  if (typeof config === "string") {
    //initiate
    distribution[config] = {};
    distribution[config].status = require("../all/status")({
      gid: config,
    });
    distribution[config].comm = require("../all/comm")({
      gid: config,
    });
    distribution[config].gossip = require("../all/gossip")({
      gid: config,
    });
    distribution[config].groups = require("../all/groups")({
      gid: config,
    });
    distribution[config].routes = require("../all/routes")({
      gid: config,
    });
    distribution[config].mem = require("../all/mem")({
      gid: config,
    });
    distribution[config].store = require("../all/store")({
      gid: config,
    });
    //store
    groups[config] = group;
    callback(null, groups[config]);
  } else {
    if (typeof config !== "object" || config.gid === undefined) {
      callback(new Error("invalid config"), null);
    } else {
      //initiate
      distribution[config.gid] = {};
      distribution[config.gid].status = require("../all/status")(config);
      distribution[config.gid].comm = require("../all/comm")(config);
      distribution[config.gid].gossip = require("../all/gossip")(config);
      distribution[config.gid].groups = require("../all/groups")(config);
      distribution[config.gid].routes = require("../all/routes")(config);
      distribution[config.gid].mem = require("../all/mem")(config);
      distribution[config.gid].store = require("../all/store")(config);
      //store
      groups[config.gid] = group;
      callback(null, groups[config.gid]);
    }
  }
};

groups.del = function (name, callback) {
  callback = callback || function () {};
  let temp = groups[name];
  if (temp === undefined) {
    callback(new Error("no such group"), null);
  } else {
    delete groups[name];
    delete distribution[name];
    callback(null, temp);
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

module.exports = groups;
