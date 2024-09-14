import YAML, { parse } from "yaml";
import logs from "./log"
import colors from "../utils/colors";
import root_path from "./root_path";
import env from "./env";
import path from "path";
import { flatten } from "./array";
import fs from 'fs'

class translator {
  static log_name = colors.yellow("translator");
  static log_dir = path.join(root_path, "translation");
  static default_locale: string = env.locale;
  static selected_locale: string;
  static initialized: boolean = false;
  static translations: { [key: string]: any } = {};

  static init() {
    if(this.initialized) {
      return;
    }
    logs.custom("starting...", this.log_name);
    const files = fs.readdirSync(this.log_dir)
    for(const file of files) {
      let data = fs.readFileSync(path.join(this.log_dir, file), 'utf8');
      if(env.debug) {
        logs.custom("loading " + file, this.log_name, true);
      }

      let parsed = YAML.parse(data);
      const locale = parsed._locale.toString();
      if(this.default_locale === locale) {
        this.selected_locale = this.default_locale;
      }
      this.translations[locale] = parsed;
    }
    logs.custom("started", this.log_name);
    this.initialized = true;
  }

  static select(locale: string) {
    this.selected_locale = locale;
  }

  static completion(locale: string) {
    if(this.default_locale && locale) {
      if(this.translations[locale]["_completion"]) {
        return this.translations[locale]["_completion"];
      }
      const default_keys = (Object.keys(flatten(this.translations[this.default_locale]) ?? {})).filter((key: any) =>
        !key.startsWith("_")
      );
      const locale_keys = Object.keys(flatten(this.translations[locale]) ?? {});
      const locale_keys_filtered = locale_keys.filter((key: any) => 
        !key.startsWith("_") && default_keys.includes(key)
      );

      let completion = (locale_keys_filtered.length / default_keys.length) * 100;
      completion = Math.floor(completion * 10) / 10;
      this.translations[locale]["_completion"] = completion;

      return completion;
    }
  }

  static text(key: string, locale: string = this.selected_locale): string {
    const get_nested_val = (obj: any, path: string): any => {
      return path.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
    };
    if(locale) {
      let data = this.translations[locale];

      if(data) {
        return get_nested_val(data, key);
      } else {
        return get_nested_val(this.translations[this.default_locale], key);
      }
    } else {
      return key;
    }
  }
}

export default translator;