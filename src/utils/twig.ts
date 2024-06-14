import { shuffle } from "../utils/array";
import env from '../utils/env';
import { pcall } from '../utils/pcall';
import twig from "twig";

twig.extendFilter("shuffle", function(array: any): any {
  const shuffled = pcall(() => shuffle(array));
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

twig.extendFunction("env", function(key: any): any {
  return env[key];
});

export default twig;