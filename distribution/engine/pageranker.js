/*
TODO: edge cases to be handled:
- function that filters out any “dangling” links before hand
- mr.exec will know total number of pages, so it can handle redistribution of 
  the rank of any "sinks"
- passing difference to orchestrator so it can determine when to stop
*/

const pageranker = {};

pageranker.sanitize = function(callback) {
  global.distribution.index.store.get(null, (e, allPkgs) => {
    global.distribution.index.comm.send(
      [allPkgs],
      { service: "pagerank", method: "sanitize" },
      (e, v) => {
        callback(e, {allPkgs: allPkgs});
      }
    );
  });
}

pageranker.map = function (packageName, packageInfo, callback) {
  //console.log(`PR MAP FOR ${packageName}`, packageInfo);
  try {
  const dependencies = packageInfo.dependencies
  const currentPagerank = packageInfo.pagerank;
  let dependencyWeight = 0;
  let carry = 0;
  if (dependencies.length === 0) {
    carry = currentPagerank;
  } else {
    dependencyWeight = (currentPagerank / dependencies.length);
  }
  const output = dependencies.map(dep => ({[dep]: dependencyWeight}));
  output.push({[packageName]: packageInfo});
  callback(null, {OUTPUT: output, CARRY: carry});
 } catch (e) {
  console.log("ERROR IN PR MAP", e);
  callback(null, null);
 }
}

pageranker.reduce = function(packageName, values, callback) {
  let carry = 0;
  if (values.CARRY !== undefined) {
    carry = values.CARRY;
    values = values.VALUES;
  }
  const dampingFactor = 0.85;
  const errorMargin = 0.01;
  const packageInfo = values.find(v => typeof v === "object");
  const weights = values.filter(v => typeof v === "number");
  const weightsSum = weights.reduce((sum, w) => sum + w, 0) + carry;
  const nextPagerank = (1 - dampingFactor) + (dampingFactor * weightsSum);
  const converging = Math.abs(nextPagerank - packageInfo.pagerank) <= errorMargin;
  packageInfo.pagerank = nextPagerank
  global.distribution.index.store.put(packageInfo, packageName, (e, v) => {
    if (e) {
      console.log(`failed to store pagerank results for ${packageName}`);
      callback(null, null);
    } else {
      callback(null, {OUTPUT: {[packageName]: nextPagerank}, CONVERGED: converging});
    }
  })
}

module.exports = pageranker;
