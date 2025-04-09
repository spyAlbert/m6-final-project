#!/usr/bin/env node


// const fs = require('fs');
const query = require('./query.js');
// const path = require('path');
const distribution = require("./config.js");
const id = distribution.util.id;

const queryGroup = {};

let localServer = null;

const n1 = { ip: "127.0.0.1", port: 7110 };
const n2 = { ip: "127.0.0.1", port: 7111 };
const n3 = { ip: "127.0.0.1", port: 7112 };

function close(){
  const remote = { service: "status", method: "stop" };
  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    console.log("close the server");
        localServer.close();
        process.exit(1);
  });   
}
// function get_smallest_edit_distance(input, n_grams){
//   let final_result = "";
//   for (let n_gram of n_grams){
//     let n = len(input);
//     let m = len(n_gram);
//     const dp = Array.from(Array(n), () => new Array(m).fill(0));
//     for i in range(n+1):
//         dp[0][i]=i
//     for j in range(m+1):
//         dp[j][0]=j
//     for i in range(1,m+1):
//         for j in range(1,n+1):
//             if word1[j-1]==word2[i-1]:
//                 dp[i][j] = 1 + min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]-1)
//             else:
//                 dp[i][j] = 1 + min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1])
//     return dp[-1][-1]
//   }
// }
  // Print the matching lines from the global index file
  // console.log(searchResults.trim());

// const indexFile = '../d/global-index.txt'; // Path to the global index file

// query(args);


  queryGroup[id.getSID(n1)] = n1;

  const startNodes = (cb) => {
    distribution.local.status.spawn(n1, (e, v) => {
          cb();
    });
  };

  distribution.node.start((server) => {
    localServer = server;

    const queryConfig = { gid: "query" };
    startNodes(() => {
      distribution.local.groups.put(queryConfig, queryGroup, (e, v) => {
        distribution.query.groups.put(queryConfig, queryGroup, (e, v) => {
          distribution.query.store.put(["https://cs.brown.edu/courses/csci1380/sandbox/1/level_1a/level_2b/index.html 1", "next_link 1"],"abil exist multipl", (e,v)=>{
            distribution.query.store.put(["https://cs.brown.edu/courses/csci1380/sandbox/1/level_1a/level_2b/index.html 1"],"abil exist", (e,v)=>{
              
              distribution.query.store.put(["a differen link 100"],"exist", (e,v)=>{
                distribution.query.store.put(["https://cs.brown.edu/courses/csci1380/sandbox/1/level_1a/level_2g/index.html 3"],"apil exust multip", (e,v)=>{
                  query(process.argv.slice(2),(e,v)=>{
                    console.log(v);
                    close();});
              });
              });
            })
      
          })
        });
      });
    });
  });
