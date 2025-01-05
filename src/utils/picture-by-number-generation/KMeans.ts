import { Vector } from "./common/Vector";

export class KMeans {
    points: any;
    k : number;
    random: any;
    currentIteration: number;
    pointsPerCategory: any[];
    centroids: any[];
    currentDeltaDistanceDifference: number;

    constructor(points: Vector[], k: number, random: any, centroids = null) {
        this.points = points;
        this.k = k;
        this.random = random;
        this.currentIteration = 0;
        this.pointsPerCategory = [];
        this.centroids = [];
        this.currentDeltaDistanceDifference = 0;
        if (centroids != null) {
            this.centroids = centroids;
            for (let i = 0; i < this.k; i++) {
                this.pointsPerCategory.push([]);
            }
        }
        else {
            this.initCentroids();
        }
    }
    initCentroids() {
        for (let i = 0; i < this.k; i++) {
            this.centroids.push(this.points[Math.floor(this.points.length * this.random.next())]);
            this.pointsPerCategory.push([]);
        }
    }
    step() {
        // clear category
        for (let i = 0; i < this.k; i++) {
            this.pointsPerCategory[i] = [];
        }
        // calculate points per centroid
        for (const p of this.points) {
            let minDist = Number.MAX_VALUE;
            let centroidIndex = -1;
            for (let k = 0; k < this.k; k++) {
                const dist = this.centroids[k].distanceTo(p);
                if (dist < minDist) {
                    centroidIndex = k;
                    minDist = dist;
                }
            }
            this.pointsPerCategory[centroidIndex].push(p);
        }
        let totalDistanceDiff = 0;
        // adjust centroids
        for (let k = 0; k < this.pointsPerCategory.length; k++) {
            const cat = this.pointsPerCategory[k];
            if (cat.length > 0) {
                const avg = Vector.average(cat);
                const dist = this.centroids[k].distanceTo(avg);
                totalDistanceDiff += dist;
                this.centroids[k] = avg;
            }
        }
        this.currentDeltaDistanceDifference = totalDistanceDiff;
        this.currentIteration++;
    }
}