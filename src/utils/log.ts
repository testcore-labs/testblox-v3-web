import colors from 'colors/safe';
import { log_time } from '../utils/time';
import env from '../utils/env'
import { printf } from 'fast-printf'
import root_path from '../utils/root_path';
import fs from 'fs';
import path from "path";

const directory = path.join(root_path, "logs", `${Date.now()}.log`) // for logs
class logs {
  static colors: typeof colors;
  static logs: { [key: string]: any; };
  static format: string;

  static {
    logs.colors = colors;
    logs.format = `[%s] [%s]: %s`;
  }

  private static push(txt: string) {
    if(!env.log_file) {
      return;
    } 
    // for removing ansi
    // credits to https://stackoverflow.com/a/29497680
    let new_txt = txt.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "")
    fs.appendFile(directory, `${new_txt}\n`, function (err) {

    });
  }

  private static print(txt: string) {
    console.log(txt);
  }

  static time() {
    return log_time(Date.now());
  }

  static custom(txt: string | number, from_where: string = "") { // from_where lol 
    const message = printf(logs.format, 
      colors.white(logs.time()), 
      colors.gray(from_where == "" ? "console" : from_where),
      colors.white(txt.toString())
    );
    logs.push(message);
    logs.print(message);
  }


  static debug(txt: string | number) {
    if(env.debug) {
      const message = printf(logs.format, 
        colors.white(logs.time()), 
        colors.green(`debug`),
        colors.white(txt.toString())
      );
      logs.push(message);
      logs.print(message);
    } // else no output cuz debug ONLY...
  }

  

  static request(method: string, path: string, ip: string, ua: string) {
    if(env.debug) {
      const message = printf(logs.format, 
        colors.white(logs.time()), 
        colors.cyan("request") + `, ${colors.gray(method)}`,
        colors.white(colors.white(path.toString()) + `, ${colors.magenta(ip.toString())}, ${colors.red(ua.toString())}`)
      );
      // use nginx :3
      //logs.push(message);
      // this is for debugging when ur not using nginx
      logs.print(message);
    } // requests are gonna be annoying on non debug so..
  }

  static http(txt: string | number) {
    const message = printf(logs.format, 
      colors.white(logs.time()), 
      colors.cyan("http"),
      colors.white(txt.toString())
    );
    logs.push(message);
    logs.print(message);
  }
  static database(txt: string | number) {
    const message = printf(logs.format, 
      colors.white(logs.time()), 
      colors.red("database"),
      colors.white(txt.toString())
    );
    logs.push(message);
    logs.print(message);
  }
}

export default logs;