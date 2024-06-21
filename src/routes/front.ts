import express, { type Express, type Request, type Response } from "express";
const routes = express.Router();
import async_handler from 'express-async-handler';
import htmx_middleware from "../utils/htmx";

routes.use(htmx_middleware);

routes.get("/redirect", async_handler((req: Request, res: Response) => {
  if(req.query?.url) { // TODO: detect domain that isnt current and warn
    res.htmx.redirect(req.query?.url.toString());
  }
}),);

routes.get("/", async_handler((req: Request, res: Response) => {
  res.render("index.twig", {
    reqtype: req.query.type ?? "",
  });
}),);

routes.get("/home", async_handler(async (req: Request, res: Response) => {
  if(res.locals.isloggedin) {
    res.render("home.twig");
  } else {
    res.htmx.redirect("/");
  }
}),);


export default routes;