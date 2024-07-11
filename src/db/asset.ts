import db from "../utils/db";
import xss from "xss";
import fs from "fs";
import path from "path";
import argon2 from "argon2";
import { type assets_table, type thumbnails_type } from "./tables/assets";
import { type message_type } from "../utils/message";
import { asset_types } from "../types/assets";
import { privacy_types } from "../types/privacy";
import { moderation_status_types } from "../types/moderation";
import root_path from "../utils/root_path";
import env from "../utils/env";
import { orderby_enum, order_enum } from "../types/orderby";

const asset_folder = path.join(root_path, "files", "assets");

class asset {
  id: number;
  data: assets_table | undefined;
  table: any;
  schema: any;
  empty_table: boolean;

  constructor() {
    this.id = 0;
    this.table = db.data.assets.data;
    this.schema = db.data.assets;
    this.empty_table = (this.table.at(0) === undefined);
  }

  async by_id(id: number) {
    const result = await this.table.find((p: assets_table) => p.id === id)
    if(result !== undefined) {
    this.id = result.id;
    this.data = result;
    }
    return this;
  }

  async by_title(title: string) {
    const result = await this.table.find((p: assets_table) => p.title === title)
    if(result !== undefined) {
    this.id = result.id;
    this.data = result;
    }
    return this;
  }

  get exists() {
    return typeof(this.data) != undefined;
  }

  get title() {
    return this.data?.title;
  }
  get description() {
    return this.data?.description;
  }

  static async all(limit: number = 16, query: string, sort: string = "createdat", sortby: string = orderby_enum.DESCENDING) {
    let new_class = new this;
    let all_things = new_class.table;
    if(query.length !== 0 && query !== "undefined") {
      const regex = new RegExp(query, "i"); // forgot to say this will make it Case Insensitive
      all_things = all_things.filter((obj: any) => 
        (obj.title && regex.test(obj.title)) || 
        (obj.desc && regex.test(obj.desc))
      );
    }

    all_things.sort((a: any, b: any) => {
      let key1 = a[sort];
      let key2 = b[sort];
      if(key1 === null) key1 = "";
      if(key2 === null) key2 = "";

      if(typeof key1 === "string" && typeof key2 === "string") {
        key1 = key1.toLowerCase();
        key2 = key2.toLowerCase();
      }

      if(key1 < key2) return sortby === "ASC" ? -1 : 1;
      if(key1 > key2) return sortby === "ASC" ? 1 : -1;
      return 0;
    });

    console.log(all_things);
    return all_things;
  }

  //s 
  private set_file(id: number, file: string): message_type {
    const path_to_asset = path.join(asset_folder, `${id}`);
    fs.writeFile(path_to_asset, file, 'binary', err => {
      if(err) {
        return {success: false, message: "an error occured.", info: { err: err }};
      }
    });
    return {success: true, message: "file uploaded.", info: { file: path_to_asset }};
  }

  async create_place(title: any, description: any, userid: number, file: string): Promise<message_type> {
    let post: assets_table = {
      id: 0,
      title: "",
      description: "",
      privacy: privacy_types.PRIVATE,
      creator: Number(userid), // this should be from trusted input. PLEASE be else im gonna rip your head off >:(, security comes FIRST.
      moderation: moderation_status_types.REVIEWING,
      updatedat: 0,
      createdat: 0,
      type: asset_types.Place,
      file: "",
      icon: 0,
      data: {
        server_size: 1, // max 100
        bc_only: false,
        gears_allowed: false,
        vip_price: 0,
        desktop_enabled: false,
        mobile_enabled: false,
        tablet_enabled: false,
        thumbnails: {
          0: 0 // icon and thumb is empty so a empty/default image is shown
        }
      }
    }

    // this might become an issue if an error occurs and we never push... but who cares if all ids are sequential.
    post.id = (this.schema.id += 1);
    post.title = title;
    post.description = description;

    const asset_file = this.set_file(post.id, file);
    if(!asset_file.success) {
      return asset_file;
    }
    post.file = asset_file.info?.file;

    post.createdat = Date.now();
    post.updatedat = Date.now();

    this.table.push(post);

    await db.write();
    const msg: message_type =  {success: true, status: 200, message: "created asset.", info: { id: post.id }}; 
    return msg;
  }
}

export default asset;