import express, { type Express, type Request, type Response, type NextFunction } from "express";
const routes = express.Router();
import async_handler from 'express-async-handler';
import htmx_middleware from "../utils/htmx";
import { format_bytes } from "../utils/format";
import asset from "../db/asset"
import {asset_types} from "../types/assets"
import filter from "../utils/filter";
import env from "../utils/env";
import { filterXSS as xss } from "xss";
import promokey from "../db/promokey";
import os from "os";
import type { message_type } from "../utils/message";

routes.use(htmx_middleware);

function notloggedin_handler(req: Request, res: Response, next: NextFunction) {
  if(!res.locals.isloggedin) {
    res.htmx.redirect("/");
  } else {
    next();
  }
}

function debug_handler(req: Request, res: Response, next: NextFunction) {
  if(!env.debug) {
    if(env.admin_panel.debug.troll) {
      res.htmx.redirect(env.admin_panel.debug.troll_url)
    } else {
      res.status(404).render("404.twig");
    }
  } else {
    next();
  }
}

function admin_handler(req: Request, res: Response, next: NextFunction) {
  if(!(res.locals.cuser.is_admin || res.locals.cuser.is_owner)) {
    res.status(404).render("404.twig");
  } else {
    next();
  }
}

function mod_handler(req: Request, res: Response, next: NextFunction) {
  if(!(res.locals.cuser.is_mod || res.locals.cuser.is_admin || res.locals.cuser.is_owner)) {
    res.status(404).render("404.twig");
  } else {
    next();
  }
}

routes.all("/redeem", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  const code = req.body?.code;
  
  let resp: message_type = { success: false, message: "" };
  if(code !== undefined) {
  let promkey = new promokey();
  await promkey.by_code(code);
  resp = await promkey.redeem(res.locals.cuser.id);
  }

  res.render("redeem.twig", { response: resp })
}));

routes.get("/filter/:this", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  res.send(filter.text_all(req.params.this))
}));

routes.get("/home", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  res.render("home.twig");
}));

routes.get("/games/", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  const query = String(req.query?.q).toString();
  let page = Number(req.query.p);
  if(String(page) == "NaN" || Number(page) <= 0) {
    page = 1;
  }

  const order = String(req.query?.order).toString();
  const sort = String(req.query?.sort).toString();
  const games = await asset.all(asset_types.Place, 6, page, query, sort, order);
  console.log(games);
  res.render("games.twig", { ...games.info});
}));

routes.get("/game/:id/:name", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  let game = await (new asset()).by_id(Number(req.params?.id));

  if(req.params?.name && req.params?.name == "about") {
    res.send("<h3 class=\"mb-2\">description</h3>" + xss(game.description ?? ""));
  } else if(req.params?.name && req.params?.name == "store") {
    res.send("<h3 class=\"mb-2\">store</h3>" + xss(game.description ?? ""));
  } else if(req.params?.name && req.params?.name == "servers") {
    res.send("<h3 class=\"mb-2\">servers</h3>" + xss(game.description ?? ""));
  } else if(req.params?.name != game.title) {
    res.send("y u tryna fake gam");
  } else {
    res.render("game.twig", { game: game });
  }
}));


routes.get("/sex/:title/:description/:userid/:file", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  res.send(await ((new asset()).create_place(req.params.title, req.params.description, Number(req.params.userid), req.params.file)));
}));

// admin only routes
const admin_route_path = env.admin_panel.path;

routes.get(`${admin_route_path}/`, notloggedin_handler, admin_handler, async_handler(async (req: Request, res: Response) => {
  const cpus = os.cpus();
  const user_info = os.userInfo();

  res.render("admin/index.twig", { 
    user: {
      name: user_info.username
    },
    host: {
      name: os.hostname()
    },
    cpu: { 
      cores: cpus.length,
      model: cpus[0].model 
    }, 
    ram: { 
      free: format_bytes(os.freemem()), 
      total: format_bytes(os.totalmem())
    }
  });
}));


routes.get(`${admin_route_path}/debug`, debug_handler, notloggedin_handler, admin_handler, async_handler(async (req: Request, res: Response) => {
  res.render("admin/debug.twig")
}));

export default routes;