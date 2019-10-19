
export interface IVisited { [node: string]: boolean }

export interface ISerialized {
  nodes: Array<{ id: string }>,
  links: Array<{ source: string, target: string, weight: number }>
}

// A graph data structure with depth-first search and topological sort.
export class InMemoryGraph {

  // The adjacency list of the graph.
  // Keys are node ids.
  // Values are adjacent node id arrays.
  private edges: { [node: string]: string[] } = {}

  // The weights of edges.
  // Keys are string encodings of edges.
  // Values are weights (numbers).
  private edgeWeights: { [edge: string]: number } = {}

  constructor(serialized?: ISerialized) {
    // If a serialized graph was passed into the constructor, deserialize it.
    if (serialized) {
      this.deserialize(serialized)
    }
  }

  // Adds a node to the graph.
  // If node was already added, this function does nothing.
  // If node was not already added, this function sets up an empty adjacency list.
  public addNode(node: string) {
    this.edges[node] = this.adjacent(node)
    return this
  }

  // Removes a node from the graph.
  // Also removes incoming and outgoing edges.
  public removeNode(node: string) {

    // Remove incoming edges.
    Object.keys(this.edges).forEach((u) => {
      this.edges[u].forEach((v) => {
        if (v === node) {
          this.removeEdge(u, v)
        }
      })
    })

    // Remove outgoing edges (and signal that the node no longer exists).
    delete this.edges[node]

    return this
  }

  // Gets the list of nodes that have been added to the graph.
  public nodes() {
    const nodeSet: { [node: string]: boolean } = {}
    Object.keys(this.edges).forEach((u) => {
      nodeSet[u] = true
      this.edges[u].forEach((v) => {
        nodeSet[v] = true
      })
    })
    return Object.keys(nodeSet)
  }

  // Gets the adjacent node list for the given node.
  // Returns an empty array for unknown nodes.
  public adjacent(node: string) {
    return this.edges[node] || []
  }

  // Sets the weight of the given edge.
  public setEdgeWeight(u: string, v: string, weight: number) {
    this.edgeWeights[this.encodeEdge(u, v)] = weight
    return this
  }

  // Gets the weight of the given edge.
  // Returns 1 if no weight was previously set.
  public getEdgeWeight(u: string, v: string) {
    const weight = this.edgeWeights[this.encodeEdge(u, v)]
    return weight === undefined ? 1 : weight
  }

  // Adds an edge from node u to node v.
  // Implicitly adds the nodes if they were not already added.
  public addEdge(u: string, v: string, weight?: number) {
    this.addNode(u)
    this.addNode(v)
    this.adjacent(u).push(v)

    if (weight !== undefined) {
      this.setEdgeWeight(u, v, weight)
    }

    return this
  }

  // Removes the edge from node u to node v.
  // Does not remove the nodes.
  // Does nothing if the edge does not exist.
  public removeEdge(u: string, v: string) {
    if (this.edges[u]) {
      this.edges[u] = this.adjacent(u).filter((f) => {
        return f !== v
      })
    }
    return this
  }

  // Computes the indegree for the given node.
  // Not very efficient, costs O(E) where E = number of edges.
  public indegree(node: string) {
    let degree = 0
    function check(v: string) {
      if (v === node) {
        degree++
      }
    }
    Object.keys(this.edges).forEach((u) => {
      this.edges[u].forEach(check)
    })
    return degree
  }

  // Computes the outdegree for the given node.
  public outdegree(node: string) {
    return node in this.edges ? this.edges[node].length : 0
  }

  // Depth First Search algorithm, inspired by
  // Cormen et al. "Introduction to Algorithms" 3rd Ed. p. 604
  // This variant includes an additional option
  // `includeSourceNodes` to specify whether to include or
  // exclude the source nodes from the result (true by default).
  // If `sourceNodes` is not specified, all nodes in the graph
  // are used as source nodes.
  public depthFirstSearch(sourceNodes?: string[], includeSourceNodes?: boolean) {

    if (!sourceNodes) {
      sourceNodes = this.nodes()
    }

    if (typeof includeSourceNodes !== "boolean") {
      includeSourceNodes = true
    }

    const visited: { [node: string]: boolean } = {}
    const nodeList: string[] = []

    const DFSVisit = (node: string) => {
      if (!visited[node]) {
        visited[node] = true
        this.adjacent(node).forEach(DFSVisit)
        nodeList.push(node)
      }
    }

    if (includeSourceNodes) {
      sourceNodes.forEach(DFSVisit)
    } else {
      sourceNodes.forEach((node) => {
        visited[node] = true
      })
      sourceNodes.forEach((node) => {
        this.adjacent(node).forEach(DFSVisit)
      })
    }

    return nodeList
  }

  // Least Common Ancestors
  // Inspired by https://github.com/relaxedws/lca/blob/master/src/LowestCommonAncestor.php code
  // but uses depth search instead of breadth. Also uses some optimizations
  public lowestCommonAncestors(node1: string, node2: string) {

    const node1Ancestors: string[] = []
    const lcas: string[] = []

    const CA1Visit = (visited: IVisited, node: string): boolean => {
      if (!visited[node]) {
        visited[node] = true
        node1Ancestors.push(node)
        if (node === node2) {
          lcas.push(node)
          return false // found - shortcut
        }
        return this.adjacent(node).every((e) => {
          return CA1Visit(visited, e)
        })
      } else {
        return true
      }
    }

    const CA2Visit = (visited: IVisited, node: string) => {
      if (!visited[node]) {
        visited[node] = true
        if (node1Ancestors.indexOf(node) >= 0) {
          lcas.push(node)
        } else if (lcas.length === 0) {
          this.adjacent(node).forEach((e) => {
            CA2Visit(visited, e)
          })
        }
      }
    }

    if (CA1Visit({}, node1)) { // No shortcut worked
      CA2Visit({}, node2)
    }

    return lcas
  }

  // The topological sort algorithm yields a list of visited nodes
  // such that for each visited edge (u, v), u comes before v in the list.
  // Amazingly, this comes from just reversing the result from depth first search.
  // Cormen et al. "Introduction to Algorithms" 3rd Ed. p. 613
  public topologicalSort(sourceNodes?: string[], includeSourceNodes?: boolean) {
    return this.depthFirstSearch(sourceNodes, includeSourceNodes).reverse()
  }

  // Dijkstra's Shortest Path Algorithm.
  // Cormen et al. "Introduction to Algorithms" 3rd Ed. p. 658
  // Variable and function names correspond to names in the book.
  public shortestPath(source: string, destination: string) {

    // Upper bounds for shortest path weights from source.
    const d: { [node: string]: number } = {}

    // Predecessors.
    const p: { [node: string]: string } = {}

    // Poor man's priority queue, keyed on d.
    let q: { [node: string]: boolean } = {}

    const initializeSingleSource = () => {
      this.nodes().forEach((node) => {
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
    const initializePriorityQueue = () => {
      this.nodes().forEach((node) => {
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

    const relax = (u: string, v: string) => {
      const w = this.getEdgeWeight(u, v)
      if (d[v] > d[u] + w) {
        d[v] = d[u] + w
        p[v] = u
      }
    }

    const dijkstra = () => {
      initializeSingleSource()
      initializePriorityQueue()
      while (!priorityQueueEmpty()) {
        const u = extractMin()
        if (u !== null) {
          this.adjacent(u).forEach((v) => {
            relax(u!, v)
          })
        }
      }
    }

    // Assembles the shortest path by traversing the
    // predecessor subgraph from destination to source.
    const path = () => {
      const nodeList = [] as any
      let weight = 0
      let node = destination
      while (p[node]) {
        nodeList.push(node)
        weight += this.getEdgeWeight(p[node], node)
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

    dijkstra()

    return path()
  }

  // Serializes the graph.
  public serialize() {
    const serialized: ISerialized = {
      links: [],
      nodes: this.nodes().map((id) => {
        return { id }
      }),
    }

    serialized.nodes.forEach((node) => {
      const source = node.id
      this.adjacent(source).forEach((target) => {
        serialized.links.push({
          source,
          target,
          weight: this.getEdgeWeight(source, target),
        })
      })
    })

    return serialized
  }

  // Deserializes the given serialized graph.
  public deserialize(serialized: ISerialized) {
    serialized.nodes.forEach((node) => this.addNode(node.id))
    serialized.links.forEach((link) => this.addEdge(link.source, link.target, link.weight))
    return this
  }

  // Computes a string encoding of an edge,
  // for use as a key in an object.
  private encodeEdge(u: string, v: string) {
    return u + "|" + v
  }
}
