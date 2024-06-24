// No :)
import express from "express";
import async_handler from 'express-async-handler';
import { rateLimit } from 'express-rate-limit';

const routes = express.Router();

routes.get('/asset', async_handler(async(req, res) => {
    // soon to be deprecated
    const asset_id: number = Number(req.query?.id);
    const roblox_asset: Promise<Response> = fetch(`https://assetdelivery.roblox.com/v1/asset/?id=${asset_id}`);
    // now, the asset may NOT exist, if this is the case, we need to parse the json to make sure its a valid asset,
    // if it's not, we throw an empty 404 to remain in compatibility with the client.
    roblox_asset.then((data) => {
        data.text().then((response_data) => {
            let is_json = false;
            try {
                JSON.parse(response_data);
                is_json = true;
            } catch (e) {
                is_json = false;
            }
            if(is_json) {
              res.status(404).json(response_data);
            } else {
              res.status(301).send(response_data)
            }
        })
    });
}));

export default routes