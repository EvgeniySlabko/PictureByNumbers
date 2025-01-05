export type Settings = {
    kMeansNrOfClusters: number;
    kMeansMinDeltaDifference: number;
    kMeansClusteringColorSpace: number;
    kMeansColorRestrictions: any[];
    colorAliases: any;
    narrowPixelStripCleanupRuns: number; // 3 seems like a good compromise between removing enough narrow pixel strips to convergence. This fixes e.g. https://i.imgur.com/dz4ANz1.png
    removeFacetsSmallerThanNrOfPoints: number;
    removeFacetsFromLargeToSmall: boolean;
    maximumNumberOfFacets: number;
    nrOfTimesToHalveBorderSegments: number;
    resizeImageIfTooLarge: boolean;
    resizeImageWidth: number;
    resizeImageHeight: number;
    randomSeed: number;
}

export enum ClusteringColorSpace{
    RGB = 1,
    HSL = 2,
    LAB = 3
} 