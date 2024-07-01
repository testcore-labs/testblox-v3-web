import express, { type Express, type Request, type Response, type NextFunction } from "express";
const routes = express.Router();
import async_handler from 'express-async-handler';
import htmx_middleware from "../utils/htmx";
import { format_bytes } from "../utils/format";
import env from "../utils/env";

import os from "os";

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
    res.htmx.redirect("//pornhub.com")
  } else {
    next();
  }
}

function admin_handler(req: Request, res: Response, next: NextFunction) {
  if(!(res.locals.cuser.is_admin || res.locals.cuser.is_owner)) {
    res.htmx.redirect("/");
  } else {
    next();
  }
}

function mod_handler(req: Request, res: Response, next: NextFunction) {
  if(!(res.locals.cuser.is_mod || res.locals.cuser.is_admin || res.locals.cuser.is_owner)) {
    res.htmx.redirect("/");
  } else {
    next();
  }
}

routes.get("/home", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  res.render("home.twig");
}));

routes.get("/games/", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  res.render("games.twig");
}));

routes.get("/game/:id/:name", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  res.render("game.twig");
}));

// admin only routes
const admin_route_path = "/admin"

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