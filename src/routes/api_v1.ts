import express, { type Express, type Request, type Response } from "express";
import user from "../db//user";
const routes = express.Router();
import { type message_type } from "../utils/message";
import async_handler from 'express-async-handler';
import env from '../utils/env';
import { rateLimit } from 'express-rate-limit';

// limiters
const msg_too_many_reqs: message_type = {success: false, status: 429, message: "too many requests, try again later."};

const creation_and_login_limiter = rateLimit({
	windowMs: 2.5 * 60 * 1000, // 2 minutes and 30 secs
	limit: 50,
	standardHeaders: 'draft-7',
  message: msg_too_many_reqs,
	legacyHeaders: true,
  keyGenerator: function (req: any) {
    return req.ip; 
  }
});

routes.post("/user/create", creation_and_login_limiter, async_handler(async (req: Request, res: Response) => {
  try {
    const usr = new user();
    const resp = await usr.register(req.body.username?.toString(), req.body.password?.toString());
  
    if(resp.success) {
      if(resp.info !== undefined) {
        res.cookie(env.session.name, resp.info["token"].toString(), { 
          expires: new Date(Date.now() + Number(env.session.expires)), 
          secure: env.production ? true : false, 
          sameSite: env.production ? 'strict' : 'lax' 
        });
      }
    }

    if(req.query.redirect && resp.success) {
      res.redirect("/redirect?url="+encodeURI(req.query?.redirect?.toString()));
    } else {
    if(!req.query.plaintext) {
      res.send(resp.message);
    } else {
      res.status(resp.status ?? 400); // 400 for generic err
      res.json(resp);
    }
    }
  } catch(e) {
    console.log(e);
    res.status(500); // serverside error therefore we return serverside error status code 
    res.json({success: false, message: "error occured."});
  }
}),);

routes.post("/user/login", creation_and_login_limiter, async_handler(async (req: Request, res: Response) => {
  try {
    const usr = new user();
    const resp = await usr.login(req.body.username?.toString(), req.body.password?.toString());
    
    if(resp.success) {
      if(resp.info !== undefined) {
        res.cookie(env.session.name, resp.info["token"].toString(), { 
          expires: new Date(Date.now() + Number(env.session.expires)), 
          secure: env.production ? true : false, 
          sameSite: env.production ? 'strict' : 'lax' 
        });
      }
    }
    if(req.query.redirect && resp.success) {
      res.redirect("/redirect?url="+encodeURI(req.query?.redirect?.toString()));
    } else {
    if(!req.query.plaintext) {
      res.send(resp.message);
    } else {
      res.status(resp.status ?? 400); // 400 for generic err
      res.json(resp);
    }
    }
  } catch(e) {
    console.log(e);
    res.status(500); // serverside error therefore we return serverside error status code 
    res.json({success: false, message: "error occured."});
  }
}),);

routes.post("/user/logout", async_handler(async (req: Request, res: Response) => {
  try {
    if(req.cookies[env.session.name] !== undefined) {
    res.clearCookie(env.session.name);
    if(req.query.redirect) {
      res.redirect("/redirect?url="+encodeURI(req.query?.redirect?.toString()));
    } else {
      res.status(200);
      res.json({success: true, message: "logged out."})
    }
    } else {
      res.status(401);
      res.json({success: false, message: "you are not logged in."})
    }
  } catch(e) {
    console.log(e);
    res.status(500);
    res.json({success: false, message: "error occured."});
  }
}),);

routes.get("/searchbar", async_handler(async (req, res) => {
  if(req.query.qnavbar !== "") {
    res.render("components/search_results_navbar.twig", { query: req.query.qnavbar })
  } else {
    res.end();
  }
}));

routes.get("*", async_handler(async (req, res) => {
  res.status(404);
  res.json({success: false, message: "not a valid api endpoint."});
}),);

export default routes;