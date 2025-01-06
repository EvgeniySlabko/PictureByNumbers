import { PathPoint } from "./PathToPoint";
import { Point } from "./Point";

export class PathSegment {
  points: PathPoint[];
  neighbour: number;
  constructor(points: PathPoint[], neighbour: number) {
    this.points = points;
    this.neighbour = neighbour;
  }
}
