class search_tags {
  tag_rgx: RegExp = /\(?(\w+):\s*([^)\s]+)\)?/g;

  match_all(txt: String) {
    let matches = [...txt.matchAll(this.tag_rgx)];
    return matches.map(match => ({
      full: match[0],
      key: match[1],
      value: match[2],
    }));
  }
}

export default (new search_tags);