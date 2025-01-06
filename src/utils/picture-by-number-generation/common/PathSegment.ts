import { PathPoint } from "./PathToPoint";
import { Point } from "./Point";

export class PathSegment {
  points: PathPoint[];
  neighbour;
  constructor(points: any, neighbour: any) {
    this.points = points;
    this.neighbour = neighbour;
  }
}
