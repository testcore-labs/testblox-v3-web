import { type PathLike } from 'fs'
import { DataFile } from 'lowdb/node'

export class JSONFileMinify<T> extends DataFile<T> {
  constructor(filename: PathLike) {
    super(filename, {
      parse: JSON.parse,
      stringify: (data: T) => JSON.stringify(data, null, 0),
    })
  }
}
