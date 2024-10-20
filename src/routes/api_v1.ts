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
import translate from "../translate";
import websockets from "../websockets";
import colors from "../utils/colors";
import sql from "../sql";
import * as crypto from 'crypto';
import { date_format } from "../utils/time";
import mime from "mime";

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

websockets.on("connection", (socket) => {
  console.log(socket.handshake.auth.token);
  const send_msg = () => socket.emit("test ass", {
      
  });
  socket.on("disconnect", (reason, details) => {
    console.log(reason, details)
  });
  socket.on('reconnect', () => send_msg())
  setInterval(send_msg, 1000);
});

routes.post("/user/create", creation_and_login_limiter, async_handler(async (req: Request, res: Response) => {
  try {
    const username = String(req.body.username);
    const password = String(req.body.password);
    const invitekey = String(req.body.invkey);
    const user = await entity_user.register(username, password, invitekey);
  
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
routes.get("/user/username/set", notloggedin_api_handler, async_handler(async (req: Request, res: Response) => {
  let username = String(req.query?.username)
  res.json(await res.locals.cuser.set_username(username, true));
}));

routes.get("/user/setting/set", notloggedin_api_handler, async_handler(async (req: Request, res: Response) => {
  let key = String(req.query?.key)
  //TODO: fix booleans
  let value = (() => { 
    switch(typeof req.query?.value) {
      case "string":
        return String(req.query?.value)
      case "number":
        return Number(req.query?.value)
      case "boolean":
        return Boolean(req.query?.value)
      default:
        return String(req.query?.value)
    }
  })()
  let set_ting = await res.locals.cuser.setting(key, value);
  res.json(set_ting);
}));

routes.get("/user/setting/get", notloggedin_api_handler, async_handler(async (req: Request, res: Response) => {
  let set_ting = res.locals.cuser.settings;
  res.json(set_ting);
}));

routes.post("/item/buy", notloggedin_api_handler, async_handler(async (req: Request, res: Response) => {
  let item_id = Number(req.body?.id);
  res.json(await res.locals.cuser.buy_item(item_id));
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

let clientside_templates: {[key: string]: any} = {};
let clientside_dir = path.join(root_path, env.views.folder, "clientside");
fs.readdir(clientside_dir, (err, filenames) => {
  if(err) {
    console.log("what the flip");
    return;
  }
  filenames.forEach((filename) => {
    if(!filename.endsWith(".njk")) {
      return;
    }
    fs.readFile(path.join(clientside_dir, filename), "utf-8", (err, content) => {
      if(err) {
        return;
      }
      clientside_templates[filename] = content;
    });
  });
});

routes.get("/client-side/:template", async_handler(async (req, res) => {
  let template = String(req.params?.template);
  let template_txt = clientside_templates[(template + (template.endsWith(".njk") ? "" : ".njk"))];
  if(template_txt) { 
    res.json({ success: true, message: "OK", info: { template: template_txt }});
  } else {
    res.json({ success: false, message: `cannot find template \`${template}\`` });
  }
}));

routes.get("/translation/get_all", async_handler(async (req, res) => {
  let locale = String(req.query?.locale);
  let translations = translate.translations[locale ? locale.toString() : env.locale];
  res.json(translations);
}));

routes.get("/asset/icon", async_handler(async (req, res) => {
  let asset_id = Number(req.query.id);
  let new_asset = await (new entity_asset).by_id(asset_id);
  if(new_asset.is_place) {
    let file = await new_asset.get_icon_image();
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
  if(req.query?.html != undefined) {
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


routes.get("/client/latest-version", async_handler(async (req, res) => {
  res.json({ success: true, message: "", info: { version: `version-54b58d77dd88cef53088bd3f` }});
}));

routes.get("/client/deploy/:folder/:file", async_handler(async (req, res, next) => {
  let client_folder = path.join(root_path, "files", "clients");
  const folder_param = String(req.params.folder);
  const file_param = String(req.params.file);

  fs.readdir(client_folder, (err, files) => {
    if(err) {
      res.end();
      next();
    } else {
    let folder = String(files.filter(folder_name => folder_name.includes(folder_param))[0]);
    if(folder) {
      let version_folder = path.join(client_folder, folder);
      fs.readdir(version_folder, (err, files) => {
        let file = String(files.filter(file_name => file_name.includes(file_param))[0]);
        if(file) {
          let folder_file = path.join(version_folder, file);
          let file_raw = fs.readFileSync(folder_file);

          res.set("content-length", String(file_raw.byteLength));
          // how and WHY does it omit the content-length??
          res.set("content-size", String(file_raw.byteLength));
          res.type(mime.lookup(folder_file));

          let chunk_size = 1024 * 10000;
          let offset = 0;

          function send_chunk() {
            if (offset < file_raw.length) {
              res.write(file_raw.subarray(offset, offset + chunk_size));
              offset += chunk_size;
              setTimeout(send_chunk, 100); 
            } else {
              res.end();
            }
          }

          send_chunk();
        } else {
          res.json({ success: false, message: "can't find file" })
        }
      });
    } else {
      res.json({ success: false, message: "can't find version" })
    }
  }});
}));

routes.get("/game/info", async_handler(async (req, res) => {
  const id = Number(req.query.id);
  const game = await (new entity_asset).by(entity_asset.query()
    .where(sql`id = ${id}`)
  );

  if(!game.is_place) {
    res.json({ success: false, message: "errors.type.not_a_place" }).end();
  } else {
    const response = {
      id: game.id,
      thumbnail: `${req.protocol}://${req.get('Host')}${game.get_icon()}`,
      title: game.title,
      description: game.description,
      creator: game.user?.username,
      year: 2019, // idk
      players: 0,
      max_players: Number(game.info.max_players ?? 0) 
    }; 
    console.log(response);
    res.json({ success: true, message: "", info: response });
  }
}));

routes.get("*", async_handler(async (req, res) => {
  res.status(404);
  res.json({success: false, message: "not a valid api endpoint."});
}));

export default routes;