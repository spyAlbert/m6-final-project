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
    nodes.push(global.nodeConfig);
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
    localServer = server;
    // start the nodes
    startNodes(() => {
        setupGroups(() => {
        console.log("Nodes started");
        // get all keys
        distribution.query.store.get(null, (e,words)=>{           
                repl.start({
                prompt: 'ngram> ',
                eval: (cmd, context, filename, callback) => {
                    const input = cmd.trim();
                
                    if (input === 'quit') {
                    console.log('Exiting...');
                    cleanUpNodes();
                    }else{
                    const args = input.split(/\s+/);
                    console.log("inputs received:", args);
                    // Call your function
                    query(args, words, callback);
                    }
                }
            });

        });
    });
  });
  });