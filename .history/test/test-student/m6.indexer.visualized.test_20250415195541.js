const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
jest.setTimeout(600000); 



// Configuration for different node counts to test
const testScenarios = [1, 2, 3, 4, 5].map(n => ({
  nodeCount: n,
  configFile: `test-config-${n}-nodes.js`,
  results: null
}));

// Directory to store visualization outputs
const outputDir = path.join(__dirname, '..', '..', 'test-visualizations');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Function to run indexer test and capture output
async function runIndexerTest(nodeCount) {
  try {
    // Modify nodes.js to use specified node count
    const nodesContent = const nodes = [];
for (let i = 0; i < ${nodeCount}; i++) {
  nodes.push({
    ip: '127.0.0.1',
    port: 7110 + i,
  });
}
module.exports = { nodes };
    await fs.promises.writeFile('distribution/engine/nodes.js', nodesContent);

    // Run the test and capture output using exec from child_process/promises
    const { exec } = require('child_process').promises;
    const { stdout } = await exec('node test/test-student/m6.indexer.test.js');
    const output = stdout.toString();
    
    // Extract metrics from output
    const latencyMatch = output.match('/Latency: (\d+)ms/');
    const throughputMatch = output.match('/Throughput: (\d+\.\d+) operations\/second/');
    
    return {
      latency: latencyMatch ? parseInt(latencyMatch[1]) : 0,
      throughput: throughputMatch ? parseFloat(throughputMatch[1]) : 0
    };
  } catch (error) {
    console.error(`Error running test with ${nodeCount} nodes:`, error.message);
    return { latency: 0, throughput: 0 };
  }
}

// Function to generate and save charts
async function generateCharts(results) {
  const width = 800;
  const height = 600;
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });
  
  // Latency chart
  const latencyConfig = {
    type: 'line',
    data: {
      labels: results.map(r => `${r.nodeCount} nodes`),
      datasets: [{
        label: 'Latency (ms)',
        data: results.map(r => r.latency),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Indexer Latency by Node Count'
        },
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  };

  // Throughput chart
  const throughputConfig = {
    type: 'line',
    data: {
      labels: results.map(r => `${r.nodeCount} nodes`),
      datasets: [{
        label: 'Throughput (ops/sec)',
        data: results.map(r => r.throughput),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Indexer Throughput by Node Count'
        },
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  };

  try {
    // Generate and save charts
    const latencyImage = await chartJSNodeCanvas.renderToBuffer(latencyConfig);
    const throughputImage = await chartJSNodeCanvas.renderToBuffer(throughputConfig);
    
    await Promise.all([
      fs.promises.writeFile(path.join(outputDir, 'latency-chart.png'), latencyImage),
      fs.promises.writeFile(path.join(outputDir, 'throughput-chart.png'), throughputImage)
    ]);
    
    console.log(`Charts saved to ${outputDir}`);
  } catch (chartError) {
    console.error('Error generating charts:', chartError);
    throw chartError;
  }
}

// Main test function wrapped in Jest test block
test("M6: Visualized Index Performance", async () => {
  // Run tests for all scenarios
  for (const scenario of testScenarios) {
    console.log(`Running test with ${scenario.nodeCount} nodes...`);
    scenario.results = await runIndexerTest(scenario.nodeCount);
    console.log(`Results:`, scenario.results);
    expect(scenario.results).toBeDefined();
    expect(scenario.results.latency).toBeGreaterThanOrEqual(0);
    expect(scenario.results.throughput).toBeGreaterThanOrEqual(0);
  }

  // Generate charts
  await generateCharts(testScenarios.map(s => ({
    nodeCount: s.nodeCount,
    ...s.results
  })));

  // Verify charts were created
  const latencyChartPath = path.join(outputDir, 'latency-chart.png');
  const throughputChartPath = path.join(outputDir, 'throughput-chart.png');
  expect(fs.existsSync(latencyChartPath)).toBe(true);
  expect(fs.existsSync(throughputChartPath)).toBe(true);
});
