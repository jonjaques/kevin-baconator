import Yargs from 'yargs'
import Inquirer from 'inquirer'
import { Simulation, SimulationType } from './simulation'

main().catch(err => console.log(err))

type SimulationOptions = {source: string, target: string}
async function main() {
  const opts = await Inquirer.prompt<SimulationOptions>([
    { name: "source", message: `Who you lookin' fer?` },
    { name: "target", message: `Kevin Bacon?`, default: "Kevin Bacon" }
  ]);

  const simulation = new Simulation(
    opts.source,
    opts.target,
    SimulationType.BaconFactor
  )

  simulation.start()

  console.log(simulation)
}