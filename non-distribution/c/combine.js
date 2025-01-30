#!/usr/bin/env node

const readline = require('readline');

// Read input from stdin
const rl = readline.createInterface({
  input: process.stdin,
});

// Helper function to generate n-grams
function generateBigrams(words) {
  const bigrams = [];
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.push(`${words[i]}\t${words[i + 1]}`);
  }
  return bigrams.sort();
}

function generateTrigrams(words) {
  const trigrams = [];
  for (let i = 0; i < words.length - 2; i++) {
    trigrams.push(`${words[i]}\t${words[i + 1]}\t${words[i + 2]}`);
  }
  return trigrams.sort();
}

// Read lines and process
const words = [];

rl.on('line', (line) => {
  words.push(line.trim());
});

// After all lines are processed, sort and print the n-grams
rl.on('close', () => {
  const unigrams = [...words].sort();
  const bigrams = generateBigrams(words);
  const trigrams = generateTrigrams(words);

  const allNGrams = [...unigrams, ...bigrams, ...trigrams];

  allNGrams.forEach((ngram) => console.log(ngram));
});
