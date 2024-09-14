// No :)
import path from "path";
import fs from "fs";
import express from "express";
import async_handler from 'express-async-handler';
import { rateLimit } from 'express-rate-limit';
import entity_asset from "../../db/asset";
import sql from "../../utils/sql";
import root_path from "../../utils/root_path";
import { pcall } from "../../utils/pcall";

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
  } else {
    if(asset.file.length > 0) {
      let asset_file_path = path.join(root_path, asset.file);
      let [asset_err, asset_file] = await pcall(() => {fs.readFileSync(asset_file_path)});
      if(asset_err instanceof Error) {
        res.status(404).json({success: false, message: "asset's file could not be fetched/read."});
        return;
      } else {
        asset_data = asset_file;
      }
    }
  }
  res.set("content-type", "application/octet-stream");
  if(asset_data) {
    res.send(asset_data);
    return;
  } else {
    res.status(404).json({success: false, message: "asset's file could not be fetched/read."});
    return;
  }
}));

export default routes