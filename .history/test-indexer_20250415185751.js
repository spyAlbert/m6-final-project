const indexer = require('./distribution/engine/indexer.js');
const distribution = require('./config.js');

// Mock global dependencies needed by indexer
global.stopwords = new Set(['the', 'and', 'of']);
global.stemmer = {
  stem: word => word // Simple stemmer that does nothing
};

// Sample package data for testing
const testPackages = [
  {
    name: 'express',
    description: 'Fast, unopinionated, minimalist web framework for Node.js',
    pagerank: 0.9
  },
  {
    name: 'lodash',
    description: 'Lodash modular utilities.',
    pagerank: 0.8
  },
  {
    name: 'react',
    description: 'React is a JavaScript library for building user interfaces.',
    pagerank: 0.95
  }
];

console.log('Starting indexer performance test...\n');

// Test map function
console.log('Testing indexer.map():');
const mapResults = [];
testPackages.forEach(pkg => {
  console.time(`map-${pkg.name}`);
  const result = indexer.map(pkg.name, pkg);
  console.timeEnd(`map-${pkg.name}`);
  mapResults.push(...result);
});

// Test reduce function
console.log('\nTesting indexer.reduce():');
const nGrams = {};
mapResults.forEach(item => {
  const nGram = Object.keys(item)[0];
  if (!nGrams[nGram]) {
    nGrams[nGram] = [];
  }
  nGrams[nGram].push(item[nGram]);
});

Object.entries(nGrams).forEach(([nGram, results]) => {
  console.time(`reduce-${nGram}`);
  const reduced = indexer.reduce(nGram, results);
  console.timeEnd(`reduce-${nGram}`);
});

console.log('\nIndexer performance test completed.');
