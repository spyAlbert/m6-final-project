
const {
  default: didYouMean,
  ReturnTypeEnums,
  ThresholdTypeEnums,
} = require('didyoumean2')
// const fs = require('fs');
const {execSync} = require('child_process');
// const path = require('path');
const distribution = require("./config.js");

function query_iteration_help(tries,list,total_res,cb){
  // console.log(list)
  // console.log(total_res)
  if (tries == list.length || total_res.size >= 4){
    // console.log("enters the callback of iteration");
    cb(null,total_res);
    return;
  }
  distribution.query.store.get(list[tries],(e,v)=>{
    // console.log("input to store get is")
    // console.log(list[tries])
    // console.log("query store get")
    // console.log("output of store get is")
    // console.log(v);
    // console.log("above is the result from query store get")
    for (let i in v){
      const trimed = {Package:v[i].package,Description:v[i].description}
      total_res.add(JSON.stringify(trimed));
    }
    // console.log(e);
    tries++;
    query_iteration_help(tries,list,total_res,cb);
  });

}
function query(processedQuery, cb) {
    // Normalize, remove stopwords, and stem the query using existing components
    // console.log("processed string is")
    // console.log(processedQuery);
    // Search the global index using the processed query string
    // const searchResults = execSync(`grep "${processedQuery}" ${indexFile}`, {
    //   encoding: 'utf-8',
    // });

    const final_out = new Set();
    const splited = processedQuery.split(" ");
    const n_grams = []
    
    for (let i = splited.length; i >= 1; i--) {
      for (let j = 0; j <= splited.length-i ; j++) {
        const sublist = splited.slice(j, j+i).join(" ");
        n_grams.push(sublist);
      }
    }
    // console.log(n_grams);
    query_iteration_help(0,n_grams, final_out, (e,v)=>{
      // console.log("in the query callback")
      // console.log(e);
      // console.log(v);
      cb(e,v,n_grams);
    })

}
  // Print the matching lines from the global index file
  // console.log(searchResults.trim());
  // words is all keys of this group
  function main(args, words, cb){
    // console.log("input is ", args);
    // console.log("words is ", words);
    if (args.length < 1) {
      console.error('Usage: ./query.js [query_strings...]');
      cb(null);
    }
    let processedQuery = execSync(
      `echo "${args}" | ./non-distribution/c/process.sh | ./non-distribution/c/stem.js | tr "\r\n" "  "`,
      {encoding: 'utf-8'},
  ).trim();
  if (!processedQuery){
    processedQuery = args.join("_");
  }
  // console.log("processed query is", processedQuery);
    query(processedQuery, (e,outSet, n_grams)=>{
      // console.log(outSet);
      if (outSet.size < 4){
          processedQuery = processedQuery.replace(/[^a-zA-Z0-9]/g, "_");
          // console.log(v);
          for(let n_gram of n_grams){
            n_gram = n_gram.replace(/[^a-zA-Z0-9]/g, "_");
            words = words.filter(word => word !== n_gram); //make sure I don't get what I have processed
            // console.log("here",words, n_gram);
          }
          // const closest = didYouMean(processedQuery, words);
          // const closest = didYouMean(processedQuery, words);
          const closests = didYouMean(processedQuery, words,   {
            returnType: ReturnTypeEnums.ALL_CLOSEST_MATCHES
          });
          // console.log(closests);
          let count = 0;
          let resSet = new Set();
          for (let item of outSet){
            resSet.add(JSON.parse(item));
          }
          for (const word of closests){
            query(word,(e,spellSet,n_grams)=>{
              // console.log("after spell check");
              // concatenatedSet = new Set([...outSet, ...spellSet]);
            //   console.log(concatenatedSet);
            count++;
              for (let item of spellSet){
                resSet.add(JSON.parse(item));
              }
              if (count == closests.length){
                cb(e,[...resSet]);  
              }
            })
          }
            // const resSet = new Set();
            // query(closest,(e,spellSet,n_grams)=>{
            //     // console.log("after spell check");
            //     const concatenatedSet = new Set([...outSet, ...spellSet]);
            //   //   console.log(concatenatedSet);
            //     for (let item of concatenatedSet){
            //       resSet.add(JSON.parse(item));
            //     }
            //     cb(e,[...resSet]);  
            // })
      }else{
        // console.log("direct output");
        const resSet = new Set();
        for (let item of outSet){
          resSet.add(JSON.parse(item));
        }
        
        cb(e,[...resSet]);  
      }
    });   
  }

  module.exports = main;