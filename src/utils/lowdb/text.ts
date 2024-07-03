import { type PathLike, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { Writer } from 'steno'

import type { Adapter } from 'lowdb'

export class TextFile implements Adapter<Buffer> {
  #filename: PathLike
  #writer: Writer

  constructor(filename: PathLike) {
    this.#filename = filename
    this.#writer = new Writer(filename)
  }

  async read(): Promise<Buffer | null> {
    let data

    try {
      data = await readFile(this.#filename)
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
        return null
      }
      throw e
    }

    return data
  }

  write(buf: Buffer): Promise<void> {
    return this.#writer.write(buf)
  }
}