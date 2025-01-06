export class Random {
  seed: number;
  constructor(seed: number) {
    if (typeof seed === "undefined") {
      this.seed = new Date().getTime();
    } else {
      this.seed = seed;
    }
  }
  next() {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }
}
