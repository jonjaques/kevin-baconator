import { Edge, LinkType } from './edge'
import { Node } from './node'
describe('Edge', () => {
  it('should have the right defaults', () => {
    const source = new Node('Foo')
    const target = new Node('Bar')
    const edge = new Edge(source, target, LinkType.Forward, 3)

    expect(edge.source.id).toBe('Foo')
    expect(edge.target.id).toBe('Bar')
    expect(edge.type).toBe(LinkType.Forward)
    expect(edge.strength).toBe(3)
  })
})