import sql, { type postgres } from "../sql";
import xss from "xss";
import fs from "fs";
import path from "path";
import argon2 from "argon2";
import entity_user from "./user";
import { type message_type } from "../types/message";
import type _ENUM from "../types/enums";
import ENUM from "../types/enums";
import root_path from "../utils/root_path";
import env from "../utils/env";
import { validate_orderby } from "../types/orderby";
import { validate_privacy } from "../types/privacy";
import entity_base, { query_builder } from "./base";
import type { asset_data_types } from "../types/assets_data"; 
import { asset_types_numbered } from "../types/assets";
import bbcode from "bbcode-ts";
import { xss_all } from "../utils/xss";

const asset_folder = path.join(root_path, "files", "assets");

class entity_asset extends entity_base {
  table = "assets";
  user: entity_user | undefined;
  bbcode_strict: bbcode;
  sales: number;

  constructor() {
    super();
    this.bbcode_strict = new bbcode;
    this.bbcode_strict.tags.a.func = (txt, params) => 
      `<a class="link" href="/redirect?url=${encodeURI(params["url"])}">${txt}</a>`;
    this.bbcode_strict.allowed_tags = ["b", "i", "d", "u", "a", "c"]; 
    this.sales = 0;
  }
  async by_id(id: number) {
    let assets = await sql`SELECT * 
    FROM "assets" 
    WHERE "id" = ${id} 
    LIMIT 1`;
    if(assets.length > 0) {
      let asset = assets[0];
      this.data = asset;
      this.user = await (new entity_user).by(entity_user.query()
        .where(sql`id = ${ asset.creator }`)
      );
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
      this.user = await (new entity_user).by(entity_user.query()
        .where(sql`id = ${ asset.creator }`)
      );
    }
    return this;
  }

  async by(query: query_builder) {
    const data = await query
      .single()
      .exec();

    this.data = data;
    if(this.exists) {
    this.user = await (new entity_user).by(entity_user.query()
      .where(sql`id = ${ data.creator }`)
    );

    if(Object.assign(asset_types_numbered.catalog, asset_types_numbered.library).includes(data.type)) {
      const sales_stmt = await sql`SELECT COUNT(*) AS count FROM "owned_items" WHERE "item" = ${data.id}`;
      this.sales = sales_stmt[0].count;
    }
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
  get bb_description() {
    return this.bbcode_strict.parse(xss_all(this.description));
  }
  get file() {
    return this.data?.file;
  }
  get type() {
    return this.data?.type;
  }
  get updatedat() {
    return this.data?.updatedat;
  }
  get createdat() {
    return this.data?.createdat;
  }
  get info() {
    return this.data?.data;
  }

  async get_icon_image() {
    return await (new entity_asset).by_id(this.data.icon);
  }
  
  // api
  get_icon() {
    return `/api/v1/asset/icon?id=${this.data.id}`;
  }

  static async all(
    types: number[] = [ENUM.assets.Image], 
    limit: number = 16, 
    page: number = 1, 
    query: string = "", 
    sort: string = "createdat", 
    order: string = ENUM.order.DESCENDING,
    privacy: number = ENUM.privacy.PUBLIC,
    custom_wheres: Array<postgres.PendingQuery<postgres.Row[]>> = []
  ): Promise<message_type> {

    let stmt = this.query()
      .search(query, ["title", "description"], false)
      .separate(`AND`)
      .limit(limit)
      .page(page)
      .where(sql`type IN ${ sql(types) }`)
      .where(sql`privacy = ${privacy}`)
      .sort_safe(sort, {
        id: "id", 
        title: "title", 
        description: "description", 
        updated: "updatedat", 
        created: "createdat"
        })
      .randomize(sort === "random")
      .direction(order);

    custom_wheres.forEach(where => {
      stmt = stmt.where(where);
    });
      
    let result = await stmt.exec();

    const item_ids = result.data.map((row: any) => row.id);
    const new_items = await Promise.all(
      item_ids.map(async (item_id: number) => {
        let new_item = new entity_asset;
        return await new_item.by(this.query()
          .where(sql`id = ${item_id}`)
        );
      })
    );

    return { success: true, message: "", info: { 
      items: new_items,
      ...result
    }};
  }

  get is_place() {
    if(this.data?.type === ENUM.assets.Place) {
      return true;
    }
  }
  
  get for_games() {
    return this.data?.type === ENUM.assets.Place;
  }

  get for_catalog() {
    return asset_types_numbered.catalog.includes(this.data?.type);
  }

  get for_library() {
    return asset_types_numbered.library.includes(this.data?.type);
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
      type: ENUM.assets.Place,
      icon: 0, // ENUM.assets.Image id
      file: "",
      privacy: ENUM.privacy.PRIVATE,
      creator: userid,
      moderation: ENUM.moderation.REVIEWING,
      data: {
        server_size: 8,
        bc_only: false,
        gears_allowed: false,
        vip_price: NaN, // if NaN, then no vip servers
        desktop_enabled: true,
        mobile_enabled: false,
        tablet_enabled: false,
        vr_enabled: false,
        thumbnails: { 0: NaN }, // ENUM.assets.thumbnail
      } as asset_data_types[typeof ENUM.assets.Place],
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

export default entity_asset;