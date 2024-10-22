import sql, { type postgres } from "../sql";
import xss from "xss";
import argon2 from "argon2";
import bbcode from "bbcode-ts";
import { type message_type } from "../types/message";
import env from "../utils/env";
import { validate_orderby } from "../types/orderby";
import entity_asset from "./asset";
import { pcall } from "../utils/pcall";
import ENUM from "../types/enums";
import type ENUM_T from "../types/enums";
import { membership_perks, type membership_types } from "../types/membership";
import entity_base, { query_builder } from "./base";
import cooldown from "../utils/cooldown";
import { xss_all } from "../utils/xss";
import { asset_types_numbered } from "../types/assets";
import entity_ban from "./ban";
import fs from "fs";
import path from "path";
import rule_validator from "../utils/rule_validation";

class entity_user extends entity_base {
  table = "users";

  static settings_template: {[key: string]: number|string|boolean} = {
    locale: "en-us", // for privacy reasons i wont detect the users locale
    css: "",

    show_ads: true,

    log_logins: true // discord poll said they want it on default
  }
  bbcode_strict: bbcode;
  ban: entity_ban|undefined;

  constructor() {
    super();

    this.bbcode_strict = new bbcode;
    this.bbcode_strict.tags.a.func = (txt, params) => 
      `<a class="link" href="/redirect?url=${encodeURI(params["url"])}">${txt}</a>`;
    this.bbcode_strict.allowed_tags = ["b", "i", "d", "u", "a", "c"]; 
  }

  async by(query: query_builder) {
    const data = await query
      .single()
      .exec();

    this.data = data;
    if(this.exists) {
    this.ban = await (new entity_ban).by(entity_ban.query()
      .where(sql`userid = ${this.data.id}`)
      .order("createdat", ENUM.order.DESCENDING)
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
      .search(query, ["username", "description", "status"], false)
      .separate(`AND`)
      .page(page)
      .sort_safe(sort, {
        id: "id", 
        username: "username", 
        description: "description", 
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
        let new_item = new entity_user;
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
    return Number(this.data?.id);
  }

  get username() {
    return String(this.data?.username);
  }

  //TODO: change username with currency
  async set_username(username: string, paid: boolean = false) {
    let un_err = entity_user.username_validate(username);
    if(!un_err.success) {
      return un_err;
    } else {
      let user = await (new entity_user).by(entity_user.query()
        .where(sql`username = ${username}`)
      );
      if(user.exists) {
        return { success: false, message: "username.taken"};
      } else {
        await sql`UPDATE ${sql(this.table)} SET username = ${username} WHERE id = ${this.id}`;
        return { success: true, message: "username.set"};
      }
    }
  }

  get password() {
    return String(this.data?.password);
  }

  get token() {
    return String(this.data?.token);
  }

  get status() {
    return String(this.data?.status);
  }
  
  get description() {
    return String(this.data?.description);
  }
  
  get money() {
    return Number(this.data?.currency);
  }

  get last_daily_money() {
    return Number(this.data?.last_daily_currency);
  }

  get can_give_daily() {
    return (Date.now() - this.last_daily_money) >= (86400 * 1000);  
  }

  async daily_money() {
    if(!this.can_give_daily) return;
    const perks = membership_perks[(this.membership as (membership_types))];

    console.log("hh");
    await sql`UPDATE ${sql(this.table)}
    SET currency = currency + ${perks.daily_currency},
    last_daily_currency = ${Date.now()}
    WHERE id = ${this.id}`;
  }

  get gender() {
    return String(this.data?.gender);
  }
  
  get settings() {
    return this.data?.settings;
  }

  async setting(key: string, value: string|number, validate_setting = true) {
    let settings = entity_user.settings_template;
    if(!(key in settings)) {
      return { success: false, messsage: "invalid key"};
    } else {
      if(typeof settings[key] !== typeof value) {
        return { success: false, messsage: "invalid value type"};
      }
      if(typeof value == "boolean") value = String(value);
      // ts so ass :pray:
      await sql`UPDATE ${sql(this.table)} 
      SET settings = jsonb_set(settings::jsonb, ARRAY[${key}], ${value}::jsonb)::json 
      WHERE "id" = ${this.data?.id}`;
      await this._updateat();
      return { success: true, message: "" };
    }
  }

  // if you're returning db values, please make sure you dont xss yourself,
  // i don't see a reason to do it BEFORE inserting as its better to be safe than sorry
  
  // future me, dont directly use "set" funcs from classes:
  // 1. you might wanna lock the username change behind a currency paywall (not irl money lol)

  get bb_description() {
    return this.bbcode_strict.parse(xss_all(this.description));
  }

  async get_games(
    limit: number = 16, 
    page: number = 1, 
    query: string, 
    sort: string = "createdat", 
    order: string = ENUM.order.DESCENDING,
    privacy: number = ENUM.privacy.PUBLIC,
  ) {
    let games = await entity_asset.all([ENUM.assets.Place], limit, page, query, sort, order, privacy, [ sql`creator = ${this.id}` ]);
    return games;
  }
  async get_items(
    limit: number = 16, 
    page: number = 1, 
    query: string, 
    sort: string = "createdat", 
    order: string = ENUM.order.DESCENDING,
    equipped_only: boolean = true,
  ) {
    let stmt = new query_builder()
      .table("owned_items")
      .limit(limit)
      .page(page)
      .search(query, ["title"])
      .sort(sort)
      .direction(order)
      .where(sql`owner = ${this.id}`)
      
    if(equipped_only) {
      stmt.where(sql`equipped = true`);
    }

    let result = await stmt.exec();
    
    const item_ids = result.data.map((row: any) => row.item);
    const new_items = await Promise.all(
      item_ids.map(async (item_id: number) => {
        let new_item = new entity_asset;
        return await new_item.by(entity_asset.query()
          .where(sql`id = ${item_id}`)
        );
      })
    );
    return { success: true, message: "", info: { 
      items: new_items,
      ...result
    }};
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
  
  async gamble_2x(gamble_amount: number = 0): Promise<message_type> {
    if(Number.isNaN(gamble_amount)) {
      return { success: false, message: "gamble.no_amount_given" }
    } else {
      if(this.money >= gamble_amount && !(gamble_amount <= 0)) {
        let [can_do, wait_amount] = cooldown.apply(this.id, (1 * 1000));
        if(!can_do) {
          return { success: false, message: `gamble.wait`, info: {
            wait: (wait_amount / 1000)
          }} 
        }
  
        let random = Math.ceil(Math.random() * 4);
        let won_amount = -gamble_amount;
        if(random === 3) {
          won_amount = Math.floor(gamble_amount * 2);
        }
  
        let won_or_lost = won_amount >= gamble_amount;

        await this.add_money(won_amount);
        return { success: true, message: `gamble.${ won_or_lost ? `won` : `lost`}`, info: { 
          won_or_lost: won_or_lost, 
          won_amount: won_amount, 
          left: this.money, 
          random: random 
        }}
      } else {
        return { success: false, message: "gamble.not_enough_money" }
      }
    }
  }

  get short_money(): string {
    let money = Intl.NumberFormat('en-US', {
      notation: "compact",
      maximumFractionDigits: 1
    }).format(this.data?.currency);
  
    return String(money);
  }

  
  async set_membership(membership_type: membership_types = ENUM.membership.TIER_1, lastfor: number = (Date.now() + (3600 * 24 * 30) * 1000) /* month */) {
    const stmt = await sql`UPDATE ${sql(this.table)} SET membership = ${membership_type}, membership_valid = ${lastfor} WHERE "id" = ${this.data?.id} RETURNING *`;
    if(stmt.length >= 1) {
      this.data = stmt[0];
    }
    await this._updateat();
  }

  get has_membership() {
    return (this.data?.membership > 0 && Date.now() < this.data?.membership_valid);
  }

  get membership(): number {
    return Number(this.data?.membership);
  }

  get what_membership() {
    return (Date.now() < this.data?.membership_valid) ? this.data?.membership : 0;
  }

  async has_item(item_id: number) {
    let count = await sql`SELECT COUNT(*) as count FROM "owned_items" WHERE item = ${item_id} AND owner = ${this.id}`;
    return (count[0].count >= 1 ? true : false);
  }

  async buy_item(item_id: number): Promise<message_type> {
    if(Number.isNaN(item_id)) return { success: false, message: "item.invalid_item" };
    const item = await (new entity_asset).by(entity_asset.query()
      .where(sql`id = ${item_id}`)
      .where(sql`type IN ${ sql(asset_types_numbered.catalog) }`)
    ); 
    if(item.exists) {
      let price = item.info.price;
      if(await this.has_item(item.id)) {
        return { success: false, message: "item.already_bought" };
      }
      // safety
      if(price >= 0) {
        if(this.money >= price) {
          const time = Date.now();
          const params = {
            owner: this.id,
            item: item.id,
            price: price,
            createdat: time,
            updatedat: time,
          }

          const [count, item_info, money_left, message] = await sql.begin(async sql => {
            const [count] = await sql`SELECT COUNT(*) AS count FROM "owned_items" WHERE "item" = ${params.item}`;
            let message = null;
            // TODO: !HAVENT TESTED IF THE LIM+AVAIL WORKS!!!!!!
            if((count >= item.info.availibility ?? 0) && (item.info.limited ?? false)) {
              message = "item.sold_out";
              return [count, null, null, message];
            } else {

            const [item_info] = await sql`INSERT INTO "owned_items" ${sql(params)}
            RETURNING *`;

            // the db should also check just for safety
            const [money_left] = await sql`UPDATE ${sql(this.table)} SET currency = currency - ${params.price} WHERE currency >= ${params.price} RETURNING currency`;
            return [count, item_info, money_left, message];
            }
          })
          if(message) {
            return { success: false, message: message }; 
          } else {
            return { success: true, message: "item.bought", info: {
              item: item_info?.id,
              price: item_info?.price,
              money_left: money_left?.currency,
            }};
          }
        } else {
          return { success: false, message: "item.not_enough_money" }
        }
      } else {
        return { success: false, message: "item.not_for_sale" };
      }
    } else {
      return { success: false, message: "item.does_not_exist" };
    }
  }

  async set_money(amount: number) {
    await sql`UPDATE ${sql(this.table)} SET currency = ${amount} WHERE "id" = ${this.data?.id}`;
    if(this.data) this.data.currency = amount;
    await this._updateat();
  }

  async add_money(amount: number) {
    await sql`UPDATE ${sql(this.table)} SET currency = currency + ${ Number(amount) } WHERE "id" = ${this.data?.id}`;
    if(this.data) this.data.currency = Number(this.data.currency) + Number(amount);
    await this._updateat();
  }

  async friend_user() {
    // todo
  }

  async accept_user() {
    // todo
  }

  async get_friend_count() {
    let count = await sql`SELECT (CASE
        WHEN "from" = ${this.data?.id} THEN "to"
        ELSE "from"
      END) as friend_id, COUNT(*) as "fcount"
    FROM "friends"
    INNER JOIN ${sql(this.table)} ON ${sql(this.table)}.id = CASE
      WHEN "from" = ${this.data?.id} THEN "to"
      ELSE "from"
    END
    WHERE ("from" = ${this.data?.id} OR "to" = ${this.data?.id})
    AND "accepted" = true
    GROUP BY friend_id, users.username
    ORDER BY users.username ASC`;

    if(count.length >= 1) {
      return count[0].fcount;
    } else {
      return 0;
    }
  }

  async get_friends(limit: 16) {
    let friends = await sql`SELECT CASE
        WHEN "from" = ${this.data?.id} THEN "to"
        ELSE "from"
      END as friend_id
    FROM "friends" 
    INNER JOIN ${sql(this.table)} ON ${sql(this.table)}.id = CASE
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
        return await friend.by(entity_user.query()
          .where(sql`id = ${ friend_id }`)
        );
      })
    );

    return user_friends;
  }

  get what_privilege(): string {
    return ENUM.privileges[this.data?.privilege];
  }

  get is_member(): boolean {
    return this.data?.privilege === ENUM.privileges.member;
  }

  get is_mod(): boolean {
    return this.data?.privilege === ENUM.privileges.mod;
  }

  get is_admin(): boolean {
    return this.data?.privilege === ENUM.privileges.admin;
  }

  get is_owner(): boolean {
    return this.data?.privilege === ENUM.privileges.owner;
  }
  
  get has_admin_panel(): boolean {
    return this.data?.privilege >= ENUM.privileges.mod;
  }

  async set_member() {
    return await sql`UPDATE ${sql(this.table)} SET privilege = ${ENUM.privileges.member} WHERE id = ${this.id}`;
  }

  async set_mod() {
    return await sql`UPDATE ${sql(this.table)} SET privilege = ${ENUM.privileges.mod} WHERE id = ${this.id}`;
  }

  async set_admin() {
    return await sql`UPDATE ${sql(this.table)} SET privilege = ${ENUM.privileges.admin} WHERE id = ${this.id}`;
  }

  async set_owner() {
    return await sql`UPDATE ${sql(this.table)} SET privilege = ${ENUM.privileges.owner} WHERE id = ${this.id}`;
  }


  // a pointer to a publicly-accesible file
  async get_headshot() {
    let headshot = await (new entity_asset).by(entity_asset.query()
      .where(sql`id = ${this.data?.headshot} AND type = ${ENUM.assets.Thumbnail}`)
    );
    if(headshot.exists) {
      return `/asset/?id=${headshot.id}`;
    } else {
      return "/assets/img/reviewpending.png";
    }
  }
  
  async get_fullbody() {
    let fullbody = await (new entity_asset).by(entity_asset.query()
      .where(sql`id = ${this.data?.fullbody} AND type = ${ENUM.assets.Thumbnail}`)
    );
    if(fullbody.exists) {
      return fullbody.file;
    } else {
      return "/assets/img/reviewpending.png";
    }
  }

  get online() {
    return this.data?.online;
  }

  async set_online() {
    const stmt = await sql`UPDATE ${sql(this.table)} SET online = ${ Date.now() + 30 * 1000 } WHERE "id" = ${this.data?.id} RETURNING *`;
    if(stmt.length >= 1) {
      this.data = stmt[0];
    }
    await this._updateat();
  }

  get is_online() {
    return ((Date.now() - (this.data?.online || 0)) < 15 * 1000);
  }

  get updatedat() {
    return this.data?.updatedat;
  }
  get createdat() {
    return this.data?.createdat;
  }

  static get rand_token(): string {
    const characters = "0123456789abcdefABCDEFxyzXYZmeow:3" // yes this is intentional
    let new_token = ""
    const token_length = 96;
    for(let i = 0; i < token_length; i++){
      new_token += characters[Math.floor(Math.random() * characters.length)]
    }
    return new_token;
  }

  static async check_and_rand_token(i = 0): Promise<any> {
    let token = this.rand_token;
    const users_find = await sql`SELECT * 
    FROM "users" 
    WHERE "token" = ${token} 
    LIMIT 1`;
    if(users_find.length === 0) {
      return token;
    } else {
      if(i === 1024) { // how would this even happen tho lmao, its 10^77 possible combinatifons, WHICH IS FAR MORE THAN A REVIVAL WOULD EVER NEED
        console.log("can't produce a unused token.");
        return Error("can't produce a unused token.");
      }
      i = i + 1;
      return this.check_and_rand_token(i);
    }
  }

  static username_validate = (username: string) => {
    let validator = new rule_validator(username, "username");
    validator.filters.is_empty();
    validator.filters.min_eq_len(1, true);
    validator.filters.max_eq_len(20, true);
    validator.filters.regex(new RegExp(`^[A-Za-z0-9_]+$`), true, `allowed_chars`);
    return validator.validate();
  }

  static password_validate(password: any) {
    let validator = new rule_validator(password, "password");
    validator.filters.is_empty();
    validator.filters.min_eq_len(1, true);
    validator.filters.max_eq_len(32, true);
    return validator.validate();
  }

  static async generate_hash(password: string) {
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
  static async register(username: any, password: any, invkey: any): Promise<message_type> {
    username = username.toString();
    password = password.toString();

    const un_err = this.username_validate(username);
    if(!un_err.success) {
      return un_err;
    }
    const pw_err = this.password_validate(password);
    if(!pw_err.success) {
      return pw_err;
    }

    let taken_user = await (new entity_user).by(entity_user.query()
      .where(sql`username = ${username}`)
    );
    if(taken_user.exists) {
      return { success: false, message: "username.taken"};
    }

    const [success, hash] = await pcall(async () => await this.generate_hash(password));

    if(!success) {
      //!!!
      console.log(success);
      return { success: false, message: "password.no_hash_generated"};
    }

    let token = await this.check_and_rand_token(); // too lazy to make it use message type
    if(token && token.stack && token.message) {
      const msg: message_type = {success: false, message: token.message};
      return msg;
    }

    const time = Date.now();
    let params = {
      username: username,
      password: hash, 
      token: token,
      privilege: 1,
      status: env.user.status,
      currency: env.currency.starter, 
      gender: ENUM.gender.NONE, 
      membership: ENUM.membership.NONE, 
      settings: sql.json(this.settings_template),
      online: time,
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
    if(!un_err.success) {
      return un_err;
    }
    const pw_err = this.password_validate(password);
    if(!pw_err.success) {
      return pw_err;
    }

    let st = await sql`
    SELECT * FROM "users" 
    WHERE "username" = ${username}`;
    if(st.length > 0) {
      let query = st[0];

      let [success, argon_verify = false] = await pcall(async () => {
        return (await argon2.verify(query?.password.toString() ?? "", password));
      });

      if(success instanceof Error) {
        return {success: false, message: env.debug 
          ? "argon2 failed to hash: " + success 
          : "username or password is incorrect."};
      }

      if(!argon_verify) {
        // this is a bad idea tho, maybe only as a feature?
        // ~~TODO: regen on login~~
        //let new_token = this.check_and_rand_token(); 
        return {success: false, message: env.debug ? "password is invalid" : "username or password is incorrect."};
      } else {
        return {success: true, message: "created account.", info: { id: query?.id, token: query?.token }}; 
      }
    } else {
      return {success: false, message: env.debug ? "user not found" : "username or password is incorrect."}
    }
  }
}

export default entity_user;