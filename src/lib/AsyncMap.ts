export class AsyncMap<K, V> {
  private map: Map<K, V> = new Map()

  public async clear() {
    this.map.clear()
  }

  public async delete(key: K): Promise<boolean> {
    return this.map.delete(key)
  }

  public async entries() {
    return this.map.entries()
  }

  public forEach(cb: (value: V, key: K, map: Map<K, V>) => void) {
    const keys = Array.from(this.map.keys())
    return Promise.all(keys.map((k: K) => {
      return Promise.resolve(cb(this.map.get(k)!, k, this.map))
    }))
  }

  public async get(key: K): Promise<V | null> {
    return this.map.has(key) ? this.map.get(key)! : null
  }

  public async has(key: K): Promise<boolean> {
    return this.map.has(key)
  }

  public async keys(): Promise<K[]> {
    return Array.from(this.map.keys())
  }

  public async set(key: K, val: V) {
    return this.map.set(key, val)
  }

  public async size() {
    return this.map.size
  }

  public async values() {
    return this.map.values()
  }
}
