// for testing things in cli obv
import entity_user from "../db/user";
import sql from "../utils/sql";

let output = new entity_user;

await output.by(entity_user.query()
.where(sql`username = ${`qzip`}`)
)

console.log(output.gender);