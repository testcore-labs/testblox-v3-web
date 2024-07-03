import date_format, { masks } from "dateformat";
masks.log_time = 'ddd HH:MM:ss:L';

export function rbx_time(timestamp: number) { // 1970-01-01T00:00:00Z
  let date = new Date(timestamp);
  return date.toISOString().split('.')[0] + 'Z';
}

export function log_time(timestamp: number) {
  return date_format(timestamp, "log_time");
}