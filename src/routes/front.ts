import express, { type Express, type Request, type Response, type NextFunction } from "express";
const routes = express.Router();
import async_handler from 'express-async-handler';
import env from '../utils/env';
import htmx_middleware from "../utils/htmx";

routes.use(htmx_middleware);

function loggedin_handler(req: Request, res: Response, next: NextFunction) {
  if(res.locals.isloggedin) {
    res.htmx.redirect("/home");
  } else {
    next();
  }
}

routes.get("/redirect", async_handler((req: Request, res: Response) => {
  if(req.query?.url) { // TODO: detect domain that isnt current and warn
    res.htmx.redirect(req.query?.url.toString());
  }
}));

routes.get("/dsc", async_handler((req: Request, res: Response) => {
  res.htmx.redirect("//discord.gg/"+env.dsc_invite)
}));


routes.get("/comingsoon", async_handler((req: Request, res: Response) => {
  res.render("comingsoon.twig")
}));

routes.get("/", loggedin_handler, async_handler((req: Request, res: Response) => {
  res.render("index.twig");
}));

routes.get("/tos", async_handler((req: Request, res: Response) => {
  res.render("tos.twig");
}));


export default routes;