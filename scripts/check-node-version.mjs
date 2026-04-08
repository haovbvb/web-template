const major = Number.parseInt(process.versions.node.split('.')[0], 10);

if (Number.isNaN(major) || major < 20) {
  console.error(`Node.js ${process.versions.node} is not supported. Require Node.js >= 20.`);
  process.exit(1);
}

console.log(`Node.js ${process.versions.node} OK (>= 20).`);
