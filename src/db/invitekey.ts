import sql, { type postgres } from "../sql";
import path from "path";
import entity_user from "./user";
import root_path from "../utils/root_path";
import type { message_type } from "../types/message";
import { orderby_enum, validate_orderby } from "../types/orderby";
import entity_base, { query_builder } from "./base";
import ENUM from "../types/enums";

class entity_invitekey extends entity_base {
  table = "invitekeys";
  usedby: entity_user = new entity_user;
  createdby: entity_user = new entity_user;
  
  async by(query: query_builder) {
    const data = await query
      .single()
      .exec();

    this.data = data;
    if(this.exists) {
      await this.usedby.by(entity_user.query()
        .where(sql`id = ${ data.usedby }`)
      );
      await this.createdby.by(entity_user.query()
        .where(sql`id = ${ data.createdby }`)
      );
    }
    return this;
  }

  static async all(
    limit: number = 16, 
    page: number = 1, 
    query: string = "", 
    sort: string = "createdat", 
    order: string = ENUM.order.DESCENDING
  ): Promise<message_type> {
    let result = await this.query()
      .search(query, ["code"], false)
      .separate(`AND`)
      .page(page)
      .sort_safe(sort, {
        id: "id", 
        code: "code", 
        usedby: "usedby", 
        createdby: "createdby", 
        updated: "updatedat", 
        created: "createdat"
        })
      .randomize(sort === "random")
      .direction(order)
      .limit(limit)
      .exec();

    const item_ids = result.data.map((row: any) => row.id);
    const new_items = await Promise.all(
      item_ids.map(async (item_id: number) => {
        let new_item = new this;
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

  get id() {
    return this.data.id;
  }

  get code() {
    return this.data.code;
  }

  get createdat() {
    return this.data.id;
  }
  get updatedat() {
    return this.data.id;
  }
}

export default entity_invitekey;