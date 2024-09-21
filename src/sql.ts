import postgres from "postgres"
import { highlight } from "sql-highlight"
import colors, { createColors } from "./utils/colors"
import logs from "./utils/log"
import env from "./utils/env"

// cool thing about this library is that it sanitizes user input FOR you

let sql!: postgres.Sql;
logs.database("connecting...");
const db_creds = env.database
try {
  sql = postgres({
    host: db_creds.host,
    port: db_creds.port,
    database: db_creds.database,
    username: db_creds.username,
    password: db_creds.password,
    ssl: db_creds.ssl ?? false,
    transform: { undefined: null },
    debug: (connection, query, parameters) => {
      // shit code
      if(env.database.log_queries) { 
        logs.custom(`${ connection }\n${ colors.blue("query") }: ${ highlight(query, { colors: { 
          keyword: "\x1b[94m",
          function: "\x1b[35m",
          number: "\x1b[32m",
          string: "\x1b[31m",
          identifier: "\x1b[97m",
          special: "\x1b[90m",
          bracket: "\x1b[36m",
          comment: "\x1b[90m",
          clear: '\x1b[0m'
        }}) 
        }\n${ colors.blue("param") }: ${ JSON.stringify(parameters, null, 2)}`, colors.red(colors.bold("sql")));
      }
    }
  });


  // try to query
  let test_query = await sql`SELECT 1`; // fails if not connected
  if(!!test_query && test_query.length === 0) {
    throw new postgres.PostgresError("failed to test query");
  }
} catch(e) {
  if(e.code === "ECONNREFUSED") {
    logs.custom(`is your postgres server running? check what port it's running.`, "!");
    logs.custom(`if you haven't installed it, please install postgres server.`, "!");
    logs.database(`server is unreachable`);
  } else {
    logs.database(`failed to connect: ${e}`);
  }
  throw e;
} finally {
  if(sql != undefined) {
    logs.database(`connected to ${db_creds.username}:${db_creds.password.replace(/./gi, "*")}@${db_creds.host}:${db_creds.port}/${db_creds.database}`);
  }
}

export default sql;
export { postgres };