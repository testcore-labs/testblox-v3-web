import express, { type Express, type Request, type Response } from "express";
import entity_user from "../db/user";
const routes = express.Router();
import { type message_type } from "../types/message";
import async_handler from 'express-async-handler';
import env from '../utils/env';
import path from "path";
import { rateLimit } from 'express-rate-limit';
import entity_asset from "../db/asset";
import { asset_types } from "../types/assets";
import root_path from "../utils/root_path";
import fs from "fs";
import entity_feed from "../db/feed";
import { notloggedin_api_handler, owner_api_handler } from "../utils/handlers";

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
    const user = await entity_user.register(req.body.username?.toString(), req.body.password?.toString());
  
    if(user.success) {
      if(user.info !== undefined) {
        res.cookie(env.session.name, user.info["token"].toString(), { 
          expires: new Date(Date.now() + Number(env.session.expires)), 
          secure: env.production ? true : false, 
          sameSite: env.production ? 'strict' : 'lax' 
        });
      }
    }

    if(req.query.redirect && user.success) {
      res.redirect("/redirect?url="+encodeURI(req.query?.redirect?.toString()));
    } else {
    if(!req.query.plaintext) {
      res.send(user.message);
    } else {
      res.status(user.status ?? 400); // 400 for generic err
      res.json(user);
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
    const user = await entity_user.login(req.body.username?.toString(), req.body.password?.toString());
    
    if(user.success) {
      if(user.info !== undefined) {
        res.cookie(env.session.name, user.info["token"].toString(), { 
          expires: new Date(Date.now() + Number(env.session.expires)), 
          secure: env.production ? true : false, 
          sameSite: env.production ? 'strict' : 'lax' 
        });
      }
    }
    if(req.query.redirect && user.success) {
      res.redirect("/redirect?url="+encodeURI(req.query?.redirect?.toString()));
    } else {
    if(!req.query.plaintext) {
      res.send(user.message);
    } else {
      res.status(user.status ?? 400); // 400 for generic err
      res.json(user);
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
}));

routes.get("/user/gamble", notloggedin_api_handler, async_handler(async (req: Request, res: Response) => {
  let gamble_amount = Number(req.query?.gamble_amount)
  let gambled = await res.locals.cuser.gamble_2x(gamble_amount);
  res.json(gambled);
}));

routes.get("/user/gamble", notloggedin_api_handler, async_handler(async (req: Request, res: Response) => {
  let gamble_amount = Number(req.query?.gamble_amount)
  let gambled = await res.locals.cuser.gamble_2x(gamble_amount);
  res.json(gambled);
}));

// import { createSession, createChannel } from "better-sse";
// import { sleep } from "bun";
// const ping_online = createChannel();

// setInterval(() => {
//   console.log("sss");
//   ping_online.broadcast("ss " +Math.random(), "message");
// }, 1000);

// routes.get("/keep_alive", async (req, res) => {
// 	const session = await createSession(req, res);
//   ping_online.register(session);
//   res.locals.cuser.set_online();
// });

routes.get("/isloggedin", async_handler(async (_req, res) => {
  res.json({ success: res.locals.isloggedin, message: res.locals.isloggedin ? "logged in" : "not logged in" });
}));

routes.get("/keep_alive", async_handler(async (req, res) => {
  if(res.locals.isloggedin) {
    await res.locals.cuser.set_online();
    res.json({ "success": true, message: "set online" });
  } else {
    res.json({ "success": false, "message": "not logged in" });
  }
}), rateLimit({
	windowMs: 2.5 * 60 * 1000, // 2 minutes and 30 secs
	limit: 30,
	standardHeaders: 'draft-7',
  message: msg_too_many_reqs,
	legacyHeaders: true,
  keyGenerator: function (req: any) {
    return req.ip; 
  }
}));

// since the owner is editing a yaml config im trusting them with it
routes.post("/owner/env_edit", async_handler(async (req, res, next) => {
  if(res.locals.isloggedin && res.locals.cuser.is_owner) {
    res.send(fs.writeFileSync(path.join(root_path, "config.yaml"), req.body?.data));
  } else {
    next();
  }
}));

routes.get("/searchbar", async_handler(async (req, res) => {
  if(req.query.qnavbar !== "") {
    res.render("components/search_results_navbar.twig", { query: req.query.qnavbar })
  } else {
    res.end();
  }
}));

routes.get("/asset/icon", async_handler(async (req, res) => {
  let asset_id = Number(req.query.id);
  let new_asset = await (new entity_asset).by_id(asset_id);
  if(new_asset.is_place) {
    let file = await new_asset.get_image();
    if(file.exists) {
      res.sendFile(path.join(root_path, file.file));
    } else {
      res.sendFile(path.join(root_path, "/public/assets/img/unknown.png"))
    }
  } else if(new_asset.data.type === asset_types.Image) {
    res.sendFile(path.join(root_path, new_asset.file));
  } else {
    res.sendFile(path.join(root_path, "/public/assets/img/unknown.png"))
  }
}));


routes.get("/feed/posts", async_handler(async (req, res) => {
  let page = Number(req.query.p);
  let limit = Number(req.query.limit);
  if(String(page) === "NaN" || Number(page) <= 0) {
    page = 1;
  }
  if(String(limit) === "NaN" || Number(limit) <= 0) {
    limit = 5;
  }

  let feeds = await entity_feed.all(limit, page, "", "", "");
  if(!req.query?.html) {
    res.render("components/feeds.twig", { feeds: feeds?.info?.items });
  } else {
    res.json(feeds);
  }
}));

routes.post("/feed/send", notloggedin_api_handler, async_handler(async (req, res) => {
  let txt = req.body?.feed_text.toString();
  let replyto = Number(req.body?.replyto ?? 0);

  let sent = await entity_feed.send(txt, res.locals.cuser.id, replyto);
  if(!req.query?.plaintext) {
    res.send(sent.message);
  } else {
    res.json(sent);
  }
})); 

routes.post("/owner/server-management", notloggedin_api_handler, owner_api_handler, async_handler(async (req, res) => {
  let txt = req.body?.feed_text.toString();
  let replyto = Number(req.body?.replyto ?? 0);

  let sent = await entity_feed.send(txt, res.locals.cuser.id, replyto);
  if(!req.query?.plaintext) {
    res.send(sent.message);
  } else {
    res.json(sent);
  }
}));


routes.get("*", async_handler(async (req, res) => {
  res.status(404);
  res.json({success: false, message: "not a valid api endpoint."});
}));

export default routes;