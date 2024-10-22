import { type Express, type Request, type Response, type NextFunction } from "express";
import env from "./env";

export function notloggedin_api_handler(req: Request, res: Response, next: NextFunction) {
  if(!res.locals.isloggedin) {
    res.json({ success: false, message: `\`${ env.session.name }\` is missing` });
  } else {
    if((res.locals.cuser.ban.is_banned ?? false)) {
      res.json({ success: false, message: `you are currently banned`, info: { 
        length: res.locals.cuser.ban.length, 
        createdat: res.locals.cuser.ban.createdat,  
        reason: res.locals.cuser.ban.reason, 
        moderator_note: res.locals.cuser.ban.moderator_note, 
        items: res.locals.cuser.ban.moderator_nsote, 
      }});
    }
    next();
  }
}
export function admin_api_handler(req: Request, res: Response, next: NextFunction) {
  if(!(res.locals.cuser.is_admin || res.locals.cuser.is_owner)) {
    res.json({ success: false, message: `you are not owner` });
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
    if((res.locals.cuser.ban.is_banned ?? false) && req.path !== "/banned") {
      res.htmx.redirect("/banned");
    }
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