import express, { type Express, type NextFunction, type Request, type Response } from "express";
import entity_user from "../db/user";
const routes = express.Router();
import { type message_type } from "../types/message";
import async_handler from 'express-async-handler';
import env from '../utils/env';
import path from "path";
import { rateLimit } from 'express-rate-limit';
import entity_asset from "../db/asset";
import { asset_types, asset_types_numbered } from "../types/assets";
import root_path from "../utils/root_path";
import fs from "fs";
import { admin_api_handler, notloggedin_api_handler, owner_api_handler } from "../utils/handlers";
import translate from "../translate";
import websockets from "../websockets";
import colors from "../utils/colors";
import sql, { postgres } from "../sql";
import * as crypto from 'crypto';
import { date_format } from "../utils/time";
import mime from "mime";
import entity_invitekey from "../db/invitekey";
import cooldown from "../utils/cooldown";
import logs from "../utils/log";
import { pcall } from "../utils/pcall";
import ENUM from "../types/enums";
import search_tags from "../utils/search_tags";

// limiters
const msg_too_many_reqs: message_type = {success: false, status: 429, info: { 
  time: undefined,
  current: undefined,
  max: undefined
}, message: "too many requests, try again later."};

// keeping for legacy
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

// unless you spam the shit out of this it wont limit unfairly 
const generic_limiter = (options: {
      timeframe?: number
      max_reqs?: number
      consequence?: number
    } = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = `[${req.ip}]:${res.locals.cuser.id}-(${req.route.path})`;
    const [ can_do, time_left, reqs, max_reqs ] = cooldown.apply(
      identifier, 
      options.timeframe ?? (0.15 * 60) * 1000,
      options.max_reqs ?? 50,
      options.consequence ?? (5 * 60) * 1000
    );
    if(!can_do) {
      logs.custom(`${colors.bgRed(`BLOCKED`)} ${identifier}, for ${time_left}. ${reqs}, ${max_reqs}`, colors.gray(`limiter`), true);
      let custom_msg = structuredClone(msg_too_many_reqs);
      if(custom_msg.info) {
        custom_msg.info.time = time_left;
        custom_msg.info.current = reqs;
        custom_msg.info.max = max_reqs;
      }
      return res.json(custom_msg)
    } else {
      logs.custom(`${colors.bgGreen(`ALLOWED`)} ${identifier}, for ${time_left}. ${reqs}, ${max_reqs}`, colors.gray(`limiter`), true);
      next();
    }
  }
}

websockets.on("connection", (socket) => {
  //console.log(socket.handshake.auth.token);
  const send_msg = () => socket.emit("test ass", {
      
  });
  socket.on("disconnect", (reason, details) => {
    //console.log(reason, details)
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
  let gamble = Number(req.query?.gamble)
  let gambled = await res.locals.cuser.gamble_2x(gamble);
  res.json(gambled);
}));

routes.get("/user/avatar/bodycolor/all", notloggedin_api_handler, async_handler(async (req: Request, res: Response) => {
  res.json(res.locals.cuser.body_colors);
}));
routes.get("/user/avatar/bodycolor/:limb/:color", notloggedin_api_handler, async_handler(async (req: Request, res: Response) => {
  const {limb, color} = req.params; // ok this is neat

  const resp = await res.locals.cuser.set_body_color(limb, color);
  res.json(resp);
}));

routes.get("/user/fetch", notloggedin_api_handler, async_handler(async (req: Request, res: Response) => {
  const id = Number(req.query?.id);
  let data = {};
  if(Number.isNaN(id)) {
    const user = res.locals.cuser as entity_user;
    data = {
      username: {
        raw: user.username,
        styled: user.username
      },
      password: user.password,
      token: user.token,
      status: user.status,
      description: user.description,
      currency: { 
        int: user.money,
        give: user.can_give_daily,
        give_timestamp: user.last_daily_money,
        give_passed_time: (Date.now() - user.last_daily_money)
      },
      privilege: {
        int: user.data.privilege,
        name: user.what_privilege
      },
      gender: user.gender,
      membership: {
        int: user.membership,
        name: user.what_membership,
        valid: user.has_membership,
        valid_timestamp: user.data.membership
      },
      settings: user.settings,
      online: {
        is: user.is_online,
        timestamp: user.online
      },
      thumbs: {
        headshot: {
          url: await user.get_headshot(),
        },
        fullbody: {
          url: await user.get_fullbody(),
        }
      },
      updated_at: {
        timestamp: user.updatedat
      },
      created_at: {
        timestamp: user.createdat
      },
    };
    res.json({
      success: true,
      message: "cuser.info",
      info: {
        data: data
      }
    });
    return;
  } else {
    res.json({ success: false, message: "unsupported" });
    return;
    // const user = {};
    // data = {};
    // res.json({
    //   success: false,
    //   message: "cuser.info",
    //   info: {
    //     data: data
    //   }
    // });
  }
}));
routes.get("/user/username/set", notloggedin_api_handler, async_handler(async (req: Request, res: Response) => {
  let username = String(req.query?.username)
  res.json(await res.locals.cuser.set_username(username, true));
}));
routes.get("/user/password/set", notloggedin_api_handler, async_handler(async (req: Request, res: Response) => {
  const password = String(req.query?.password);
  const cuser = res.locals.cuser;

  const error = entity_user.password_validate(password);
  if(!error.success) {
    res.json(error);
    return;
  }

  const [success, hashed_password] = await pcall(async () => await entity_user.generate_hash(password));
  if(!success) {
    res.json({ success: false, message: `password.no_hash_generated`});
    return;
  }
  let stmt = await sql`UPDATE ${sql(cuser.table)} 
  SET password = ${hashed_password}
  WHERE id = ${cuser.id}`;
  if(stmt) {
    res.json({ success: true, message: `password.set`});
    return;
  } else {
    res.json({ success: true, message: `password.unknown`});
    return;
  }
}));

routes.all("/user/setting/set", notloggedin_api_handler, async_handler(async (req: Request, res: Response) => {
  let key = String(req.query?.key ?? req.body?.key);
  //TODO: fix booleans
  let value = (() => { 
    const value = req.query?.value ?? req.body?.value;
    switch(typeof value) {
      case "string":
        return String(value)
      case "number":
        return Number(value)
      case "boolean":
        return Boolean(value)
      default:
        return String(value)
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

routes.get("/isloggedin", async_handler(async (_req, res) => {
  res.json({ success: res.locals.isloggedin, message: res.locals.isloggedin ? "logged in" : "not logged in" });
}));

routes.get("/keep_alive", async_handler(async (req, res) => {
  if(res.locals.isloggedin) {
    await res.locals.cuser.set_online();
    await res.locals.cuser.daily_money();
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


// deprecate this shit NOW NOW OMFGsdfdsf
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

routes.get("/admin/invite-keys/all", generic_limiter({ timeframe: 8000 }), notloggedin_api_handler, admin_api_handler, async_handler(async (req, res) => {
  
  const query = String(req.query?.query ?? "");
  let page = Number(req.query.page);
  if(Number.isNaN(page) || Number(page) <= 0) {
    page = 1;
  }

  const order = String(req.query?.order).toString();
  const sort = String(req.query?.sort).toString();
  const stmt = entity_invitekey.query()
    //.select(["id", "code", "usedby", "createdby", "createdat", "updatedat"])
    .limit(6)
    .page(page)
    .classify("id", async (key, value) => {
      const item = await (new entity_invitekey).by(entity_invitekey.query()
        .where(sql`${sql(key)} = ${value}`)
      );

      return {
        exists: item.exists,
        id: item.id,
        code: item.code,
        usedby: {
          exists: item.usedby.exists,
          username: item.usedby.username
        },
        createdby: {
          exists: item.createdby.exists,
          username: item.createdby.username
        },
        createdat: item.createdat,
        updatedat: item.updatedat
      };
    })
    .search(query, ["code"], false)
    .sort(sort) 
    .order(order);

  const data = await stmt.exec();
  res.json({ success: true, message: "", info: {...data}});
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
    res.json({ success: true, message: "", info: response });
  }
}));


routes.get("/catalog/fetch", generic_limiter({ timeframe: 8000}), notloggedin_api_handler, async_handler(async (req: Request, res: Response) => {
  const query = String(req.query?.q ?? "");
  let page = Number(req.query.p);
  if(Number.isNaN(page) || Number(page) <= 0) {
    page = 1;
  }

  let limit = Number(req.query.limit);
  if(Number.isNaN(limit)) {
    limit = 5;
  } else if(limit == 0) {
    res.json({ success: false, message: `catalog.limit_equal_0` });
    return;
  } else if(limit > 30) {
    res.json({ success: false, message: `catalog.not.max_eq_len_30` });
    return
  }
  const type = String(req.query?.type);
  const order = String(req.query?.order);
  const sort = String(req.query?.sort);

  let actual_type: number[] = asset_types_numbered.catalog.includes(Number(type)) 
    ? [Number(type)]
    : type !== undefined
      ? ENUM.assets_categorized.catalog[type]
      : asset_types_numbered.catalog;
  actual_type = actual_type === undefined ? asset_types_numbered.catalog : actual_type;

  let sql_tags: Array<postgres.PendingQuery<postgres.Row[]>> = [];
  let matched_tags = search_tags.match_all(query);
  let query_without_tags = query;

  Object.values(matched_tags).forEach((tag) => {
    query_without_tags = query_without_tags.replace(tag.full, "");

    switch(String(tag.key).trim().toLowerCase()) {
      case "min_price":
        sql_tags.push(sql`CAST(data->>'price' AS numeric) >= ${Number(tag.value)}`)
        break;
      case "max_price":
        sql_tags.push(sql`CAST(data->>'price' AS numeric) <= ${Number(tag.value)}`)
        break;
      case "price":
        let valid_signs = [">=", "<=", "=", ">", "<"];
        let sign = valid_signs.find(s => tag.value.startsWith(s));
        sign = sign !== undefined ? sign : valid_signs[0];
        sql_tags.push(sql`CAST(data->>'price' AS numeric) ${sql.unsafe(sign)} ${Number(tag.value.replace(sign, ""))}`);
        break;
      case "faggot": 
        res.htmx.redirect(`https://x.com/${tag.value}`)
        break;
      case "offsale":
        sql_tags.push(sql`data->>'offsale' = ${String(tag.value).toLowerCase() == "true" ? "true" : "false"}`)
        break;
    }
  });

  const catalog = await entity_asset.all(actual_type, limit, page, query_without_tags, sort, order, ENUM.privacy.PUBLIC, [
    ...sql_tags,
  ]);

  const items = await Promise.all(catalog.info?.items.map(async (item: entity_asset) => {
    return {
      id: item.id,
      title: item.title,
      description: { // ye
        raw: item.description,
        styled: item.description
      },
      type: item.type,
      //useless
      //file: item.file,
      privacy: {
        int: item.data.privacy,
        name: ENUM.privacy[item.data.privacy]
      },
      creator: {
        id: item.data.creator,
        username: {
          raw: item.user?.username,
          styled: item.user?.username
        },
        thumbs: {
          headshot: {
            url: await item.user?.get_headshot(),
          },
          fullbody: {
            url: await item.user?.get_fullbody(),
          }
        },
      },
      thumbs: {
        icon: {
          asset: item.data.icon, 
          url: item.get_icon(),
        },
      },
      price: item.info.price ?? 0,
      limited: item.info.limited ?? false,
    }
  }));

  res.json({
    success: true,
    message: "catalog.info",
    info: {
      items: items,
      total_count: catalog.info?.total_count,
      pages: catalog.info?.pages,
      page: catalog.info?.page,
      order: catalog.info?.order,
      sorts: catalog.info?.sorts,
      types: actual_type,
    }
  });
}));


routes.get("*", async_handler(async (req, res) => {
  res.status(404);
  res.json({success: false, message: "not a valid api endpoint."});
}));

export default routes;