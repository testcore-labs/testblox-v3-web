import sql, { type postgres } from "../utils/sql";
import xss from "xss";
import argon2 from "argon2";
import { type message_type } from "../utils/message";
import { membership_types } from "../types/membership";
import { gender_types } from "../types/gender";
import env from "../utils/env";

const settings_obj = {
  locale: String, // user decides
  language: String, // user decides
  css: String, // this has to secured (also make this scoped so u cant fuck wit the whole page)

  log_logins: Boolean,
}

class user {
  priveleges = {
    member: 1,
    mod: 2,
    admin: 3,
    owner: 4
  }
  data: { [key: string]: any } | undefined;

  constructor() {
    this.data = {};
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

  async _updateat() {
    return await sql`UPDATE "users" SET "updatedat" = ${new Date} WHERE "id" = ${this.data?.id}`;
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

  get password() { // this.data? is for not giving a fuck if its null 
    return xss(this.data?.username ?? "");
  }
  set password(pw: string) {
    if(this.data) {
      this.data.password = pw;
    }
  }

  get money(): number {
    return Number(this.data?.currency);
  }

  set money(amount: number) {
    sql`UPDATE "users" SET currency = ${amount} WHERE "id" = ${this.data?.id}`;
    if(this.data) this.data.currency = amount;
    this._updateat();
  }

  get is_mod(): boolean {
    return this.data?.privelege === this.priveleges.mod;
  }

  get is_admin(): boolean {
    return this.data?.privelege === this.priveleges.admin;
  }

  get is_owner(): boolean {
    return this.data?.privelege === this.priveleges.owner;
  }

  // get headshot(): File {
  //   return; // TODO: use assets to return the Image of the rendered character
  // }


  get rand_token(): string {
    let characters = "0123456789abcdef"
    let str = ""
    for(let i = 0; i < 64; i++){
      str += characters[Math.floor(Math.random() * 16)]
    }
    return str;
  }

  async check_and_rand_token(i = 0): Promise<any> {
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

  username_validate(username: any) {
    let rules = {
      "username.empty": (!username || username == "" || username.length == 0),
      "username.is_more_than_20": username.length > 20,
      "username.is_not_ascii": !(new RegExp(`^[A-Za-z0-9_]+$`)).test(username),
    }

    Object.entries(rules).forEach((rule, valid) => {
      if(valid) return rule;
    })
    return false;
  }

  password_validate(password: any) {
    let rules = {
      "password.empty": (!password || password == "" || password.length == 0),
      "password.is_more_than_32": password.length > 32,
      "password.is_less_than_4": password.length < 4,
      "password.is_not_ascii": !(new RegExp(`^[A-Za-z0-9_]+$`)).test(password),
    }

    Object.entries(rules).forEach((rule, valid) => {
      if(valid) return rule;
    })
    return false;
  }


  // run this with a pcall (yes i made a simpler way to catch errs) or try catch clause
  async register(username: any, password: any): Promise<message_type> {
    let token = await this.check_and_rand_token(); // too lazy to make it use message type
    if(token && token.stack && token.message) {
      const msg: message_type = {success: false, message: token.message};
      return msg;
    }

    username = username.toString();
    password = password.toString();

    const un_err = this.username_validate(username);
    if(typeof(un_err) == "string") {
      return un_err;
    }
    const pw_err = this.password_validate(password);
    if(typeof(pw_err) == "string") {
      return pw_err;
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
      settings: sql.json({
        locale: "en-us", // for privacy reasons i wont detect the users locale
        css: "",

        log_logins: true // discord poll said they want it on default
      }),
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

  async login(username: any, password: any, ): Promise<message_type> {
    username = username.toString();
    password = password.toString();

    const un_err = this.username_validate(username);
    if(typeof(un_err) == "string") {
      return un_err;
    }
    const pw_err = this.password_validate(password);
    if(typeof(pw_err) == "string") {
      return pw_err;
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

export default user;