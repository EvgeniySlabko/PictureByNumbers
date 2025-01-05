import { FacetBoundarySegment } from "./common/FacetBoundarySegment";
import { OrientationEnum } from "./common/OrientationEnum";
import { PathSegment } from "./common/PathSegment";
import { PathPoint } from "./common/PathToPoint";
import { Point } from "./common/Point";

export class FacetBorderSegmenter {
    /**
     * Builds border segments that are shared between facets
     * While border paths are all nice and fancy, they are not linked to neighbour facets
     * So any change in the paths makes a not so nice gap between the facets, which makes smoothing them out impossible
     */
    static async buildFacetBorderSegments(
        facetResult: any,
        nrOfTimesToHalvePoints: number = 2,
        onUpdate: ((progress: number) => void) | null = null
    ): Promise<void> {
        // First chop up the border path in segments each time the neighbour at that point changes
        const segmentsPerFacet = FacetBorderSegmenter.prepareSegmentsPerFacet(facetResult);

        // Reduce the segment complexity with Haar wavelet reduction to smooth them out
        FacetBorderSegmenter.reduceSegmentComplexity(facetResult, segmentsPerFacet, nrOfTimesToHalvePoints);

        // Match segments of facets with the prepared segments of the neighbour facets
        await FacetBorderSegmenter.matchSegmentsWithNeighbours(facetResult, segmentsPerFacet, onUpdate);
    }

    /**
     * Chops up the border paths per facet into segments adjacent to the same neighbour
     */
    static prepareSegmentsPerFacet(facetResult: any): any[] {
        const segmentsPerFacet: any[] = new Array(facetResult.facets.length);

        for (const f of facetResult.facets) {
            if (f != null) {
                const segments: any[] = [];
                if (f.borderPath.length > 1) {
                    let currentPoints: any[] = [];
                    currentPoints.push(f.borderPath[0]);

                    for (let i = 1; i < f.borderPath.length; i++) {
                        const prevBorderPoint = f.borderPath[i - 1];
                        const curBorderPoint = f.borderPath[i];
                        const oldNeighbour = prevBorderPoint.getNeighbour(facetResult);
                        const curNeighbour = curBorderPoint.getNeighbour(facetResult);

                        let isTransitionPoint = false;
                        if (oldNeighbour !== curNeighbour) {
                            isTransitionPoint = true;
                        } else if (oldNeighbour !== -1) {
                            if (FacetBorderSegmenter.isTransitionDueToDiagonals(prevBorderPoint, curBorderPoint, facetResult, oldNeighbour)) {
                                isTransitionPoint = true;
                            }
                        }

                        currentPoints.push(curBorderPoint);

                        if (isTransitionPoint) {
                            if (currentPoints.length > 1) {
                                const segment = new PathSegment(currentPoints, oldNeighbour);
                                segments.push(segment);
                                currentPoints = [curBorderPoint];
                            }
                        }
                    }

                    // Handle remainder of the path
                    if (currentPoints.length > 1) {
                        const oldNeighbour = f.borderPath[f.borderPath.length - 1].getNeighbour(facetResult);
                        if (segments.length > 0 && segments[0].neighbour === oldNeighbour) {
                            segments[0].points = currentPoints.concat(segments[0].points);
                        } else {
                            segments.push(new PathSegment(currentPoints, oldNeighbour));
                        }
                    }
                }
                segmentsPerFacet[f.id] = segments;
            }
        }

        return segmentsPerFacet;
    }

    private static isTransitionDueToDiagonals(
        prevBorderPoint: any,
        curBorderPoint: any,
        facetResult: any,
        oldNeighbour: number
    ): boolean {
        if (prevBorderPoint.x === curBorderPoint.x && prevBorderPoint.y === curBorderPoint.y) {
            const diagNeighbours = [
                { dx: -1, dy: -1 },
                { dx: 1, dy: -1 },
                { dx: -1, dy: 1 },
                { dx: 1, dy: 1 }
            ];

            for (const { dx, dy } of diagNeighbours) {
                const diagNeighbour = facetResult.facetMap.get(curBorderPoint.x + dx, curBorderPoint.y + dy);
                if (diagNeighbour !== oldNeighbour) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Reduces each segment border path points
     */
    static reduceSegmentComplexity(facetResult: any, segmentsPerFacet: any[], nrOfTimesToHalvePoints: number): void {
        for (const f of facetResult.facets) {
            if (f != null) {
                for (const segment of segmentsPerFacet[f.id]) {
                    for (let i = 0; i < nrOfTimesToHalvePoints; i++) {
                        segment.points = FacetBorderSegmenter.reduceSegmentHaarWavelet(
                            segment.points,
                            true,
                            facetResult.width,
                            facetResult.height
                        );
                    }
                }
            }
        }
    }

    /**
     * Remove the points by taking the average per pair and using that as a new point in the reduced segment.
     */
    static reduceSegmentHaarWavelet(
        newpath: any[],
        skipOutsideBorders: boolean,
        width: number,
        height: number
    ): any[] {
        if (newpath.length <= 5) {
            return newpath;
        }

        const reducedPath: any[] = [];
        reducedPath.push(newpath[0]);

        for (let i = 1; i < newpath.length - 2; i += 2) {
            if (!skipOutsideBorders || !FacetBorderSegmenter.isOutsideBorderPoint(newpath[i], width, height)) {
                const cx = (newpath[i].x + newpath[i + 1].x) / 2;
                const cy = (newpath[i].y + newpath[i + 1].y) / 2;
                reducedPath.push(new PathPoint(new Point(cx, cy), OrientationEnum.Left));
            } else {
                reducedPath.push(newpath[i]);
                reducedPath.push(newpath[i + 1]);
            }
        }

        reducedPath.push(newpath[newpath.length - 1]);
        return reducedPath;
    }

    static isOutsideBorderPoint(point: any, width: number, height: number): boolean {
        return point.x === 0 || point.y === 0 || point.x === width - 1 || point.y === height - 1;
    }

    /**
     * Matches all segments with each other between facets and their neighbours
     */
    static async matchSegmentsWithNeighbours(
        facetResult: any,
        segmentsPerFacet: any[],
        onUpdate: ((progress: number) => void) | null = null
    ): Promise<void> {
        const MAX_DISTANCE = 4;

        for (const f of facetResult.facets) {
            if (f != null) {
                f.borderSegments = new Array(segmentsPerFacet[f.id].length);
            }
        }

        let count = 0;

        for (const f of facetResult.facets) {
            if (f != null) {
                for (let s = 0; s < segmentsPerFacet[f.id].length; s++) {
                    const segment = segmentsPerFacet[f.id][s];
                    if (segment != null && f.borderSegments[s] == null) {
                        f.borderSegments[s] = new FacetBoundarySegment(segment, segment.neighbour, false);

                        if (segment.neighbour !== -1) {
                            const neighbourFacet = facetResult.facets[segment.neighbour];
                            let matchFound = false;

                            if (neighbourFacet != null) {
                                const neighbourSegments = segmentsPerFacet[segment.neighbour];

                                for (let ns = 0; ns < neighbourSegments.length; ns++) {
                                    const neighbourSegment = neighbourSegments[ns];
                                    if (
                                        neighbourSegment != null &&
                                        neighbourSegment.neighbour === f.id &&
                                        FacetBorderSegmenter.areSegmentsMatching(
                                            segment,
                                            neighbourSegment,
                                            MAX_DISTANCE
                                        )
                                    ) {
                                        const reverse = FacetBorderSegmenter.shouldReverse(segment, neighbourSegment);
                                        neighbourFacet.borderSegments[ns] = new FacetBoundarySegment(
                                            segment,
                                            f.id,
                                            reverse
                                        );

                                        neighbourSegments[ns] = null;
                                        matchFound = true;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    segmentsPerFacet[f.id][s] = null;
                }
                if (count % 100 === 0 && onUpdate) {
                    await new Promise((resolve) => setTimeout(resolve, 0));
                    onUpdate(f.id / facetResult.facets.length);
                }
            }
            count++;
        }
        if (onUpdate) {
            onUpdate(1);
        }
    }

    private static areSegmentsMatching(segment: any, neighbourSegment: any, maxDistance: number): boolean {
        const segStartPoint = segment.points[0];
        const segEndPoint = segment.points[segment.points.length - 1];
        const nSegStartPoint = neighbourSegment.points[0];
        const nSegEndPoint = neighbourSegment.points[neighbourSegment.points.length - 1];

        const matchesStraight =
            segStartPoint.distanceTo(nSegStartPoint) <= maxDistance &&
            segEndPoint.distanceTo(nSegEndPoint) <= maxDistance;

        const matchesReverse =
            segStartPoint.distanceTo(nSegEndPoint) <= maxDistance &&
            segEndPoint.distanceTo(nSegStartPoint) <= maxDistance;

        return matchesStraight || matchesReverse;
    }

    private static shouldReverse(segment: any, neighbourSegment: any): boolean {
        const segStartPoint = segment.points[0];
        const segEndPoint = segment.points[segment.points.length - 1];
        const nSegStartPoint = neighbourSegment.points[0];
        const nSegEndPoint = neighbourSegment.points[neighbourSegment.points.length - 1];

        return segStartPoint.distanceTo(nSegEndPoint) <= 4 && segEndPoint.distanceTo(nSegStartPoint) <= 4;
    }
}
