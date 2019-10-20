import qs from "querystring"
import UUID from "uuid"

export function profile(name: string, data: any = {}) {
  const args = { id: UUID.v4(), ...data }
  const key = `${name}(${qs.stringify(args, "&", "=", { encodeURIComponent: (x) => x })})`
  console.time(key)
  return function end() {
    console.timeEnd(key)
  }
}
