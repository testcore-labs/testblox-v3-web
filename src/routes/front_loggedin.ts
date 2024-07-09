import express, { type Express, type Request, type Response, type NextFunction } from "express";
const routes = express.Router();
import async_handler from 'express-async-handler';
import htmx_middleware from "../utils/htmx";
import { format_bytes } from "../utils/format";
import universe from "../db/universe"
import filter from "../utils/filter";
import env from "../utils/env";

import os from "os";
import asset from "../db/asset";

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


routes.get("/filter/:this", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  res.send(filter.text_all(req.params.this))
}));

routes.get("/home", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  res.render("home.twig");
}));

routes.get("/games/", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  const query = String(req.query?.q).toString();
  const games = universe.all(20, query);
  res.render("games.twig", { games: games });
}));

routes.get("/game/:id/:name", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  res.render("game.twig");
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