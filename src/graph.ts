import {Edge} from './edge'
import {Node} from './node'

type MaybeNode = string | Node

export class Graph {
  private nodes: Map<string, Node>
  private edges: Edge[] = []

  public hasNode(node: MaybeNode) {
    return this.nodes.has(this.getId(node))
  }

  public removeNode(node: MaybeNode) {
    this.nodes.delete(this.getId(node))
  }

  public addNode(node: Node) {
    if (this.hasNode(node)) {
      return
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