const id = require("../util/id");
const log = require("../util/log");

const config = global.nodeConfig;

const status = {};

global.moreStatus = {
  sid: id.getSID(global.nodeConfig),
  nid: id.getNID(global.nodeConfig),
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
  // TODO: implement need in M3
  //const distribution = require("@brown-ds/distribution");
  //return distribution.local.status.spawn(configuration, callback);
};

status.stop = function (callback) {
  // TODO: implement need in M3
  //const distribution = require("@brown-ds/distribution");
  //return distribution.local.status.stop(callback);
};

module.exports = status;
