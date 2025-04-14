const distribution = global.distribution;

/* 
  Currently, the crawler stores the package data in the all group.
  Each stored values has this structure:
  const extracted = {
    name: metadata.name,
    version: latestVersion,
    description: metadata.description,
    dependencies: latestMeta.dependencies || {},
      each dependency package name is a key, with the value being version
  };
*/

const indexer = {};

indexer.map = function (packageName, packageData) {
  const description = packageData.description;
  console.log(`index mapper: ${packageName}`);
  // 1) process text to extract words
  const words = description.replace(/[^A-Za-z]/g, " ")
                           .split(" ")
                           .filter(word => word !== "")
                           .map(word => word.toLowerCase())
                           .filter(word => !global.stopwords.has(word))
                           .map(word => global.stemmer.stem(word));

  // 2) combine words into n-grams
  const maxNGramSize = 3;
  const nGrams = new Set([packageName]); // include packageName
  for (let i = 0; i < words.length; i++) {
    let nGram = [];
    for (let offset = 0; (offset < maxNGramSize) && (i + offset < words.length); offset++) {
      nGram.push(words[i + offset]);
      nGrams.add(nGram.sort().join(" "));
      nGram = [...nGram];
    }
  }

  // 3) Construct output based on the inverted index
  const output = [];
  for (const nGram of nGrams) {
    output.push({[nGram]: {package: packageName, description: description, pagerank: packageData.pagerank}});
  }
  return output;
}

indexer.reduce = function (nGram, results) {
  console.log(`index reducer: ${nGram}`);
  const output = {};
  output[nGram] = results.sort((a, b) => b.pagerank - a.pagerank);
  return output;
}

module.exports = indexer;
