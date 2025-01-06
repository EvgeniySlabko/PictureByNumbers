export class CustomMap {
  obj: {[key: string]: any} = {};
  constructor() {
    this.obj = {};
  }
  containsKey(key: any) {
    return key in this.obj;
  }
  getKeys() {
    const keys = [];
    for (const el in this.obj) {
      if (this.obj.hasOwnProperty(el)) {
        keys.push(el);
      }
    }
    return keys;
  }
  get(key: any) {
    const o = this.obj[key];
    if (typeof o === "undefined") {
      return null;
    } else {
      return o;
    }
  }
  put(key: any, value: any) {
    this.obj[key] = value;
  }
  remove(key: string) {
    delete this.obj[key];
  }
  clone() {
    const m = new CustomMap();
    m.obj = {};
    for (const p in this.obj) {
      m.obj[p] = this.obj[p];
    }
    return m;
  }
}
