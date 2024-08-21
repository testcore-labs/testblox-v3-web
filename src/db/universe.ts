// import db from "../utils/sql";
// import xss from "xss";
// import argon2 from "argon2";
// import { type message_type } from "../types/message";
// import entity_asset from "../db/asset";
// import type { universes_table } from "./tables/universes";
// import type { assets_table, place_type } from "./tables/assets";
// import { moderation_status_types } from "../types/moderation";
// import { privacy_types } from "../types/privacy";
// import { asset_types } from "../types/assets";

// class entity_universe {
//   id: number;
//   data: universes_table | undefined;
//   table: any;
//   schema: any;
//   empty_table: boolean;

//   constructor() {
//     this.id = 0;
//     this.table = db.data.universes.data;
//     this.schema = db.data.universes;
//     this.empty_table = (this.table.at(0) === undefined);
//   }

//   async by_id(id: number) {
//     const result = await this.table.find((p: universes_table) => p.id === id)
//     if(result !== undefined) {
//     this.id = result.id;
//     this.data = result;
//     }
//     return this;
//   }

//   async by_placeid(placeid: number) {
//     const result = await this.table.find((p: universes_table) => p.placeid === placeid)
//     if(result !== undefined) {
//     this.id = result.id;
//     this.data = result;
//     }
//     return this;
//   }

//   get exists() {
//     return Object.keys(this.data ?? {}).length !== 0;
//   }

//   get placeid() {
//     return Number(this.data?.placeid) ?? 0;
//   }
//   set placeid(placeid: number) {
//     if(this.data) {
//       this.data.placeid = placeid;
//       db.write();
//     }
//   }

//   async create(title: any, creator: number): Promise<message_type> {
//     // default file
//     const file = "";
//     let new_universe: universes_table = {
//       id: 0,
//       placeid: 0,
//       creator: Number(creator), // it is trusted but its just to make sure
//       updatedat: 0,
//       createdat: 0
//     }

//     let new_place = await (new entity_asset).create_place(title, "placeholder text", creator, file);

//     if(new_place.success) {
//       new_universe.placeid = typeof new_place.info?.id == "number" ? new_place.info?.id : -1; // this will never happen and if it does we will know
//     } else {
//       return new_place;
//     }
  
//     new_universe.createdat = Date.now();
//     new_universe.updatedat = Date.now();

//     new_universe.id = (this.schema.id += 1);
//     this.table.push(new_universe);

//     await db.write();
//     const msg: message_type =  {success: true, message: `created universe \`${title}\`.`, info: { universe_id: new_universe.id, place_id: new_universe.placeid }}; 
//     return msg;
//   }
// }

// export default entity_universe;


import sql, { type postgres } from "../utils/sql";
import xss from "xss";
import argon2 from "argon2";
import bbcode from "bbcode-ts";
import { type message_type } from "../types/message";
import env from "../utils/env";
import { validate_orderby } from "../types/orderby";
import entity_asset from "./asset";
import { pcall } from "../utils/pcall";
import ENUM from "../types/enums";
import type ENUM_T from "../types/enums";
import type { membership_types } from "../types/membership";

class entity_universe {
  data: { [key: string]: any };
  place: entity_asset | undefined;

  constructor() {
    this.data = {};
  }

  async by_id(id: number) {
    let universes = await sql`SELECT * 
    FROM "universes" 
    WHERE "id" = ${id} 
    LIMIT 1`;
    if(universes.length > 0) {
      let universe = universes[0];
      this.data = universe;
      this.place = await (new entity_asset).by_id(universe.root_placeid);
    }
    return this;
  }

  async by_rootplace(id: number) {
    let universes = await sql`SELECT * 
    FROM "universes" 
    WHERE "root_placeid" = ${id} 
    LIMIT 1`;
    if(universes.length > 0) {
      let universe = universes[0];
      this.data = universe;
      this.place = await (new entity_asset).by_id(universe.root_placeid);
    }
    return this;
  }

  async _updateat() {
    return await sql`UPDATE "universes" SET "updatedat" = ${Date.now()} WHERE "id" = ${this.data?.id}`;
  }

  get exists() {
    return Object.keys(this.data ?? {}).length !== 0;
  }

  get id() {
    return Number(this.data?.id);
  }

  get root_placeid() { 
    return this.data?.root_placeid ?? 0;
  }
  get placeids() { 
    return this.data?.placeids ?? {};
  }
  get updatedat() { 
    return this.data?.updatedat ?? 0;
  }
  get createdat() { 
    return this.data?.createdat ?? 0;
  }
}

export default entity_universe;