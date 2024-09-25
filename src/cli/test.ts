// for testing things in cli obv
import translator from "../translate";

translator.init();

console.log("mmm:", translator.translations["lt-lt"].catalog);
console.log("ew:", translator.translations["lt-lt"].catalog.catalog);