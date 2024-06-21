import db from "../utils/db";
import xss from "xss";
import argon2 from "argon2";
import { type user_table, type settings_obj } from "./tables/users";
import { type message_type } from "../utils/message";
import { membership_types } from "../types/membership";
import { gender_types } from "../types/gender";
import env from "../utils/env";

class user {
  id: number;
  data: user_table | undefined;
  table: any;
  empty_table: boolean;

  constructor() {
    this.id = 0;
    this.table = db.data.users;
    this.empty_table = (this.table.at(0) === undefined);
  }

  async by_id(id: number) {
    const result = await this.table.find((p: user_table) => p.id === id)
    if(result !== undefined) {
    this.id = result.id;
    this.data = result;
    }
    return this;
  }

  async by_username(username: string) {
    const result = await this.table.find((p: user_table) => p.username === username)
    if(result !== undefined) {
    this.id = result.id;
    this.data = result;
    }
    return this;
  }

  async by_token(token: string) {
    const result = await this.table.find((p: user_table) => p.token === token)
    if(result !== undefined) {
    this.id = result.id;
    this.data = result;
    }
    return this;
  }

  get exists() {
    return this.data != undefined;
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
      db.write();
    }
  }

  get money(): number {
    return Number(this.data?.currency);
  }

  set money(amount: number) {
    if(this.data) {
      this.data.currency = amount;
      db.write();
    }
  }

  get rand_token(): string {
    let characters = "0123456789abcdef"
    let str = ""
    for(let i = 0; i < 64; i++){
      str += characters[Math.floor(Math.random() * 16)]
    }
    return str;
  }

  check_and_rand_token(i = 0): any {
    let token = this.rand_token;
    const user_find = this.table.find((p: user_table) => p.token !== token);
    if(this.empty_table) {
      console.log(this.empty_table.toString());
      return token;
    } else if(user_find) {
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

  username_validate(username: any): message_type {
    let errs = "";
    switch (true) {
      case !username || typeof(username) == "string" && username.length == 0: 
        errs += "username is empty. ";
        break;
      case username && username.length <= 0:
        errs += "username 1 character too short. ";
        break;
      case username && !(new RegExp(`^[A-Za-z0-9_]+$`)).test(username):
        errs += "username must be ASCII. ";
        break;
      case username && username.length > 20:
        errs += `username ${ (username.length - 20) } character${ (username.length - 20) !== 1 ? "s" : "" } too long. `;
        break;
    }
    const msg: message_type =  {success: (errs.length == 0) ? true : false, message:(errs.length == 0) ? "" : errs.trimEnd()};
    return msg;
  }
  password_validate(password: any): message_type {
    let errs = "";
    switch (true) {
      case !password || typeof(password) == "string" && password.length == 0: 
        errs += "password is empty. ";
        break;
      case password && password.length < 4:
        errs += `password ${ Math.abs(4 - password.length) } character${ Math.abs(4 - password.length) !== 1 ? "s" : "" } too short. `;
        break;
      case password && !(new RegExp(`^[A-Za-z0-9_#-]+$`)).test(password):
        errs += "password must be ASCII. ";
        break; 
      case password && password.length > 32:
        errs += `password ${ (password.length - 32) } character${ (password.length - 32) !== 1 ? "s" : "" } too long. `;
        break;
    }
    const msg: message_type =  {success: (errs.length == 0) ? true : false, message:(errs.length == 0) ? "" : errs.trimEnd()};
    return msg;
  }


  // run this with a pcall (yes i made a simpler way to catch errs) or try catch clause
  async create(username: any, password: any): Promise<message_type> {
    let post: user_table = {
      id: 0,
      username: "",
      password: "",
      token: "",
      status: "i'm new to testblox!",
      description: "",

      currency: env.currency.starter,

      setup: false,
      state: 0,
      gender: gender_types.NONE,
      membership: membership_types.NONE,
      logins: {},
      moderation: {},
      settings: {
        locale: "en-us", // for privacy reasons i wont detect the users locale
        language: env.language,
        css: "",

        log_logins: false // why log them if you don't need them to be
      },

      online: 0,
      updatedat: 0,
      createdat: 0
    }

    username = username?.trim();
    username = username?.toString();
    const err_un = this.username_validate(username);
    if(err_un && !err_un.success) {
      return err_un;
    }

    if(this.table.find((p: user_table) => p.username === username)) {
      const msg: message_type = {success: false, message: "username taken."};
      return msg;
    }
    post.username = username ?? "";

    password = password?.trim();
    password = password?.toString();
    const err_pw = this.password_validate(password);
    if(err_pw && !err_pw.success) {
      return err_pw;
    }
    const hash = await argon2.hash(password ?? "");
    post.password = hash.toString()

    post.createdat = Date.now();
    post.updatedat = Date.now();

    let token = this.check_and_rand_token(); // too lazy to make it use message type
    if(token && token.stack && token.message) {
      const msg: message_type = {success: false, message: token.message};
      return msg;
    } else {
      post.token = token.toString();
    }
    
    post.id = this.table.length + 1;
    this.table.push(post);

    await db.write();
    const msg: message_type =  {success: true, message: "created account.", info: { id: post.id, token: post.token }}; 
    return msg;
  }

  async validate(username: any, password: any): Promise<message_type> {
    username = username?.trim();
    username = username?.toString();
    const err_un = this.username_validate(username);
    if(err_un && !err_un.success) {
      return err_un;
    }
    const user_find = this.table.find((p: user_table) => p.username === username);
    if(!user_find || this.empty_table) {
      return {success: false, message: "user not found."};
    }

    password = password?.trim();
    password = password?.toString();
    const err_pw = this.username_validate(password);
    if(err_pw && !err_pw.success) {
      return err_pw;
    }
    if(!(await argon2.verify(user_find.password, password))) {
      return {success: false, message: "username or password is incorrect."};
    }
    return {success: true, message: "created account.", info: { id: user_find.id, token: user_find.token }}; 
  }
}

export default user;