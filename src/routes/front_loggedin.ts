import express, { type Express, type Request, type Response, type NextFunction } from "express";
const routes = express.Router();
//Max Keeble's Big Move
import { notloggedin_handler, mod_handler, admin_handler, owner_handler } from "../utils/handlers";
import { format_bytes } from "../utils/format";
import {asset_types, asset_types_numbered} from "../types/assets"
import type { message_type } from "../types/message";
import htmx_middleware from "../utils/express-extend";
import cooldown from "../utils/cooldown";
import colors from "../utils/colors";
import env, { raw_env } from "../utils/env";
import filter from "../utils/filter";
import entity_feed from "../db/feed";
import entity_asset from "../db/asset"
import entity_invitekey from "../db/invitekey";
import entity_user from "../db/user";
import entity_promokey from "../db/promokey";

import async_handler from 'express-async-handler';
import os from "os";
import si from "systeminformation";
import gfs from "get-folder-size";
import root_path from "../utils/root_path";
import path from "path";
import sql, { postgres } from "../sql";
import ENUM from "../types/enums";
import _ from "lodash";
import { xss_all } from "../utils/xss";
import search_tags from "../utils/search_tags";
import entity_ban from "../db/ban";
import logs from "../utils/log";
routes.use(htmx_middleware);

routes.all("/redeem", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  const code = req.body?.code;
  
  let resp: message_type = { success: false, message: "" };
  if(code !== undefined) {
  let promkey = new entity_promokey();
  await promkey.by_code(code);
  resp = await promkey.redeem(res.locals.cuser.id);
  }

  res.render("redeem.twig", { response: resp })
}));

routes.get("/filter/:this", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  res.send(filter.text_all(req.params.this))
}));

routes.get("/chat/", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  res.render("chat/index.twig", { show_skeleton: !req.htmx.ishtmx() });
}));
routes.get("/chat/conversation", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  res.render("chat/conversation.twig", { show_skeleton: !req.htmx.ishtmx() });
}));

routes.get("/home", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  let page = Number(req.query.p);
  if(Number.isNaN(page) || Number(page) <= 0) {
    page = 1;
  }

  let feeds = await entity_feed.all(5, page, "", "", "");
  let recently_played = await res.locals.cuser.recently_played(12);
  let friends = await res.locals.cuser.get_friends(12);
  res.render("home.twig", { friends: friends, recently_played, feeds: feeds });
}));


routes.get("/games/", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  const query = xss_all(String(req.query?.q ?? ""));
  let page = Number(req.query.p);
  if(Number.isNaN(page) || Number(page) <= 0) {
    page = 1;
  }

  const order = String(req.query?.order).toString();
  const sort = String(req.query?.sort).toString();
  const games = await entity_asset.all([asset_types.Place], 6, page, query, sort, order);
  res.render("games.twig", { ...games.info});
}));

routes.get("/game/:id/:name", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  let game =  await (new entity_asset).by(entity_asset.query()
  .where(sql`id = ${ Number(req.params?.id) }`)
  .where(sql`"type" = ${ ENUM.assets.Place }`)
  );
  let option = req.params?.name ? req.params?.name : game.title;

  if(!game.exists) {
    res.statusCode = 400;
    return res.render("error.twig");
  }

  switch(option) {
    case "about":
      res.render("components/game_tabs.twig", { tab: option, game });
      break;
    case "store":
      res.render("components/game_tabs.twig", { tab: option, game });
      break;
    case "servers":
      res.render("components/game_tabs.twig", { tab: option, game });
      break;
    case "play":
      res.render("player/index.twig");
      break;
    case "sm64":
      res.render("player/sm64.twig");
      break;
    default:
      res.render("game.twig", { game: game });
      break;
  }
}));

routes.get("/gamble", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  res.render("gamble.twig");
}));

routes.get("/users/", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  const query = xss_all(String(req.query?.q ?? ""));
  let page = Number(req.query.p);
  if(Number.isNaN(page) || Number(page) <= 0) {
    page = 1;
  }

  const order = String(req.query?.order);
  const sort = String(req.query?.sort);
  const users = await entity_user.all(8, page, query, sort, order);
  res.render("users.twig", { ...users.info});
}));

routes.get("/users/:id/:name", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  const id = Number(req.params?.id);
  if(Number.isNaN(id)) {
    res.status(404).render("error.twig")
    return;
  }
  let user = await (new entity_user).by(entity_user.query()
  .where(sql`id = ${id}`)
  );
  let option = req.params?.name ? req.params?.name : "profile";

  if(!user.exists) {
    res.statusCode = 400;
    return res.render("error.twig");
  }

  const query = xss_all(String(req.query?.q ?? ""));
  const page = (Number(req.query.p) <= 0 && Number.isNaN(req.query.p)) ? Number(req.query.p) : 1;
  switch(option) {
    case "profile":
      res.render("user.twig", { user: user });
      break;
    case "avatar":
      let user_equipped_items = await user.get_items(16, page, query, undefined, undefined, true);
      res.render("components/user_tabs.twig", { tab: option, user, user_equipped_items: user_equipped_items?.info });
      break;
    case "games":
      let user_games = await user.get_games(6, page, query);
      res.render("components/user_tabs.twig", { tab: option, user, user_games: user_games?.info });
      break;
    case "items":
      let user_items = await user.get_items(6, page, query, undefined, undefined, false);
      res.render("components/user_tabs.twig", { tab: option, user, user_items: user_items?.info });
      break;
    case "groups":
      res.render("components/user_tabs.twig", { tab: option, user });
      break;
    case "css":
      res.render("components/user_tabs.twig", { tab: option, user });
      break;
    case "bans":
      let bans = await entity_ban.all(4, page, query, undefined, undefined, [
        sql`userid = ${ user.id }`
      ])
      res.render("components/user_tabs.twig", { tab: option, user, bans });
      break;
    default:
      res.render("user.twig", { user: user });
      break;
  }
}));

routes.get("/catalog/", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  const query = String(req.query?.q ?? "");
  let page = Number(req.query.p);
  if(Number.isNaN(page) || Number(page) <= 0) {
    page = 1;
  }

  const type = String(req.query?.type);
  const order = String(req.query?.order).toString();
  const sort = String(req.query?.sort).toString();

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

  const catalog = await entity_asset.all(actual_type, 6, page, query_without_tags, sort, order, ENUM.privacy.PUBLIC, [
    ...sql_tags,
  ]);
  res.render("catalog.twig", { ...catalog.info, catalog_types: ENUM.assets_categorized.catalog_categorized });
}));

routes.get("/catalog/:id/:name", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  let item = await (new entity_asset).by(entity_asset.query()
  .where(sql`id = ${ Number(req.params?.id) }`)
  .where(sql`"type" IN ${ sql(asset_types_numbered.catalog) }`)
  );
  let option = req.params?.name ? req.params?.name : "profile";

  if(!item.exists) {
    res.statusCode = 400;
    return res.render("error.twig");
  }

  let has_item = await res.locals.cuser.has_item(item.id);
  switch(option) {
    case "view":
      res.render("item.twig", { item: item, has_item: has_item });
      break;
    case "owners":
      res.render("components/item_tabs.twig", { tab: option, item: item });
      break;
    case "comments":
      res.render("components/item_tabs.twig", { tab: option, item: item });
      break;
    default:
      res.render("item.twig", { item: item, has_item: has_item });
      break;
  }
}));


const settings_tabs: {[key: string]: any} = {
  account: {
    icon: "person-gear",
    file: "account",
    url: "account",
  }
}

routes.get("/avatar/", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  res.render("avatar.twig");
}));

routes.get("/banned", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  if(res.locals.cuser.ban.is_banned) {
    let off_items = await res.locals.cuser.ban.get_items();
    console.log(off_items)
    res.render("banned.twig", { ban_off_items: off_items });
  } else {
    res.htmx.redirect("/");
  }
}));

routes.get("/settings/", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  res.render("settings.twig", settings_tabs);
}));

routes.get("/settings/:setting", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  const setting = req.params.setting.toString();
  let settings_tab = settings_tabs[setting];
  if(settings_tab) {
    res.render(`settings/${settings_tab.file}.twig`);
  } else {
    res.render(`settings/404.twig`);
  }
}));

// admin only routes
const admin_route_path = env.admin_panel.path;

const cpus = os.cpus();
const user_info = os.userInfo();
let sys_info = { 
  inited: false,
  user: {
    name: user_info.username
  },
  host: {
    ip: "0",
    name: os.hostname()
  },
  cpu: { 
    cores: cpus.length,
    model: cpus[0].model,
    temp: "0C°",
    brand: "undefined",
    usage: "NaN%",
  }, 
  ram: { 
    used: "0.0B",
    total: "0.0B"
  },
  folders: {} as { [key: string]: any }
};

let update_sys_info = async () => {
  try {
  sys_info.ram.used = await si.mem()
    .then(data => format_bytes(data.active, 1));
  sys_info.ram.total = await si.mem()
    .then(data => format_bytes(data.total, 1));
  sys_info.host.ip = await fetch("http://ip.me/", { headers: { "User-Agent": "curl/idklmao" } })
    .then(async (response) => {
      const ip = await response.text();
      if(!(/(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])/.test(ip.toString()))) {
        return "127.0.0.1";
      } else {
        return ip;
      }
    })

  
  sys_info.folders["assets"] = format_bytes(await gfs.loose(path.join(root_path, "files", "assets")), 2);
  sys_info.folders["logs"] = format_bytes(await gfs.loose(path.join(root_path, "logs")), 2);
  sys_info.folders["files"] = format_bytes(await gfs.loose(path.join(root_path, "files")), 2);
  sys_info.cpu.temp = await si.cpuTemperature()
    .then(data => (data.main ?? "0").toString() + "C°");
  sys_info.cpu.brand = await si.cpu()
    .then(data => data.manufacturer);
  sys_info.cpu.usage = await si.currentLoad()
    .then(data => data.currentLoad.toFixed(1) + "%");

  sys_info.inited = true;
  } catch(e) {
    logs.custom(e, colors.red(`admin`));
  }
}
update_sys_info();
setInterval(update_sys_info, 30000);

routes.get(`${admin_route_path}/`, notloggedin_handler, admin_handler, async_handler(async (req: Request, res: Response) => {
  res.render("admin/index.twig", {... sys_info });
  update_sys_info();
}));

routes.get(`${admin_route_path}/debug`, notloggedin_handler, admin_handler, async_handler(async (req: Request, res: Response) => {
  res.render("admin/debug.twig")
}));

routes.get(`${admin_route_path}/invite-keys`, notloggedin_handler, admin_handler, async_handler(async (req: Request, res: Response) => {
  const query = String(req.query?.q).toString();
  let page = Number(req.query.p);
  if(Number.isNaN(page) || Number(page) <= 0) {
    page = 1;
  }

  const order = String(req.query?.order).toString();
  const sort = String(req.query?.sort).toString();
  const invitekeys = await entity_invitekey.all(6, page, query, sort, order);
  res.render("admin/invite-keys.twig", { ...invitekeys.info})
}));

routes.get(`${admin_route_path}/server-management`, notloggedin_handler, owner_handler, async_handler(async (req: Request, res: Response) => {
  res.render("admin/server-management.twig")
}));

export default routes;