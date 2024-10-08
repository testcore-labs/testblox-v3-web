// No :)
import path from "path";
import fs from "fs";
import express from "express";
import async_handler from 'express-async-handler';
import { rateLimit } from 'express-rate-limit';
import entity_asset from "../../db/asset";
import sql from "../../sql";
import env from "../../utils/env";
import root_path from "../../utils/root_path";
import { pcall } from "../../utils/pcall";
import job_status from "../../types/rbx/join_status";

const routes = express.Router();

routes.get(["/asset/", "/asset", "/Asset/", "/Asset"], async_handler(async(req, res) => {
  const id = Number(req.query?.id)
  if(String(req.query?.id)?.startsWith("../")) {
    res.render("bftobanner.twig");
    return;
  }

  let asset = await (new entity_asset).by(entity_asset.query()
    .where(sql`id = ${id ?? 0}`)
  );

  if(!asset.exists) {
    res.status(404).json({success: false, message: "asset could not be found."});
  }

  const is_url = (string: string) => {
    let url;
    try { url = new URL(string); } catch (_) { return false; }

    return url.protocol === "http:" || url.protocol === "https:";
  };

  let asset_data;
  if(is_url(asset.file)) {
    let asset_fetch = await fetch(asset.file)
      .then(async response => await response.arrayBuffer());

    asset_data = Buffer.from(asset_fetch);

    if(asset_data.byteLength == 0) {
      res.status(404).json({success: false, message: "asset's file could not be fetched/read.3"});
      return;
    } else {
      res.set("content-type", "application/octet-stream");
      res.send(asset_data);
      return;
    }
  } else {
    if(asset.file.length > 0) {
      let asset_file_path = path.join(root_path, "files", "assets", asset.file);
      fs.readFile(asset_file_path, (err, buff) => {
        if(err instanceof Error) {
          res.status(404).json({success: false, message: "asset's file could not be fetched/read.2"});
          return;
        } else {
          res.set("content-type", "application/octet-stream");
          res.send(buff);
          return
        }
      });
    }
  }
}));

const fflags: {[key: string]: Buffer} = {
  "RCCServiceTSTBLX": fs.readFileSync(path.join(root_path, "files", "fflags", "RCCService.json")),
  "PCDesktopClient": fs.readFileSync(path.join(root_path, "files", "fflags", "PCDesktopClient.json"))
}

routes.get("/v1/settings/application", async_handler(async(req, res) => {
  let application_name = String(req.query.applicationName);

  res.type("json").send(String(fflags[application_name]));
}));

routes.get("/GetAllowedMD5Hashes/", async_handler(async(req, res) => {
  res.json({
    data: [
      "s",
  ]})
}));


routes.get("/Thumbs/GameIcon.ashx", async_handler(async(req, res) => {
  res.htmx.redirect(`/asset/?id=${Number(req.query.assetId)}`)
}));
routes.get("/asset-thumbnail/json", async_handler(async(req, res) => {
  res.json({
    "Url":"/assets/img/tenors.gif",
    "Final":true});
}));
routes.all("/Login/Negotiate.ashx", async_handler(async(req, res) => {
  res.send(true)
}));
routes.all("/marketplace/productinfo", async_handler(async(req, res) => {
  let info = {
      
"TargetId": "id",
"ProductType":  "User Product",
"AssetId": "id",
"ProductId": "id",
"Name": "gamename",
"Description": "gamedescription",
"AssetTypeId":  9,
"Creator":  {
"Id": "gamecreatorid",
"Name": "gamecreator",
"CreatorType":  "User",
"CreatorTargetId": "gamecreatorid",
"HasVerifiedBadge":  true
},
"IconImageAssetId": "id",
"Created": "itemcreated",
"Updated": "itemupdated",
"PriceInRobux": "itemrobux",
"PriceInTickets": "itemtickets",
"Sales": "itemsale",
"IsNew":  false,
"IsForSale":  false,
"IsPublicDomain":  false,
"IsLimited": "itemlimited",
"IsLimitedUnique":  false,
"Remaining": null,
"MinimumMembershipLevel":  0,
"ContentRatingTypeId":  0,
"SaleAvailabilityLocations": null,
"SaleLocation": null,
"CollectibleItemId": null
  }
  res.json(info)
}));
routes.all("/Game/PlaceLauncher.ashx", async_handler(async(req, res) => {
  res.json({
    jobId: "none",
    status: job_status.Joining,
    joinScriptUrl: `${req.protocol}://${req.get('Host')}/Game/Join.ashx`,
    authenticationUrl: `${req.protocol}://${req.get('Host')}/Login/Negotiate.ashx`,
    authenticationTicket: req.cookies[env.session.name],
    message: "none",
  })
}));
routes.all("/game/validate-machine", async_handler(async(req, res) => {
  console.log(req.body);
  console.log(req.query);
}));
routes.all("/Game/Join.ashx", async_handler(async(req, res) => {
  let privatekey = String(fs.readFileSync(path.join(root_path, "files", "keys", "client", "private.pem"))) 
  function authticket(id: string, name: string, charapp: string, jobid: string, privatekey: string) {
    const dateStr = new Date().toLocaleString('en-US', { hour12: true });
    const ticket = `${id}\n${jobid}\n${dateStr}`;
    const sig = sign(ticket, privatekey);

    const ticket2 = `${id}\n${name}\n${charapp}\n${jobid}\n${dateStr}`;
    const sig2 = sign(ticket2, privatekey);

    const final = `${dateStr};${sig};${sig2}`;
    return final;
  }

  function sign(script: string, privatekey: string) {
    const crypto = require('crypto');
    const signer = crypto.createSign('SHA1');
    signer.update(script);
    signer.end();
    const signature = signer.sign(privatekey, 'base64');
    return signature;
  }

  let baseurl = `${req.protocol}://${req.get('Host')}`;
  let ip = String(req.query['ip']) ?? "";
  let port = Number(req.query['port']) ?? "";
  let gameid = String(req.query['pid']) ?? "";
  let authid = String(req.query['userid']) ?? "";
  let authname = String(req.query['un']) ?? "";
  let charapp = `${baseurl}/Asset/CharacterFetch.ashx?userId=${authid}placeId=${gameid}`;
  let jobid = "Test";
  let creatorid = 1;
  let membership = "None";
  let accountdays = 365 * 18;

  let join_script = {
    "ClientPort": 0,
    "MachineAddress": "127.0.0.1",
    "ServerPort": "53640",
    "PingUrl": "",
    "PingInterval": 0,
    "UserName": "shikataganai",
    "SeleniumTestMode": false,
    "UserId": 1,
    "SuperSafeChat": false,
    "CharacterAppearance": "https://www.tstblx.win/v1.1/avatar-fetch?userId=1",
    "ClientTicket": "1;1;1",
    "NewClientTicket": "1;1;1",
    "GameChatType": "AllUsers",
    "GameId": "91c2236e-73d2-49b5-b07a-dda91a59e336",
    "PlaceId": "1",
    "MeasurementUrl": "",
    "WaitingForCharacterGuid": "91c2236e-73d2-49b5-b07a-dda91a59e336",
    "BaseUrl": "https://www.tstblx.win",
    "ChatStyle": "ClassicAndBubble",
    "VendorId": 0,
    "ScreenShotInfo": "",
    "VideoInfo": "",
    "CreatorId": 1,
    "CreatorTypeEnum": "User",
    "MembershipType": "None",
    "AccountAge": 1,
    "CookieStoreFirstTimePlayKey": "rbx_evt_ftp",
    "CookieStoreFiveMinutePlayKey": "rbx_evt_fmp",
    "CookieStoreEnabled": true,
    "IsRobloxPlace": false,
    "GenerateTeleportJoin": false,
    "IsUnknownOrUnder13": false,
    "SessionId": "",
    "DataCenterId": 0,
    "UniverseId": 1,
    "BrowserTrackerId": 0,
    "UsePortraitMode": false,
    "FollowUserId": 0,
    "characterAppearanceId": 1,
    "DisplayName": "shikataganai",
    "RobloxLocale": "RobloxLocale",
    "GameLocale": "en_us",
    "CountryCode": "US"
  }; 
  let json = "\r\n" + JSON.stringify(join_script, null, 0);
  let sig = sign(json, privatekey);
  res.type("txt").send(`--rbxsig2%${sig}%${json}`);
}));


export default routes