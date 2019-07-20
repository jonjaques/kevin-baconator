import { Node } from './node'

main().catch(err => console.log(err))

async function main() {
  const src = 'Kevin Bacon'
  const target = 'Donald Trump'

  const kevin = new Node(src)
  const trump = new Node(target)

  console.time(src)
  await kevin.resolve()
  console.timeEnd(src)

  console.time(target)
  await trump.resolve({ backlinks: false })
  console.timeEnd(target)
}