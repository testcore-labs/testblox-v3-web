import { shuffle } from "../utils/array";
import env from '../utils/env';
import twig from "twig";

twig.extendFilter("shuffle", function(array: any): any {
  return shuffle(array);
});

twig.extendFilter("parse_json", function(json: string): any {
  if(typeof json === 'undefined') return;
  return JSON.parse(json);
});

twig.extendFunction("env", function(key: any): any {
  return env[key];
});

export default twig;