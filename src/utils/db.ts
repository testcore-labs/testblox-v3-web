import low from 'lowdb/node';
import { qstorepreset } from './lowdb/preset';
import root_path from "./root_path";
import path from "path";
import fs from "fs";
import env from "../utils/env";
import logs from "../utils/log";

import { type user_table } from "../db/tables/users";
import { type assets_table } from "../db/tables/assets";
import { type universes_table } from "../db/tables/universes";
import { sleep } from 'bun';

// id's are here because we need to count it async and we cant do sync dbs
type db_struct = {
  users: { data: user_table[], id: number }
  assets: { data: assets_table[], id: number }
  universes: { data: universes_table[], id: number }
}
const db_tables: db_struct = { 
  users: { data: [], id: 0 },
  assets: { data: [], id: 0 },
  universes: { data: [], id: 0 }
};

const db_file = "db.qstore";
const path_to_db = path.join(root_path, "database", db_file);
logs.database("loading ");
const db = await qstorepreset(path_to_db, db_tables);

await db.write();
logs.database("loaded!");

if(env.backup) {
(async () => {
  while (env.backup) { // wait an hour to backup
    await sleep((3600 / 2) * 100);
    console.log("[db]: backup in 30 minutes");
    await sleep((3600 / 4) * 100);
    console.log("[db]: backup in 15 minutes");
    await sleep((3600 / 6) * 100);
    console.log("[db]: backup in 5 minutes");
    await sleep((3600 / 12) * 100);
    fs.writeFile(path.join(root_path, "database", "db-backup.json"), JSON.stringify(db.data), err => {
      if (err) {
        console.error(err);
      } else {
        console.log("[db]: backup created")
      }
    })
  }
})()
}

export default db;