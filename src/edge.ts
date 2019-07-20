import {Node} from './node'

export enum LinkType {
  Forward,
  Back
}

export class Edge {
  constructor(
    public source: Node,
    public target: Node,
    public type: LinkType,
    public strength: number = 1,
  ) {}
}