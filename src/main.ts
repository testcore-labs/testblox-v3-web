import express, { type Express, type Request, type Response } from "express";
import env from "./utils/env";
import twig from "./utils/twig";
import root_path from "./utils/root_path";
import * as path from "path";import fs from "fs/promises";
import cookie_parser from "cookie-parser";
// import users from "./utils/db";

import front_routes from "./routes/front";
import api_v1_routes from "./routes/api_v1";

console.log(`[server]: starting...`);
const app: Express = express();

app.set("views", "views");
app.set("view engine", twig);
app.set("twig options", {
  allowAsync: true,
  strict_variables: false,
});

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

  //const cuser = await user.findOne({ token: req.cookies.token }); // cuser = current user
  //res.locals.cuser = cuser;
  //res.locals.isloggedin = ((cuser == null) ? false : true);
  
  next();
});

app.use("/assets", express.static(path.join(__dirname, "../public/assets"))) 
app.use("/dist", express.static(path.join(__dirname, "../bootstrap-5.3.3/dist"))) 
app.use(front_routes);
app.use("/api/v1", api_v1_routes);

app.get("*", (req, res) => {
  res.status(404).render("404.twig");
});


app.listen(env.port, () => {
  console.log(`[server]: server is running at :${env.port}`);
});