import db from "../utils/db";
import xss from "xss";
import argon2 from "argon2";
import { type message_type } from "../utils/message";
import type { universes_table } from "./tables/universes";

class universe {
  id: number;
  data: universes_table | undefined;
  table: any;
  empty_table: boolean;

  constructor() {
    this.id = 0;
    this.table = db.data.universes;
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

  async get_games(limit: number = 16, query: string) {
    //return result;
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

  async create(creator: number) {
    let post: universes_table = {
      id: 0,
      placeid: 0,
      creator: Number(creator),
      updatedat: 0,
      createdat: 0
    }

    // add place making here

    post.createdat = Date.now();
    post.updatedat = Date.now();

    post.id = this.table.length + 1;
    this.table.push(post);

    await db.write();
    const msg: message_type =  {success: true, message: "created place ``.", info: { universe_id: post.id, place_id: post.placeid }}; 
    return msg;
  }
}

export default universe;