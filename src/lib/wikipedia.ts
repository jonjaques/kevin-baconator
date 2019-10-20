import { WikiPage } from "./WikiPage"

export async function getNode(name: string, fetch: boolean = true) {
  const node = new WikiPage(name)
  if (fetch) {
    await node.find()
  }
  return node
}

export async function fromJSON(obj: any, fetch: boolean = true) {
  const node = WikiPage.fromJSON(obj)
  if (fetch) {
    await node.find()
  }
  return node
}
