import express, { type Express, type Request, type Response, type NextFunction } from "express";

declare module 'express-serve-static-core' {
  interface Request {
    htmx: {
      ishtmx: () => boolean;
    };
  }

  interface Response {
    htmx: {
      redirect: (url: string) => void;
    };
  }
}

function htmx_middleware(req: Request, res: Response, next: NextFunction): void {
  req.htmx = {
    ishtmx: () => {
      return req.header("HX-Request") === "true";
    }
  }
  res.htmx = {
    redirect: (url: string) => {
      if(req.htmx.ishtmx()) {
      res.setHeader("HX-Redirect", url);
      res.end();
      } else {
       res.redirect(url); 
      }
    }
  };
  next();
}

export default htmx_middleware;