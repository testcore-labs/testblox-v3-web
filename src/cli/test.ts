// for testing things in cli obv
import {query_builder} from "../db/base";
import sql from "../sql";

let qu = new query_builder;
const stmt = await
qu.table("invitekeys")
  .exec();

console.log(stmt);