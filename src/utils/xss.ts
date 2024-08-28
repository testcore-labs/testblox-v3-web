import xss from "xss";
export const xss_all = (txt: string) => xss(txt, { whiteList: { }});