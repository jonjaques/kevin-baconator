import Yargs from "yargs"
import { InMemoryAsyncGraph } from "../lib/InMemoryAsyncGraph"
import { profile } from "../lib/log"
import { getNode } from "../lib/wikipedia"

// import Redis from "redis"

// const redis = Redis.createClient()

// redis.rpush("test", ["things"], (err, n) => {
//   console.log(n)

// })

export const program = Yargs
  .option("source", {
    alias: "s",
    default: "Kevin Bacon",
    description: 'The source of our search, by default "Kevin Bacon"',
    type: "string",
  })
  .option("target", {
    alias: "t",
    description: "The target of our search",
    type: "string",
  })
  .demandOption("target")
  .alias("help", "h")
  .help()
  .argv

main().catch((err) => {
  console.error(err)
})

async function main() {
  const [source, target] = await Promise.all([
    getNode(program.source),
    getNode(program.target),
  ])

  await Promise.all([
    source.fetchLinks(),
    target.fetchLinks(),
  ])

  const graph = new InMemoryAsyncGraph()

  const sEnd = profile("source.attachToGraph")
  await source.attachToGraph(graph)
  sEnd()

  const tEnd = profile("target.attachToGraph")
  await target.attachToGraph(graph)
  tEnd()

  const lcaEnd = profile("lowestCommonAncestors")
  console.log("lowestCommonAncestors", (await graph.lowestCommonAncestors(program.source, program.target)).length)
  lcaEnd()

  const tsEnd = profile("topologicalSort")
  console.log("topologicalSort", (await graph.topologicalSort()).length)
  tsEnd()

  const spEnd = profile("shortestPath")
  console.log("shortestPath", (await graph.shortestPath(program.source, program.target)).length)
  spEnd()
}
