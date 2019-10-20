import Wiki, { Page } from "wikijs"
import { InMemoryAsyncGraph } from "./InMemoryAsyncGraph"
import { profile } from "./log"

const wiki = Wiki()

export { Page }

export class WikiPage {

  public static fromJSON(obj: any = {}) {
    const page = new WikiPage(obj.name, obj.id)
    page.backlinks = obj.backlinks
    page.categories = obj.categories
    page.links = obj.links
    page.url = obj.url
    return page
  }

  public name: string
  public links?: string[]
  public backlinks?: string[]
  public categories?: string[]
  public id?: number
  public url?: URL
  public size?: number
  private repository?: Page

  constructor(name: string, id?: number) {
    this.name = name
    if (id) {
      this.id = id
    }
  }

  public async attachToGraph(graph: InMemoryAsyncGraph) {
    await graph.addNode(this.name)
    if (this.links) {
      await Promise.all(this.links.map((link) => graph.addEdge(this.name, link)))
    }
    if (this.backlinks) {
      await Promise.all(this.backlinks.map((link) => graph.addEdge(link, this.name)))
    }
  }

  public async fetchCategories() {
    const end = profile(`WikiPage.fetchCategories`, { name: this.name })
    if (!this.repository) {
      await this.find()
    }

    this.categories = await this.repository!.categories()
    end()
  }

  public async fetchLinks() {
    const end = profile(`WikiPage.fetchLinks`, { name: this.name })
    if (!this.repository) {
      await this.find()
    }

    this.links = await this.repository!.links()
    this.backlinks = await this.repository!.backlinks()
    end()
  }

  public async find() {
    const end = profile(`WikiPage.find`, { name: this.name })
    if (this.id) {
      this.repository = await wiki.findById(this.id as unknown as string)
    } else {
      this.repository = await wiki.find(this.name)
    }

    const r = this.repository as any
    this.id = r.raw.pageid
    this.name = r.raw.title
    this.size = r.raw.length
    this.url = this.repository.url()
    end()
  }

  public toJSON() {
    return {
      backlinks: this.backlinks,
      categories: this.categories,
      id: this.id,
      links: this.links,
      name: this.name,
      url: this.url,
    }
  }
}
