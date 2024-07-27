import sql, { type postgres } from "../utils/sql";
import path from "path";
import user from "./user";
import root_path from "../utils/root_path";
import type { message_type } from "../utils/message";

const asset_folder = path.join(root_path, "files", "assets");

class friend {
  data: { [key: string]: any } | undefined;

  constructor() {
    this.data = {};
  }

  async by_code(code: string) {
    let friends = await sql`SELECT * 
    FROM "friends" 
    WHERE "code" = ${code} 
    LIMIT 1`;
    if(friends.length > 0) {
      let friend = friends[0];
      this.data = friend;
    }
    return this;
  }

  async _updateat() {
    return await sql`UPDATE "friends" SET "updatedat" = ${Date.now()} WHERE "id" = ${this.data?.id}`;
  }

  get exists() {
    return Object.keys(this.data ?? {}).length !== 0;
  }

  get id() {
    return Number(this.data?.id);
  }

  async accept()/*: Promise<message_type>*/ {
    // todo
  }

  async request()/*: Promise<message_type>*/ {
    // todo
  }
}

export default friend;