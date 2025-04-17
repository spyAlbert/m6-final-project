const distribution = global.distribution;
const pagerank = {};

pagerank.sanitize = function (allPackages, callback) {
  distribution.local.store.get({gid: "index", key: null}, (e, localPackages) => {
    if (localPackages.length === 0) callback(e, []);
    const validPackages = new Set(allPackages);
    let numSanitized = 0;
    function afterSanitization(pkg, e, v) {
      if (e) console.log(`failed to sanitize ${pkg} for pagerank`, e);
      if (++numSanitized === localPackages.length) {
        // can use this value to number of dependencies, number of packages with 0 dependencies, etc.
        callback(e, v);
      }
    }
    for (const pkg of localPackages) {
      //console.log(`prepping ${pkg} for pageranking`)
      distribution.local.store.get({gid: "index", key: pkg}, (e, packageInfo) => {
        if (e || !packageInfo) {
          console.log(`ERROR WHEN FETCHING PAGERANK DATA for ${pkg} on node ${global.nodeConfig.port}`, e, packageInfo, localPackages);
          afterSanitization(pkg, e);
        } 
        const dependencies = packageInfo.dependencies || [];
        let sanitizedDeps = dependencies.filter(dep => validPackages.has(dep));
        // Uncomment this section  to use "add edges to all sink nodes" implementation.
        // if (sanitizedDeps.length === 0) {
        //   sanitizedDeps = allPackages;
        // }
        packageInfo.dependencies = sanitizedDeps;
        packageInfo.pagerank = 1;
        distribution.local.store.put(
          packageInfo, 
          {gid: "index", key: pkg}, 
          (e, v) => afterSanitization(pkg, e, v)
        );
      });
    }
  });
}

module.exports = pagerank;
