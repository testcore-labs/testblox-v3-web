import express, { type Express, type Request, type Response, type NextFunction } from "express";
const routes = express.Router();
import async_handler from 'express-async-handler';
import htmx_middleware from "../utils/htmx";
import { format_bytes } from "../utils/format";
import asset from "../db/asset"
import user from "../db/user";
import invitekey from "../db/invitekey";
import {asset_types} from "../types/assets"
import filter from "../utils/filter";
import env, { raw_env } from "../utils/env";
import { filterXSS as xss } from "xss";
import promokey from "../db/promokey";
import os from "os";
import type { message_type } from "../utils/message";
import { notloggedin_handler, mod_handler, admin_handler, owner_handler } from "../utils/handlers";
import si from "systeminformation";
import { sys } from "typescript";
import { pcall } from "../utils/pcall";

routes.use(htmx_middleware);

routes.all("/redeem", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  const code = req.body?.code;
  
  let resp: message_type = { success: false, message: "" };
  if(code !== undefined) {
  let promkey = new promokey();
  await promkey.by_code(code);
  resp = await promkey.redeem(res.locals.cuser.id);
  }

  res.render("redeem.twig", { response: resp })
}));

routes.get("/filter/:this", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  res.send(filter.text_all(req.params.this))
}));

routes.get("/play/:placeid", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  res.send("doesn't work rn");
  //res.render("player/window.twig");
}));

routes.get("/home", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  let friends = await res.locals.cuser.get_friends();
  res.render("home.twig", { friends: friends });
}));

routes.get("/users/", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  const query = String(req.query?.q).toString();
  let page = Number(req.query.p);
  if(String(page) == "NaN" || Number(page) <= 0) {
    page = 1;
  }

  const order = String(req.query?.order).toString();
  const sort = String(req.query?.sort).toString();
  const games = await user.all(6, page, query, sort, order);
  res.render("users.twig", { ...games.info});
}));

routes.get("/games/", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  const query = String(req.query?.q).toString();
  let page = Number(req.query.p);
  if(String(page) == "NaN" || Number(page) <= 0) {
    page = 1;
  }

  const order = String(req.query?.order).toString();
  const sort = String(req.query?.sort).toString();
  const games = await asset.all(asset_types.Place, 6, page, query, sort, order);
  res.render("games.twig", { ...games.info});
}));

routes.get("/game/:id/:name", notloggedin_handler, async_handler(async (req: Request, res: Response) => {
  let game = await (new asset()).by_id(Number(req.params?.id));

  if(req.params?.name && req.params?.name == "about") {
    res.send("<h3 class=\"mb-2\">description</h3>" + xss(game.description ?? ""));
  } else if(req.params?.name && req.params?.name == "store") {
    res.send("<h3 class=\"mb-2\">store</h3>" + xss(game.description ?? ""));
  } else if(req.params?.name && req.params?.name == "servers") {
    res.send("<h3 class=\"mb-2\">servers</h3>" + xss(game.description ?? ""));
  } else if(req.params?.name != game.title) {
    res.send("y u tryna fake gam");
  } else {
    res.render("game.twig", { game: game });
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
    free: "0.0B", 
    total: "0.0B"
  },
  fs: {} as { [key: string]: any }
};

let update_sys_info = async () => {
  try {
  sys_info.ram.free = format_bytes(os.freemem(), 1);
  sys_info.ram.total = format_bytes(os.totalmem(), 1);
  sys_info.host.ip = await fetch("http://ip.me/", { headers: { "User-Agent": "curl/idklmao" } })
    .then(async (response) => {
      const ip = await response.text();
      if(!(/(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])/.test(ip.toString()))) {
        return "127.0.0.1";
      } else {
        return ip;
      }
    })

  await si.diskLayout()
    .then(data => {
      Object.entries(data).forEach(async ([key, info]) => {
        sys_info.fs[info.device] = { ... info, 
          size: format_bytes(info.size, 2),
        };
      });
      return;
    });
  sys_info.cpu.temp = await si.cpuTemperature()
  // windows doesn't work lol..
    .then(data => (data.chipset ?? "0").toString() + "C°");
  sys_info.cpu.brand = await si.cpu()
    .then(data => data.manufacturer);
  sys_info.cpu.usage = await si.currentLoad()
    .then(data => data.currentLoad.toFixed(1) + "%");

  sys_info.inited = true;
  } catch(e) {
    console.error("admin info failed updating: ", e);
  }
}
update_sys_info();
setInterval(update_sys_info, 30000);

routes.get(`${admin_route_path}/`, notloggedin_handler, admin_handler, async_handler(async (req: Request, res: Response) => {
  res.render("admin/index.twig", {... sys_info });
  update_sys_info();
}));


routes.get(`${admin_route_path}/env_editor`, notloggedin_handler, owner_handler, async_handler(async (req: Request, res: Response) => {
  res.render("admin/env_editor.twig", { configdotyaml: raw_env })
}));

routes.get(`${admin_route_path}/debug`, notloggedin_handler, admin_handler, async_handler(async (req: Request, res: Response) => {
  res.render("admin/debug.twig")
}));

routes.get(`${admin_route_path}/invite-keys`, notloggedin_handler, admin_handler, async_handler(async (req: Request, res: Response) => {
  const query = String(req.query?.q).toString();
  let page = Number(req.query.p);
  if(String(page) == "NaN" || Number(page) <= 0) {
    page = 1;
  }

  const order = String(req.query?.order).toString();
  const sort = String(req.query?.sort).toString();
  const invitekeys = await invitekey.all(6, page, query, sort, order);
  res.render("admin/invite-keys.twig", { ...invitekeys.info})
}));

export default routes;