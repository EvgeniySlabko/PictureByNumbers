export class Uint8Array2D {
    width: number
    height: number
    arr: Uint8Array
    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.arr = new Uint8Array(width * height);
    }
    get(x: number, y: number) {
        return this.arr[y * this.width + x];
    }
    set(x: number, y: number, value: any) {
        this.arr[y * this.width + x] = value;
    }
    matchAllAround(x: number, y: number, value: number) {
        const idx = y * this.width + x;
        return (x - 1 >= 0 && this.arr[idx - 1] === value) &&
            (y - 1 >= 0 && this.arr[idx - this.width] === value) &&
            (x + 1 < this.width && this.arr[idx + 1] === value) &&
            (y + 1 < this.height && this.arr[idx + this.width] === value);
    }
}