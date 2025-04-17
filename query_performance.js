process.removeAllListeners('warning'); // Remove default warning handlers

const n_grams = ['amazingli',
  'amd_modul',
  'api',
  'architectur_data_store',
  'architectur_flux',
  'ascii_progress',
  'authent',
  'authent_node_unobtrus',
  'base_react_webpack',
  'browser_codebas_split',
  'browser_fluent_node',
  'browser_js_node',
  'browser_node',
  'bundl_codebas_multipl',
  'bundl_demand_load',
  'call_function',
  'camelcas_convert_underscor',
  'cm',
  'commander',
  'commonj_ecmascript',
  'compon_data',
  'compon_inherit',
  'compress_middlewar',
  'compression',
  'condit',
  'condition',
  'convert',
  'cookie',
  'cor_js',
  'creat',
  'css_custom',
  'data_form_multipart',
  'data_store',
  'dateformat',
  'deep_librari_recurs',
  'deep_recurs',
  'deepmerge',
  'demand_load_support',
  'depth',
  'depth_limit',
  'domain_host_virtual',
  'driver',
  'driver_js_node',
  'driver_mongodb',
  'driver_mongodb_node',
  'eleg',
  'emitt_engin',
  'encod',
  'encod_exclud',
  'encod_percent_url',
  'event',
  'excel_levithan',
  'file_json_jsx',
  'file_preprocess',
  'final',
  'final_js_node',
  'final_js_respond',
  'final_respond',
  'framework_minimalist',
  'fresh',
  'fresh_respons',
  'friendli_gener_uniqu',
  'graphicsmagick_imagemagick_node',
  'handl_middlewar',
  'history',
  'intuit',
  'javascript_merg_object',
  'javascript_object_string',
  'js_node_packag',
  'js_node_solut',
  'levithan_packag_steven',
  'librari',
  'limit',
  'loader_preprocess',
  'loader_preprocess_support',
  'loader_support',
  'logger_middlewar_request',
  'logger_request',
  'manag',
  'manipul',
  'memoiz',
  'merge',
  'middlewar_simpl_style',
  'minimalist_unopinion',
  'mkdir',
  'modul',
  'mongodb',
  'multer',
  'node',
  'node_port',
  'object_return_true',
  'os',
  'os_python',
  'parser',
  'parseurl',
  'passport',
  'percent_url',
  'qs',
  'redi',
  'rescope',]
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

// latency helper function
function latency_helper(tries, args, words, cb){
  tries++;
  if (tries == args.length){
      cb();
      return;
  }
  const input = args[tries].split(/\s+/);
  query(input, words, true, (e,v)=>{
      latency_helper(tries, args, words, cb);
  })
}

  distribution.node.start((server) => {
    // let totalSpellCheckTime = 0;
    try {
      // start the nodes
    localServer = server;
    // start the nodes
    startNodes(() => {
        setupGroups(() => {
        console.log("Nodes started");
        // get all keys
        distribution.query.store.get(null, (e, words) => {
          const startTime = performance.now();
          let count = 0;
          for (let i = 0; i < n_grams.length; i++){
            const args = n_grams[i].split(/\s+/);
            query(args, words, true, (error, results) => {
              // totalSpellCheckTime += spellchecktime/1000;
              count++;
              if (count == n_grams.length){
                const endTime = performance.now();
                const totalTime = (endTime-startTime)/1000
                console.log(`Time elapsed is ${totalTime}s  Number of query is ${n_grams.length}  total throughput is ${n_grams.length/totalTime}`)
                // console.log(`For spellcheck, Time elapsed is ${totalSpellCheckTime}s  Number of query is ${n_grams.length}  ${totalSpellCheckTime/n_grams.length} second per query`);
                const startTime2 = performance.now();
                // start the latency
                latency_helper(0,n_grams,words,(e,v)=>{
                  try {
                  const endTime2 = performance.now();
                  const totalTime2 = endTime2-startTime2;
                  console.log('query latency');
                  console.log(`Total Time is ${totalTime2/1000} second`);
                  console.log(`latency of query is ${totalTime2/1000/n_grams.length} second per query`);
                  cleanUpNodes();
                  }
                  catch{
                    cleanUpNodes();
                  }
                })
              }
            });
          }

    });
  });
});
    }
    catch{
      cleanUpNodes();
    }
});