import { OrientationEnum } from "./OrientationEnum";
import { Point } from "./Point";

export class PathPoint extends Point {
    orientation: OrientationEnum
    constructor(pt: Point, orientation: OrientationEnum) {
        super(pt.x, pt.y);
        this.orientation = orientation;
    }
    getWallX() {
        let x = this.x;
        if (this.orientation === OrientationEnum.Left) {
            x -= 0.5;
        }
        else if (this.orientation === OrientationEnum.Right) {
            x += 0.5;
        }
        return x;
    }
    getWallY() {
        let y = this.y;
        if (this.orientation === OrientationEnum.Top) {
            y -= 0.5;
        }
        else if (this.orientation === OrientationEnum.Bottom) {
            y += 0.5;
        }
        return y;
    }
    getNeighbour(facetResult: any) {
        switch (this.orientation) {
            case OrientationEnum.Left:
                if (this.x - 1 >= 0) {
                    return facetResult.facetMap.get(this.x - 1, this.y);
                }
                break;
            case OrientationEnum.Right:
                if (this.x + 1 < facetResult.width) {
                    return facetResult.facetMap.get(this.x + 1, this.y);
                }
                break;
            case OrientationEnum.Top:
                if (this.y - 1 >= 0) {
                    return facetResult.facetMap.get(this.x, this.y - 1);
                }
                break;
            case OrientationEnum.Bottom:
                if (this.y + 1 < facetResult.height) {
                    return facetResult.facetMap.get(this.x, this.y + 1);
                }
                break;
        }
        return -1;
    }
    toString() {
        return this.x + "," + this.y + " " + this.orientation;
    }
}