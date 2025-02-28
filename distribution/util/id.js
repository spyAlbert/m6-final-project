/** @typedef {import("../types.js").Node} Node */

const assert = require("assert");
const crypto = require("crypto");

// The ID is the SHA256 hash of the JSON representation of the object
/** @typedef {!string} ID */

/**
 * @param {any} obj
 * @return {ID}
 */
function getID(obj) {
  const hash = crypto.createHash("sha256");
  hash.update(JSON.stringify(obj));
  return hash.digest("hex");
}

/**
 * The NID is the SHA256 hash of the JSON representation of the node
 * @param {Node} node
 * @return {ID}
 */
function getNID(node) {
  node = { ip: node.ip, port: node.port };
  return getID(node);
}

/**
 * The SID is the first 5 characters of the NID
 * @param {Node} node
 * @return {ID}
 */
function getSID(node) {
  return getNID(node).substring(0, 5);
}

function getMID(message) {
  const msg = {};
  msg.date = new Date().getTime();
  msg.mss = message;
  return getID(msg);
}

function idToNum(id) {
  const n = parseInt(id, 16);
  assert(!isNaN(n), "idToNum: id is not in KID form!");
  return n;
}

// Binary Search
function findFirstLarge(kid, nids) {
  let left = 0,
    right = nids.length - 1;
  while (right - left > 1) {
    let mid = Math.floor(left + (right - left) / 2);
    if (nids[mid] === kid) return mid;
    if (nids[mid] > kid) {
      right = mid;
    } else {
      left = mid + 1;
    }
  }
  if (nids[left] > kid) return left;
  if (nids[right] > kid) return right;
  return 0;
}

function naiveHash(kid, nids) {
  nids.sort();
  return nids[idToNum(kid) % nids.length];
}

function consistentHash(kid, nids) {
  const mapToNid = {};
  const nidNums = nids.map((nid) => {
    let num = idToNum(nid);
    mapToNid[num] = nid;
    return num;
  });
  nidNums.sort((a, b) => a - b);
  const index = findFirstLarge(idToNum(kid), nidNums);
  const nidNum = nidNums[index];
  return mapToNid[nidNum];
}

function rendezvousHash(kid, nids) {
  let mapToNid = {};
  const concatenatingList = nids.map((nid) => {
    let concat = kid.concat(nid);
    let hashNumConcat = idToNum(getID(concat));
    mapToNid[hashNumConcat] = nid;
    return hashNumConcat;
  });
  concatenatingList.sort((a, b) => a - b);
  return mapToNid[concatenatingList[concatenatingList.length - 1]];
}

module.exports = {
  getID,
  getNID,
  getSID,
  getMID,
  naiveHash,
  consistentHash,
  rendezvousHash,
};
