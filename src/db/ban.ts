import sql, { type postgres } from "../sql";
import entity_asset from "./asset";
import entity_base, { query_builder } from "./base";
import type { message_type } from "../types/message";
import ENUM from "../types/enums";

class entity_ban extends entity_base {
  table = "bans";

  constructor() {
    super();
  }


  static async all(
    limit: number = 16, 
    page: number = 1, 
    query: string = "", 
    sort: string = "createdat", 
    order: string = ENUM.order.DESCENDING,
    custom_wheres: Array<postgres.PendingQuery<postgres.Row[]>> = []
  ): Promise<message_type> {
    let stmt = this.query()
      .search(query, ["reason", "moderator_note"], false)
      .separate(`AND`)
      .limit(limit)
      .page(page)
      .sort_safe(sort, {
        id: "id", 
        userid: "userid", 
        reason: "reason", 
        description: "description", 
        moderator_note: "moderator_note", 
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
        let new_item = new entity_ban;
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
    return Number(this.data.id);
  }

  get userid() {
    return Number(this.data.userid);
  }

  get reason() {
    return String(this.data.reason);
  }

  async get_items() {
    let off_items = Object.entries(this.data.items);

    console.log(off_items);
    let items: {[key: string]: entity_asset} = {};
    for await (const item of off_items) {
      items[item[0]] = await (new entity_asset).by(entity_asset.query()
        .where(sql`id = ${Number(item[1])}`)
      );
    };
  
    return items;
  }

  get moderator_note() {
    return String(this.data.moderator_note);
  }

  get agreed() {
    return Boolean(this.data.agreed);
  }

  get length() {
    return Number(this.data.length);
  }

  get updatedat() {
    return Number(this.data.updatedat);
  }
  get createdat() {
    return Number(this.data.createdat);
  }

  get is_banned() {
    if(this.exists && (this.length === -1 ? this.agreed : (this.length >= Date.now()))) {
      return true;
    } else {
      return false;
    }
  }
}

export default entity_ban;