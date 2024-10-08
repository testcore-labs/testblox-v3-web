// for testing things in cli obv
import user from "../db/user";
import sql from "../sql";

let cuser = await (new user).by(user.query()
  .where(sql`id = ${23}`)
);

console.log(await cuser.setting("css", "world!!"));