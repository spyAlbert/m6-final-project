
const didYouMean = require('didyoumean2').default

// const fs = require('fs');
const {execSync} = require('child_process');
// const path = require('path');
const distribution = require("./config.js");

function close(){
  const remote = { service: "status", method: "stop" };
  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    console.log("close the server");
        localServer.close();
        process.exit(1);
  });   
}
function query_iteration_help(tries,list,total_res,cb){
  if (tries == list.length || total_res.size >= 4){
    // console.log("enters the callback of iteration");
    cb(null,total_res);
    return;
  }
  distribution.query.store.get(list[tries],(e,v)=>{
    for (let i in v){
      total_res.add(v[i]);
    }
    // console.log(e);
    tries++;
    query_iteration_help(tries,list,total_res,cb);
  });

}
function query(processedQuery, cb) {
    // Normalize, remove stopwords, and stem the query using existing components
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
  function main(args, cb){
    // const args = process.argv.slice(2); // Get command-line arguments
    if (args.length < 1) {
      console.error('Usage: ./query.js [query_strings...]');
      cb(null);
    }
    let processedQuery = execSync(
      `echo "${args}" | ./non-distribution/c/process.sh | ./non-distribution/c/stem.js | tr "\r\n" "  "`,
      {encoding: 'utf-8'},
  ).trim();
    query(processedQuery, (e,outSet, n_grams)=>{
      if (outSet.size < 4){
        distribution.query.store.get(null, (e,v)=>{
          processedQuery = processedQuery.replace(/[^a-zA-Z0-9]/g, "_");
          // console.log(v);
          let words = v;
          for(let n_gram of n_grams){
            n_gram = n_gram.replace(/[^a-zA-Z0-9]/g, "_");
            words = words.filter(word => word !== n_gram); //make sure I don't get what I have processed
            // console.log("here",words, n_gram);
          }
          const closest = didYouMean(processedQuery, words);
          if (closest!=null){
            query(closest,(e,spellSet,n_grams)=>{
              console.log("after spell check");
              const concatenatedSet = new Set([...outSet, ...spellSet]);
            //   console.log(concatenatedSet);
              cb(e,concatenatedSet);
            })
          }
        })
      }else{
        console.log("direct output");
        // console.log(outSet);
        cb(e,outSet);  
      }
    });   
  }

  module.exports = main;