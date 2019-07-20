import {Edge, LinkType} from './edge'
import {wiki} from './services/wiki'
import {Page} from 'wikijs'

export class Node {
  public id: string
  public links: string[]
  public backlinks: string[]
  public edges: Edge[]
  private page: Page

  constructor(id: string) {
    this.id = id
  }

  async resolve() {
    this.page = await wiki.page(this.id)
    const [links, backlinks] = await Promise.all([
      this.page.links(),
      this.page.backlinks()
    ])
    this.links = links
    this.backlinks = backlinks
    this.edges = this.computeEdges()
    return this
  }

  private computeEdges() {
    const edges: Edge[] = []

    for (const link of this.links) {
      const source = this
      const target = new Node(link)
      const type = LinkType.Forward
      edges.push(new Edge(source, target, type))
    }

    for (const backlink of this.backlinks) {
      const source = new Node(backlink)
      const target = this
      const type = LinkType.Back
      edges.push(new Edge(source, target, type))
    }

    return edges
  }
}

