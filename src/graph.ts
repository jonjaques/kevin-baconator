import { Edge } from './edge'
import { Node } from './node'
export { Edge, Node }

type MaybeNode = string | Node

export class Graph {
  private nodes: Map<string, Node> = new Map()
  private edges: Edge[] = []

  public hasNode(node: MaybeNode) {
    return this.nodes.has(this.getId(node))
  }

  public removeNode(node: MaybeNode) {
    this.nodes.delete(this.getId(node))
  }

  public addNode(node: MaybeNode) {
    if (this.hasNode(node)) {
      return
    }

    if (typeof node === 'string') {
      node = new Node(node)
    }

    this.nodes.set(node.id, node)
  }

  public findNode(id: string) {
    return this.nodes.get(id)
  }

  private getId(node: MaybeNode): string {
    return typeof node === 'string' ? node : node.id
  }
}