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

// yes
type db_struct = {
  users: user_table[]
  assets: assets_table[]
  universes: universes_table[]
}
const db_tables: db_struct = { 
  users: [],
  assets: [],
  universes: [] 
};

const db_file = "db.qstore";
const path_to_db = path.join(root_path, "database", db_file);
logs.database_log("loading ");
const db = await qstorepreset(path_to_db, db_tables);

await db.write();
logs.database_log("loaded!");

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