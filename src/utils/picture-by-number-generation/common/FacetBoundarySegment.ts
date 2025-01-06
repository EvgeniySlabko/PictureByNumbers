/**
 * Facet boundary segment describes the matched segment that is shared between 2 facets
 * When 2 segments are matched, one will be the original segment and the other one is removed
 * This ensures that all facets share the same segments, but sometimes in reverse order to ensure
 * the correct continuity of its entire oborder path
 */
export class FacetBoundarySegment {
  originalSegment;
  neighbour;
  reverseOrder;
  constructor(originalSegment: any, neighbour: any, reverseOrder: any) {
    this.originalSegment = originalSegment;
    this.neighbour = neighbour;
    this.reverseOrder = reverseOrder;
  }
}
