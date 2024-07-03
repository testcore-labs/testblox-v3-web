import db from "../utils/db";
import xss from "xss";
import argon2 from "argon2";
import { type message_type } from "../utils/message";
import type { universes_table } from "./tables/universes";
import type { assets_table, place_type } from "./tables/assets";
import { moderation_status_types } from "../types/moderation";
import { privacy_types } from "../types/privacy";
import { asset_types } from "../types/assets";

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
    let new_universe: universes_table = {
      id: 0,
      placeid: 0,
      creator: Number(creator),
      updatedat: 0,
      createdat: 0
    }

    // add place making here
    let new_place: assets_table = {
      id: 0,
      title: "",
      description: "",
      type: asset_types.Place,
      version: 0,
      icon: 0,
      privacy: privacy_types.PRIVATE,
      creator: 0,
      moderation: moderation_status_types.REVIEWING,
      data: {
        cost: 0,
        limited: false,
        vipcost: 0,
        bc_only: false,
        tbc_only: false,
        obc_only: false
      },
      updatedat: 0,
      createdat: 0
    }

    new_place.createdat = Date.now();
    new_place.updatedat = Date.now();

    new_place.id = this.table.length + 1;
    this.table.push(new_place);
    
    new_universe.createdat = Date.now();
    new_universe.updatedat = Date.now();

    new_universe.id = this.table.length + 1;
    this.table.push(new_universe);

    await db.write();
    const msg: message_type =  {success: true, message: "created place ``.", info: { universe_id: new_universe.id, place_id: new_universe.placeid }}; 
    return msg;
  }
}

export default universe;