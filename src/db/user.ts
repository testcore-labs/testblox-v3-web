import sql, { type postgres } from "../utils/sql";
import xss from "xss";
import argon2 from "argon2";
import bbcode from "bbcode-ts";
import { type message_type } from "../utils/message";
import { membership_types } from "../types/membership";
import { gender_types } from "../types/gender";
import { privelege_types } from "../types/priveleges";
import env from "../utils/env";
import { orderby_enum, validate_orderby } from "../types/orderby";
import entity_asset from "./asset";
import { pcall } from "../utils/pcall";

class entity_user {
  static settings_template = {
    locale: "en-us", // for privacy reasons i wont detect the users locale
    css: "",

    show_ads: true,

    log_logins: true // discord poll said they want it on default
  }
  data: { [key: string]: any };
  bbcode_strict: bbcode;

  constructor() {
    this.data = {};
    this.bbcode_strict = new bbcode;
    this.bbcode_strict.tags.a.func = (txt, params) => 
      `<a class="link" href="/redirect?url=${encodeURI(params["url"])}">${txt}</a>`;
    this.bbcode_strict.allowed_tags = ["b", "i", "d", "u", "a", "c"]; 
  }

  async by_id(id: number) {
    let users = await sql`SELECT * 
    FROM "users" 
    WHERE "id" = ${id} 
    LIMIT 1`;
    if(users.length > 0) {
      let user = users[0];
      this.data = user;
    }
    return this;
  }

  async by_username(username: string) {
    let users = await sql`SELECT * 
    FROM "users" 
    WHERE "username" = ${username} 
    LIMIT 1`;
    if(users.length > 0) {
      let user = users[0];
      this.data = user;
    }
    return this;
  }

  async by_token(token: string) {
    let users = await sql`SELECT * 
    FROM "users" 
    WHERE "token" = ${token} 
    LIMIT 1`;
    if(users.length > 0) {
      let user = users[0];
      this.data = user;
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
    const allowed_sorts = ["id", "username", "description", "updatedat", "createdat"];
    const allowed_wheres = ["username", "description"];

    if(!allowed_sorts.includes(sort)) sort = "createdat";
    if(query == "undefined") query = "";;
    order = validate_orderby(order);

    const offset = (page - 1) * limit;
    let items = await sql`SELECT *, (SELECT COUNT(*) FROM "invitekeys") AS total_count
    FROM "users" 
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
        let new_item = new entity_user;
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

  // if you're returning db values, please make sure you dont xss yourself,
  // i don't see a reason to do it BEFORE inserting as its better to be safe than sorry
  
  // future me, dont directly use "set" funcs from classes:
  // 1. you might wanna lock the username change behind a currency paywall (not irl money lol)
  get username() { // this.data? is for not giving a fuck if its null 
    return this.data?.username ?? "";
  }
  set username(set) {
    console.log(set);
  }  

  get settings() {
    return this.data?.settings;
  }

  get status() {
    return this.data?.status ?? "";
  }

  get description() {
    return this.data?.description ?? "";
  }
  get bb_description() {
    return this.bbcode_strict.parse(this.description);
  }

  get password() { // this.data? is for not giving a fuck if its null 
    return xss(this.data?.username ?? "");
  }
  set password(pw: string) {
    if(this.data) {
      this.data.password = pw;
    }
  }

  async recently_played(limit: 8) {
    let games = await sql`SELECT * 
    FROM "recently_played" 
    WHERE "userid" = ${this.data.id} 
    ORDER BY updatedat DESC
    LIMIT ${limit}`;

    const item_ids = games.map(row => row.placeid);
    const new_items = await Promise.all(
      item_ids.map(async item_id => {
        let new_item = new entity_asset;
        return await new_item.by_id(item_id);
      })
    );
    return new_items;
  }

  get money(): number {
    return Number(this.data?.currency);
  }

  get short_money(): string {
    let money = Intl.NumberFormat('en-US', {
      notation: "compact",
      maximumFractionDigits: 1
    }).format(this.data?.currency);
  
    return String(money);
  }

  
  async set_membership(membership_type: membership_types = 0, lastfor: number = (Date.now() + (3600 * 24 * 30) * 1000) /* month */) {
    this.data = await sql`UPDATE "users" SET membership = ${membership_type}, membership_valid = ${lastfor} WHERE "id" = ${this.data?.id} RETURNING *`;
    await this._updateat();
  }

  get has_membership() {
    return (this.data?.membership > 0);
  }

  async set_money(amount: number) {
    await sql`UPDATE "users" SET currency = ${amount} WHERE "id" = ${this.data?.id}`;
    if(this.data) this.data.currency = amount;
    await this._updateat();
  }

  async add_money(amount: number) {
    await sql`UPDATE "users" SET currency = currency + ${ Number(amount) } WHERE "id" = ${this.data?.id}`;
    if(this.data) this.data.currency = Number(this.data.currency) + Number(amount);
    await this._updateat();
  }

  async friend_user() {
    // todo
  }

  async accept_user() {
    // todo
  }

  async get_friends(limit: 16) {
    let friends = await sql`SELECT CASE
        WHEN "from" = ${this.data?.id} THEN "to"
        ELSE "from"
      END as friend_id
    FROM "friends" 
    INNER JOIN "users" ON "users".id = CASE
      WHEN "from" = ${this.data?.id} THEN "to"
      ELSE "from"
    END
    WHERE ("from" = ${this.data?.id} OR "to" = ${this.data?.id})
    AND "accepted" = true
    ORDER BY users.username ASC
    LIMIT ${limit}`;

    const friend_ids = friends.map(row => row.friend_id);
    const user_friends = await Promise.all(
      friend_ids.map(async friend_id => {
        let friend = new entity_user;
        return await friend.by_id(friend_id);
      })
    );

    return user_friends;
  }

  get what_privelege(): string {
    return privelege_types[this.data?.privelege];
  }

  get is_member(): boolean {
    return this.data?.privelege === privelege_types.member;
  }

  get is_mod(): boolean {
    return this.data?.privelege === privelege_types.mod;
  }

  get is_admin(): boolean {
    return this.data?.privelege === privelege_types.admin;
  }

  get is_owner(): boolean {
    return this.data?.privelege === privelege_types.owner;
  }

  // a pointer to a file
  async get_headshot() {
    let headshot = this.data?.headshot;
    if(headshot == 0) {
      return "/assets/img/reviewpending.png";
    }
  }

  get online() {
    return this.data?.online;
  }

  async set_online() {
    this.data = await sql`UPDATE "users" SET online = ${ Date.now() + 30 * 1000 } WHERE "id" = ${this.data?.id} RETURNING *`;
    await this._updateat();
  }

  get is_online() {
    return ((Date.now() - (this.data?.online || 0)) < 60 * 1000);
  }

  get updatedat() {
    return this.data?.updatedat;
  }
  get createdat() {
    return this.data?.createdat;
  }

  static get rand_token(): string {
    let characters = "0123456789abcdef"
    let str = ""
    for(let i = 0; i < 96; i++){
      str += characters[Math.floor(Math.random() * 16)]
    }
    return str;
  }

  static async check_and_rand_token(i = 0): Promise<any> {
    let token = this.rand_token;
    const users_find = await sql`SELECT * 
    FROM "users" 
    WHERE "token" = ${token} 
    LIMIT 1`;
    if(users_find.length == 0) {
      return token;
    } else {
      if(i == 1024) { // how would this even happen tho lmao, its 10^77 possible combinatifons, WHICH IS FAR MORE THAN A REVIVAL WOULD EVER NEED
        console.log("can't produce a unused token.");
        return Error("can't produce a unused token.");
      }
      i = i + 1;
      return this.check_and_rand_token(i);
    }
  }

  static username_validate(username: any) {
    let rules = {
      "username.empty": (!username || username == "" || username.length == 0),
      "username.is_more_than_20": username.length > 20,
      "username.is_0": username.length == 0,
      "username.is_not_ascii": !(new RegExp(`^[A-Za-z0-9_]+$`)).test(username),
    }

    for(const [rule, valid] of Object.entries(rules)) {
      if(valid) return rule;
    }
    return false;
  }

  static password_validate(password: any) {
    let rules = {
      "password.empty": (!password || password == "" || password.length == 0),
      "password.is_more_than_32": password.length > 32,
      "password.is_less_than_4": password.length < 4,
      "password.is_not_ascii": !(new RegExp(`^[A-Za-z0-9_#\$]+$`)).test(password),
    }

    for(const [rule, valid] of Object.entries(rules)) {
      if(valid) return rule;
    }
    return false;
  }

  async generate_hash(password: string) {
    let [ success, password_hash ] = await pcall(async () => await argon2.hash(password, {
      type: argon2.argon2id,
      hashLength: 128,
    }));
    if(success instanceof Error) {
      throw success;
    } else {
      return password_hash;
    }
  }

  // run this with a pcall (yes i made a simpler way to catch errs) or try catch clause
  static async register(username: any, password: any): Promise<message_type> {
    let token = await this.check_and_rand_token(); // too lazy to make it use message type
    if(token && token.stack && token.message) {
      const msg: message_type = {success: false, message: token.message};
      return msg;
    }

    username = username.toString();
    password = password.toString();

    const un_err = this.username_validate(username);
    if(un_err !== false) {
      // this isnt a bool typescript just assumes
      return { success: false, message: String(un_err) };
    }
    const pw_err = this.password_validate(password);
    if(pw_err !== false) {
      return { success: false, message: String(pw_err) };
    }

    const hash = await argon2.hash(password ?? "");

    const time = Date.now();
    let params = {
      username: username,
      password: hash, 
      token: token,
      privelege: 1,
      status: "i'm new to testblox!",
      currency: env.currency.starter, 
      gender: gender_types.NONE, 
      membership: membership_types.NONE, 
      settings: sql.json(this.settings_template),
      createdat: time, 
      updatedat: time,
    }

    let st = await sql`
      INSERT INTO "users" ${sql(params)}
      RETURNING *`;
    if(st.length > 0) {
      let query = st[0];
      return {success: true, message: "created account.", info: { id: query?.id, token: query?.token }}; 
    } else {
      return {success: false, message: "failed to create account."}
    }
  }

  static async login(username: any, password: any, ): Promise<message_type> {
    username = username.toString();
    password = password.toString();

    const un_err = this.username_validate(username);
    if(un_err !== false) {
      return { success: false, message: String(un_err) };
    }
    const pw_err = this.password_validate(password);
    if(pw_err !== false) {
      return { success: false, message: String(pw_err) };
    }

    let st = await sql`
    SELECT * FROM "users" 
    WHERE "username" = ${username}`;
    if(st.length > 0) {
      let query = st[0];

      let argon_verify = false;
      try {
        argon_verify = (await argon2.verify(query?.password.toString() ?? "", password));
      } catch(e) {
        // "TypeError: pchstr must contain a $ as first char" usually means your string is not a argon2 hash
        return {success: false, message: env.debug ? "argon2 failed to hash: "+e : "username or password is incorrect."};
      }
      if(!argon_verify) {
        return {success: false, message: env.debug ? "password is invalid" : "username or password is incorrect."};
      }
      return {success: true, message: "created account.", info: { id: query?.id, token: query?.token }}; 
    } else {
      return {success: false, message: env.debug ? "user not found" : "username or password is incorrect."}
    }
  }
    // username = username?.trim();
    // username = username?.toString();
    // const err_un = this.username_validate(username);
    // if(err_un && !err_un.success) {
    //   return err_un;
    // }
    // const user_find = this.table.find((p: user_table) => p.username === username);
    // if(!user_find || this.empty_table) {
    //   return {success: false, message: "user not found."};
    // }

    // password = password?.trim();
    // password = password?.toString();
    // const err_pw = this.password_validate(password);
    // if(err_pw && !err_pw.success) {
    //   return err_pw;
    // }
    // if(!(await argon2.verify(user_find.password, password))) {
    //   return {success: false, message: "username or password is incorrect."};
    // }
    // return {success: true, message: "created account.", info: { id: user_find.id, token: user_find.token }}; 


}

export default entity_user;