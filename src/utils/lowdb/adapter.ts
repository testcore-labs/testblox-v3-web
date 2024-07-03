import { type PathLike, readFileSync, writeFileSync, renameSync } from 'fs';
import { DataFile } from './data'
import cbor from 'cbor'

// @ts-ignore
export class qstore<T> extends DataFile<T> {
  constructor(filename: PathLike) {
    super(filename, {
      parse: (buf: Buffer) => {
        if(buf == null) {
          return {};
        }
        const strobj = cbor.decode(buf);
        return strobj;
      },
      stringify: (data: T) => { 
        let str = cbor.encode(data);
        return str;
      }
    })
  }
}
