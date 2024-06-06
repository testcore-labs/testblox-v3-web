import express, { type Express, type Request, type Response } from "express";
const routes = express.Router();

routes.get("/", (req: Request, res: Response) => {
  res.render("index.twig", {
    reqtype: req.query.type ?? "",
  });
});

export default routes;