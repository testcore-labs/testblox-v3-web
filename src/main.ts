import express, { type Express, type Request, type Response } from "express";
import env from "./utils/env";
import twig from "./utils/twig";
import * as path from "path";
import async_handler from 'express-async-handler';
import root_path from './utils/root_path';
import cookie_parser from "cookie-parser";
import logs from "./utils/log";
import { queryParser as query_parser} from "express-query-parser";
//import multer from "multer";
import user from "./db/user";
import './utils/db';

import front_routes from "./routes/front";
import front_loggedin_routes from "./routes/front_loggedin";
import api_v1_routes from "./routes/api_v1";
import roblox_routes from "./routes/api_roblox";

logs.http(`starting...`);
const app: Express = express();

app.set("views", "views");
app.set("view engine", twig);
app.set("twig options", {
  allowAsync: true,
  strict_variables: false,
});

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

app.set('trust proxy', env.behind_proxy)
app.use(express.urlencoded({
    extended: false,
    limit: "4mb"
}));
app.use(cookie_parser());
app.use(async (req, res, next) => {
  app.disable("x-powered-by");
  res.set("X-Powered-By", "PHP/5.6.40"); // get fucking trolled

  res.locals.req = req;
  res.locals.res = res;
  res.locals.env = env;

  const cuser = new user(); // cuser = current user
  cuser.by_token(req.cookies[env.session.name]);
  res.locals.cuser = cuser;
  res.locals.isloggedin = req.cookies[env.session.name] && (await cuser).exists; // await DOES change everything >:(

  logs.request(req.method.toString(), req.originalUrl.toString(), req.ip?.toString() ?? "127.0.0.1", req.get('user-agent')?.toString() ?? "")
  next();
});

app.use("/assets", express.static(path.join(__dirname, "../public/assets"))) 
app.use(front_loggedin_routes); 
app.use(front_routes);
app.use("/api/v1", api_v1_routes);
app.use(roblox_routes);

app.get("*", async_handler(async (req, res) => {
  if(req.path.startsWith("/assets")) {
    res.status(403).render("error.twig");
  } else {
    res.status(404).render("error.twig");
  }
}));

app.listen(env.port, () => {
  logs.http(`running at :${env.port}`);
});