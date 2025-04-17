const nodes = [];
for (let i = 0; i < 5; i++) {
  nodes.push({
    ip: "127.0.0.1",
    port: 7110 + i,
  });
}
module.exports = { nodes };
