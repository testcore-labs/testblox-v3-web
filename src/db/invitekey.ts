import sql, { type postgres } from "../utils/sql";
import path from "path";
import entity_user from "./user";
import root_path from "../utils/root_path";
import type { message_type } from "../types/message";
import { orderby_enum, validate_orderby } from "../types/orderby";

class entity_invitekey {
  data: { [key: string]: any };
  usedby: entity_user | undefined;
  createdby: entity_user | undefined;

  constructor() {
    this.data = {};
  }

  async by_id(id: number) {
    let promokeys = await sql`SELECT * 
    FROM "invitekeys" 
    WHERE "id" = ${id} 
    LIMIT 1`;
    if(promokeys.length > 0) {
      let promokey = promokeys[0];
      this.usedby = await (new entity_user).by_id(promokey.usedby);
      this.createdby = await (new entity_user).by_id(promokey.createdby);
      this.data = promokey;
    }
    return this;
  }

  async by_code(code: string) {
    let promokeys = await sql`SELECT * 
    FROM "invitekeys" 
    WHERE "code" = ${code} 
    LIMIT 1`;
    if(promokeys.length > 0) {
      let promokey = promokeys[0];
      this.usedby = await (new entity_user).by_id(promokey.usedby);
      this.createdby = await (new entity_user).by_id(promokey.createdby);
      this.data = promokey;
    }
    return this;
  }

  static async all(
    limit: number = 16, 
    page: number = 1, 
    query: string, 
    sort: string = "createdat", 
    order: string = orderby_enum.DESCENDING
  ): Promise<message_type> {
    const allowed_sorts = ["code", "usedby", "createdby", "updatedat", "createdat"];
    const allowed_wheres = ["code"];

    if(!allowed_sorts.includes(sort)) sort = "createdat";
    if(query === "undefined") query = "";;
    order = validate_orderby(order);

    const offset = (page - 1) * limit;
    let items = await sql`SELECT *, (SELECT COUNT(*) FROM "invitekeys") AS total_count
    FROM "invitekeys" 
    WHERE ${ allowed_wheres.reduce((_w, wheree) =>
      sql`(${wheree} like ${ '%' + query + '%' })`,
      sql`false`
    )}
    ORDER BY ${ sql(sort) } ${ sql.unsafe(order) } 
    LIMIT ${limit} OFFSET ${offset}`;
    
    const total_items = items[0] != undefined ? items[0].total_count : 0;
    const total_pages = Math.ceil(total_items / limit);

    const item_ids = items.map(row => row.id);
    const new_items = await Promise.all(
      item_ids.map(async item_id => {
        let new_item = new entity_invitekey;
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

  async _updateat() {
    return await sql`UPDATE "promokeys" SET "updatedat" = ${Date.now()} WHERE "id" = ${this.data?.id}`;
  }

  get exists() {
    return Object.keys(this.data ?? {}).length !== 0;
  }

  get id() {
    return Number(this.data?.id);
  }
  
  get code() {
    return String(this.data?.code);
  }
  
  get createdat() {
    return Number(this.data?.createdat);
  }
  get updatedat() {
    return Number(this.data?.updatedat);
  }

  async redeem(usedby: number): Promise<message_type> {
    let usr = new entity_user();
    await usr.by_id(usedby);
    if(!usr.exists) {
      return { success: false, message: "redeem.invalid_user" };
    }

    if(!this.exists) {
      return { success: false, message: "redeem.invalid_code" };
    }

    if(usr.exists) {
      let given = "none";

      if(this.data?.usedby != null) {
        return { success: false, message: "redeem.used_code" };
      }

      if(this.data?.createdby === usr.id) {
        return { success: false, message: "redeem.cant_use_own_code" };
      }

      if(this.data?.currency != null) {
        given = "currency";
        usr.add_money(this.data.currency);
      } else if(this.data?.item) {
        // to implement
        //given = "item";
        //usr.add_item = this.data.item;
      } else if(this.data?.membership) {
        if(usr.has_membership) {
          return { success: false, message: "redeem.already_have_membership" };
        }
        given = "membership";
        usr.set_membership(this.data?.membership);
      }
      
      if(given !== "none") {
        await sql`UPDATE "promokeys" SET "usedby" = ${usedby} WHERE "id" = ${this.data?.id}`;
        await this._updateat();
        return { success: true, message: `redeem.given_${given}`, info: { 
          code: this.data?.code, 
          currency: this.data?.currency,
          item: this.data?.item,
        }};
      }
    }
    return { success: false, message: "redeem.unknown" };
  }
}

export default entity_invitekey;