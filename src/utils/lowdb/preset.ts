import { type PathLike } from 'node:fs'
import { JSONFileMinify } from './adapter.ts'
import { Low, Memory } from 'lowdb'

export async function JSONFileMinifyPreset<Data>(
  filename: PathLike,
  defaultData: Data,
): Promise<Low<Data>> {
  const adapter =
    process.env.NODE_ENV === 'test'
      ? new Memory<Data>()
      : new JSONFileMinify<Data>(filename)
  const db = new Low<Data>(adapter, defaultData)
  await db.read()
  return db
}