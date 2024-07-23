class filter {
  static invisible_chars: string[];
  static bad_words: string[];
  static replacement_char: string;
  static whitelist_words: string[];
  static replacement_chars: { [key: string]: string };
  
  static {
    this.invisible_chars = [
    "0009",
    "0020",
    "00A0",
    "00AD",
    "034F",
    "061C",
    "115F",
    "1160",
    "17B4",
    "17B5",
    "180E",
    "2000",
    "2001",
    "2002",
    "2003",
    "2004",
    "2005",
    "2006",
    "2007",
    "2008",
    "2009",
    "200A",
    "200B",
    "200C",
    "200D",
    "200E",
    "200F",
    "202F",
    "205F",
    "2060",
    "2061",
    "2062",
    "2063",
    "2064",
    "206A",
    "206B",
    "206C",
    "206D",
    "206E",
    "206F",
    "3000",
    "2800",
    "3164",
    "FEFF",
    "FFA0",
    "1D159",
    "1D173",
    "1D174",
    "1D175",
    "1D176",
    "1D177",
    "1D178",
    "1D179",
    "1D17A",
    "E0020"
    ];

    this.replacement_chars = {
      "0": "o",
      "3": "e",
      "5": "a",
    };

    this.replacement_char = "#";
    this.bad_words = [
      "n+gg+r",
      "n+gga",
      "coon",
    ];
    this.whitelist_words = [
      "cain",
      "coin",
      "corn",
      "conn"
    ];
  }

  private static filter(text: string) {
    let filtered_text = text;
    let filtered = false;
    let amount_filtered = 0;
    filtered_text = filtered_text.toString();
    this.invisible_chars.forEach(code_char => {
      const uni_char = String.fromCodePoint(parseInt(code_char, 16));
      filtered_text.replaceAll(uni_char, "");
    });

    this.bad_words.forEach(bad_word => {
      const pattern = bad_word.replace(/\+/g, '[a-zA-Z0-9!?]');
      const regex = new RegExp(pattern, 'gi');
      

      filtered_text = filtered_text.replace(regex, (match) => {
        filtered = true;
        amount_filtered = amount_filtered + 1;
        return (this.replacement_char).repeat(match.length);
      });
    });

    return {filtered: filtered, amount_filtered: amount_filtered, txt: filtered_text};
  }

  static text_all(text: string) {
    return this.filter(text);
  }
  static text(text: string) {
    return this.filter(text).txt;
  }
  // checking if it has been censored
  static contains(text: string) {
    return this.filter(text).filtered;
  }
  static amount(text: string) {
    return this.filter(text).amount_filtered;
  }
}

export default filter;