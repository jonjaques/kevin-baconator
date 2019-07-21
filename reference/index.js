const Yargs = require("yargs");
const Inquirer = require("inquirer");
const Wiki = require("wikijs").default;
const Graph = require("graph-data-structure");
const { union } = require("lodash");
const Chalk = require("chalk");
const { performance } = require("perf_hooks");

const wiki = Wiki();
const program = Yargs.argv;
const query = program._.join(" ");

const graph = Graph();
let params;

process.on("SIGTERM", () => process.exit(0));

main().catch(err => {
  console.log(err);
  return process.exit(1);
});

function getParams() {
  return Inquirer.prompt([
    { name: "source", message: `Who you lookin' fer?` },
    { name: "target", message: `Kevin Bacon?`, default: "Kevin Bacon" }
  ]);
}

async function main() {
  params = await getParams();
  const now = performance.now();

  let gen = 0;
  let nextGen = [params.source, params.target];

  let path = null;

  while (!path) {
    const currentGen = [...nextGen];
    nextGen = await processGeneration(gen, currentGen);
    path = findPath();
    gen++;
    await delay(1000);
  }

  if (path) {
    let chords = path.slice(0).map(c => Chalk.bold(c));
    console.log(
      `${Chalk.green("Found path")}: ${chords.join(
        Chalk.gray(" -> ")
      )}, ${Chalk.cyan("Bacon Factor")}: ${Chalk.bold(chords.length - 1)}`
    );
  }

  debugPerf("total", now);
  process.exit(0);
}

function debugPerf(name, ts) {
  const now = performance.now();
  const s = Chalk.bold.gray(((now - ts) / 1000).toFixed(2) + "s");
  console.log(Chalk.gray(`${Chalk.bold.gray(name)}: completed in ${s}`));
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function findPath() {
  try {
    return graph.shortestPath(params.source, params.target);
  } catch (err) {
    return null;
  }
}

async function processGeneration(gen, nodes) {
  const now = performance.now();
  console.log(
    Chalk.gray(
      `processing generation ${Chalk.yellow(gen)}; size: ${Chalk.yellow(
        nodes.length
      )}`
    )
  );
  const results = [];
  for (let node of nodes) {
    try {
      const nodeNow = performance.now();
      console.log(Chalk.gray(`processing node ${Chalk.bold(node)}`));
      const links = await getPageLinks(node);
      if (!hasNode(node)) {
        graph.addNode(node);
      }

      links.forEach(edge => graph.addEdge(node, edge));
      results.push(links);

      serializeGraph();

      debugPerf(`node ${node}`, nodeNow);
      await delay(20);

      if (findPath()) {
        return results;
      }
    } catch (err) {
      console.log(Chalk.red(`Error while fetching ${node}`, err));
    }
  }

  debugPerf(`generation ${gen}`, now);
  return union(...results)//.sort();
}

function serializeGraph() {
  const Path = require("path");
  const Fs = require("fs");
  Fs.writeFileSync(
    Path.resolve("data/graph.json"),
    JSON.stringify(graph.serialize(), null, 2)
  );
}

function getPageLinks(id) {
  return wiki.find(id).then(page => page.links());
}

function logGraph() {
  console.log(graph.serialize());
}

function hasNode(id) {
  return graph.nodes().includes(id);
}
