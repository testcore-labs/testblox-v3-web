import express, { type Request, type Response, type NextFunction } from "express";
import async_handler from 'express-async-handler';
import env from "../../utils/env";

const routes = express.Router();

function security_handler(req: Request, res: Response, next: NextFunction) {
  if(req.get("user-agent")?.toLowerCase() === env.user_agent.toLowerCase()) {
    res.status(404).json({success: false, message: "not a valid api endpoint."});
  }
  if(!req.query.api_key) {
    res.status(400).json({ success: false, message: "cannot get `api_key`" })
  }
  if(req.query?.api_key !== env.rcc.api_key) {
    res.status(400).json({ success: false, message: "invalid `api_key`" })
  }
  next();
}

routes.get("/", security_handler, async_handler(async(req, res) => {
  res.send("s");
}));

// routes.get("*", async_handler(async (req, res) => {
//   res.status(404);
//   res.json({success: false, message: "not a valid api endpoint."});
// }),);

export default routes;