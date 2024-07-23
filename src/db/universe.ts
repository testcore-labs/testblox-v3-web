import db from "../utils/sql";
import xss from "xss";
import argon2 from "argon2";
import { type message_type } from "../utils/message";
import asset from "../db/asset";
import type { universes_table } from "./tables/universes";
import type { assets_table, place_type } from "./tables/assets";
import { moderation_status_types } from "../types/moderation";
import { privacy_types } from "../types/privacy";
import { asset_types } from "../types/assets";

class universe {
  id: number;
  data: universes_table | undefined;
  table: any;
  schema: any;
  empty_table: boolean;

  constructor() {
    this.id = 0;
    this.table = db.data.universes.data;
    this.schema = db.data.universes;
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

  async create(title: any, creator: number): Promise<message_type> {
    // default file
    const file = "";
    let new_universe: universes_table = {
      id: 0,
      placeid: 0,
      creator: Number(creator), // it is trusted but its just to make sure
      updatedat: 0,
      createdat: 0
    }

    let new_place = await (new asset).create_place(title, "placeholder text", creator, file);

    if(new_place.success) {
      new_universe.placeid = typeof new_place.info?.id == "number" ? new_place.info?.id : -1; // this will never happen and if it does we will know
    } else {
      return new_place;
    }
  
    new_universe.createdat = Date.now();
    new_universe.updatedat = Date.now();

    new_universe.id = (this.schema.id += 1);
    this.table.push(new_universe);

    await db.write();
    const msg: message_type =  {success: true, message: `created universe \`${title}\`.`, info: { universe_id: new_universe.id, place_id: new_universe.placeid }}; 
    return msg;
  }
}

export default universe;