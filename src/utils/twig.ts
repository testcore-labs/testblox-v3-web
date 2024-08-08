import { shuffle } from "../utils/array";
import env from '../utils/env';
import { timeago } from '../utils/time';
import { pcall_msg } from '../utils/pcall';
import twig from "twig";
import translate from "../utils/translate";

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


twig.extendFilter("t", function(txt: string, args: any): any {
  return translate.text(txt, args[0]);
});
twig.extendFilter("nr2br", function(txt: string, args: any): any {
  return txt.replaceAll(/\n\r?/g, '&#13;&#10;');
});
twig.extendFunction("transcompletion", function(locale: string): any {
  return translate.completion(locale);
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