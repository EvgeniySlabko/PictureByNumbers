export class BooleanArray2D {
    width: number;
    height: number;
    arr: Uint8Array;
    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.arr = new Uint8Array(width * height);
    }
    get(x: number, y: number) {
        return this.arr[y * this.width + x] !== 0;
    }
    set(x: number, y: number, value: boolean) {
        this.arr[y * this.width + x] = value ? 1 : 0;
    }
}