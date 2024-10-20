// for testing things in cli obv
import rule_validation from "../utils/rule_validation";

let validator = new rule_validation("", "thing");

validator.custom.add("is_empty", (input) => {
  return input.length == 0 || !input;
})

console.log(validator.validate());