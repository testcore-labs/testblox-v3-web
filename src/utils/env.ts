// incase i switch config types
import _ from "lodash";
import YAML from "yaml";
import logs from "./log";
import fs from 'fs'
import path from "path";
import root_path from "./root_path";
import { pcall } from "./pcall";

let config = fs.readFileSync(path.join(root_path, 'config.yaml'), 'utf8');
let [tokens_failed, tokens] = await pcall(() => fs.readFileSync(path.join(root_path, 'tokens.yaml'), 'utf8'));

if(tokens_failed instanceof Error) {
  let [tokens_sample_failed, _tokens_sample] = await pcall(() => fs.readFileSync(path.join(root_path, 'tokens.sample.yaml'), 'utf8'));
  if(!(tokens_sample_failed instanceof Error)) {
    throw new Error("please rename your `tokens.sample.yaml` to `tokens.yaml`");
  } else {
    throw new Error("you are missing tokens.yaml");
  }
}

let config_parsed = YAML.parse(config);
let tokens_parsed = YAML.parse(tokens);

const env = _.merge(config_parsed, tokens_parsed);
const env_yaml = YAML.stringify(env);

export default env;
export { env_yaml as raw_env };