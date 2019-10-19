// If using from the NPM package, this line would be
// const graph = require("graph-data-structure");
import assert from "assert"
import { InMemoryAsyncGraph as Graph, Serialized } from "../lib/InMemoryAsyncGraph"
import { comesBefore, contains, withWeight } from "./utils"

describe("Graph", () => {
  describe("Data structure", () => {
    it("Should add nodes and list them.", async () => {
      const graph = new Graph()
      await graph.addNode("a")
      await graph.addNode("b")
      expect(await graph.nodes()).toHaveLength(2)
      expect(await graph.nodes()).toContain("a")
      expect(await graph.nodes()).toContain("b")
      expect(await graph.serialize()).toMatchSnapshot()
    })

    it("Should remove nodes.", async () => {
      const graph = new Graph()
      await graph.addNode("a")
      await graph.addNode("b")
      await graph.removeNode("a")
      await graph.removeNode("b")
      expect(await graph.nodes()).toHaveLength(0)
    })

    it("Should add edges and query for adjacent nodes.", async () => {
      const graph = new Graph()
      await graph.addNode("a")
      await graph.addNode("b")
      await graph.addEdge("a", "b")
      expect(await graph.adjacent("a")).toHaveLength(1)
      expect(await graph.adjacent("a")).toMatchObject(["b"])
      expect(await graph.serialize()).toMatchSnapshot()
    })

    it("Should implicitly add nodes when edges are added.", async () => {
      const graph = new Graph()
      await graph.addEdge("a", "b")

      expect(await graph.adjacent("a")).toHaveLength(1)
      expect(await graph.adjacent("a")).toMatchObject(["b"])
      expect(await graph.nodes()).toHaveLength(2)
      expect(await graph.nodes()).toContain("a")
      expect(await graph.nodes()).toContain("b")
    })

    it("Should remove edges.", async () => {
      const graph = new Graph()
      await graph.addEdge("a", "b")
      await graph.removeEdge("a", "b")
      expect(await graph.adjacent("a")).toHaveLength(0)
    })

    it("Should not remove nodes when edges are removed.", async () => {
      const graph = new Graph()
      await graph.addEdge("a", "b")
      await graph.removeEdge("a", "b")
      expect(await graph.nodes()).toHaveLength(2)
      expect(await graph.nodes()).toContain("a")
      expect(await graph.nodes()).toContain("b")
    })

    it("Should remove outgoing edges when a node is removed.", async () => {
      const graph = new Graph()
      await graph.addEdge("a", "b")
      await graph.removeNode("a")
      expect(await graph.adjacent("a")).toHaveLength(0)
    })

    it("Should remove incoming edges when a node is removed.", async () => {
      const graph = new Graph()
      await graph.addEdge("a", "b")
      await graph.removeNode("b")
      expect(await graph.adjacent("a")).toHaveLength(0)
    })

    it("Should compute indegree.", async () => {
      const graph = new Graph()
      await graph.addEdge("a", "b")
      expect(await graph.indegree("a")).toBe(0)
      expect(await graph.indegree("b")).toBe(1)

      await graph.addEdge("c", "b")
      expect(await graph.indegree("b")).toBe(2)
    })

    it("Should compute outdegree.", async () => {
      const graph = new Graph()
      await graph.addEdge("a", "b")
      expect(await graph.outdegree("a")).toBe(1)
      expect(await graph.outdegree("b")).toBe(0)

      await graph.addEdge("a", "c")
      expect(await graph.outdegree("a")).toBe(2)
    })

  })

  describe("Algorithms", () => {

    // This example is from Cormen et al. "Introduction to Algorithms" page 550
    it("Should compute topological sort.", async () => {

      const graph = new Graph()

      // Shoes depend on socks.
      // Socks need to be put on before shoes.
      await graph.addEdge("socks", "shoes")

      await graph.addEdge("shirt", "belt")
      await graph.addEdge("shirt", "tie")
      await graph.addEdge("tie", "jacket")
      await graph.addEdge("belt", "jacket")
      await graph.addEdge("pants", "shoes")
      await graph.addEdge("underpants", "pants")
      await graph.addEdge("pants", "belt")

      const sorted = await graph.topologicalSort()

      expect(comesBefore(sorted, "pants", "shoes")).toBe(true)
      expect(comesBefore(sorted, "underpants", "pants")).toBe(true)
      expect(comesBefore(sorted, "underpants", "shoes")).toBe(true)
      expect(comesBefore(sorted, "shirt", "jacket")).toBe(true)
      expect(comesBefore(sorted, "shirt", "belt")).toBe(true)
      expect(comesBefore(sorted, "belt", "jacket")).toBe(true)

      expect(sorted).toHaveLength(8)

      expect(await graph.serialize()).toMatchSnapshot()
    })

    it("Should compute topological sort, excluding source nodes.", async () => {
      const graph = new Graph()
      await graph.addEdge("a", "b")
      await graph.addEdge("b", "c")
      const sorted = await graph.topologicalSort(["a"], false)
      expect(sorted).toHaveLength(2)
      expect(sorted[0]).toBe("b")
      expect(sorted[1]).toBe("c")
      expect(await graph.serialize()).toMatchSnapshot()
    })

    it("Should compute topological sort tricky case.", async () => {
      const graph = new Graph()     //      a
      //     / \
      await graph.addEdge("a", "b") //    b   |
      await graph.addEdge("a", "d") //    |   d
      await graph.addEdge("b", "c") //    c   |
      await graph.addEdge("d", "e") //     \ /
      await graph.addEdge("c", "e") //      e

      const sorted = await graph.topologicalSort(["a"], false)
      assert.equal(sorted.length, 4)
      assert(contains(sorted, "b"))
      assert(contains(sorted, "c"))
      assert(contains(sorted, "d"))
      assert.equal(sorted[sorted.length - 1], "e")

      assert(comesBefore(sorted, "b", "c"))
      assert(comesBefore(sorted, "b", "e"))
      assert(comesBefore(sorted, "c", "e"))
      assert(comesBefore(sorted, "d", "e"))

      expect(await graph.serialize()).toMatchSnapshot()
    })

    it("Should exclude source nodes with a cycle.", async () => {
      const graph = new Graph()
      await graph.addEdge("a", "b")
      await graph.addEdge("b", "c")
      await graph.addEdge("c", "a")

      const sorted = await graph.topologicalSort(["a"], false)
      assert.equal(sorted.length, 2)
      assert.equal(sorted[0], "b")
      assert.equal(sorted[1], "c")

      expect(await graph.serialize()).toMatchSnapshot()
    })

    it("Should exclude source nodes with multiple cycles.", async () => {
      const graph = new Graph()
      await graph.addEdge("a", "b")
      await graph.addEdge("b", "a")

      await graph.addEdge("b", "c")
      await graph.addEdge("c", "b")

      await graph.addEdge("a", "c")
      await graph.addEdge("c", "a")

      const sorted = await graph.topologicalSort(["a", "b"], false)
      assert(!contains(sorted, "b"))

      expect(await graph.serialize()).toMatchSnapshot()
    })

    it("Should compute lowest common ancestors.", async () => {
      const graph = new Graph()

      await graph.addEdge("a", "b")
      await graph.addEdge("b", "d")
      await graph.addEdge("c", "d")
      await graph.addEdge("b", "e")
      await graph.addEdge("c", "e")
      await graph.addEdge("d", "g")
      await graph.addEdge("e", "g")
      await graph.addNode("f")

      assert.deepStrictEqual(await graph.lowestCommonAncestors("a", "a"), ["a"])
      assert.deepStrictEqual(await graph.lowestCommonAncestors("a", "b"), ["b"])
      assert.deepStrictEqual(await graph.lowestCommonAncestors("a", "c"), ["d", "e"])
      assert.deepStrictEqual(await graph.lowestCommonAncestors("a", "f"), [])
    })
  })

  describe("Edge cases and error handling", () => {

    it("Should return empty array of adjacent nodes for unknown nodes.", async () => {
      const graph = new Graph()
      assert.equal((await graph.adjacent("a")).length, 0)
      assert.equal((await graph.nodes()).length, 0)
    })

    it("Should do nothing if removing an edge that does not exist.", async () => {
      const graph = new Graph()
      await graph.removeEdge("a", "b")
    })

    it("Should return indegree of 0 for unknown nodes.", async () => {
      const graph = new Graph()
      assert.equal(await graph.indegree("z"), 0)
    })

    it("Should return outdegree of 0 for unknown nodes.", async () => {
      const graph = new Graph()
      assert.equal(await graph.outdegree("z"), 0)
    })

  })

  describe("Serialization", () => {
    let serialized: Serialized

    function checkSerialized(graph: Serialized) {
      assert.equal(graph.nodes.length, 3)
      assert.equal(graph.links.length, 2)

      assert.equal(graph.nodes[0].id, "a")
      assert.equal(graph.nodes[1].id, "b")
      assert.equal(graph.nodes[2].id, "c")

      assert.equal(graph.links[0].source, "a")
      assert.equal(graph.links[0].target, "b")
      assert.equal(graph.links[1].source, "b")
      assert.equal(graph.links[1].target, "c")
    }

    it("Should serialize a await graph.", async () => {
      const graph = new Graph()
      await graph.addEdge("a", "b")
      await graph.addEdge("b", "c")
      serialized = await graph.serialize()
      checkSerialized(serialized)
    })

    it("Should deserialize a await graph.", async () => {
      const graph = new Graph()
      await graph.deserialize(serialized)
      checkSerialized(await graph.serialize())
    })

    it("Should chain deserialize a await graph.", async () => {
      const graph = new Graph()
      await graph.deserialize(serialized)
      checkSerialized(await graph.serialize())
    })
  })

  describe("Edge Weights", () => {

    it("Should set and get an edge weight.", async () => {
      const graph = new Graph()
      await graph.addEdge("a", "b", 5)
      assert.equal(await graph.getEdgeWeight("a", "b"), 5)
    })

    it("Should set edge weight via setEdgeWeight.", async () => {
      const graph = new Graph()
      await graph.addEdge("a", "b")
      await graph.setEdgeWeight("a", "b", 5)
      assert.equal(await graph.getEdgeWeight("a", "b"), 5)
    })

    it("Should return weight of 1 if no weight set.", async () => {
      const graph = new Graph()
      await graph.addEdge("a", "b")
      assert.equal(await graph.getEdgeWeight("a", "b"), 1)
    })

  })

  describe("Dijkstra's Shortest Path Algorithm", () => {

    it("Should compute shortest path on a single edge.", async () => {
      const graph = new Graph()
      await graph.addEdge("a", "b")
      assert.deepEqual(await graph.shortestPath("a", "b"), withWeight(["a", "b"], 1))
    })

    it("Should compute shortest path on two edges.", async () => {
      const graph = new Graph()
      await graph.addEdge("a", "b")
      await graph.addEdge("b", "c")
      assert.deepEqual(await graph.shortestPath("a", "c"), withWeight(["a", "b", "c"], 2))
    })

    it("Should compute shortest path on example from Cormen text (p. 659).", async () => {
      const graph = new Graph()
      await graph.addEdge("s", "t", 10)
      await graph.addEdge("s", "y", 5)
      await graph.addEdge("t", "y", 2)
      await graph.addEdge("y", "t", 3)
      await graph.addEdge("t", "x", 1)
      await graph.addEdge("y", "x", 9)
      await graph.addEdge("y", "z", 2)
      await graph.addEdge("x", "z", 4)
      await graph.addEdge("z", "x", 6)

      assert.deepEqual(await graph.shortestPath("s", "z"), withWeight(["s", "y", "z"], 5 + 2))
      assert.deepEqual(await graph.shortestPath("s", "x"), withWeight(["s", "y", "t", "x"], 5 + 3 + 1))
    })

    it("Should throw error if source node not in await graph.", async () => {
      const graph = new Graph()
      await graph.addEdge("b", "c")
      expect(graph.shortestPath("a", "c")).rejects.toThrowError(/Source node/)
    })

    it("Should throw error if dest node not in await graph.", async () => {
      const graph = new Graph()
      await graph.addEdge("b", "c")
      expect(graph.shortestPath("b", "g")).rejects.toThrowError(/Destination node/)
    })

    it("Should throw error if no path exists.", async () => {
      const graph = new Graph()
      await graph.addEdge("a", "b")
      await graph.addEdge("d", "e")
      expect(graph.shortestPath("a", "e")).rejects.toThrowError(/No path/)
    })

    it("Should be robust to disconnected subgraphs.", async () => {
      const graph = new Graph()
      await graph.addEdge("a", "b")
      await graph.addEdge("b", "c")
      await graph.addEdge("d", "e")
      const shortedPath = await graph.shortestPath("a", "c")
      assert.deepEqual(shortedPath, withWeight(["a", "b", "c"], 2))
    })
  })
})
