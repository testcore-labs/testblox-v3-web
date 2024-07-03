import colors from 'colors/safe';
import date_format, { masks } from "dateformat";

class logs {
  static colors: typeof colors;
  static logs: { server: string[]; database: string[]; };

  static {
    masks.log_time = 'ddd HH:MM:ss:L';
    logs.colors = colors;
    logs.logs = {
      server: [],
      database: [],
    };
  }
  static server_log(txt: string | number) {
    const message = colors.white("["+date_format(Date.now(), "log_time")+"]") + " " + colors.cyan("[server]") + ": " + txt;
    logs.logs.server.push(message);
    console.log(message);
  }
  static database_log(txt: string | number) {
    const message = colors.white("["+date_format(Date.now(), "log_time")+"]") + " " + colors.red("[database]") + ": " + txt;
    logs.logs.database.push(message);
    console.log(message);
  }
}

export default logs;