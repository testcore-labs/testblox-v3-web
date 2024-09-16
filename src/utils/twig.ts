import { shuffle } from "./array";
import env from './env';
import { info_time, timeago } from './time';
import { pcall, pcall_msg, pcall_sync } from './pcall';
import twig from "twig";
import translate from "./translate";
import fs from "fs";
import path from "path";
import root_path from "./root_path";

twig.extendFilter("shuffle", function(array: any): any {
  const shuffled = pcall_msg(() => shuffle(array));
  if(shuffled.success) {
    return shuffled.value;
  } else {
    return array;
  }
});

twig.extendFilter("parse_json", function(json: string): any {
  if(typeof json === 'undefined') return;
  return JSON.parse(json);
});
twig.extendFilter("timeago", function(timestamp: number): any {
  return timeago(timestamp);
});

twig.extendFilter("to_fixed", function(nmb: number, params: any): any {
  return nmb.toFixed(params[0] ?? 0);
});
twig.extendFilter("to_formatted", function(nmb: number, params: any): any {
  var value = (Number(nmb)).toLocaleString(
    env.locale,
    { minimumFractionDigits: params[0] ?? 0 }
  );
  return value;
});

twig.extendFilter("t", function(txt: string, args: any): any {
  return translate.text(txt, args[0]);
});
twig.extendFilter("nr2br", function(txt: string, args: any): any {
  return txt.replaceAll(/\n\r?/g, '&#13;&#10;');
});
twig.extendFilter("info_time", function(txt: number, args: any): any {
  let [_, out] = pcall_sync(() => info_time(txt));
  if(_ instanceof Error) {
    return info_time(txt / 1000);
  } else {
    return out;
  }
});
twig.extendFunction("transcompletion", function(locale: string): any {
  return translate.completion(locale);
});
twig.extendFunction("file_read", function(file_name: string): any {
  const views_folder = path.join(root_path, env.views.folder);
  const path_to_file = path.join(views_folder, file_name);
  return fs.readFileSync(path_to_file);
});

twig.extendFunction("query_remove_key", function(query: {[key: string]: any}, remove: string) {
  let parsed = { ...query };
  delete parsed[remove];
  
  let str = "";
  Object.entries(parsed).forEach(([key, value]) => {
    str += encodeURIComponent(key) + "=" + encodeURIComponent(value) + "&";
  });
  
  return str;
});

twig.extendFunction("env", function(key: any): any {
  return env[key];
});
twig.extendFunction("repeat", function(string: string, x: number): any {
  return string.repeat(x);
});

export default twig;