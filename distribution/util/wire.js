const log = require("../util/log");
const id = require("./id");
const serialization = require("./serialization");

function createRPC(func) {
  // Write some code...
  if (global.toLocal === undefined) {
    global.toLocal = {};
  }
  const uniqueObj = {
    fun: func,
    date: new Date(),
  };
  const name = id.getID(uniqueObj);
  global.toLocal[name] = func;
  let serializedStub = fromRPCTemplate(name);
  return serialization.deserialize(serializedStub);
}

function fromRPCTemplate(name) {
  let stub = (...args) => {
    const callback = args.pop();
    let remote = {
      node: { ip: "__IP_INFO__", port: "__PORT_INFO__" },
      service: "rpc",
      method: "__METHOD_NAME__",
    };
    distribution.local.comm.send(args, remote, callback);
  };
  return serialization
    .serialize(stub)
    .replace(/__IP_INFO__/g, global.nodeConfig.ip)
    .replace(/__PORT_INFO__/g, global.nodeConfig.port)
    .replace(/__METHOD_NAME__/g, name);
}

/*
  The toAsync function transforms a synchronous function that returns a value into an asynchronous one,
  which accepts a callback as its final argument and passes the value to the callback.
*/
function toAsync(func) {
  log(
    `Converting function to async: ${func.name}: ${func
      .toString()
      .replace(/\n/g, "|")}`
  );

  // It's the caller's responsibility to provide a callback
  const asyncFunc = (...args) => {
    const callback = args.pop();
    try {
      const result = func(...args);
      callback(null, result);
    } catch (error) {
      callback(error);
    }
  };

  /* Overwrite toString to return the original function's code.
   Otherwise, all functions passed through toAsync would have the same id. */
  asyncFunc.toString = () => func.toString();
  return asyncFunc;
}

module.exports = {
  createRPC: createRPC,
  toAsync: toAsync,
};
