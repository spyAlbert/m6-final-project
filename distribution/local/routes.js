/** @typedef {import("../types").Callback} Callback */

// create a service map
const local = require("./local");
const serviceMap = {
  status: local.status,
  routes: local.routes,
  comm: local.comm,
  rpc: global.toLocal,
};
/**
 * @param {string} configuration
 * @param {Callback} callback
 * @return {void}
 */
function get(configuration, callback) {
  callback = callback || function () {};
  global.moreStatus.counts++;
  if (
    typeof configuration === "string" ||
    configuration.gid === "local" ||
    configuration.gid === undefined
  ) {
    configuration = configuration.service || configuration;
    //update global.toLocal if rpc
    if (configuration == "rpc") {
      serviceMap.rpc = global.toLocal;
    }

    if (serviceMap[configuration] === undefined) {
      callback(new Error("undefined service"), null);
    } else {
      callback(null, serviceMap[configuration]);
    }
  } else {
    // not a local service
    if (distribution[configuration.gid] === undefined) {
      callback(new Error("no such group"), null);
    } else {
      callback(null, distribution[configuration.gid][configuration.service]);
    }
  }
}

/**
 * @param {object} service
 * @param {string} configuration
 * @param {Callback} callback
 * @return {void}
 */
function put(service, configuration, callback) {
  callback = callback || function () {};
  global.moreStatus.counts++;
  if (typeof service !== "object") {
    callback(new Error("not a valid service"), null);
  } else if (typeof configuration !== "string") {
    callback(new Error("not a valid service name"), null);
  } else {
    serviceMap[configuration] = service;
    callback(null, service);
  }
}

/**
 * @param {string} configuration
 * @param {Callback} callback
 */
function rem(configuration, callback) {
  callback = callback || function () {};
  global.moreStatus.counts++;
  if (serviceMap[configuration] === undefined) {
    callback(new Error("undefined service"), null);
  } else {
    let temp = serviceMap[configuration];
    delete serviceMap[configuration];
    callback(null, temp);
  }
}

module.exports = { get, put, rem };
