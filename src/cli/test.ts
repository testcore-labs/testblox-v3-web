// for testing things in cli obv
import search_tags from "../utils/search_tags";
let search_matches =search_tags.match_all(`(price:       22)`);

console.log(search_matches);