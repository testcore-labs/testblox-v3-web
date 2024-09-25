import express, { type Express, type Request, type Response, type NextFunction } from "express";
import socket_io from "socket.io";
import websockets from "../websockets";

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
    io: typeof websockets
  }
}

function htmx_middleware(req: Request, res: Response, next: NextFunction): void {
  req.htmx = {
    ishtmx: () => {
      return req.header("HX-Request") === "true";
    }
  }
  res.io = websockets
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