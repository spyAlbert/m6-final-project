/*
    Checklist:

    1. Serialize strings
    2. Serialize numbers
    3. Serialize booleans
    4. Serialize (non-circular) Objects
    5. Serialize (non-circular) Arrays
    6. Serialize undefined and null
    7. Serialize Date, Error objects
    8. Serialize (non-native) functions
    9. Serialize circular objects and arrays
    10. Serialize native functions
*/
let uuid = 0;

const fs = require("fs");
const os = require("os");
const basicNatives = {
  "console.log": console.log,
  "fs.readFile": fs.readFile,
  "os.type": os.type,
  "fs.writeFile": fs.writeFile,
  "fs.open": fs.open,
};
const nativeModules = {};

const builtin = require("repl")._builtinLibs;
// preprocess all builtin Libs
builtin.forEach((modName) => {
  nativeModules[modName] = require(modName);
});

function areFunctionsEqual(fn1, fn2) {
  return fn1.name === fn2.name && fn1.prototype === fn2.prototype;
}

function isNative(func) {
  return func.toString().includes("[native code]");
}

function serialize(object) {
  // a map from object to it's id
  const map = new Map();
  return serializeWithMap(object, map);
}

function findNative(fnName) {
  for (const modName in nativeModules) {
    const module = nativeModules[modName];
    for (const key of Object.getOwnPropertyNames(module)) {
      if (module[key] && areFunctionsEqual(fnName, module[key])) {
        console.log(modName);
        return { module: modName, id: key };
      }
    }
  }
  return null;
}
function serializeWithMap(object, map) {
  //cehck for basic 5 natives
  if (object === null) {
    return JSON.stringify({ type: "Null", value: "null" });
  }
  if (object === undefined) {
    return JSON.stringify({ type: "Undefined", value: "undefined" });
  }
  if (typeof object === "number") {
    return JSON.stringify({ type: "Number", value: object.toString() });
  }
  if (typeof object === "string") {
    return JSON.stringify({ type: "String", value: object });
  }
  if (typeof object === "boolean") {
    return JSON.stringify({ type: "Boolean", value: object.toString() });
  }
  if (typeof object === "function") {
    // check for basic 5 natives first
    for (const key in basicNatives) {
      if (basicNatives[key] === object) {
        return JSON.stringify({
          type: "BasicNative",
          value: key,
        });
      }
    }

    // check whether it's a global of fs native obj
    for (const key of Object.getOwnPropertyNames(global)) {
      if (global[key] === object) {
        return JSON.stringify({
          type: "GlobalNative",
          value: key,
        });
      }
    }

    for (const key of Object.getOwnPropertyNames(fs)) {
      if (fs[key] === object) {
        return JSON.stringify({
          type: "FSNative",
          value: key,
        });
      }
    }

    // check whether it's native in general
    if (isNative(object)) {
      const nativeFun = findNative(object);
      if (nativeFun) {
        return JSON.stringify({
          type: "Native",
          module: nativeFun.module,
          id: nativeFun.id,
        });
      }
    }
    // not a native function
    return JSON.stringify({ type: "Function", value: object.toString() });
  }
  if (object instanceof Date) {
    return JSON.stringify({ type: "Date", value: object.toISOString() });
  }
  if (object instanceof Error) {
    const errMessage = {
      message: object.message,
      stack: object.stack,
    };
    return JSON.stringify({ type: "Error", value: JSON.stringify(errMessage) });
  }

  if (typeof object === "object") {
    // no need to serialize if alread visited
    if (map.has(object)) {
      return JSON.stringify({ type: "Reference", value: map.get(object) });
    }
    const currId = uuid;
    map.set(object, uuid);
    uuid++;
    if (Array.isArray(object)) {
      let array = [];
      for (const item of object) {
        array.push(serializeWithMap(item, map));
      }
      const result = JSON.stringify({
        type: "Array",
        id: currId,
        value: JSON.stringify(array),
      });
      return result;
    } else {
      // other normal object rather than Date, Error and Array
      let objStr = {};
      for (const key of Object.keys(object)) {
        objStr[key] = serializeWithMap(object[key], map);
      }
      return JSON.stringify({
        type: "Object",
        id: currId,
        value: JSON.stringify(objStr),
      });
    }
  }
}

function deserialize(string) {
  // a map from id to object
  const map = new Map();
  return deserializeWithMap(string, map);
}

function deserializeWithMap(string, map) {
  const object = JSON.parse(string);
  switch (object.type) {
    case "Null":
      return null;
    case "Undefined":
      return undefined;
    case "Number":
      return Number(object.value);
    case "String":
      return object.value;
    case "Boolean":
      return object.value === "true";
    case "BasicNative":
      return basicNatives[object.value];
    case "GlobalNative":
      return global[object.value];
    case "FSNative":
      return fs[object.value];
    case "Native":
      return nativeModules[object.module][object.id];
    case "Function":
      return eval("(" + object.value + ")");
    case "Reference":
      return map.get(object.value);
    case "Array":
      const arrayStr = JSON.parse(object.value);
      let array = [];
      map.set(object.id, array);
      for (const item of arrayStr) {
        array.push(deserializeWithMap(item, map));
      }
      return array;
    case "Date":
      return new Date(object.value);
    case "Error":
      const errorObj = JSON.parse(object.value);
      const error = new Error(errorObj.message);
      error.stack = errorObj.stack;
      return error;
    case "Object":
      const objStr = JSON.parse(object.value);
      let obj = {};
      map.set(object.id, obj);
      for (const key of Object.keys(objStr)) {
        obj[key] = deserializeWithMap(objStr[key], map);
      }
      return obj;
    default:
      return undefined;
  }
}

module.exports = {
  serialize: serialize,
  deserialize: deserialize,
};
