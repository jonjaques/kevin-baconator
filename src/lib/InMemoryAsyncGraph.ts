import { AbstractAsyncGraph, ISerialized } from "./AbstractAsyncGraph"

export type Node = string

export type Edge = [string, string, number]

export interface INode { id: string }

export interface IEdge { source: string, target: string, weight?: number }

export interface IVisited { [node: string]: boolean }

export type Serialized = ISerialized<INode, IEdge>

export class InMemoryAsyncGraph extends AbstractAsyncGraph<Node, Edge> {
  private edges: Map<Node, Node[]> = new Map()
  private edgeWeights: Map<string, number> = new Map()

  public async deserialize(serialized: Serialized): Promise<this> {
    return this.deserializeInternal(serialized)
  }

  protected async initializeInternal(serialized?: Serialized) {
    if (serialized) {
      await this.deserializeInternal(serialized)
    }

    return this
  }

  protected async serializeInternal(): Promise<Serialized> {
    const nodes = await this.nodesInternal()
    const serialized = {
      links: [] as IEdge[],
      nodes: nodes.map((id) => ({ id })),
    }

    for (const source of nodes) {
      const adjacent = await this.adjacentInternal(source)
      for (const target of adjacent) {
        serialized.links.push({
          source,
          target,
          weight: await this.getEdgeWeightInternal(source, target),
        })
      }
    }

    return serialized
  }

  protected async deserializeInternal(serialized: Serialized): Promise<this> {
    for (const sNode of serialized.nodes) {
      await this.addNodeInternal(sNode.id)
    }

    for (const sEdge of serialized.links) {
      await this.addEdgeInternal(sEdge.source, sEdge.target, sEdge.weight)
    }

    return this
  }

  protected deserializeNodeInternal(node: { id: string }) {
    return node.id
  }

  protected serializeNodeInternal(node: Node) {
    return { id: node }
  }

  protected async addNodeInternal(node: Node) {
    this.edges.set(node, await this.adjacentInternal(node))
    return node
  }

  protected async removeNodeInternal(node: Node) {
    const nodes = this.edges.keys()
    for (const u of nodes) {
      for (const v of this.edges.get(u)!) {
        if (v === node) {
          await this.removeEdgeInternal(u, v)
        }
      }
    }

    this.edges.delete(node)
  }

  protected async nodesInternal() {
    const nodeSet = new Set<string>()
    for (const node of this.edges.keys()) {
      nodeSet.add(node)
      for (const edge of this.edges.get(node)!) {
        nodeSet.add(edge)
      }
    }
    return Array.from(nodeSet.keys())
  }

  protected async adjacentInternal(node: Node) {
    if (!this.edges.has(node)) {
      return []
    }
    return this.edges.get(node)!
  }

  protected async setEdgeWeightInternal(u: string, v: string, weight: number) {
    const edge = this.encodeEdge(u, v)
    this.edgeWeights.set(edge, weight)
    return [u, v, weight] as Edge
  }

  protected async getEdgeWeightInternal(u: string, v: string) {
    const edge = this.encodeEdge(u, v)
    const weight = this.edgeWeights.get(edge)
    return weight === undefined ? 1 : weight
  }

  protected async addEdgeInternal(u: string, v: string, weight?: number) {
    await this.addNodeInternal(u)
    await this.addNodeInternal(v)
    const adjacent = await this.adjacentInternal(u)
    adjacent.push(v)

    if (weight !== undefined) {
      await this.setEdgeWeightInternal(u, v, weight)
    }

    return [u, v, weight] as Edge
  }

  protected async removeEdgeInternal(u: string, v: string) {
    if (this.edges.has(u)) {
      const adjacent = await this.adjacentInternal(u)
      this.edges.set(u, adjacent.filter((f) => v !== f))
    }
  }

  protected async indegreeInternal(node: Node) {
    let degree = 0

    for (const key of this.edges.keys()) {
      for (const link of this.edges.get(key)!) {
        if (link === node) {
          degree++
        }
      }
    }

    return degree
  }

  protected async outdegreeInternal(node: Node) {
    return this.edges.has(node) ? this.edges.get(node)!.length : 0
  }

  protected async depthFirstSearchInternal(sourceNodes?: Node[], includeSourceNodes?: boolean) {
    if (!sourceNodes) {
      sourceNodes = await this.nodesInternal()
    }

    if (typeof includeSourceNodes !== "boolean") {
      includeSourceNodes = true
    }

    const visited = new Set<string>()
    const nodeList: Node[] = []

    const visit = async (node: Node) => {
      if (!visited.has(node)) {
        visited.add(node)
        const adjacent = await this.adjacentInternal(node)
        for (const adj of adjacent) {
          await visit(adj)
        }
        nodeList.push(node)
      }
    }

    if (includeSourceNodes) {
      for (const node of sourceNodes) {
        await visit(node)
      }
    } else {
      for (const node of sourceNodes) {
        visited.add(node)
      }
      for (const node of sourceNodes) {
        const adjacent = await this.adjacentInternal(node)
        for (const adj of adjacent) {
          await visit(adj)
        }
      }
    }

    return nodeList
  }

  protected async topologicalSortInternal(sourceNodes?: Node[], includeSourceNodes?: boolean) {
    const search = await this.depthFirstSearchInternal(sourceNodes, includeSourceNodes)
    return search.reverse()
  }
  protected async shortestPathInternal(source: string, destination: string): Promise<Node[]> {

    // Upper bounds for shortest path weights from source.
    const d: { [node: string]: number } = {}

    // Predecessors.
    const p: { [node: string]: string } = {}

    // Poor man's priority queue, keyed on d.
    let q: { [node: string]: boolean } = {}

    const initializeSingleSource = async () => {
      (await this.nodesInternal()).forEach((node) => {
        d[node] = Infinity
      })
      if (d[source] !== Infinity) {
        throw new Error("Source node is not in the graph")
      }
      if (d[destination] !== Infinity) {
        throw new Error("Destination node is not in the graph")
      }
      d[source] = 0
    }

    // Adds entries in q for all nodes.
    const initializePriorityQueue = async () => {
      (await this.nodesInternal()).forEach((node) => {
        q[node] = true
      })
    }

    // Returns true if q is empty.
    const priorityQueueEmpty = () => {
      return Object.keys(q).length === 0
    }

    // Linear search to extract (find and remove) min from q.
    const extractMin = () => {
      let min = Infinity
      let minNode: string | undefined
      Object.keys(q).forEach((node) => {
        if (d[node] < min) {
          min = d[node]
          minNode = node
        }
      })
      if (minNode === undefined) {
        // If we reach here, there's a disconnected subgraph, and we're done.
        q = {}
        return null
      }
      delete q[minNode]
      return minNode
    }

    const relax = async (u: string, v: string) => {
      const w = await this.getEdgeWeightInternal(u, v)
      if (d[v] > d[u] + w) {
        d[v] = d[u] + w
        p[v] = u
      }
    }

    const dijkstra = async () => {
      await initializeSingleSource()
      await initializePriorityQueue()
      while (!priorityQueueEmpty()) {
        const u = extractMin()
        if (u !== null) {
          const adj = await this.adjacentInternal(u)
          for (const v of adj) {
            await relax(u!, v)
          }
        }
      }
    }

    // Assembles the shortest path by traversing the
    // predecessor subgraph from destination to source.
    const path = async () => {
      const nodeList: any = []
      let weight = 0
      let node = destination
      while (p[node]) {
        nodeList.push(node)
        weight += await this.getEdgeWeightInternal(p[node], node)
        node = p[node]
      }
      if (node !== source) {
        throw new Error("No path found")
      }
      nodeList.push(node)
      nodeList.reverse()
      nodeList.weight = weight
      return nodeList
    }

    await dijkstra()

    return path()
  }

  protected async lowestCommonAncestorsInternal(node1: Node, node2: Node): Promise<Node[]> {
    const node1Ancestors: Node[] = []
    const lcas: Node[] = []

    const CA1Visit = async (visited: IVisited, node: string): Promise<boolean> => {
      if (!visited[node]) {
        visited[node] = true
        node1Ancestors.push(node)
        if (node === node2) {
          lcas.push(node)
          return false // found - shortcut
        }

        const adjacent = await this.adjacentInternal(node)
        const adjacentVisited = await Promise.all(adjacent.map((a) => CA1Visit(visited, a)))
        return adjacentVisited.every((a) => a === true)
      } else {
        return true
      }
    }

    const CA2Visit = async (visited: IVisited, node: Node) => {
      if (!visited[node]) {
        visited[node] = true
        if (node1Ancestors.indexOf(node) >= 0) {
          lcas.push(node)
        } else if (lcas.length === 0) {
          const adjacent = await this.adjacentInternal(node)
          await Promise.all(adjacent.map((a) => CA2Visit(visited, a)))
        }
      }
    }

    if (await CA1Visit({}, node1)) { // No shortcut worked
      await CA2Visit({}, node2)
    }

    return lcas
  }
}
