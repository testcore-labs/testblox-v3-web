// import db from "../utils/db";
// import xss from "xss";
// import argon2 from "argon2";
// import { type message_type } from "../utils/message";
// import type { universes_table } from "./tables/universes";

// class user {
//   id: number;
//   data: universes_table | undefined;
//   table: any;
//   empty_table: boolean;

//   constructor() {
//     this.id = 0;
//     this.table = db.data.users;
//     this.empty_table = (this.table.at(0) === undefined);
//   }

//   async by_id(id: number) {
//     const result = await this.table.find((p: universes_table) => p.id === id)
//     if(result !== undefined) {
//     this.id = result.id;
//     this.data = result;
//     }
//     return this;
//   }

//   async by_username(username: string) {
//     const result = await this.table.find((p: universes_table) => p.username === username)
//     if(result !== undefined) {
//     this.id = result.id;
//     this.data = result;
//     }
//     return this;
//   }

//   async by_token(token: string) {
//     const result = await this.table.find((p: universes_table) => p.token === token)
//     if(result !== undefined) {
//     this.id = result.id;
//     this.data = result;
//     }
//     return this;
//   }

//   get exists() {
//     return this.data != undefined;
//   }

//   get username() {
//     return this.data?.username ?? "";
//   }
//   set username(set) {
//     console.log(set);
//   }  

//   async create(username: any, password: any): Promise<message_type> {
//     let post: universes_table = {
//     }

//     username = username?.trim();
//     username = username?.toString();
//     const err_un = this.username_validate(username);
//     if(err_un && !err_un.success) {
//       return err_un;
//     }

//     if(this.table.find((p: user_table) => p.username === username)) {
//       const msg: message_type = {success: false, message: "username taken."};
//       return msg;
//     }
//     post.username = username ?? "";

//     password = password?.trim();
//     password = password?.toString();
//     const err_pw = this.password_validate(password);
//     if(err_pw && !err_pw.success) {
//       return err_pw;
//     }
//     const hash = await argon2.hash(password ?? "");
//     post.password = hash.toString()

//     post.createdat = Date.now();
//     post.updatedat = Date.now();

//     let token = this.check_and_rand_token(); // too lazy to make it use message type
//     if(token && token.stack && token.message) {
//       const msg: message_type = {success: false, message: token.message};
//       return msg;
//     } else {
//       post.token = token.toString();
//     }
    
//     post.id = this.table.length + 1;
//     this.table.push(post);

//     await db.write();
//     const msg: message_type =  {success: true, message: "created account.", info: { id: post.id, token: post.token }}; 
//     return msg;
//   }
// }

// export default user;