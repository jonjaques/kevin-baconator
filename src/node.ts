import { Edge, LinkType } from './edge'
import { wiki } from './services/wiki'
import { Page } from 'wikijs'

type Nullable<T> = T | null

export interface INodeResolveOptions {
  links: boolean
  backlinks: boolean
}

export class Node {
  public id: string
  public links: string[] = []
  public backlinks: string[] = []
  public edges: Edge[] = []
  public resolving = false
  private page: Nullable<Page> = null

  constructor(id: string) {
    this.id = id
  }

  public get resolved() {
    return !!(this.links.length
      // && this.backlinks.length
      && this.edges.length
    )
  }

  async resolve(opts: Partial<INodeResolveOptions> = {}) {
    try {
      const o = { ...Node.resolveDefaults, ...opts }
      const calls: Promise<string[]>[] = []
      this.resolving = true

      if (!this.page) {
        this.page = await wiki.page(this.id)
      }

      if (o.links) {
        calls.push(this.page.links()
          .then(links => (this.links = links)))
      }

      if (o.backlinks) {
        calls.push(this.page.backlinks()
          .then(backlinks => (this.backlinks = backlinks)))
      }

      await Promise.all(calls)
      this.edges = this.computeEdges()
    } catch (err) {
      console.log('Error while resolving Node<%s>', this.id)
      throw err
    } finally {
      this.resolving = false
    }
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

  static resolveDefaults: INodeResolveOptions = {
    links: true,
    backlinks: false,
  }
}

