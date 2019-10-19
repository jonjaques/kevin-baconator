
export interface ISerialized<N, E> { nodes: N[], links: E[] }

export abstract class AbstractAsyncGraph<TNode, TEdge> {

  public addNode(node: TNode): Promise<TNode> {
    return this.addNodeInternal(node)
  }

  public removeNode(node: TNode): Promise<void> {
    return this.removeNodeInternal(node)
  }

  public nodes(): Promise<TNode[]> {
    return this.nodesInternal()
  }

  public adjacent(node: TNode): Promise<TNode[]> {
    return this.adjacentInternal(node)
  }

  public addEdge(u: string, v: string, weight?: number): Promise<TEdge> {
    return this.addEdgeInternal(u, v, weight)
  }

  public removeEdge(u: string, v: string): Promise<void> {
    return this.removeEdgeInternal(u, v)
  }

  public setEdgeWeight(u: string, v: string, weight: number): Promise<TEdge> {
    return this.setEdgeWeightInternal(u, v, weight)
  }

  public getEdgeWeight(u: string, v: string): Promise<number> {
    return this.getEdgeWeightInternal(u, v)
  }

  public indegree(node: TNode): Promise<number> {
    return this.indegreeInternal(node)
  }

  public outdegree(node: TNode): Promise<number> {
    return this.outdegreeInternal(node)
  }

  public depthFirstSearch(sourceNodes?: TNode[], includeSourceNodes?: boolean): Promise<TNode[]> {
    return this.depthFirstSearchInternal(sourceNodes, includeSourceNodes)
  }

  public lowestCommonAncestors(node1: TNode, node2: TNode): Promise<TNode[]> {
    return this.lowestCommonAncestorsInternal(node1, node2)
  }

  public topologicalSort(sourceNodes?: TNode[], includeSourceNodes?: boolean): Promise<TNode[]> {
    return this.topologicalSortInternal(sourceNodes, includeSourceNodes)
  }

  public shortestPath(source: TNode, destination: TNode): Promise<TNode[]> {
    return this.shortestPathInternal(source, destination)
  }

  public serialize() {
    return this.serializeInternal()
  }

  public initialize(serialized?: ISerialized<TNode, TEdge>): Promise<this> {
    return this.initializeInternal(serialized)
  }

  public deserialize(serialized: ISerialized<any, any>): Promise<this> {
    return this.deserializeInternal(serialized)
  }

  public serializeNode(node: TNode): any {
    return this.serializeNodeInternal(node)
  }

  public deserializeNode(serialized: ISerialized<TNode, TEdge>): TNode {
    return this.deserializeNodeInternal(serialized)
  }

  protected abstract addNodeInternal(node: TNode): Promise<TNode>

  protected abstract removeNodeInternal(node: TNode): Promise<void>

  protected abstract nodesInternal(): Promise<TNode[]>

  protected abstract adjacentInternal(node: TNode): Promise<TNode[]>

  protected abstract addEdgeInternal(u: string, v: string, weight?: number): Promise<TEdge>

  protected abstract removeEdgeInternal(u: string, v: string): Promise<void>

  protected abstract setEdgeWeightInternal(u: string, v: string, weight: number): Promise<TEdge>

  protected abstract getEdgeWeightInternal(u: string, v: string): Promise<number>

  protected abstract indegreeInternal(node: TNode): Promise<number>

  protected abstract outdegreeInternal(node: TNode): Promise<number>

  protected abstract depthFirstSearchInternal(sourceNodes?: TNode[], includeSourceNodes?: boolean): Promise<TNode[]>

  protected abstract lowestCommonAncestorsInternal(node1: TNode, node2: TNode): Promise<any>

  protected abstract topologicalSortInternal(sourceNodes?: TNode[], includeSourceNodes?: boolean): Promise<TNode[]>

  protected abstract shortestPathInternal(source: TNode, destination: TNode): Promise<TNode[]>

  protected abstract serializeInternal(): Promise<ISerialized<any, any>>

  protected abstract deserializeInternal(serialized: ISerialized<any, any>): Promise<this>

  protected abstract initializeInternal(serialized?: ISerialized<any, any>): Promise<this>

  protected abstract serializeNodeInternal(node: TNode): any

  protected abstract deserializeNodeInternal(serialized: any): TNode

  // Computes a string encoding of an edge,
  // for use as a key in an object.
  protected encodeEdge(u: string, v: string) {
    return u + "|" + v
  }
}
