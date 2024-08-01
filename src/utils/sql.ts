import postgres from "postgres"
import logs from "./log"
import env from "./env"

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
    transform: { undefined: null }
  });
  // try to query
  let test_query = await sql`SELECT 1`; // fails if not connected
  if(!!test_query && test_query.length == 0) {
    throw new postgres.PostgresError("failed to test query");
  }
} catch(e) {
  if(e.code == "ECONNREFUSED") {
    logs.custom(`is your postgres server running? check what port it's running.`, "!");
    logs.custom(`if you haven't installed it, please install postgres server.`, "!");
    logs.database(`server is unreachable`);
  } else {
    logs.database(`failed to connect: ${e}`);
  }
  throw e;
} finally {
  if(!sql) {
    logs.database(`connected to ${db_creds.username}:${db_creds.password.replace(/./gi, "*")}@${db_creds.host}:${db_creds.port}/${db_creds.database}`);
  }
}

export default sql;
export { postgres };