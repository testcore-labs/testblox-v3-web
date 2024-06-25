import db from "../utils/db";
import xss from "xss";
import argon2 from "argon2";
import { type message_type } from "../utils/message";
import type { universes_table } from "./tables/universes";

class user {
  id: number;
  data: universes_table | undefined;
  table: any;
  empty_table: boolean;

  constructor() {
    this.id = 0;
    this.table = db.data.users;
    this.empty_table = (this.table.at(0) === undefined);
  }

  async by_id(id: number) {
    const result = await this.table.find((p: universes_table) => p.id === id)
    if(result !== undefined) {
    this.id = result.id;
    this.data = result;
    }
    return this;
  }

  async by_placeid(placeid: number) {
    const result = await this.table.find((p: universes_table) => p.placeid === placeid)
    if(result !== undefined) {
    this.id = result.id;
    this.data = result;
    }
    return this;
  }

  get exists() {
    return this.data != undefined;
  }

  get placeid() {
    return Number(this.data?.placeid) ?? 0;
  }
  set placeid(placeid: number) {
    if(this.data) {
      this.data.placeid = placeid;
      db.write();
    }
  }
}

export default user;