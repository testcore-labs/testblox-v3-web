import sql, { type postgres } from "../utils/sql";
import xss from "xss";
import fs from "fs";
import path from "path";
import argon2 from "argon2";
import entity_user from "./user";
import { type message_type } from "../utils/message";
import { asset_types } from "../types/assets";
import { privacy_types, validate_privacy } from "../types/privacy";
import { moderation_status_types } from "../types/moderation";
import root_path from "../utils/root_path";
import env from "../utils/env";
import { orderby_enum, validate_orderby } from "../types/orderby";

const asset_folder = path.join(root_path, "files", "assets");

class asset {
  static catalog_types = [
    asset_types.Hat,
    asset_types.TShirt,
    asset_types.Shirt,
    asset_types.Pants,
    asset_types.Face,
    asset_types.Gear,
    asset_types.Head,
    asset_types.Torso,
    asset_types.LeftArm,
    asset_types.RightArm,
    asset_types.LeftLeg,
    asset_types.RightLeg,
    asset_types.Package,
    asset_types.RunAnimation,
    asset_types.FallAnimation,
    asset_types.IdleAnimation,
    asset_types.JumpAnimation,
    asset_types.PoseAnimation,
    asset_types.SwimAnimation,
    asset_types.WalkAnimation,
    asset_types.ClimbAnimation,
    asset_types.DeathAnimation,
    asset_types.HairAccessory,
    asset_types.FaceAccessory,
    asset_types.NeckAccessory,
    asset_types.ShoulderAccessory,
    asset_types.FrontAccessory,
    asset_types.BackAccessory,
    asset_types.WaistAccessory,
    asset_types.DeathAnimation,
  ];
  static library_types = [
    asset_types.Audio,
    asset_types.Mesh,
    asset_types.Lua,
    asset_types.Model,
    asset_types.Decal,
    asset_types.Badge,
    asset_types.Animation,
    asset_types.GamePass,
    asset_types.Plugin,
    asset_types.MeshPart,
  ];
  data: { [key: string]: any };
  user: entity_user | undefined;

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
      this.user = await (new entity_user).by_id(asset.creator);
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
      this.user = await (new entity_user).by_id(asset.creator);
    }
    return this;
  }

  get exists() {
    return Object.keys(this.data ?? {}).length !== 0;
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
  get file() {
    return this.data?.file;
  }

  async get_image() {
    return await (new asset).by_id(this.data.icon);
  }
  
  // api
  get_icon() {
    return `/api/v1/asset/icon?id=${this.data.id}`;
  }

  static async all(
    types: number[] = [asset_types.Image], 
    limit: number = 16, 
    page: number = 1, 
    query: string, 
    sort: string = "createdat", 
    order: string = orderby_enum.DESCENDING,
    privacy: number = privacy_types.PUBLIC,
  ): Promise<message_type> {
    const allowed_sorts = ["id", "title", "description", "updatedat", "createdat"];
    const allowed_wheres = ["title", "description"];

    if(!allowed_sorts.includes(sort)) sort = "createdat";
    if(query == "undefined") query = "";;
    order = validate_orderby(order);
    privacy = validate_privacy(privacy);

    const offset = (page - 1) * limit;
    let items = await sql`SELECT *, (SELECT COUNT(*) FROM "assets") AS total_count
    FROM "assets" 
    WHERE "type" IN ${ sql(types) } AND
    ${ allowed_wheres.reduce((_w, wheree) =>
      sql`(${wheree} like ${ '%' + query + '%' })`,
      sql`false`
    )} AND "privacy" = ${ privacy }
    ORDER BY ${ sql(sort) } ${ sql.unsafe(order) } 
    LIMIT ${limit} OFFSET ${offset}`;
    
    const total_items = items[0] != undefined ? items[0].total_count : 0;
    const total_pages = Math.ceil(total_items / limit);

    const item_ids = items.map(row => row.id);
    const new_items = await Promise.all(
      item_ids.map(async item_id => {
        let new_item = new asset;
        return await new_item.by_id(item_id);
      })
    );

    return { success: true, message: "", info: { 
      items: new_items, 
      total_pages: total_pages, 
      page: page,
      total_items: total_items,
      allowed_sorts: allowed_sorts,
      allowed_wheres: allowed_wheres,
    }};
  }

  get is_place() {
    if(this.data?.type == asset_types.Place) {
      return true;
    }
  }

  
  get for_games() {
    if(this.data?.type == asset_types.Place) {
      return true;
    }
  }

  get for_catalog() {
    if(asset.catalog_types[this.data?.type]) {
      return true;
    }
  }

  get for_library() {
    if(asset.library_types[this.data?.type]) {
      return true;
    }
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
    const time = Date.now();
    let params = {
      title: title,
      description: description, 
      type: asset_types.Place,
      icon: 0, // asset_types.Image id
      file: "",
      privacy: privacy_types.PRIVATE,
      creator: userid,
      moderation: moderation_status_types.REVIEWING,
      data: {},
      createdat: time, 
      updatedat: time,
    }

    let st = await sql`
      INSERT INTO "assets" ${sql(params)}
      RETURNING *`;
    if(st.length > 0) {
      let query = st[0];
      return {success: true, message: "created account.", info: { id: query?.id, token: query?.token }}; 
    } else {
      return {success: false, message: "failed to create account."}
    }
  }
}

export default asset;