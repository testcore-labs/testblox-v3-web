import { type PathLike } from 'fs'

import type { Adapter } from 'lowdb'
import { TextFile } from './text'

export class DataFile<T extends Buffer> implements Adapter<Buffer> {
  #adapter: TextFile
  #parse: (str: Buffer) => T
  #stringify: (data: T) => Buffer

  constructor(
    filename: PathLike,
    {
      parse,
      stringify,
    }: {
      parse: (str: Buffer) => T
      stringify: (data: T) => Buffer
    },
  ) {
    this.#adapter = new TextFile(filename)
    this.#parse = parse
    this.#stringify = stringify
  }

  async read(): Promise<Buffer | null> {
    const data = await this.#adapter.read()
    if (data === null) {
      return null
    } else {
      return this.#parse(data)
    }
  }

  write(obj: Buffer): Promise<void> {
    // @ts-ignore
    return this.#adapter.write(this.#stringify(obj))
  }
}