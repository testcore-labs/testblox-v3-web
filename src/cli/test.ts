// for testing things in cli obv
import entity_base, { query_builder } from "../db/base";
import sql from "../utils/sql";

let games = await new query_builder()
.table("owned_items")
.limit(1)
.page(1)
.search("", ["title"])
.sort("createdat")
.direction("desc")
.where(sql`owner = ${23}`)
.exec();


console.log(games);