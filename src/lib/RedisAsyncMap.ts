import Redis from "redis"
import UUID from "UUID"

export class RedisAsyncMap<V> {
  private type: "list" | "key"
  private name: string
  private client = Redis.createClient()

  constructor(type: "list" | "key", name: string = UUID.v4()) {
    this.type = type
    this.name = name

  }

  public get(key: string): Promise<V | null> {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, val) => {
        if ((err === null && val === null) || val === null) {
          return resolve(null)
        }
        if (err) {
          return reject(err)
        }
        return resolve(val as unknown as V)
      })
    })
  }

  public has(key: string, ...args: string[]): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.client.exists(key, args, (err, n) => {
        if (err) {
          return reject(err)
        }
        return resolve(n > 0)
      })
    })
  }

  public async keys(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      resolve([])
    })
  }

  public async set(key: string, val: V): Promise<void> {
    return new Promise((resolve, reject) => {
      resolve()
    })
  }

  public async delete(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.del(key, (err, nDel) => {

      })
    })
  }
}
