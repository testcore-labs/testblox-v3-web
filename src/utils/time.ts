import date_format, { masks } from "dateformat";
import { format } from "timeago.js"
masks.log_time = 'ddd HH:MM:ss:L';
masks.info_time = 'UTC:yyyy-mm-dd hh:MM:ss TT Z';

export { date_format };

export function rbx_time(timestamp: number) { // 1970-01-01T00:00:00Z
  let date = new Date(timestamp);
  return date.toISOString().split('.')[0] + 'Z';
}

export function log_time(timestamp: number) {
  return date_format(timestamp, "log_time");
}
export function info_time(timestamp: number) {
  return date_format(timestamp, "info_time");
}


export function timeago(timestamp: number) {
  return format(timestamp);
}