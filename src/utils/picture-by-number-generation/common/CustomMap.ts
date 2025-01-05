export class CustomMap {
    obj: {};
    constructor() {
        this.obj = {};
    }
    containsKey(key) {
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
    get(key) {
        const o = this.obj[key];
        if (typeof o === "undefined") {
            return null;
        }
        else {
            return o;
        }
    }
    put(key, value) {
        this.obj[key] = value;
    }
    remove(key) {
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