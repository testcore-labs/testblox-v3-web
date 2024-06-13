import db from "../utils/db";
import xss from "xss";
import argon2 from "argon2";
import { type assets_table } from "./tables/assets";
import { type message_type } from "../utils/message";
import { asset_types } from "../types/assets";
import { privacy_types } from "../types/privacy";
import { moderation_status_types } from "../types/moderation";
import env from "../utils/env";

class assets {
  id: number;
  data: assets_table | undefined;
  table: any;
  empty_table: boolean;

  constructor() {
    this.id = 0;
    this.table = db.data.assets;
    this.empty_table = (this.table.at(0) === undefined);
  }

  by_id(id: number) {
    const result = this.table.find((p: assets_table) => p.id === id)
    if(result !== undefined) {
    this.id = result.id;
    this.data = result;
    }
    return this;
  }

  by_title(title: string) {
    const result = this.table.find((p: assets_table) => p.title === title)
    if(result !== undefined) {
    this.id = result.id;
    this.data = result;
    }
    return this;
  }

  get exists() {
    return typeof(this.data) != undefined;
  }

  async create(username: any, password: any): Promise<message_type> {
    let post: assets_table = {
      id: 0,
      title: "",
      description: "",
      type: asset_types.Image,
      privacy: privacy_types.PRIVATE,
      creator: 0,
      moderation: moderation_status_types.REVIEWING,
      thumbnail: "",
      limited: false,
      vipcost: 0,
      updatedat: 0,
      createdat: 0
    }

    // so the problem here is that i have to get it from assetversion which is not added yet.
    // if(this.table.find((p: assets_table) => p.hash === hash)) {
    //   const msg: message_type = {success: false, message: "username taken."};
    //   return msg;
    // }


    post.createdat = Date.now();
    post.updatedat = Date.now();
    
    post.id = this.table.length + 1;
    this.table.push(post);

    await db.write();
    const msg: message_type =  {success: true, message: "created account.", info: { id: post.id, token: post.token }}; 
    return msg;
  }
}

export default assets;