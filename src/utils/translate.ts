import YAML, { parse } from "yaml";
import logs from "./log"
import colors from "colors";
import root_path from "./root_path";
import env from "./env";
import path from "path";
import fs from 'fs'

class translator {
  static log_name = colors.yellow("translator");
  static log_dir = path.join(root_path, "translation");
  static default_locale: string = "en-us";
  static selected_locale: string;
  static initialized: boolean = false;
  static translations: { [key: string]: any } = {};

  static init() {
    if(this.initialized) {
      return;
    }
    logs.custom("starting", this.log_name);
    const files = fs.readdirSync(this.log_dir)
    for(const file of files) {
      let data = fs.readFileSync(path.join(this.log_dir, file), 'utf8');
      if(env.debug) {
        logs.custom("loading " + file, this.log_name + " | " + colors.green("debug"));
      }

      let parsed = YAML.parse(data);
      const locale = parsed._locale.toString();
      if(this.default_locale == locale) {
        this.selected_locale = this.default_locale;
      }
      this.translations[locale] = parsed;
    }
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
      const default_keys = Object.keys(this.translations[this.default_locale]);
      const locale_keys = Object.keys(this.translations[locale]);
      const locale_keys_filtered = locale_keys.filter((key: any) => default_keys.includes(key));

      const completion = (locale_keys_filtered.length / default_keys.length) * 100;
      this.translations[locale]["_completion"] = completion;

      return completion;
    }
  }

  static text(key: string, locale: string = this.selected_locale): string {
    if(locale) {
      let data = this.translations[locale];

      if(data) {
        return data[key];
      } else {
        return "undefined";
      }
    } else {
      return "undefined";
    }
  }
}

export default translator;