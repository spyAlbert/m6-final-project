const id = require("../util/id");
const log = require("../util/log");
const wire = require("../util/wire");
const serialization = require("../util/serialization");
const child_process = require("node:child_process");
const distribution = require("@brown-ds/distribution");

const config = global.nodeConfig;
const status = {};

global.moreStatus = {
  sid: global.distribution.util.id.getSID(global.nodeConfig),
  nid: global.distribution.util.id.getNID(global.nodeConfig),
  counts: 0,
};

status.get = function (configuration, callback) {
  callback = callback || function () {};
  global.moreStatus.counts++;
  switch (configuration) {
    case "nid":
      callback(null, global.moreStatus.nid);
      break;
    case "sid":
      callback(null, global.moreStatus.sid);
      break;
    case "ip":
      callback(null, config.ip);
      break;
    case "port":
      callback(null, config.port);
      break;
    case "counts":
      callback(null, global.moreStatus.counts);
      break;
    case "heapTotal":
      callback(null, process.memoryUsage().heapTotal);
      break;
    case "heapUsed":
      callback(null, process.memoryUsage().heapUsed);
      break;
    default:
      callback(new Error("not a valid state"), null);
  }
};

status.spawn = function (configuration, callback) {
  callback = callback || function () {};
  const { onStart, ...remainConfigs } = configuration;
  const internalFun = () => {
    // console.log("internalFun called!");
    if (onStart) {
      onStart();
    }
    callback(null, configuration);
  };
  const rpcCall = wire.createRPC(internalFun);
  const newConfig = { ...remainConfigs, onStart: rpcCall };

  const configJson = serialization.serialize(newConfig);

  const child = child_process.fork("distribution.js", ["--config", configJson]);

  child.on("error", (err) => {
    callback(err, null);
  });
};

status.stop = function (callback) {
  callback = callback || function () {};
  const localServer = global.distribution.node.server;
  global.distribution.local.groups.clearAll(() => {
    localServer.close(() => callback(null, config));
    // set Time out
    setTimeout(() => {
      callback(null, config);
      process.exit(1);
    }, 120);
  });
};
module.exports = status;
