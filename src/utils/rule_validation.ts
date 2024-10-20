import type { message_type } from "../types/message";

export default class rule_validator {
  input_rule_name: string;
  input: any;
  rules: {[key: string]: (input: any) => boolean} = {};

  constructor(input: any, input_rule_name: string = "input") {
    this.input_rule_name = input_rule_name;
    this.input = input;
  }

  validate(): message_type {
    let success: boolean = true
    let message: string = ``;
    for(const [rule, valid] of Object.entries(this.rules)) {
      let returned = valid(this.input);
      if(returned) {
        success = false; 
        message = rule;
        break;
      }
    }

    return { success: success, message: message };
  } 

  // re-usable rules
  not_ify = (bool: boolean, not_ify: boolean = false) => {
    return not_ify ? !bool : bool;
  }
  filters = {
    is_empty: (not: boolean = false) => {
      this.custom.add(
        `${not ? `not.` : ``}is_empty`, 
        (input) => this.not_ify(input.length == 0, not)
      );
    },
    min_len: (len: number, not: boolean = false) => {
      this.custom.add(
        `${not ? `not.` : ``}min_len`, 
        (input) => this.not_ify(input.length > len, not))
    },
    min_eq_len: (len: number, not: boolean = false) => {
      this.custom.add(
        `${not ? `not.` : ``}min_eq_len`, 
        (input) => this.not_ify(input.length >= len, not))
    },
    is_len: (len: number, not: boolean = false) => {
      this.custom.add(
        `${not ? `not.` : ``}is_len`, 
        (input) => this.not_ify(input.length === len, not))
    },
    max_len: (len: number, not: boolean = false) => {
      this.custom.add(
        `${not ? `not.` : ``}max_len`, 
        (input) => this.not_ify(input.length < len, not))
    },
    max_eq_len: (len: number, not: boolean = false) => {
      this.custom.add(
        `${not ? `not.` : ``}max_eq_len`, 
        (input) => this.not_ify(input.length <= len, not))
    },
    is_alphanumeric: (not: boolean = false) => {
      const rgx = new RegExp(`^[A-Za-z0-9]+$`);
      this.custom.add(
        `${not ? `not.` : ``}is_alphanumeric`, 
        (input) => this.not_ify((rgx.test(input)), not))
    },
    allowed_chars: (chars: string[] = [], not: boolean = false) => {
      this.custom.add(
        `${not ? `not.` : ``}allowed_chars`, 
        (input) => {
          const input_chars = String(input).split("");
    
          const allowed = input_chars.every(input_char => 
            chars.includes(input_char)
          );
    
          return this.not_ify(allowed, not);
        }
      )
    },
    regex: (regex: RegExp, not: boolean = false, rule_name: string = `regex`) => {
      this.custom.add(
        `${not ? `not.` : ``}${rule_name}`, 
        (input) => this.not_ify((regex.test(input)), not))
    }
  }

  custom = {
    add: (rule_name: string, rule_func: (input: any) => boolean) => {
      const rule_full_name = `${this.input_rule_name}.${rule_name}`;
      if(!this.rules[rule_full_name]) {
        this.rules[rule_full_name] = rule_func;
        return true;
      } else {
        return false;
      }
    },
    remove: (rule_name: string) => {
      const rule_full_name = `${this.input_rule_name}.${rule_name}`;
      if(!this.rules[rule_full_name]) {
        delete this.rules[rule_full_name];
        return true;
      } else {
        return false;
      }
    } 
  }
}