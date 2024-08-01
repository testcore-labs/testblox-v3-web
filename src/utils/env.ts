// incase i switch config types
import YAML from "yaml";
import fs from 'fs'
import path from "path";
import root_path from "./root_path";

let file = fs.readFileSync(path.join(root_path, 'config.yaml'), 'utf8');
//if(process.env.NODE_ENV == "development") {
//  file = fs.readFileSync(path.join(root_path, 'config.dev.yaml'), 'utf8');
//} else if(process.env.NODE_ENV == "production") {
//  file = fs.readFileSync(path.join(root_path, 'config.prod.yaml'), 'utf8');
//} else {
//  file = fs.readFileSync(path.join(root_path, 'config.dev.yaml'), 'utf8');
//}

const env = YAML.parse(file);

export default env;
export { file as raw_env };