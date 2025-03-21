/** @typedef {import("../types").Callback} Callback */
/** @typedef {import("../types").Node} Node */
const http = require("node:http");
const util = require("../util/util");

/**
 * @typedef {Object} Target
 * @property {string} service
 * @property {string} method
 * @property {Node} node
 */

/**
 * @param {Array} message
 * @param {Target} remote
 * @param {Callback} [callback]
 * @return {void}
 */
function send(message, remote, callback) {
  if (!callback || typeof callback !== "function") {
    callback = function () {};
  }

  message = message || [];
  global.moreStatus.counts++;
  if (remote === undefined) {
    callback(new Error("unvalid remote service"));
    return;
  }
  const node = remote.node;
  const service = remote.service;
  const method = remote.method;
  const gid = remote.gid || "local";
  if (node === undefined || service === undefined || method === undefined) {
    callback(new Error("unvalid remote service"));
    return;
  }
  if (!Array.isArray(message)) {
    callback(new Error("unvalid message"));
    return;
  }

  const options = {
    hostname: node.ip,
    port: node.port,
    path: `/${gid}/${service}/${method}`,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
  };

  // create request
  const req = http.request(options, (res) => {
    let data = "";

    // get response
    res.on("data", (chunk) => {
      data += chunk;
    });

    // do something with data
    res.on("end", () => {
      let result = util.deserialize(data);
      if (result instanceof Error) {
        callback(result, null);
      } else {
        const compoundResult = result;
        callback(compoundResult.error, compoundResult.value);
      }
    });
  });

  // Error handle
  req.on("error", (err) => {
    callback(new Error(err), null);
  });

  // send request
  req.write(util.serialize(message));

  // end request
  req.end();
}

module.exports = { send };
