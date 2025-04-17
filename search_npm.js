process.removeAllListeners('warning'); // Remove default warning handlers

// Optional: Custom warning handler
process.on('warning', (warning) => {
  // Filter out specific warnings you want to ignore
  if (
    warning.name === 'DeprecationWarning' || 
    warning.name === 'ExperimentalWarning'
  ) {
    return;
  }
  console.warn(warning);
});

// Set environment variable to suppress experimental warnings
process.env.NODE_NO_WARNINGS = '1';

const query = require('./query.js');
const repl = require('repl');
const distribution = require("./config.js");

const id = distribution.util.id;
let localServer = null;

const {nodes} = require("./distribution/engine/nodes.js");
const groups = {
    query: {},
  };
  
function startNodes(cb) {
    let numResponses = 0;
    function onSpawn(node, e, v) {
      if (e) console.log("error spawning node", node, e);
      if (++numResponses === nodes.length) cb();
    }
    for (const node of nodes) {
      distribution.local.status.spawn(node, (e, v) => onSpawn(node, e, v));
    }
  };
  function setupGroups(cb) {
    // For now, put all nodes in all groups
    for (const node of nodes) {
      const sid = id.getSID(node);
      for (const group of Object.values(groups)) {
        group[sid] = node;
      }
    }
    let numResponses = 0;
    function onGroupAdd(gid, e, v) {
      if (e) console.log("error setting up group", gid, e);
      if (++numResponses === Object.keys(groups).length) cb();
    }
    for (const [gid, group] of Object.entries(groups)) {
      const config = { gid: gid };
      distribution.local.groups.put(config, group, (e1, v) => {
        distribution[gid].groups.put(config, group, (e2, v) => {
          onGroupAdd(gid, e1 || Object.keys(e2).length, v);
        });
      });
    }
  }

  function cleanUpNodes() {
    let numResponses = 0;
    function onStop(node, e, v) {
      if (e) console.log("error stopping node", node, e);
      if (++numResponses === nodes.length) localServer.close();
    }
    const remote = {service: 'status', method: 'stop'};
    let count = 0;
    for (const node of nodes) {
      const stopRemote = {...remote, node: node};
      distribution.local.comm.send([], stopRemote, (e, v) => {
        count++;
        onStop(node, e, v);
        if (count == nodes.length-1){
            process.exit(0);
        }
      }
        );
    }
  }
  distribution.node.start((server) => {
    let spellcheck = true;
    localServer = server;
    // start the nodes
    startNodes(() => {
        setupGroups(() => {
        console.log("Nodes started");
        console.log("Enter q to quit | Enter h for help");
        // get all keys
        distribution.query.store.get(null, (e, words) => {
          // console.log(words);
          repl.start({
              prompt: 'ngram> ',
              eval: (cmd, context, filename, callback) => {
                  const input = cmd.trim();
                              // Help command
            if (input === 'h') {
              const helpText = `
              Available commands:
              ------------------
              h          - Show this help message
              q          - Exit the program
              s          - Turn on/off the spellcheck
              <search term> - Search for packages matching the term

              Examples:
              ngram> express       - Search for packages related to 'express'
              ngram> q             - Exit the program
              ngram> h             - Show this help message
              `;
              callback(null, helpText);
              return;
          }
                  if (input === ""){
                    callback(null);
                    return
                  } 
                  if (input === "s"){
                    
                    spellcheck = !spellcheck;
                    let switchText = "spell check off";
                    if (spellcheck){
                      switchText = "spell check on";
                    }
                    callback(null,switchText);
                    return
                  } 
                  if (input === 'q') {
                      console.log('Exiting...');
                      cleanUpNodes();
              
                  }else {
                      const args = input.split(/\s+/);
                      console.log("inputs received:", args);
                      
                      query(args, words, spellcheck, (error, results) => {
                          if (error) {
                              callback(error);
                              return;
                          }
                          
                          // Format the results prettily
                          if (Array.isArray(results) && results.length > 0) {
                              console.log("\nSearch Results:");
                              console.log("---------------");
                              
                              results.forEach((result, index) => {
                                  console.log(`\nResult ${index + 1}:`);
                                  for (const [key, value] of Object.entries(result)) {
                                      console.log(`  ${key.padEnd(15)}: ${value}`);
                                  }
                              });
                              
                              console.log("\n");
                              callback(null, `${results.length} results found`);
                          } else {
                              callback(null, "No results found");
                          }
                      });
                  }
              }
          });
    });
  });
});
  });