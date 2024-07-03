import { type PathLike } from 'node:fs'
import { qstore } from './adapter.ts'
import { Low, Memory } from 'lowdb'

export async function qstorepreset<Data>(
  filename: PathLike,
  defaultData: Data,
): Promise<Low<Data>> {
  const adapter =
    process.env.NODE_ENV === 'test'
      ? new Memory<Data>()
      : new qstore<Data>(filename)
      // @ts-ignore
  const db = new Low<Data>(adapter, defaultData)
  await db.read()
  return db
}