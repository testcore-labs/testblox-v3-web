import colors from 'colors/safe';
import { log_time } from '../utils/time';
import env from '../utils/env';
import root_path from '../utils/root_path';
import path from "path";

const directory = path.join(root_path, "logs") // for logs
class logs {
  static colors: typeof colors;
  static logs: { [key: string]: any; };

  static {
    logs.colors = colors;
  }

  static push(from_where: string, txt: string | number) {
    
  }

  static custom(txt: string | number, from_where: string = "") { // from_where lol 
    const message = colors.white("["+log_time(Date.now())+"]") + " " + colors.gray(`[${ from_where == "" ? "console": from_where }]`) + ": " + txt;
    console.log(message);
  }


  static debug(txt: string | number) {
    if(env.debug) {
      const message = colors.white("["+log_time(Date.now())+"]") + " " + colors.green(`[debug]`) + ": " + txt;
      console.log(message);
    } // else no output cuz debug ONLY...
  }

  static http(txt: string | number) {
    const message = colors.white("["+log_time(Date.now())+"]") + " " + colors.cyan("[http]") + ": " + txt;
    console.log(message);
  }
  static database(txt: string | number) {
    const message = colors.white("["+log_time(Date.now())+"]") + " " + colors.red("[database]") + ": " + txt;
    console.log(message);
  }
}

export default logs;