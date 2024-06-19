import express, { type Express, type Request, type Response } from "express";
const routes = express.Router();
import htmx_middleware from "../utils/htmx";

routes.use(htmx_middleware);

routes.get("/redirect", (req: Request, res: Response) => {
  if(req.query?.url) { // TODO: detect domain that isnt current and warn
    res.htmx.redirect(req.query?.url.toString());
  }
});

routes.get("/", (req: Request, res: Response) => {
  res.render("index.twig", {
    reqtype: req.query.type ?? "",
  });
});

export default routes;