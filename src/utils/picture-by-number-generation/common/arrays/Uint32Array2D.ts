export class Uint32Array2D {
    width: number;
    height: number;
    arr: Uint32Array;
    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.arr = new Uint32Array(width * height);
    }
    get(x: number, y: number) {
        return this.arr[y * this.width + x];
    }
    set(x: number, y: number, value: number) {
        this.arr[y * this.width + x] = value;
    }
}