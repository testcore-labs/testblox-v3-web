import express, { type Express, type Request, type Response } from "express";
import * as path from "path";
import colors from "colors";
import async_handler from 'express-async-handler';
import cookie_parser from "cookie-parser";
import { queryParser as query_parser} from "express-query-parser";
import cors from "cors";
//import multer from "multer";

import user from "./db/user";
import './utils/sql';
import env from "./utils/env";
import twig from "./utils/twig";
import logs from "./utils/log";

import translate from "./utils/translate";
import arbiter from "./arbiter";

import front_routes from "./routes/front";
import front_loggedin_routes from "./routes/front_loggedin";
import api_v1_routes from "./routes/api_v1";
import api_roblox_routes from "./routes/rbx/api";
import api_rcc_roblox_routes from "./routes/rbx/rcc";

new arbiter();
translate.init();

logs.http(`starting...`);
const app: Express = express();

app.use(cookie_parser());
app.use(cors());
app.set('trust proxy', env.behind_proxy)
app.set("views", "views");
app.set("view engine", twig);
app.set("twig options", {
  allowAsync: true,
  strict_variables: false,
});
app.use(express.urlencoded({
    extended: false,
    limit: "4mb"
}));
app.use(
  query_parser({
    parseNull: true,
    parseUndefined: true,
    parseBoolean: true,
    parseNumber: true
  })
)

// PLEASE upload the file somewhere else from tmp, since its TEMPORARY, and we should clean the folder each run aswell
//app.use(multer({dest:root_path+'/files/tmp/'}).smthing);

app.use(async (req, res, next) => {
  app.disable("x-powered-by");
  res.set("X-Powered-By", "PHP/5.6.40"); // get fucking trolled

  logs.request(req.method.toString(), req.originalUrl.toString(), req.ip?.toString() ?? "127.0.0.1", req.get('user-agent')?.toString() ?? "")
  next();
});
// separated so cuser isnt used for assets, good for perfomance
app.use("/assets", express.static(path.join(__dirname, "../public/assets")));
app.use(async (req, res, next) => {
  res.locals.req = req;
  res.locals.res = res;
  res.locals.env = env;
  res.locals.translations = translate.translations;
  res.locals.t = translate.translations[req.cookies?.locale ? req.cookies?.locale.toString() : env.locale];

  // cuser = current user
  let cuser = new user();
  await cuser.by_token(req.cookies[env.session.name]);
  res.locals.cuser = cuser;
  res.locals.isloggedin = req.cookies[env.session.name] && (await cuser).exists; // await DOES change everything >:(

  next();
});

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
  logs.custom(err.stack.replace(err.name + ": ", ""), colors.red("error: " +err.name));
  if(env.debug) {
    let error = err.stack;
    res.set("content-type", "text/plain").status(500).send(error);
  }
});

app.listen(env.port, () => {
  logs.http(`running at :${env.port}`);
});