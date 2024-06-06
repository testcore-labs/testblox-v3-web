import express, { type Express, type Request, type Response } from "express";
import user from "../db//user";
const routes = express.Router();
import { type message_type } from "../utils/message";
import { rateLimit } from 'express-rate-limit';

// limiters
const msg_too_many_reqs: message_type = {success: false, message: "too many requests, try again later."};

const creation_and_login_limiter = rateLimit({
	windowMs: 5 * 60 * 1000, // 5 minutes
	limit: 25,
	standardHeaders: 'draft-7',
  message: msg_too_many_reqs,
	legacyHeaders: true,
});

routes.get("/user/create", creation_and_login_limiter, async (req: Request, res: Response) => {
  try {
    const usr = new user();
    const resp = await usr.create(req.query.username?.toString(), req.query.password?.toString());
  
    if(resp.success) {
      if(resp.info !== undefined) {
        res.cookie('token', resp.info["token"].toString(), { 
          expires: new Date(Date.now() + (3600 * 24 * 365)), 
          secure: (process.env.NODE_ENV == "production") ? true : false, 
          sameSite: (process.env.NODE_ENV == "production") ? 'strict' : 'none' 
        });
      }
    }

    res.json(resp);
  } catch(e) {
    console.log(e);
    res.json({success: false, message: "error occured."});
  }
});

routes.get("/user/login", creation_and_login_limiter, async (req: Request, res: Response) => {
  try {
    const usr = new user();
    const resp = await usr.validate(req.query.username?.toString(), req.query.password?.toString());
    
    if(resp.success) {
      if(resp.info !== undefined) {
        res.cookie('token', resp.info["token"].toString(), { 
          expires: new Date(Date.now() + (3600 * 24 * 365)), 
          secure: (process.env.NODE_ENV == "production") ? true : false, 
          sameSite: (process.env.NODE_ENV == "production") ? 'strict' : 'none' 
        });
      }
    }
    res.json(resp);
  } catch(e) {
    console.log(e);
    res.json({success: false, message: "error occured."});
  }
});

routes.get("/user/logout", async (req: Request, res: Response) => {
  try {
    if(req.cookies.token !== undefined) {
    res.clearCookie('token', { 
      expires: new Date(Date.now() - (3600 * 24 * 365)), 
      secure: (process.env.NODE_ENV == "production") ? true : false, 
      sameSite: (process.env.NODE_ENV == "production") ? 'strict' : 'none' 
    });
    res.json({success: true, message: "logged out."})
    } else {
      res.json({success: false, message: "you are not logged in."})
    }
  } catch(e) {
    console.log(e);
    res.json({success: false, message: "error occured."});
  }
});

export default routes;