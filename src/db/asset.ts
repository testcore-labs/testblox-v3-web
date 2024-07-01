import db from "../utils/db";
import xss from "xss";
import argon2 from "argon2";
import { type assets_table, type thumbnails_type } from "./tables/assets";
import { type message_type } from "../utils/message";
import { asset_types } from "../types/assets";
import { privacy_types } from "../types/privacy";
import { moderation_status_types } from "../types/moderation";
import env from "../utils/env";

class asset {
  id: number;
  data: assets_table | undefined;
  table: any;
  empty_table: boolean;

  constructor() {
    this.id = 0;
    this.table = db.data.assets;
    this.empty_table = (this.table.at(0) === undefined);
  }

  async by_id(id: number) {
    const result = await this.table.findOne((p: assets_table) => p.id === id)
    if(result !== undefined) {
    this.id = result.id;
    this.data = result;
    }
    return this;
  }

  async by_title(title: string) {
    const result = await this.table.findOne((p: assets_table) => p.title === title)
    if(result !== undefined) {
    this.id = result.id;
    this.data = result;
    }
    return this;
  }

  get exists() {
    return typeof(this.data) != undefined;
  }

  async create_decal(title: any, description: any, userid: number): Promise<message_type> {
    let post: assets_table = {
      id: 0,
      title: "",
      description: "",
      version: 1,
      privacy: privacy_types.PRIVATE,
      creator: userid, // this should be from trusted input. PLEASE be else im gonna rip your head off >:(, security comes FIRST.
      moderation: moderation_status_types.REVIEWING,
      updatedat: 0,
      createdat: 0,
      type: asset_types.Image,
      icon: 0,
      data: {
        server_size: 0,
        bc_only: false,
        gears_allowed: false,
        vip_price: 0,
        desktop_enabled: false,
        mobile_enabled: false,
        tablet_enabled: false,
        thumbnails: {
          0: "default"
        },
        vr_enabled: false
      }
    }

    // [!]: so the problem here is that i have to get it from assetversion which is not added yet.
    // if(this.table.find((p: assets_table) => p.hash === hash)) {
    //   const msg: message_type = {success: false, message: "username taken."};
    //   return msg;
    // }

    // since images are the parents for alot of assets we gotta upload that
    // im too lazy for making library work rn so LATER it goes 
    // ^ realized this is TOO much work to make each asset get created THEN be able to be edited oh my gooood :(


    post.createdat = Date.now();
    post.updatedat = Date.now();
    
    post.id = this.table.length + 1;
    this.table.push(post);

    await db.write();
    const msg: message_type =  {success: true, status: 200, message: "created asset.", info: { id: post.id }}; 
    return msg;
  }
}

export default asset;