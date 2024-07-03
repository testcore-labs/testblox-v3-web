import colors from 'colors/safe';
import { log_time } from '../utils/time';

class logs {
  static colors: typeof colors;
  static logs: { server: string[]; database: string[]; };

  static {
    logs.colors = colors;
    logs.logs = {
      server: [],
      database: [],
    };
  }
  static server_log(txt: string | number) {
    const message = colors.white("["+log_time(Date.now())+"]") + " " + colors.cyan("[server]") + ": " + txt;
    logs.logs.server.push(message);
    console.log(message);
  }
  static database_log(txt: string | number) {
    const message = colors.white("["+log_time(Date.now())+"]") + " " + colors.red("[database]") + ": " + txt;
    logs.logs.database.push(message);
    console.log(message);
  }
}

export default logs;