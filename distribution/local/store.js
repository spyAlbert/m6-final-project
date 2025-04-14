/* Notes/Tips:

- Use absolute paths to make sure they are agnostic to where your code is running from!
  Use the `path` module for that.
*/
const id = require("../util/id");
const serialization = require("../util/serialization");
const path = require("path");
const fs = require("fs");
const PROJECT_ROOT = path.resolve(__dirname, "../../");
const STORE_PATH = path.resolve(PROJECT_ROOT, "store");

const dirName = id.getNID(global.nodeConfig);
const CURR_PATH = path.resolve(STORE_PATH, dirName);

// Ensure the store directory exists
if (!fs.existsSync(CURR_PATH)) {
  fs.mkdirSync(CURR_PATH, { recursive: true });
}

function put(state, configuration, callback) {
  callback = callback || function () {};
  let key = configuration;
  let finalPath = CURR_PATH;
  finalPath = path.resolve(CURR_PATH, "local");
  if (!fs.existsSync(finalPath)) {
    fs.mkdirSync(finalPath, { recursive: true });
  }
  if (configuration && typeof configuration !== "string") {
    key = configuration.key;
    const gid = configuration.gid;
    if (gid && gid !== "local") {
      finalPath = path.resolve(CURR_PATH, gid);
      if (!fs.existsSync(finalPath)) {
        fs.mkdirSync(finalPath, { recursive: true });
      }
    }
  }
  if (!key) {
    key = id.getID(state);
  } else {
    if(typeof key !== "string"){
      console.log(key)
    }
    key = key.replace(/[^a-zA-Z0-9]/g, "_");
  }
  const filePath = path.join(finalPath, key);
  fs.writeFileSync(filePath, serialization.serialize(state));
  callback(null, state);
  // fs.writeFile(filePath, serialization.serialize(state), (err) => {
  //   if (err) {
  //     return callback(new Error(err), null);
  //   }
  //   callback(null, state);
  // });
}

function get(configuration, callback) {
  callback = callback || function () {};
  let finalPath = CURR_PATH;
  finalPath = path.resolve(CURR_PATH, "local");
  if (!fs.existsSync(finalPath)) {
    fs.mkdirSync(finalPath, { recursive: true });
  }

  let key = configuration;
  if (configuration && typeof configuration !== "string") {
    key = configuration.key;

    const gid = configuration.gid;
    if (gid && gid !== "local") {
      finalPath = path.resolve(CURR_PATH, gid);
      if (!fs.existsSync(finalPath)) {
        fs.mkdirSync(finalPath, { recursive: true });
      }
    }
  }

  if (!key) {
    if (fs.existsSync(finalPath)) {
      return callback(null, fs.readdirSync(finalPath));
    } else {
      return callback(null, []);
    }
  }
  key = key.replace(/[^a-zA-Z0-9]/g, "_");
  const filePath = path.join(finalPath, key);
  try {
    const data = fs.readFileSync(filePath, "utf8");
    callback(null, serialization.deserialize(data));
  } catch (error) {
    callback(error, null);
  }
  // fs.readFile(filePath, (err, data) => {
  //   if (err) {
  //     return callback(new Error(err), null);
  //   } else {
  //     try {
  //       callback(null, serialization.deserialize(data));
  //     } catch (error) {
  //       callback(error, null);
  //     }
  //   }
  // });
}

function del(configuration, callback) {
  callback = callback || function () {};
  if (configuration) {
    get(configuration, (e, v) => {
      if (e) {
        return callback(e, null);
      }
      let key = configuration;
      let finalPath = CURR_PATH;
      finalPath = path.resolve(CURR_PATH, "local");
      if (!fs.existsSync(finalPath)) {
        fs.mkdirSync(finalPath, { recursive: true });
      }
      if (typeof configuration !== "string") {
        key = configuration.key;
        const gid = configuration.gid;
        if (gid && gid !== "local") {
          finalPath = path.resolve(CURR_PATH, gid);
          if (!fs.existsSync(finalPath)) {
            fs.mkdirSync(finalPath, { recursive: true });
          }
        }
      }
      const val = v;
      key = key.replace(/[^a-zA-Z0-9]/g, "_");
      const filePath = path.join(finalPath, key);
      fs.unlink(filePath, (err) => {
        if (err) {
          return callback(new Error(err), null);
        } else {
          return callback(null, val);
        }
      });
    });
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
