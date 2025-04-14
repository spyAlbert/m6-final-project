const distribution = global.distribution;
const pagerank = {};

pagerank.sanitize = function (allPackages, callback) {
  distribution.local.store.get({gid: "pagerank", key: null}, (e, localPackages) => {
    if (localPackages.length === 0) callback(e, []);
    const validPackages = new Set(localPackages);
    let numSanitized = 0;
    function afterSanitization(pkg, e, v) {
      if (e) console.log(`failed to sanitize ${pkg} for pagerank`, e);
      if (++numSanitized === localPackages.length) {
        callback(e, v);
      }
    }
    for (const pkg of localPackages) {
      console.log(`prepping ${pkg} for pageranking`)
      distribution.local.store.get({gid: "pagerank", key: pkg}, (e, packageInfo) => {
        if (e) console.log(`ERROR WHEN FETCHING PAGERANK DATA for ${pkg} on node ${global.nodeConfig.port}`, e);
        const dependencies = Object.keys(packageInfo.dependencies) || [];
        let sanitizedDeps = dependencies.filter(dep => validPackages.has(dep));
        if (sanitizedDeps.length === 0) {
          sanitizedDeps = allPackages;
        }
        packageInfo.dependencies = sanitizedDeps;
        packageInfo.pagerank = 1;
        distribution.local.store.put(
          packageInfo, 
          {gid: "pagerank", key: pkg}, 
          (e, v) => afterSanitization(pkg, e, v)
        );
      });
    }
  });
}

module.exports = pagerank;
