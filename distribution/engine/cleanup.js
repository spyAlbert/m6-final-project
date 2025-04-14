const distribution = require('../../config.js');
/*
    The local node will be the orchestrator.
*/
let localServer = null;

const { nodes } = require("./nodes.js");

function cleanUpNodes() {
  let numResponses = 0;
  function onStop(node, e, v) {
    if (e) console.log("error stopping node", node, e);
    if (++numResponses === nodes.length) {
      console.log("\n\n\n------FINISHED SHUTTING DOWN NODES------\n\n\n");
      localServer.close();
    }
  }
  const remote = {service: 'status', method: 'stop'};
  for (const node of nodes) {
    const stopRemote = {...remote, node: node};
    distribution.local.comm.send([], stopRemote, (e, v) => onStop(node, e, v));
  }
}

function cleanUp() {
  distribution.node.start((server) => {
    console.log("\n\n\n------SHUTTING DOWN NODES...------\n\n\n");
    localServer = server;
    cleanUpNodes();
  });
}

cleanUp();
