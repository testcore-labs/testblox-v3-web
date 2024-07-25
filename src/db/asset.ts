import sql, { type postgres } from "../utils/sql";
import xss from "xss";
import fs from "fs";
import path from "path";
import argon2 from "argon2";
import user from "./user";
import { type message_type } from "../utils/message";
import { asset_types } from "../types/assets";
import { privacy_types } from "../types/privacy";
import { moderation_status_types } from "../types/moderation";
import root_path from "../utils/root_path";
import env from "../utils/env";
import { orderby_enum, order_enum } from "../types/orderby";

const asset_folder = path.join(root_path, "files", "assets");

class asset {
  data: { [key: string]: any } | undefined;

  constructor() {
    this.data = {};
  }

  async by_id(id: number) {
    let assets = await sql`SELECT * 
    FROM "assets" 
    WHERE "id" = ${id} 
    LIMIT 1`;
    if(assets.length > 0) {
      let asset = assets[0];
      this.data = asset;
    }
    return this;
  }

  async by_title(title: string) {
    let assets = await sql`SELECT * 
    FROM "assets" 
    WHERE "title" = ${title} 
    LIMIT 1`;
    if(assets.length > 0) {
      let asset = assets[0];
      this.data = asset;
    }
    return this;
  }

  get exists() {
    return typeof(this.data) != undefined;
  }

  get id() {
    return this.data?.id;
  }

  get title() {
    return this.data?.title;
  }
  get description() {
    return this.data?.description;
  }
  get username() {
    return this.data?.creator;
  }

  static async all(type: number = asset_types.Image, 
    limit: number = 16, 
    page: number = 1, 
    query: string, 
    sort: string = "createdat", 
    order: string = orderby_enum.DESCENDING): 
    Promise<message_type> {
    const allowed_sorts = ["title", "description", "updatedat", "createdat"];
    const allowed_wheres = ["title", "description"];

    const start = (page - 1) * limit;
    sort = Object(allowed_sorts)[sort];
    let hs = order.toString().toUpperCase() === orderby_enum.ASCENDING; // how to sort

    let nq; // not set query
    if(query == "undefined") query = ""; nq = false;

    let users = await sql`SELECT * 
    FROM "assets" 
    WHERE "type" = ${type} AND ${ allowed_wheres.reduce((_w, wheree) =>
      sql`(${wheree} like ${ '%' + query + '%' })`,
      sql`false`
    )}
    ORDER BY ${ sort } ${ hs ? sql`ASC` : sql`DESC` } 
    LIMIT ${limit} OFFSET ${start}`;
    
    const total_items = users.length;
    const total_pages = Math.ceil(total_items / limit);

    return { success: true, message: "", info: { 
      queries: users, 
      total_pages: total_pages, 
      page: page,
      total_items: total_items
    }};
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
    return {"success": false, "message": "NOT IMPLEMENTED."}
  }
}

export default asset;