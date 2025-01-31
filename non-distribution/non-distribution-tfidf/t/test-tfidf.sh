#!/bin/bash
T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}

url="https://cs.brown.edu/courses/csci1380/sandbox/1/level_1a/index.html"

if $DIFF <(cat "$T_FOLDER"/d/d1.txt | ./tfidf.js "$url" | sed 's/[[:space:]]//g' | sort) \
         <(cat "$T_FOLDER"/d/d2.txt | sed 's/[[:space:]]//g' | sort) >&2;
then
    echo "$0 success: TF-IDF results are identical"
    exit 0
else
    echo "$0 failure: TF-IDF results are not identical"
    exit 1
fi

# Test result depends on the corpus.json and global-index.txt in /d, tf-idf will be 0 at first run as idf = log(1/1), which should be 0