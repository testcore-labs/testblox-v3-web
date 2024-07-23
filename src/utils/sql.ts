import postgres from "postgres"
import logs from "./log"
import env from "./env"

// cool thing about this library is that it sanitizes user input FOR you

logs.database("connecting...");
const db_creds = env.database
let sql = postgres({
  host: db_creds.host,
  port: db_creds.port,
  database: db_creds.database,
  username: db_creds.username,
  password: db_creds.password,
  transform: { undefined: null }
});

logs.database(`connected to ${db_creds.username}:${db_creds.password.replace(/./gi, "*")}@${db_creds.host}:${db_creds.port}/${db_creds.database}`);

export default sql;
export { postgres };