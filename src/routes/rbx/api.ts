// No :)
import path from "path";
import fs from "fs";
import crypto from "crypto";
import express from "express";
import async_handler from 'express-async-handler';
import { rateLimit } from 'express-rate-limit';
import entity_asset from "../../db/asset";
import sql from "../../sql";
import env from "../../utils/env";
import filter from "../../utils/filter";
import root_path from "../../utils/root_path";
import { pcall } from "../../utils/pcall";
import job_status from "../../types/rbx/join_status";
import entity_user from "../../db/user";
import {date_format} from "../../utils/time";

const routes = express.Router();

routes.get(["/asset/", "/asset", "/Asset/", "/Asset"], async_handler(async(req, res) => {
  const id = Number(req.query?.id)
  const read_from_roblox = true; // idk lol
  if(String(req.query?.id)?.startsWith("../")) {
    res.render("bftobanner.twig");
    return;
  }

  let asset = await (new entity_asset).by(entity_asset.query()
    .where(sql`id = ${id ?? 0}`)
  );

  if(!asset.exists) {
    if(!read_from_roblox) {
      res.status(404).json({success: false, message: "asset could not be found."});
      return;
    }

    const rbx_asset = await fetch(`https://assetdelivery.roblox.com/v1/asset/?id=${id ?? 0}`)
    if(rbx_asset.ok) {
      const data = Buffer.from(await rbx_asset.arrayBuffer());

      res.set("content-type", "application/octet-stream");
      res.send(data);
      return;
    } else {
      res.status(404).json({success: false, message: "asset could not be found."});
      return;
    }
  }

  if(asset.file && asset.file.length > 0) {
    let asset_file_path = path.join(root_path, "files", "assets", asset.file);
    fs.readFile(asset_file_path, (err, buff) => {
      if(err instanceof Error) {
        res.status(404).json({success: false, message: "asset's file could not be fetched/read.2"});
        return;
      } else {
        res.set("content-type", "application/octet-stream");
        res.send(buff);
        return;
      }
    });
  }
}));

const fflags: {[key: string]: Buffer} = {
  "RCCServiceLinuxTSTBLX": fs.readFileSync(path.join(root_path, "files", "fflags", "RCCService.json")),
  "RCCServiceTSTBLX": fs.readFileSync(path.join(root_path, "files", "fflags", "RCCService.json")),
  "PCDesktopClient": fs.readFileSync(path.join(root_path, "files", "fflags", "PCDesktopClient.json"))
}

routes.all("/moderation/v2/filtertext", async_handler(async(req, res) => {
  const data = {
    text: String(req.body.text),
    user_id: Number(req.body.userId),
    context: Number(req.body.context), //???
    user_locale: String(req.body.userLocale),
  }

  const filtered = filter.text_all(data.text);
  const response = { 
    success: true, 
    data: { 
      AgeUnder13: String(filtered.txt), 
      Age13OrOver: String(filtered.txt) 
    }
  };
  console.log(response);
  res.json(response);
}));

routes.get("/v1/settings/application", async_handler(async(req, res) => {
  let application_name = String(req.query.applicationName).trim();

  res.type("json").send(String(fflags[application_name]));
}));

routes.get("/universes/validate-place-join", async_handler(async(req, res) => {
  //?originPlaceId=0&destinationPlaceId=2
  res.send(`true`);
}));

routes.get("/GetAllowedSecurityKeys/", async_handler(async(req, res) => {
  res.send(`true`);
}));
routes.get("/GetAllowedSecurityVersions/", async_handler(async(req, res) => {
  res.send(`{data:["0.372.0pcplayer"]}`);
}));

routes.get("/GetAllowedMD5Hashes/", async_handler(async(req, res) => {
  res.json({data: [
    "f06edba008d17529ad7032c5835441ba",
  ]})
}));


routes.all("/v2.0/Refresh", async_handler(async(req, res) => {
  res.send(true)
}));
routes.all("/v2/CreateOrUpdate/", async_handler(async(req, res) => {
  res.send(true)
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
  const token = String(req.query.suggest);
  if(!token) {
    res.send("missing `token` query");
    return;
  }
  const cuser = await (new entity_user).by(entity_user.query()
    .where(sql`token = ${token}`)
  ); 
  if(cuser.exists) {
    res.locals.cuser = cuser;
    res.cookie(env.session.name, cuser.token.toString(), { 
      expires: new Date(Date.now() + Number(env.session.expires)), 
      secure: env.production ? true : false, 
      sameSite: env.production ? 'strict' : 'lax' 
    });
    res.send(`true`);
  } else {
    res.send(`false`);
  }
}));
routes.all("/marketplace/productinfo", async_handler(async(req, res) => {
  const id = Number(req.query.assetId);
  const asset = await (new entity_asset).by(entity_asset.query()
    .where(sql`id = ${id}`)
  );
  let info = {
    "TargetId": asset.id,
    "ProductType": "User Product",
    "AssetId": asset.id,
    "ProductId": asset.id,
    "Name": asset.title,
    "Description": asset.description,
    "AssetTypeId": asset.type,
    "Creator":  {
      "Id": asset.user?.id,
      "Name": asset.user?.username,
      "CreatorType":  "User",
      "CreatorTargetId": asset.user?.id,
      "HasVerifiedBadge": false //TODO: Add verified badge (?)
    },
    "IconImageAssetId": "id",
    "Created": asset.createdat,
    "Updated": asset.updatedat,
    "PriceInRobux": asset.info.price ? asset.info.price : 0,
    "PriceInTickets": 0, // deprecated
    "Sales": asset.sales,
    "IsNew": false, //TODO: do it
    "IsForSale": (asset.info.price ? asset.info.price : 0) >= 0,
    "IsPublicDomain": false, //hm 
    "IsLimited": false, //      TO
    "IsLimitedUnique":  false,//DO
    "Remaining": null, //IDK
    "MinimumMembershipLevel": 0, //aasss
    "ContentRatingTypeId": 0,
    "SaleAvailabilityLocations": null,
    "SaleLocation": null,
    "CollectibleItemId": null
  }
  res.json(info);
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
  let privatekey = fs.readFileSync(path.join(root_path, "files", "keys", "client", "private.pem"));
  
  function sign_rbxsig(script: string) {
    const signer = crypto.createSign('SHA1');
    signer.update(script);
    signer.end();
    const signature = signer.sign(privatekey, "base64");
    return signature;
  }
  function sign(script: string) {
    const signer = crypto.createSign('SHA1');
    signer.update(script);
    signer.end();
    const signature = signer.sign(privatekey, "base64");
    return signature;
  }
  const cuser = res.locals.cuser;

  if(!cuser.exists) {
    res.json({ success: false, message: "not logged in"});
    return;
  } 
  let baseurl = `${req.protocol}://${req.get('Host')}`;
  let ip = String(req.query['ip']) ?? "";
  let port = Number(req.query['port']) ?? "";
  let gameid = String(req.query['pid']) ?? "";
  let authid = String(req.query['userid']) ?? "";
  let authname = String(req.query['un']) ?? "";
  let charapp = `${baseurl}/v1.1/avatar-fetch?userId=${cuser.id}`;
  let jobid = "testthejob";
  let creatorid = 1;
  let membership = "None";
  let accountdays = 365 * 18;

  // PHP implementations
  /* 2020
  function authticket($id, $name, $charapp, $jobid, $privatekey) {
    global $accountdays;
    global $membership;
    global $authdisplayname;
    $time = date('n\/j\/Y\ g\:i\:s\ A');
    $namecount = strlen($name);
    $displaynamecount = strlen($authdisplayname);
    $membcount = strlen($membership);
    $ticket = $time."\n".$jobid."\n".$id."\n0\n0\n".$accountdays."\nf\n".$namecount."\n".$name."\n".$membcount."\n".$membership."\n0\n\n0\n\n".$displaynamecount."\n".$authdisplayname;
    openssl_sign($ticket, $sig, $privatekey, OPENSSL_ALGO_SHA1);
    $sig = base64_encode($sig);
    $ticket2 = $id . "\n" . $name . "\n" . $charapp . "\n". $jobid . "\n" . $time;
    openssl_sign($ticket2, $sig2, $privatekey, OPENSSL_ALGO_SHA1);
    $sig2 = base64_encode($sig2);
    $final = $time . ";" . $sig2 . ";" . $sig . ";4";
    return($final);
  } */
  /* 2018
  function authticket($id, $name, $charapp, $jobid, $privatekey) {
    $ticket = $id . "\n" . $jobid . "\n" . date('n\/j\/Y\ g\:i\:s\ A');
    openssl_sign($ticket, $sig, $privatekey, OPENSSL_ALGO_SHA1);
    $sig = base64_encode($sig);
    $ticket2 = $id . "\n" . $name . "\n" . 0 . "\n". $jobid . "\n" . date('n\/j\/Y\ g\:i\:s\ A');
    openssl_sign($ticket2, $sig2, $privatekey, OPENSSL_ALGO_SHA1);
    $sig2 = base64_encode($sig2);
    $final = date('n\/j\/Y\ g\:i\:s\ A') . ";" . $sig2 . ";" . $sig . ";2";
    return($final);
  } */
  const ticket_time = date_format(new Date(), `m/d/yyyy H:MM:ss TT`, false);
  const generate_ticket = () => {
    // i love how my charapp MUST be 1
    let ticket = `${cuser.id}\n${cuser.username}\n1\n${jobid}\n${ticket_time}`;
    let sig = sign(ticket);
    let ticket2 = `${cuser.id}\n${jobid}\n${ticket_time}`;
    let sig2 = sign(ticket2);
    return `${ticket_time};${sig};${sig2};2`;
  }

  /*
    "ClientTicket":
      "10/31/2024 14:17:35 PM;
      Zi/IlrofEEDDYWtO/upqV/qSs3DrAuCRDx9fAjWQhXxyFUvWiD3LR7n6RQbpJ37r7y21n4s/t8r6RsKA8KjWt/msIqtu3rHqGiZpXRlsm1cYwmj3KtM5BMR/+BjfQGPvE5vo5gtDycr/9QmlVAmwpvXCFRxqu3ZCKGnn7VSTtzeiG0S098ZboGsJB8x+pUa4Secrpo7X5PxezeXzjAxQhZFLZ07HlFmGWS+lcwrN/86ku3rUAb6qLexsGCtQcJMXuoGZsXfy8CQNwIlfU+KTF5MgYhuav+qGp+54ZdeQYxKCf9u8yjHFNIkkCG0XtrASUDnMk7e9uIY6m/Le8dM7HQ==;
      K8m8C2H7L+efC5DwHdMH1k13mTLWkVrRoWQhD169oH/dq9UP7U0GLNzLGyjEVPnA+szzkhF/7Nx5GBj9tBlMwJYASDc/PuRnswJFk1kz3B0n3n7CtIiN99Dw1WTiC5eyNEInU+fBv1bOCSKNOsOVG6HhQbUfy7vmntaMm36Yp8sB+DQdC8xiQZWBhtW/14YkmSrJtDflLwYAO50IvhHPNIAkkPx4U45bf4Ga9b9zcxZnUq6d6kXBbzsuDBm9PmeEpGSbJXivdqSL0Fn5Jg1uVf4M7Pmi7NQ1tfflIx0rHtbFHFiHjTmEnBcl6xNrnPVo95hOljX+gr/A2sSBww30Qw==;
      3"
    "ClientTicket":
      "9/26/2019 10:32:05 PM;
      VNQ9nQU2QVTQJnPa1TEh513a3aj4ELacT0Tg86HVQ8MdnaHCGkqHkJs0p+nhyxdIJlIUJCHVO+E1biptcmkZ+BsLXw0+yJdCmlG6sL9xS3jnmhdla5x5ae083FeI0fZFitCZV8uZYgzlMtLpMoiypQ/MXB5PBqpcV8Y6kEbcD7perL04FLjnSYnE7eU4UgcNQ7DTKzwPQtAReBeNVUpxyr0+FdlPjfHLk/GvIkjHS8nUIvFLD9vJAJiw/BY+bpc93NuzRcQtkb5E1Mg/728L7Qo6wOVm+BZebKNo1zNqeMBnSeAd3YabmPj9prcc/6P0zTaVgvEJp24G1twmwtiq7Q==;
      qDAF8wBpBvnTfqTZzPmnP7sqMW6NR5Aha3c3xuTUZY3JXkT16LEvBQ4d/XGKd85G3RKBF31xCxmoBC7a7KJSEegFiSfloyRzsWTqrCHxdSChHzRy+Xpf0EGkS4q8e4xZ9r2q2W9aoM7w2Db8xh/x8C/R1AU+ayHChZj09TFH2zng9SWOnqE6+e4v1exIHcdKA9BjApYZhDCkTEhcH/AwtGszGrTTC1ryIcLRDOvK6KxpMcKzMsVJSFZ1RDziExqBjlyVpzArxSwmtnZav0YlJZ2eVutVJWRFTxMMZJ9dySA3yaZZwPqu5Ay5yohUpi/XcHMi916V5Rt/pJEAYQ9x4Q==;
      3",
    "NewClientTicket":
      "9/26/2019 10:32:05 PM;
      VNQ9nQU2QVTQJnPa1TEh513a3aj4ELacT0Tg86HVQ8MdnaHCGkqHkJs0p+nhyxdIJlIUJCHVO+E1biptcmkZ+BsLXw0+yJdCmlG6sL9xS3jnmhdla5x5ae083FeI0fZFitCZV8uZYgzlMtLpMoiypQ/MXB5PBqpcV8Y6kEbcD7perL04FLjnSYnE7eU4UgcNQ7DTKzwPQtAReBeNVUpxyr0+FdlPjfHLk/GvIkjHS8nUIvFLD9vJAJiw/BY+bpc93NuzRcQtkb5E1Mg/728L7Qo6wOVm+BZebKNo1zNqeMBnSeAd3YabmPj9prcc/6P0zTaVgvEJp24G1twmwtiq7Q==;
      qDAF8wBpBvnTfqTZzPmnP7sqMW6NR5Aha3c3xuTUZY3JXkT16LEvBQ4d/XGKd85G3RKBF31xCxmoBC7a7KJSEegFiSfloyRzsWTqrCHxdSChHzRy+Xpf0EGkS4q8e4xZ9r2q2W9aoM7w2Db8xh/x8C/R1AU+ayHChZj09TFH2zng9SWOnqE6+e4v1exIHcdKA9BjApYZhDCkTEhcH/AwtGszGrTTC1ryIcLRDOvK6KxpMcKzMsVJSFZ1RDziExqBjlyVpzArxSwmtnZav0YlJZ2eVutVJWRFTxMMZJ9dySA3yaZZwPqu5Ay5yohUpi/XcHMi916V5Rt/pJEAYQ9x4Q==;
      3",
  */  

  const ticket = generate_ticket();
  console.log(ticket)
  let join_script = {
    "ClientPort": 0,
    "MachineAddress": "127.0.0.1", // ::1 || ::ffff:127.0.0.1
    "ServerPort": 53640,
    "ServerConnections": [{"Address": "127.0.0.1", "Port": 53640}],
    "PingUrl": "",
    "PingInterval": 0,
    "UserName": cuser.username,
    "SeleniumTestMode": false,
    "UserId": cuser.id,
    "SuperSafeChat": false,
    "CharacterAppearance": charapp,
    "ClientTicket": ticket,
    "NewClientTicket": ticket,
    "GameChatType": "AllUsers",
    // JOB ID
    "GameId": jobid,
    "PlaceId": 2,
    "MeasurementUrl": "",
    "WaitingForCharacterGuid": "91c2236e-73d2-49b5-b07a-dda91a59e336",
    "BaseUrl": "http://www.tstblx.win",
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
    "DataCenterId": "69420",
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
  let sig = sign_rbxsig(json);
  res.type("txt").send(`--rbxsig2%${sig}%${json}`);
}));


export default routes