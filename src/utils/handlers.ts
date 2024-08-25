import { type Express, type Request, type Response, type NextFunction } from "express";
import env from "./env";

export function notloggedin_api_handler(req: Request, res: Response, next: NextFunction) {
  if(!res.locals.isloggedin) {
    res.json({ success: false, message: `\`${ env.session.name }\` is missing` });
  } else {
    next();
  }
}
export function owner_api_handler(req: Request, res: Response, next: NextFunction) {
  if(!res.locals.cuser.is_owner) {
    res.json({ success: false, message: `you are not owner` });
  } else {
    next();
  }
}

export function notloggedin_handler(req: Request, res: Response, next: NextFunction) {
  if(!res.locals.isloggedin) {
    res.htmx.redirect("/");
  } else {
    next();
  }
}

export function owner_handler(req: Request, res: Response, next: NextFunction) {
  if(!(res.locals.cuser.is_owner)) {
    res.status(404).render("error.twig");
  } else {
    next();
  }
}

export function admin_handler(req: Request, res: Response, next: NextFunction) {
  if(!(res.locals.cuser.is_admin || res.locals.cuser.is_owner)) {
    res.status(404).render("error.twig");
  } else {
    next();
  }
}

export function mod_handler(req: Request, res: Response, next: NextFunction) {
  if(!(res.locals.cuser.is_mod || res.locals.cuser.is_admin || res.locals.cuser.is_owner)) {
    res.status(404).render("error.twig");
  } else {
    next();
  }
}