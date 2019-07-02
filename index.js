const Yargs = require("yargs");
const Inquirer = require("inquirer");
const Wiki = require("wikijs").default;
const Graph = require("graph-data-structure");
const { union } = require("lodash");

const wiki = Wiki();
const program = Yargs.argv;
const query = program._.join(" ");

const graph = Graph();

process.on("SIGTERM", () => process.exit(0));

main().catch(err => {
  console.log(err);
  return process.exit(1);
});

async function main() {
  let elapsed = console.time("total");
  let gen = 0;
  let nextGen = ["Kevin Bacon", query];

  let path = null;

  while (!path) {
    const currentGen = [...nextGen];
    nextGen = await processGeneration(gen, currentGen);
    gen++;
    path = findPath();
    await delay(1000);
  }

  if (path) {
    let chords = path.slice(0);
    console.log(
      `Found path: ${chords.join(" -> ")}, Bacon Factor: ${chords.length - 1}`
    );
  }
  process.exit(0);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function findPath() {
  try {
    return graph.shortestPath(query, "Kevin Bacon");
  } catch (err) {
    return null;
  }
}

async function processGeneration(gen, nodes) {
  console.time(`generation ${gen}`);
  console.log(`starting generation ${gen}; size: ${nodes.length}`);
  const results = [];
  for (let node of nodes) {
    try {
      console.log(`processing node ${node}`);
      const links = await getPageLinks(node);
      if (!hasNode(node)) {
        graph.addNode(node);
      }

      links.forEach(edge => graph.addEdge(node, edge));
      serializeGraph();
      await delay(20);
      if (findPath()) {
        return results;
      }
      results.push(links);
    } catch (err) {
      console.log(`Error while fetching ${node}`, err);
    }
  }
  console.timeEnd(`generation ${gen}`);
  return union(...results).sort();
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
