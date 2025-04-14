/*
TODO: edge cases to be handled:
- function that filters out any “dangling” links before hand
- mr.exec will know total number of pages, so it can handle redistribution of 
  the rank of any "sinks"
- passing difference to orchestrator so it can determine when to stop
*/

const pageranker = {};

pageranker.sanitize = function(callback) {
  global.distribution.pagerank.store.get(null, (e, allPkgs) => {
    console.log("FETCHED ALL PACKAGE NAMES:", allPkgs);
    global.distribution.pagerank.comm.send(
      [allPkgs],
      { service: "pagerank", method: "sanitize" },
      (e, v) => {
        callback(e, allPkgs);
      }
    );
  });
}

pageranker.map = function (packageName, packageInfo) {
  console.log(`pagerank mapper: ${packageName}`, packageInfo.pagerank);
  const dependencies = packageInfo.dependencies
  const currentPagerank = packageInfo.pagerank;
  const dependencyWeight = (currentPagerank / dependencies.length);
  const output = dependencies.map(dep => ({[dep]: dependencyWeight}));
  output.push({[packageName]: packageInfo});
  return output;
}

// TODO: consider adding total distributed sink weight as an arg here instead of adding edges
pageranker.reduce = function(packageName, values) {
  const dampingFactor = 0.85;
  const errorMargin = 0.01;
  const packageInfo = values.find(v => typeof v === "object");
  const weights = values.filter(v => typeof v === "number");
  const weightsSum = weights.reduce((sum, w) => sum + w, 0);
  const nextPagerank = (1 - dampingFactor) + (dampingFactor * weightsSum);
  const converging = Math.abs(nextPagerank - packageInfo.pagerank) <= errorMargin;
  packageInfo.pagerank = nextPagerank
  console.log(`pagerank reducer: ${packageName}`, nextPagerank);
  return {RESULT: {[packageName]: packageInfo}, CONVERGING: converging};
}

module.exports = pageranker;
