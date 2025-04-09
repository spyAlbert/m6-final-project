const distribution = require('../../config.js');
const id = distribution.util.id;
const crawler = require("./crawler.js");
const indexer = require("./indexer.js");

/*
    The local node will be the orchestrator.
*/
let localServer = null;

const nodes = [];
for (let i = 0; i < 10; i++) {
  nodes.push({
    ip: '127.0.0.1',
    port: 7110 + i,
  })
}

const groups = {
  all: {},
  index: {},
  query: {},
};

// Could potentially use this list of packages with the highest number of 
// dependencies: https://gist.github.com/anvaka/8e8fa57c7ee1350e3491
const rootPackages = [
  // package with medium number of dependencies (for simple testing)
  "express", 
  // packages with many dependencies (for stress testing)
  "khoom",
  "toyako",
  // "mhy",
  // "cncjs",
];

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

function setupCrawler(cb) {
  let numResponses = 0;
  function handleResponse(package, e, v) {
    if (e) console.log(`error preparing ${package} for crawling`, e);
    if (++numResponses === rootPackages.length) cb();
  }
  for (const pkgName of rootPackages) {
    distribution.all.store.put("null", pkgName, (e, v) => handleResponse(pkgName, e, v));
  }
}

function cleanUpNodes() {
  let numResponses = 0;
  function onStop(node, e, v) {
    if (e) console.log("error stopping node", node, e);
    if (++numResponses === nodes.length) localServer.close();
  }
  const remote = {service: 'status', method: 'stop'};
  for (const node of nodes) {
    const stopRemote = {...remote, node: node};
    distribution.local.comm.send([], stopRemote, (e, v) => onStop(node, e, v));
  }
}

function runEngine() {
  console.log("\n\n\n------SETTING UP------\n\n\n");
  distribution.node.start((server) => {
    localServer = server;
    startNodes(() => {
      setupGroups(() => {
        setupCrawler(() => {
          console.log("\n\n\n------STARTING CRAWLING------\n\n\n");
          const mrConfig = {
            map: crawler.map,
            reduce: crawler.reduce,
            rounds: 4, // TODO: figure out best number of rounds or make mapreduce detect when its found all (or a sufficient amount) of packages
            keys: rootPackages,
            mapOut: "index",
          };
          distribution.all.mr.exec(mrConfig, (e, v) => {
            // TODO: insert page rank calculations here
            console.log("\n\n\n------STARTING INDEXING------\n\n\n");
            indexer.performIndexing((e, v) => {
              console.log("\n\n\n------SHUTTING DOWN NODES------\n\n\n");
              cleanUpNodes();
            });
          });
        });
      });
    });
  });
}

runEngine();
