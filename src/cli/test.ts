// for testing things in cli obv
import translate from "../utils/translate";

translate.init();
console.log(translate.text("hello_world", "lt-lt"));
console.log(translate.completion("lt-lt"));