let crawler = {};
crawler.map = (key, _value, callback) => {
  const pkgName = key;
  // if (!global.visited) {
  //   global.visited = new Set();
  // }
  // if (global.visited.has(pkgName)) {
  //   return callback(null, []);
  // }
  //console.log(`crawling: ${key}`);
  // global.visited.add(pkgName);
  const url = `https://registry.npmjs.org/${pkgName}`;
  let metadata;

  try {
    // uses a synchronous fetch package
    metadata = global.fetch(url).json(); // JSON object
  } catch (e) {
    console.log(`failed to crawl ${key}`);
    return callback(e, []);
  }

  // Delay (to be polite)
  // const delay = 1000;
  // const start = Date.now();
  // while (Date.now() - start < delay) {}

  const latestVersion = metadata["dist-tags"]?.latest;
  const latestMeta = metadata.versions?.[latestVersion] || {};
  const dependencyData = latestMeta.dependencies || {};
  const possibleDependencies = Object.keys(dependencyData);
  const disallowedCharacters = /[^a-z0-9-_]/i;
  const dependencies = possibleDependencies.filter(dep => !disallowedCharacters.test(dep));

  const extracted = {
    name: metadata.name,
    //version: latestVersion,
    description: metadata.description,
    dependencies: dependencies,
  };
  
  global.distribution.local.store.put(true, {key: pkgName, gid: "crawl"}, (e, v) => {
    if (e) console.log(`failed to record that ${pkgName} was crawled`, e, v);
    global.distribution.local.store.put(extracted, {key: pkgName, gid: "index"}, (e, v) => {
      if (e) console.log(`failed to store crawler data for ${pkgName}`, e, v);
      // Prepare list of new packages to crawl
      callback(null, dependencies.map(dep => ({[dep]: true})));
    });
  });
};

crawler.reduce = (key, values, callback) => {
  //console.log(`crawl-reducing ${key}`);
  if (!values || values.length === 0) {
    return callback(null, []);
  }
  
  global.distribution.crawl.store.get(key, (e, v) => {
    if (v) {
      return callback(null, null);
    }
    global.distribution.crawl.store.put(false, key, (e, v) => {
      if (e) console.log(`CRAWL REDUCER: failed to record ${key}`);
      callback(null, {[key]: false});
    })
  });
  
};

module.exports = crawler;
