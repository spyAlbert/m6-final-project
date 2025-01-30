#!/usr/bin/env node

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function formatLine(ngram, url, count) {
  return `${ngram} | ${count} | ${url}`;
}

const url = process.argv[2];

const ngrams = [];

// preprocess
rl.on('line', (line) => {
  // `grep -v $'\t+$'`
  const cleanedLine = line.replace(/\t+$/, '');
  const formatLine = cleanedLine.replace(/\s+/g, ' ');

  // store
  ngrams.push(formatLine);
});

rl.on('close', () => {
  // count
  const countMap = new Map();
  ngrams.forEach((ngram) => {
    countMap.set(ngram, (countMap.get(ngram) || 0) + 1);
  });

  const sortedNgrams = Array.from(countMap.entries())
      .sort()
      .map(([ngram, count]) => {
      // formating
        return formatLine(ngram, url, count);
      });

  // print
  sortedNgrams.forEach((line) => {
    console.log(line);
  });
});
