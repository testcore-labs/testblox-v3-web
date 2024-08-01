import { type Express, type Request, type Response, type NextFunction } from "express";
export function notloggedin_handler(req: Request, res: Response, next: NextFunction) {
  if(!res.locals.isloggedin) {
    res.htmx.redirect("/");
  } else {
    next();
  }
}

export function owner_handler(req: Request, res: Response, next: NextFunction) {
  if(!(res.locals.cuser.is_owner)) {
    res.status(404).render("404.twig");
  } else {
    next();
  }
}

export function admin_handler(req: Request, res: Response, next: NextFunction) {
  if(!(res.locals.cuser.is_admin || res.locals.cuser.is_owner)) {
    res.status(404).render("404.twig");
  } else {
    next();
  }
}

export function mod_handler(req: Request, res: Response, next: NextFunction) {
  if(!(res.locals.cuser.is_mod || res.locals.cuser.is_admin || res.locals.cuser.is_owner)) {
    res.status(404).render("404.twig");
  } else {
    next();
  }
}