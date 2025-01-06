import { BoundingBox } from "./common/BoundingBox";
import { FacetBoundarySegment } from "./common/FacetBoundarySegment";
import { PathPoint } from "./common/PathToPoint";
import { Point } from "./common/Point";

export class Facet {
  public pointCount: number;
  public neighbourFacetsIsDirty: boolean;
  public borderSegments: FacetBoundarySegment[];
  public id: number;
  public color: number;
  public bbox: BoundingBox = new BoundingBox();
  public borderPoints: Point[] = [];
  public neighbourFacets: number[] = [];
  public borderPath: PathPoint[]
  public labelBounds: BoundingBox
  constructor() {
    this.pointCount = 0;
    /**
     * Flag indicating if the neighbourfacets array is dirty. If it is, the neighbourfacets *have* to be rebuild
     * Before it can be used. This is useful to defer the rebuilding of the array until it's actually needed
     * and can remove a lot of duplicate building of the array because multiple facets were hitting the same neighbour
     * (over 50% on test images)
     */
    this.neighbourFacetsIsDirty = false;
  }
  getFullPathFromBorderSegments(useWalls: boolean) {
    const newpath: Point[] = [];
    const addPoint = (pt: PathPoint) => {
      if (useWalls) {
        newpath.push(new Point(pt.getWallX(), pt.getWallY()));
      } else {
        newpath.push(new Point(pt.x, pt.y));
      }
    };
    let lastSegment: FacetBoundarySegment | null = null;
    for (const seg of this.borderSegments) {
      // fix for the continuitity of the border segments. If transition points between border segments on the path aren't repeated, the
      // borders of the facets aren't always matching up leaving holes when rendered
      if (lastSegment != null) {
        if (lastSegment.reverseOrder) {
          addPoint(lastSegment.originalSegment.points[0]);
        } else {
          addPoint(
            lastSegment.originalSegment.points[
              lastSegment.originalSegment.points.length - 1
            ],
          );
        }
      }
      for (let i = 0; i < seg.originalSegment.points.length; i++) {
        const idx = seg.reverseOrder
          ? seg.originalSegment.points.length - 1 - i
          : i;
        addPoint(seg.originalSegment.points[idx]);
      }
      lastSegment = seg;
    }
    return newpath;
  }
}
