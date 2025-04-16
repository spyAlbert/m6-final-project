let crawler = {};
crawler.map = (key, _value) => {
  const pkgName = key;
  const pkgID = distribution.util.id.getID(pkgName);
  if (!global.visited) {
    global.visited = new Set();
  }
  if (global.visited.has(pkgName)) return [];
  console.log(`crawling: ${key}`);
  global.visited.add(pkgName);
  const url = `https://registry.npmjs.org/${pkgName}`;
  let metadata;

  try {
    metadata = global.fetch(url).json(); // JSON object
  } catch (e) {
    return [];
  }

  // // Delay (to be polite)
  // const delay = 1000;
  // const start = Date.now();
  // while (Date.now() - start < delay) {}

  const latestVersion = metadata["dist-tags"]?.latest;
  const latestMeta = metadata.versions?.[latestVersion] || {};

  const extracted = {
    name: metadata.name,
    version: latestVersion,
    description: metadata.description,
    dependencies: latestMeta.dependencies || {},
  };

  // Prepare list of new packages to crawl
  const deps = Object.keys(extracted.dependencies);
  return { output: { [pkgName]: deps }, forStoring: extracted };
};

crawler.reduce = (key, values) => {
  const parentPkg = key;
  const parentID = distribution.util.id.getID(parentPkg);
  values = values.flat();

  // const depsKey = `${parentID}+deps`;
  // const depsInfo = { pkg: parentPkg, deps: values };

  // distribution.all.store.put(depsInfo, depsKey, (e, _v) => {
  //   if (e) return null;
  // });

  // Format for next iteration
  const out = [];
  const seen = new Set();

  for (const dep of values) {
    if (dep && !seen.has(dep) && dep !== parentPkg) {
      out.push({ [dep]: parentPkg });
      seen.add(dep);
    }
  }

  return out;
};

module.exports = crawler;
