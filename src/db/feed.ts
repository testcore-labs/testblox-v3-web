import sql, { type postgres } from "../utils/sql";
import bbcode from "bbcode-ts";
import { type message_type } from "../types/message";
import ENUM from "../types/enums";
import { validate_orderby } from "../types/orderby";
import entity_user from "./user";

class entity_feed {
  data: { [key: string]: any };
  user: entity_user | undefined;
  bbcode_strict: bbcode;

  constructor() {
    this.data = {};
    this.bbcode_strict = new bbcode;
    this.bbcode_strict.tags.a.func = (txt, params) => 
      `<a class="link" href="/redirect?url=${encodeURI(params["url"])}">${txt}</a>`;
    this.bbcode_strict.allowed_tags = ["b", "i", "d", "u", "a", "c"]; 
  }

  async by_id(id: number) {
    let items = await sql`SELECT * 
    FROM "feed" 
    WHERE "id" = ${id} 
    LIMIT 1`;
    if(items.length > 0) {
      let item = items[0];
      this.user = await (new entity_user).by(entity_user.query()
        .where(sql`id = ${ item.creator }`)
      );
      this.data = item;
    }
    return this;
  }
  
  async by_creator(id: number) {
    let items = await sql`SELECT * 
    FROM "feed"
    WHERE "creator" = ${id} 
    LIMIT 1`;
    if(items.length > 0) {
      let item = items[0];
      this.user = await (new entity_user).by(entity_user.query()
        .where(sql`id = ${ item.creator }`)
      );
      this.data = item;
    }
    return this;
  }

  // this is where sql truly shines
  // relational data, use join
  async by_username(username: string) {
    let items = await sql`SELECT feed.*
    FROM "feed" 
    INNER JOIN "users" ON feed.creator = users.id
    WHERE users.username = ${username}
    LIMIT 1`;
    if(items.length > 0) {
      let item = items[0];
      this.user = await (new entity_user).by(entity_user.query()
        .where(sql`id = ${ item.creator }`)
      );
      this.data = item;
    }
    return this;
  }

  async by_token(token: string) {
    let items = await sql`SELECT * 
    FROM "feed" 
    WHERE "token" = ${token} 
    LIMIT 1`;
    if(items.length > 0) {
      let item = items[0];
      this.user = await (new entity_user).by(entity_user.query()
        .where(sql`id = ${ item.creator }`)
      );
      this.data = item;
    }
    return this;
  }

  static async all(
    limit: number = 16, 
    page: number = 1, 
    query: string, 
    sort: string = "createdat", 
    order: string = ENUM.order.DESCENDING
  ): Promise<message_type> {
    const allowed_sorts = ["id", "text", "updatedat", "createdat"];
    const allowed_wheres = ["text"];

    if(!allowed_sorts.includes(sort)) sort = "createdat";
    if(query === "undefined") query = "";;
    order = validate_orderby(order, "DESC");

    const offset = (page - 1) * limit;
    let items = await sql`SELECT *, (SELECT COUNT(*) FROM "feed") AS total_count
    FROM "feed" 
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
        let new_item = new entity_feed;
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
    return await sql`UPDATE "users" SET "updatedat" = ${Date.now()} WHERE "id" = ${this.data?.id}`;
  }

  get exists() {
    return Object.keys(this.data ?? {}).length !== 0;
  }

  get id() {
    return Number(this.data?.id);
  }

  
  get text() {
    return this.data?.text;
  }
  get bb_text() {
    return this.bbcode_strict.parse(this.data?.text);
  }
  get createdat() {
    return this.data?.createdat;
  }
  get updatedat() {
    return this.data?.updatedat;
  }

  static txt_validate(txt: any) {
    let rules = {
      "feed_txt.empty": (!txt || txt === "" || txt.length === 0),
      "feed_txt.is_more_or_equal_200": txt.length >= 200,
      "feed_txt.is_less_than_1": txt.length < 1,
    }

    for(const [rule, valid] of Object.entries(rules)) {
      if(valid) return rule;
    }
    return false;
  }

  static wait_cooldown = 15;
  static async check_if_recently_posted(userid: number) {
    let st = await sql`SELECT * FROM "feed"
    WHERE creator = ${userid}
    ORDER BY updatedat DESC`;
    if(st.length > 0) {
      const updatedat = st[0].updatedat;
      return [((Date.now() - updatedat) <= this.wait_cooldown * 1000), 
      (this.wait_cooldown - Math.round((Date.now() - updatedat) / 100) / 10)];
    } else {
      return [false, 0];
    }
  }

  static async send(txt: any, userid: number, replyto: number): Promise<message_type> {
    txt = txt.toString();

    const txt_err = this.txt_validate(txt);
    if(txt_err !== false) {
      // this isnt a bool typescript just assumes
      return { success: false, message: String(txt_err) };
    }

    const time = Date.now();
    let params = {
      text: txt,
      creator: userid,
      replyto: replyto,
      updatedat: time,
      createdat: time
    }

    const [hasposted, timetowait] = await this.check_if_recently_posted(userid);
    if(hasposted) {
      return {success: true, message: `wait ${timetowait} second(s)`}; 
    }

    let st = await sql`
      INSERT INTO "feed" ${sql(params)}
      RETURNING *`;
    if(st.length > 0) {
      let query = st[0];
      return {success: true, message: "sent message.", info: { id: query?.id }}; 
    } else {
      return {success: false, message: "failed to send message."}
    }
  }

}

export default entity_feed;