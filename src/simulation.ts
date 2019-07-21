import { Graph, Node, Edge } from "./graph";

export enum SimulationType {
  BaconFactor,
  Philosophy
}

export class Simulation {
  private graph: Graph
  private _running = false;
  private source: Node;
  private target: Node;
  private type: SimulationType

  constructor(
    source: string,
    target: string,
    type: SimulationType = SimulationType.BaconFactor
  ) {
    this.type = type
    this.graph = new Graph()
    this.source = new Node(source)
    this.target = new Node(target)
    this.graph.addNode(this.source)
    this.graph.addNode(this.target)
  }

  get running() {
    return this._running
  }

  start() {
    this._running = true
  }

  stop() {
    this._running = false
  }

}