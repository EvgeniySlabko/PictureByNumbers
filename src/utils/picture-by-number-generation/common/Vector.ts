export class Vector {
    values: any[]
    weight: number
    public tag: any;
    constructor(values: any, weight = 1) {
        this.values = values;
        this.weight = weight;
    }
    distanceTo(p: any) {
        let sumSquares = 0;
        for (let i = 0; i < this.values.length; i++) {
            sumSquares += (p.values[i] - this.values[i]) * (p.values[i] - this.values[i]);
        }
        return Math.sqrt(sumSquares);
    }
    /**
     *  Calculates the weighted average of the given points
     */
    static average(pts: any[]) {
        if (pts.length === 0) {
            throw Error("Can't average 0 elements");
        }
        const dims = pts[0].values.length;
        const values = [];
        for (let i = 0; i < dims; i++) {
            values.push(0);
        }
        let weightSum = 0;
        for (const p of pts) {
            weightSum += p.weight;
            for (let i = 0; i < dims; i++) {
                values[i] += p.weight * p.values[i];
            }
        }
        for (let i = 0; i < values.length; i++) {
            values[i] /= weightSum;
        }
        return new Vector(values);
    }
}