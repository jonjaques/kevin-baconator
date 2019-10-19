
export function withWeight(nodeList: string[], weight: number) {
  (nodeList as any).weight = weight
  return nodeList
}

export function contains(arr: string[], item: string) {
  return arr.filter((d) => {
    return d === item
  }).length > 0
}

export function comesBefore(arr: string[], a: string, b: string) {
  let aIndex: number | undefined
  let bIndex: number | undefined
  arr.forEach((d, i) => {
    if (d === a) { aIndex = i }
    if (d === b) { bIndex = i }
  })
  return aIndex! < bIndex!
}
