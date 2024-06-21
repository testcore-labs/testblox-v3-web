import express, { type Express, type Request, type Response } from "express";
import user from "../db//user";
const routes = express.Router();
import { type message_type } from "../utils/message";
import async_handler from 'express-async-handler';
import { rateLimit } from 'express-rate-limit';

// limiters
const msg_too_many_reqs: message_type = {success: false, status: 429, message: "too many requests, try again later."};

const creation_and_login_limiter = rateLimit({
	windowMs: 5 * 60 * 1000, // 5 minutes
	limit: 25,
	standardHeaders: 'draft-7',
  message: msg_too_many_reqs,
	legacyHeaders: true,
  keyGenerator: function (req: any) {
    return req.headers["x-forwarded-for"] || req.connection.remoteAddress; 
  }
});

routes.post("/user/create", creation_and_login_limiter, async_handler(async (req: Request, res: Response) => {
  try {
    const usr = new user();
    const resp = await usr.create(req.body.username?.toString(), req.body.password?.toString());
  
    if(resp.success) {
      if(resp.info !== undefined) {
        res.cookie('token', resp.info["token"].toString(), { 
          expires: new Date(Date.now() + (3600 * 24 * 365)), 
          secure: (process.env.NODE_ENV == "production") ? true : false, 
          sameSite: (process.env.NODE_ENV == "production") ? 'strict' : 'none' 
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
    const resp = await usr.validate(req.body.username?.toString(), req.body.password?.toString());
    
    if(resp.success) {
      if(resp.info !== undefined) {
        res.cookie('token', resp.info["token"].toString(), { 
          expires: new Date(Date.now() + (3600 * 24 * 365)), 
          secure: (process.env.NODE_ENV == "production") ? true : false, 
          sameSite: (process.env.NODE_ENV == "production") ? 'strict' : 'none' 
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

routes.get("/user/logout", async_handler(async (req: Request, res: Response) => {
  try {
    if(req.cookies.token !== undefined) {
    res.clearCookie('token', { 
      expires: new Date(Date.now() - (3600 * 24 * 365)), 
      secure: (process.env.NODE_ENV == "production") ? true : false, 
      sameSite: (process.env.NODE_ENV == "production") ? 'strict' : 'none' 
    });
    res.status(200);
    res.json({success: true, message: "logged out."})
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

routes.get("*", async_handler(async (req, res) => {
  res.status(404);
  res.json({success: false, message: "not a valid api endpoint."});
}),);

export default routes;