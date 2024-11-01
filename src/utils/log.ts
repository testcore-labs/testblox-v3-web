import colors from "../utils/colors";
import { log_time, date_format } from '../utils/time';
import env from '../utils/env'
import { printf } from 'fast-printf'
import root_path from '../utils/root_path';
import fs from 'fs';
import path from "path";

const directory = path.join(root_path, "logs", `log_${date_format(Date.now(), "yyyy-mm-dd_hh-MM-ss")}.log`) // for logs
class logs {
  static debug_format = ` ${colors.gray("|")} ${colors.green("debug")}`;
  static colors: typeof colors;
  static logs: { [key: string]: any; };
  static format: string;

  static {
    logs.colors = colors;
    logs.format = `${colors.gray(`[`)}%s${colors.gray(`]`)} [%s]: %s`;
  }

  private static push(txt: string) {
    if(!env.log_file) {
      return;
    } 
    // for removing ansi
    // credits to https://stackoverflow.com/a/29497680
    let new_txt = txt.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "")
    fs.appendFile(directory, `${new_txt}\n`, (error) => {
      if(error) console.error(error);
    });
  }

  private static print(txt: string) {
    console.log(txt);
  }

  static time() {
    return log_time(Date.now());
  }

  static custom(txt: string | number, from_where: string = "", debug = false) { // from_where lol 
    const message = printf(logs.format, 
      colors.white(logs.time()), 
      colors.gray(from_where === "" ? "console" : from_where) + (debug ? logs.debug_format : ``),
      colors.white(txt.toString())
    );
    logs.push(message);
    logs.print(message);
    return message;
  }


  static debug(txt: string | number, debug = false) {
    if(env.debug) {
      const message = printf(logs.format, 
        colors.white(logs.time()), 
        colors.green(`debug`) + (debug ? logs.debug_format : ``),
        colors.white(txt.toString())
      );
      logs.push(message);
      logs.print(message);
      return message;
    } // else no output cuz debug ONLY...
  }

  

  static request(method: string, path: string, ip: string, ua: string, debug = false) {
    let tr_ua = ua.toString().substring(0, 16).trimEnd(); // trim so truncate looks Nicer And Neater
    if(env.debug) {
      const message = printf(logs.format, 
        colors.white(logs.time()), 
        colors.cyan(method) + (debug ? logs.debug_format : ``),
        colors.white(colors.white(path.toString()) + `, ${colors.magenta(ip.toString())}, ${colors.red(tr_ua.toString() + (ua.length > 16 ? "…" : "")) }`)
      );
      // use nginx :3
      //logs.push(message);
      // this is for debugging when ur not using nginx
      logs.print(message);
      return message;
    } // requests are gonna be annoying on non debug so..
  }

  static http(txt: string | number, debug = false) {
    const message = printf(logs.format, 
      colors.white(logs.time()), 
      colors.cyan("http") + (debug ? logs.debug_format : ``),
      colors.white(txt.toString())
    );
    logs.push(message);
    logs.print(message);
    return message;
  }
  static database(txt: string | number, debug = false) {
    const message = printf(logs.format, 
      colors.white(logs.time()), 
      colors.red("database") + (debug ? logs.debug_format : ``),
      colors.white(txt.toString())
    );
    logs.push(message);
    logs.print(message);
    return message;
  }
  
  static arbiter(txt: string | number, debug = false) {
    const message = printf(logs.format, 
      colors.white(logs.time()), 
      colors.magenta("arbiter") + (debug ? logs.debug_format : ``),
      colors.white(txt.toString())
    );
    logs.push(message);
    logs.print(message);
    return message;
  }
  static discord(txt: string | number, debug = false) {
    const message = printf(logs.format, 
      colors.white(logs.time()), 
      colors.blue("discord" + ((debug ? logs.debug_format : ``))),
      colors.white(txt.toString())
    );
    logs.push(message);
    logs.print(message);
  }
}

export default logs;