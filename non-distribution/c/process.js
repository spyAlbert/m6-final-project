#!/usr/bin/env node

/*
# Convert input to a stream of non-stopword terms
# Usage: ./process.js < input > output

# Convert each line to one word per line, **remove non-letter characters**, make lowercase, convert to ASCII; then remove stopwords (inside d/stopwords.txt)
*/

const readline = require('readline');
const fs = require('fs');

const stopwords = new Set(
    fs
        .readFileSync('d/stopwords.txt', 'utf-8')
        .split('\n')
        .map((word) => word.trim())
        .filter((word) => word.length > 0),
);

const rl = readline.createInterface({
  input: process.stdin,
});

rl.on('line', (line) => {
  const text = line
      .replace(/[^A-Za-z]/g, ' ')
      .toLocaleLowerCase()
      .split(/\s+/)
      .filter((word) => !stopwords.has(word) && word.length > 0);
  text.forEach((word) => console.log(word));
});
