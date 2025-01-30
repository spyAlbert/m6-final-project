#!/usr/bin/env node

// combine process.js → stem.js → combine.js → invert.js → merge.js

const fs = require("fs");
const readline = require("readline");
const natural = require("natural");

const STOPWORDS_FILE = "d/stopwords.txt";
const GLOBAL_INDEX_FILE = "d/global-index.txt";
const CORPUS_FILE = "d/corpus.json";

// stopwords
const stopwords = new Set(
  fs
    .readFileSync(STOPWORDS_FILE, "utf-8")
    .split("\n")
    .map((w) => w.trim())
);

// preprocess
function processText(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z]/g, " ")
    .split(/\s+/)
    .filter((word) => word && !stopwords.has(word));
}

// stem
function stemWords(words) {
  return words.map((word) => natural.PorterStemmer.stem(word));
}

// n-grams
function generateNGrams(words) {
  const ngrams = new Set([...words]); // Unigrams
  for (let i = 0; i < words.length - 1; i++) {
    ngrams.add(`${words[i]}\t${words[i + 1]}`); // Bigrams
  }
  for (let i = 0; i < words.length - 2; i++) {
    ngrams.add(`${words[i]}\t${words[i + 1]}\t${words[i + 2]}`); // Trigrams
  }
  return Array.from(ngrams).sort();
}

// build Inverted Index
function buildInvertedIndex(ngrams, url) {
  const index = {};
  ngrams.forEach((ngram) => {
    if (!index[ngram]) index[ngram] = {};
    index[ngram][url] = (index[ngram][url] || 0) + 1;
  });
  return index;
}

// read corpus
function loadCorpus() {
  if (fs.existsSync(CORPUS_FILE)) {
    return JSON.parse(fs.readFileSync(CORPUS_FILE, "utf8"));
  }
  // totalDocs: total num of doc, df: number of documents that contain the term, docWordCount: num of words each url
  return { totalDocs: 0, df: {}, docWordCount: {} };
}

// read global index
function loadGlobalIndex() {
  if (!fs.existsSync(GLOBAL_INDEX_FILE)) return {};
  const index = {};
  fs.readFileSync(GLOBAL_INDEX_FILE, "utf8")
    .split("\n")
    .forEach((line) => {
      if (!line.trim()) return;
      const [term, ...entries] = line.split(" | ");
      index[term] = {};
      for (let i = 0; i < entries.length; i += 2) {
        index[term][entries[i]] = parseInt(entries[i + 1]);
      }
    });
  return index;
}

// merge and update df
function mergeIndexes(localIndex, url, totalWordsInDoc) {
  const globalIndex = loadGlobalIndex();
  const corpus = loadCorpus();
  // update doc num
  corpus.totalDocs += 1;
  corpus.docWordCount[url] = totalWordsInDoc;

  for (const term in localIndex) {
    if (!globalIndex[term]) {
      globalIndex[term] = {};
      corpus.df[term] = 0;
    }
    if (!(url in globalIndex[term])) {
      corpus.df[term] += 1; // update term df
    }
    globalIndex[term][url] =
      (globalIndex[term][url] || 0) + localIndex[term][url];
  }

  // write back
  const newIndex = Object.entries(globalIndex)
    .map(
      ([term, urls]) =>
        `${term.replace(/\s+/g, " ")} | ${Object.entries(urls)
          .map(([doc, tf]) => `${doc} ${tf}`)
          .join(" ")}`
    )
    .join("\n");

  fs.writeFileSync(GLOBAL_INDEX_FILE, newIndex);
  fs.writeFileSync(CORPUS_FILE, JSON.stringify(corpus, null, 2));

  const logIndex = Object.entries(globalIndex)
    .map(
      ([term, urls]) =>
        `${term.replace(/\s+/g, " ")} | ${Object.entries(urls)
          .map(
            ([doc, tf]) =>
              `${doc} ${computeTFIDF(term, tf / totalWordsInDoc, corpus)}`
          )
          .join(" ")}`
    )
    .join("\n");
  // print term, url and corresponding TF-IDF
  console.log(logIndex);
}

//  TF-IDF computing （used in ranking）
function computeTFIDF(term, tf, corpus) {
  const df = corpus.df[term] || 1; // avoid  dividing 0
  const idf = Math.log(corpus.totalDocs / df);
  return tf * idf;
}

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: node tfidf.js <document_url>");
    process.exit(1);
  }

  let rawText = "";
  const rl = readline.createInterface({ input: process.stdin });
  for await (const line of rl) rawText += line + "\n";

  const words = processText(rawText);
  const stemmedWords = stemWords(words);
  const ngrams = generateNGrams(stemmedWords);
  const localIndex = buildInvertedIndex(ngrams, url);

  // num of words in doc
  const totalWordsInDoc = words.length;

  mergeIndexes(localIndex, url, totalWordsInDoc);
}

main();
