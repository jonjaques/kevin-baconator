import { Node, INodeResolveOptions } from '../node'

jest.setTimeout(30 * 1000)

describe('Node', () => {
  let kevin: Node;

  beforeEach(() => {
    kevin = new Node('Kevin Bacon')
  })

  it('should have the right defaults', () => {
    expect(kevin.id).toBe('Kevin Bacon')
    expect(kevin.links).toHaveLength(0)
    expect(kevin.backlinks).toHaveLength(0)
    expect(kevin.edges).toHaveLength(0)
  })

  describe('#resolve', () => {
    it('should begin with the right props', () => {
      expect(kevin.resolved).toBe(false)
      expect(kevin.resolving).toBe(false)
    })

    it.nock('should return a promise', async () => {
      await expect(kevin.resolve()).resolves
        .toBeUndefined()
    })

    it.nock('should have the right lifecycle while resolving', async () => {
      expect(kevin.links).toHaveLength(0)

      const resolving = kevin.resolve()
      expect(kevin.resolving).toBe(true)

      await resolving

      expect(kevin.resolving).toBe(false)
      expect(kevin.resolved).toBe(true)
      expect(kevin.links.length).toBeGreaterThan(0)
    })

    it.nock('should respect links and backlinks options', async () => {
      // By default we resolve w/ just links
      expect(kevin.links).toHaveLength(0)
      expect(kevin.backlinks).toHaveLength(0)
      expect(kevin.edges).toHaveLength(0)

      // The inverse of the defaults
      await kevin.resolve({ links: false, backlinks: true })

      expect(kevin.links).toHaveLength(0)
      expect(kevin.backlinks.length).toBeGreaterThan(0)
      expect(kevin.edges.length).toBeGreaterThan(0)
    })

    it.nock('should be able to resolve multiple times without extra edges', async () => {
      // By default we resolve w/ just links
      expect(kevin.links).toHaveLength(0)
      expect(kevin.backlinks).toHaveLength(0)
      expect(kevin.edges).toHaveLength(0)

      // The inverse of the defaults
      await kevin.resolve({ links: true })
      const linkLength = kevin.links.length
      const linkEdgeLength = kevin.edges.length
      expect(linkLength).toBeGreaterThan(0)
      expect(linkEdgeLength).toBeGreaterThan(0)
      expect(linkLength).toEqual(linkEdgeLength)

      await kevin.resolve({ links: false, backlinks: true })
      expect(kevin.links.length).toEqual(linkLength)
      expect(kevin.backlinks.length).toBeGreaterThan(0)
      expect(kevin.edges.length).toBeGreaterThan(linkEdgeLength)
      expect(kevin.links.length + kevin.backlinks.length)
        .toEqual(kevin.edges.length)
    })

    it('should calculate edges for links and backlinks', async () => {
      const spy = mockResolve(kevin)

      kevin.links = ['Foo']
      kevin.backlinks = ['Bar']
      await kevin.resolve()
      expect(spy).toHaveBeenCalled()
      expect(kevin.edges).toHaveLength(2)
      expect(kevin).toMatchSnapshot()
      expect(kevin.edges[0].source).toBe(kevin)
      expect(kevin.edges[0].target.id).toBe('Foo')
      expect(kevin.edges[1].source.id).toBe('Bar')
      expect(kevin.edges[1].target).toBe(kevin)
    })
  })
})

function mockResolve(node: Node) {
  const impl = (async function(this: Node, opts?: Partial<INodeResolveOptions>) {
    this.edges = (this as any).computeEdges()
  }).bind(node)

  return jest.spyOn(node, 'resolve').mockImplementation(impl)
}