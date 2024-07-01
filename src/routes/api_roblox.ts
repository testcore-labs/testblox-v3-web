// No :)
import express from "express";
import async_handler from 'express-async-handler';
import { rateLimit } from 'express-rate-limit';

const routes = express.Router();

routes.get(['/asset', '/Asset', '/asset/', '/Asset/', '/v1/asset/'], async_handler(async(req, res) => {
    // soon to be deprecated
    const asset_id: number = Number(req.query?.id) || -1;
    const asset_version: number = Number(req.query?.version) || -1;
    if(asset_id==-1)
        return res.status(200).send('');
    const extra_query: string = asset_version == -1 ? '&version=1' : `&version=${asset_version}`
    const roblox_asset: Promise<Response> = fetch(`https://assetdelivery.roblox.com/v1/asset/?id=${asset_id}${extra_query}`);
    console.log(`https://assetdelivery.roblox.com/v1/asset/?id=${asset_id}${extra_query}`);
    // now, the asset may NOT exist, if this is the case, we need to parse the json to make sure its a valid asset,
    // if it's not, we throw an empty 200 to remain in compatibility with the client.
    roblox_asset.then((data) => {
        data.text().then((response_data) => {
            let is_json = false;
            try {
                JSON.parse(response_data);
                is_json = true;
            } catch (e) {
                is_json = false;
            }
            if(is_json)
              res.status(200).send('');
            else
              res.status(200).send(response_data);
        })
    });
}));

export default routes