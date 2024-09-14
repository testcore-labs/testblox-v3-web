export function proxy_obj(obj: any, def: (target: any, prop: string | symbol) => {}) {
  // typescript doesnt like plain Object type being used
  if(typeof obj === "object") {
    return new Proxy(obj, {
      get(target, prop) {
        if(prop in target) {
          if(typeof target[prop] === "object" && target[prop] !== null) {
            return proxy_obj(target[prop], def);
          }
          return target[prop];
        } else {
          let out = def(target, prop);
          return out;
        }
      }
    });
  }
}