import express, { type Express, type Request, type Response } from "express";

import front_routes from "./routes/front";
import front_loggedin_routes from "./routes/front_loggedin";
import api_v1_routes from "./routes/api_v1";
import api_roblox_routes from "./routes/rbx/api";
import api_rcc_roblox_routes from "./routes/rbx/rcc";
import ENUM from "./types/enums";
import sql from "./sql";
import root_path from "./utils/root_path";

import * as path from "path";
import colors from "./utils/colors";
import async_handler from 'express-async-handler';
import cookie_parser from "cookie-parser";
import { queryParser as query_parser} from "express-query-parser";
import cors from "cors";

import entity_user from "./db/user";
import twig from "./utils/twig";
import env from "./utils/env";
import logs from "./utils/log";
import translate from "./translate";

translate.init();
const app = express()

app.use(cookie_parser());
app.use(cors());
app.set('trust proxy', env.behind_proxy)
app.set("views", path.join(root_path, env.views.folder));
app.set("view engine", twig);
app.set("twig options", {
  allowAsync: true,
  autoescape: false, // retarded
  strict_variables: false,
});
app.use(express.urlencoded({
    extended: false,
    limit: "25mb"
}));
app.use(express.json());
app.use(
  query_parser({
    parseNull: true,
    parseUndefined: true,
    parseBoolean: true,
    parseNumber: true
  })
)

app.use(async_handler(async (req, res, next) => {
  app.disable("x-powered-by");
  res.set("X-Powered-By", "PHP/5.6.40"); // get fucking trolled

  let user_agent = req.get('user-agent')?.toString() ?? "";
  logs.request(
    req.method.toString(), 
    req.originalUrl.toString(), 
    req.ip?.toString() ?? "0.0.0.0", 
    user_agent
  );
  next();
}));
// separated so cuser isnt used for assets, good for perfomance
app.use("/", express.static(path.join(__dirname, "../public/")));
app.use(async_handler(async (req, res, next) => {
  translate.select(req.cookies?.locale ?? env.locale)
  res.locals.req = req;
  res.locals.res = res;
  res.locals.env = env;
  res.locals.ENUM = ENUM;
  res.locals.translations = translate.translations;
  res.locals.translate = (text: string) => translate.text(text);
  const selected_translation = translate.translations[req.cookies?.locale ? req.cookies?.locale.toString() : env.locale];
  res.locals.t = selected_translation;
  // cuser = current user
  let cuser = new entity_user();
  await cuser.by(entity_user.query()
    .where(sql`token = ${req.cookies[env.session.name]}`)
  );
  res.locals.cuser = cuser;
  res.locals.isloggedin = req.cookies[env.session.name] && (await cuser).exists; // await DOES change everything >:(
  next();
}));

app.use(front_loggedin_routes); 
app.use(front_routes);
app.use("/api/v1", api_v1_routes);
app.use(api_roblox_routes);
app.use(api_rcc_roblox_routes);

app.get("*", async_handler(async (req, res) => {
  if(req.path.startsWith("/assets")) {
    res.status(403).render("error.twig");
  } else {
    res.status(404).render("error.twig");
  }
}));

app.use((err: any, req: any, res: any, next: any) => {
  try {
    logs.custom(err.stack.replace(err.name + ": ", ""), colors.red("error: " +err.name));
    if(env.debug) {
      let error = err.stack;
      return res.set("content-type", "text/plain").status(500).send(error);
    }
  } catch(e) {
    console.error(err);
  }
});

export default app;