const { performance } = require('perf_hooks');
const distribution = require('../../config.js');
const id = distribution.util.id;
const indexGroup = {};

let localServer = null;
const { nodes } = require("../../distribution/engine/nodes");

class IndexerPerformanceTest {
  constructor() {
    this.operationLatencies = [];
    this.mrOperationTimes = [];
    this.stats = {
      store: {
        min: Infinity,
        max: 0,
        avg: 0,
        total: 0
      },
      mapReduce: {
        min: Infinity,
        max: 0,
        avg: 0,
        total: 0
      }
    };
  }

  generateTestData() {
    const commonPhrases = [
      // System related
      "distributed system processing",
      "cloud computing platform",
      "data management framework",
      "real time analytics",
      "high performance computing",
      // Architecture related
      "microservice architecture",
      "scalable infrastructure",
      "fault tolerant design",
      "load balancing system",
      "service mesh implementation",
      // Data related
      "big data processing",
      "stream processing engine",
      "data pipeline framework",
      "database optimization",
      "cache management system",
      // Performance related
      "performance monitoring tools",
      "resource allocation system",
      "throughput optimization",
      "latency reduction framework",
      "concurrent processing engine"
    ];

    const uniquePhrases = [
      // Feature descriptions
      "custom implementation details",
      "specific feature set",
      "unique approach method",
      "novel solution design",
      "innovative architecture",
      "specialized components",
      "advanced algorithms",
      "optimized protocols",
      "enhanced security",
      "improved reliability",
      // Technical characteristics
      "async processing",
      "event driven",
      "message queue",
      "load balanced",
      "fault tolerant",
      "highly available",
      "horizontally scaled",
      "vertically scaled",
      "containerized deployment",
      "serverless architecture",
      // Integration capabilities
      "third party integration",
      "api gateway",
      "service discovery",
      "circuit breaker",
      "rate limiting",
      "data validation",
      "error handling",
      "logging system",
      "monitoring tools",
      "alerting mechanism",
      // Development features
      "test coverage",
      "continuous integration",
      "automated deployment",
      "version control",
      "documentation system",
      "code quality",
      "dependency management",
      "build automation",
      "release management",
      "configuration system",
      // Business functions
      "business logic",
      "workflow automation",
      "report generation",
      "data analytics",
      "user management",
      "access control",
      "audit logging",
      "backup system",
      "recovery mechanism",
      "maintenance tools"
    ];

    return Array.from({length: 10000}, (_, i) => {
      const description = 
        commonPhrases[i % commonPhrases.length] + " " +
        commonPhrases[(i + 7) % commonPhrases.length] + " " +
        commonPhrases[(i + 13) % commonPhrases.length] + " " +
        uniquePhrases[Math.floor(Math.random() * uniquePhrases.length)] + " " +
        uniquePhrases[Math.floor(Math.random() * uniquePhrases.length)] + " " +
        `version ${i}`;

      const packageName = `package${i}`;
      return { 
        [packageName]: {
          package: packageName,
          description: description,
          pagerank: (i % 10) + 1
        }
      };
    });
  }

  recordOperationLatency(latency) {
    this.operationLatencies.push(latency);
    this.stats.store.min = Math.min(this.stats.store.min, latency);
    this.stats.store.max = Math.max(this.stats.store.max, latency);
    this.stats.store.avg = this.operationLatencies.reduce((a, b) => a + b) / this.operationLatencies.length;
  }

  recordMapReduceTime(time) {
    this.mrOperationTimes.push(time);
    this.stats.mapReduce.min = Math.min(this.stats.mapReduce.min, time);
    this.stats.mapReduce.max = Math.max(this.stats.mapReduce.max, time);
    this.stats.mapReduce.avg = this.mrOperationTimes.reduce((a, b) => a + b) / this.mrOperationTimes.length;
  }

  generateReport() {
    return {
      store: {
        ...this.stats.store,
        operationCount: this.operationLatencies.length,
        throughput: (this.operationLatencies.length * 1000) / this.stats.store.total
      },
      mapReduce: {
        ...this.stats.mapReduce,
        operationCount: this.mrOperationTimes.length,
        throughput: (this.mrOperationTimes.length * 1000) / this.stats.mapReduce.total
      }
    };
  }

  async runTest() {
    return new Promise((resolve, reject) => {
      const indexer = require("../../distribution/engine/indexer.js");
      const dataset = this.generateTestData();
      
      const storeStartTime = performance.now();
      let cntr = 0;

      // Store data and measure individual operation latencies
      dataset.forEach((o) => {
        const opStartTime = performance.now();
        const key = Object.keys(o)[0];
        const value = o[key];
        
        distribution.index.store.put(value, key, (e, v) => {
          const opEndTime = performance.now();
          this.recordOperationLatency(opEndTime - opStartTime);
          
          cntr++;
          if (cntr === dataset.length) {
            this.stats.store.total = performance.now() - storeStartTime;
            
            // Start MapReduce after all data is stored
            const mrStartTime = performance.now();
            const keys = dataset.map(o => Object.keys(o)[0]);
            
            const mrIndexConfig = {
              map: indexer.map,
              reduce: indexer.reduce,
              keys: keys,
            };

            distribution.index.mr.exec(mrIndexConfig, (e, v) => {
              const mrEndTime = performance.now();
              this.stats.mapReduce.total = mrEndTime - mrStartTime;
              this.recordMapReduceTime(mrEndTime - mrStartTime);
              
              resolve(this.generateReport());
            });
          }
        });
      });
    });
  }
}

// Performance thresholds
const MAX_SINGLE_OP_LATENCY = 10; // ms
const MAX_AVG_LATENCY = 5; // ms
const MIN_THROUGHPUT = 200; // ops/sec

jest.setTimeout(3600000);

test("M6: indexer performance test", (done) => {
  const perfTest = new IndexerPerformanceTest();

  // Setup test environment
  const startNodes = (cb) => {
    const spawnNext = (index) => {
      if (index >= nodes.length) {
        cb();
        return;
      }
      distribution.local.status.spawn(nodes[index], (e, v) => {
        spawnNext(index + 1);
      });
    };
    spawnNext(0);
  };

  // Start test
  distribution.node.start((server) => {
    localServer = server;

    nodes.forEach(node => {
      indexGroup[id.getSID(node)] = node;
    });

    startNodes(() => {
      const indexConfig = { gid: "index" };
      distribution.local.groups.put(indexConfig, indexGroup, (e, v) => {
        distribution.index.groups.put(indexConfig, indexGroup, async (e, v) => {
          try {
            const report = await perfTest.runTest();
            
            // Verify performance metrics
            expect(report.store.max).toBeLessThan(MAX_SINGLE_OP_LATENCY);
            expect(report.store.avg).toBeLessThan(MAX_AVG_LATENCY);
            expect(report.store.throughput).toBeGreaterThan(MIN_THROUGHPUT);
            
            // Log detailed performance report
            console.log('Performance Report:');
            console.log(JSON.stringify(report, null, 2));
            
            done();
          } catch (error) {
            done(error);
          }
        });
      });
    });
  });
});

// Cleanup
afterAll((done) => {
  const remote = {service: 'status', method: 'stop'};
  const stopNodes = (index) => {
    if (index >= nodes.length) {
      localServer.close();
      done();
      return;
    }
    remote.node = nodes[index];
    distribution.local.comm.send([], remote, (e, v) => {
      stopNodes(index + 1);
    });
  };
  stopNodes(0);
});
