import low from 'lowdb/node';
import { JSONFilePreset } from 'lowdb/node';
import FileSync from 'lowdb/adapters/FileSync';
import root_path from "./root_path";
import path from "path";
import fs from "fs";
import env from "../utils/env";

import { type user_table } from "../db/tables/users";
import { type assets_table } from "../db/tables/assets";
import { sleep } from 'bun';

// yes
type db_struct = {
  users: user_table[]
  assets: assets_table[]
}
const db_tables: db_struct = { 
  users: [],
  assets: [] 
};

const path_to_json_db = path.join(root_path, "database", "db.json");
console.log("[db]: loading...");
const db = await JSONFilePreset(path.join(root_path, "database", "db.json"), db_tables);
fs.readFile(path_to_json_db, "utf8", async function(err, data) {
  if(err) {
    console.log("[db]: writing empty file");
    //console.log(err);
    await db.write();
  }
});
console.log("[db]: loaded!");

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

export default db;