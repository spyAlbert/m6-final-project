const id = require("../util/id");
objMap = {};
groupObjectMap = {};
function put(state, configuration, callback) {
  callback = callback || function () {};
  if (configuration) {
    if (typeof configuration === "string") {
      const key = configuration;
      objMap[key] = state;
      callback(null, state);
    } else {
      let key = configuration.key;
      if (!key) {
        key = id.getID(state);
      }
      // type of group object
      if (!configuration.gid || configuration.gid == "local") {
        // same logic for local version
        objMap[key] = state;
        callback(null, state);
      } else {
        const gid = configuration.gid;
        if (!groupObjectMap[gid]) {
          groupObjectMap[gid] = {};
        }
        groupObjectMap[gid][key] = state;
        callback(null, state);
      }
    }
  } else {
    //no configuration provided
    objMap[id.getID(state)] = state;
    callback(null, state);
  }
}

function get(configuration, callback) {
  callback = callback || function () {};
  if (configuration) {
    if (typeof configuration === "string") {
      if (objMap[configuration] === undefined) {
        callback(new Error("no such element"), null);
      } else {
        callback(null, objMap[configuration]);
      }
    } else {
      const key = configuration.key;
      const gid = configuration.gid;
      if (!key) {
        if (!gid || gid === "local") {
          callback(null, Object.keys(objMap));
        } else {
          if (!groupObjectMap[gid]) {
            callback(null, []);
          } else {
            callback(null, Object.keys(groupObjectMap[gid]));
          }
        }
      } else {
        if (!gid || gid === "local") {
          //same logic as local
          if (objMap[key] === undefined) {
            callback(new Error("no such element"), null);
          } else {
            callback(null, objMap[key]);
          }
        } else {
          if (!groupObjectMap[gid]) {
            callback(new Error("no such group"), null);
          } else if (!groupObjectMap[gid][key]) {
            callback(new Error("no such element in group"), null);
          } else {
            callback(null, groupObjectMap[gid][key]);
          }
        }
      }
    }
  } else {
    callback(null, Object.keys(objMap));
  }
}

function del(configuration, callback) {
  callback = callback || function () {};
  if (configuration) {
    if (typeof configuration === "string") {
      if (objMap[configuration] === undefined) {
        callback(new Error("no such element"), null);
      } else {
        let temp = objMap[configuration];
        delete objMap[configuration];
        callback(null, temp);
      }
    } else {
      const key = configuration.key;
      const gid = configuration.gid;
      if (!key) {
        callback(new Error("no key provided"), null);
      } else {
        if (!gid || gid === "local") {
          //same logic as local
          if (objMap[key] === undefined) {
            callback(new Error("no such element"), null);
          } else {
            let temp = objMap[key];
            delete objMap[key];
            callback(null, temp);
          }
        } else {
          if (!groupObjectMap[gid]) {
            callback(new Error("no such group"), null);
          } else if (!groupObjectMap[gid][key]) {
            callback(new Error("no such element in group"), null);
          } else {
            let temp = groupObjectMap[gid][key];
            delete groupObjectMap[gid][key];
            callback(null, temp);
          }
        }
      }
    }
  } else {
    callback(new Error("no key provided"), null);
  }
}

function append(obj, configuration, callback) {
  get(configuration, (e, v) => {
    let valList = [];
    if (!e && Array.isArray(v.val)) {
      valList = v.val;
    }
    valList = [...valList, ...obj.val];
    //store the new valList
    obj.val = valList;
    put(obj, configuration, (e, v) => {
      callback(null, v);
    });
  });
}
module.exports = { put, get, del, append };
