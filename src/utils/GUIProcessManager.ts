import CancellationToken from "cancellationtoken";
import { ColorReducer } from "./picture-by-number-generation/ColorReducer";
import { ColorMapResult } from "./picture-by-number-generation/common/ColorMapResult";
import { delay } from "./picture-by-number-generation/common/delay";
import { Point } from "./picture-by-number-generation/common/Point";
import { Settings } from "./picture-by-number-generation/common/Settings";
import { FacetBorderSegmenter } from "./picture-by-number-generation/FacetBorderSegmenter";
import { FacetBorderTracer } from "./picture-by-number-generation/FacetBorderTracer";
import {
  FacetCreator,
  FacetResult,
} from "./picture-by-number-generation/FacetCreator";
import { FacetLabelPlacer } from "./picture-by-number-generation/FacetLabelPlacer";
import { FacetReducer } from "./picture-by-number-generation/FacetReducer";

export class GUIProcessManager {
  static async process(
    settings: Settings,
    cancellationToken: CancellationToken,
    canvas: HTMLCanvasElement
  ) {
    const ctx = canvas.getContext("2d");
    let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    if (
      settings.resizeImageIfTooLarge &&
      (canvas.width > settings.resizeImageWidth ||
        canvas.height > settings.resizeImageHeight)
    ) {
      let width = canvas.width;
      let height = canvas.height;
      if (width > settings.resizeImageWidth) {
        const newWidth = settings.resizeImageWidth;
        const newHeight =
          (canvas.height / canvas.width) * settings.resizeImageWidth;
        width = newWidth;
        height = newHeight;
      }
      if (height > settings.resizeImageHeight) {
        const newHeight = settings.resizeImageHeight;
        const newWidth = (width / height) * newHeight;
        width = newWidth;
        height = newHeight;
      }
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = width;
      tempCanvas.height = height;
      tempCanvas.getContext("2d").drawImage(canvas, 0, 0, width, height);
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(tempCanvas, 0, 0, width, height);
      imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
    // reset progress
    //const tabsOutput = M.Tabs.getInstance(document.getElementById("tabsOutput"));
    // k-means clustering
    const kmeansImgData = await GUIProcessManager.processKmeansClustering(
      imgData,
      null,
      ctx,
      settings,
      cancellationToken,
      canvas
    );
    let facetResult: FacetResult;
    const colormapResult = ColorReducer.createColorMap(kmeansImgData);
    if (settings.narrowPixelStripCleanupRuns === 0) {
      // facet building
      facetResult = await GUIProcessManager.processFacetBuilding(
        colormapResult,
        cancellationToken
      );
      // facet reduction
      await GUIProcessManager.processFacetReduction(
        facetResult,
        null,
        settings,
        colormapResult,
        cancellationToken,
        canvas
      );
    } else {
      for (let run = 0; run < settings.narrowPixelStripCleanupRuns; run++) {
        // clean up narrow pixel strips
        await ColorReducer.processNarrowPixelStripCleanup(colormapResult);
        // facet building
        facetResult = await GUIProcessManager.processFacetBuilding(
          colormapResult,
          cancellationToken
        );
        // facet reduction
        await GUIProcessManager.processFacetReduction(
          facetResult,
          null,
          settings,
          colormapResult,
          cancellationToken,
          canvas
        );
        // the colormapResult.imgColorIndices get updated as the facets are reduced, so just do a few runs of pixel cleanup
      }
    }
    // facet border tracing
    await GUIProcessManager.processFacetBorderTracing(
      null,
      facetResult,
      cancellationToken,
      canvas
    );
    // facet border segmentation
    const cBorderSegment =
      await GUIProcessManager.processFacetBorderSegmentation(
        facetResult,
        null,
        settings,
        cancellationToken,
        canvas
      );
    // facet label placement
    await GUIProcessManager.processFacetLabelPlacement(
      facetResult,
      cBorderSegment,
      null,
      cancellationToken,
      canvas
    );
    // everything is now ready to generate the SVG, return the result

    return {
      facetResult: facetResult,
      colorsByIndex: colormapResult.colorsByIndex,
    };
  }
  static async processKmeansClustering(
    imgData: ImageData,
    tabsOutput: any,
    ctx: CanvasRenderingContext2D,
    settings: Settings,
    cancellationToken: CancellationToken,
    canvas: HTMLCanvasElement
  ) {
    //gui_1.time("K-means clustering");
    const ctxKmeans = canvas.getContext("2d");
    ctxKmeans.fillStyle = "white";
    ctxKmeans.fillRect(0, 0, canvas.width, canvas.height);
    const kmeansImgData = ctxKmeans.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );
    //tabsOutput.select("kmeans-pane");
    //$(".status.kMeans").addClass("active");
    await ColorReducer.applyKMeansClustering(
      imgData,
      kmeansImgData,
      settings,
      (kmeans) => {
        const progress =
          (100 -
            (kmeans.currentDeltaDistanceDifference > 100
              ? 100
              : kmeans.currentDeltaDistanceDifference)) /
          100;
        //$("#statusKMeans").css("width", Math.round(progress * 100) + "%");
        ctxKmeans.putImageData(kmeansImgData, 0, 0);
        console.log(kmeans.currentDeltaDistanceDifference);
        if (cancellationToken.isCancelled) {
          throw new Error("Cancelled");
        }
      }
    );
    //$(".status").removeClass("active");
    //$(".status.kMeans").addClass("complete");
    //gui_1.timeEnd("K-means clustering");
    return kmeansImgData;
  }
  static async processFacetBuilding(
    colormapResult: ColorMapResult,
    cancellationToken: CancellationToken
  ) {
    //gui_1.time("Facet building");
    //$(".status.facetBuilding").addClass("active");
    const facetResult = await FacetCreator.getFacets(
      colormapResult.width,
      colormapResult.height,
      colormapResult.imgColorIndices,
      (progress) => {
        if (cancellationToken.isCancelled) {
          throw new Error("Cancelled");
        }
        //$("#statusFacetBuilding").css("width", Math.round(progress * 100) + "%");
      }
    );
    //$(".status").removeClass("active");
    //$(".status.facetBuilding").addClass("complete");
    //gui_1.timeEnd("Facet building");
    return facetResult;
  }
  static async processFacetReduction(
    facetResult: FacetResult,
    tabsOutput: any,
    settings: Settings,
    colormapResult: ColorMapResult,
    cancellationToken: CancellationToken,
    canvas: HTMLCanvasElement
  ) {
    //gui_1.time("Facet reduction");
    //const cReduction = document.getElementById("cReduction");
    //cReduction.width = facetResult.width;
    //cReduction.height = facetResult.height;
    const ctxReduction = canvas.getContext("2d");
    ctxReduction.fillStyle = "white";
    ctxReduction.fillRect(0, 0, canvas.width, canvas.height);
    const reductionImgData = ctxReduction.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );
    //tabsOutput.select("reduction-pane");
    //$(".status.facetReduction").addClass("active");
    await FacetReducer.reduceFacets(
      settings.removeFacetsSmallerThanNrOfPoints,
      settings.removeFacetsFromLargeToSmall,
      settings.maximumNumberOfFacets,
      colormapResult.colorsByIndex,
      facetResult,
      colormapResult.imgColorIndices,
      (progress: number) => {
        if (cancellationToken.isCancelled) {
          throw new Error("Cancelled");
        }
        // update status & image
        //$("#statusFacetReduction").css("width", Math.round(progress * 100) + "%");
        let idx = 0;
        for (let j = 0; j < facetResult.height; j++) {
          for (let i = 0; i < facetResult.width; i++) {
            const facet = facetResult.facets[facetResult.facetMap.get(i, j)];
            const rgb = colormapResult.colorsByIndex[facet.color];
            reductionImgData.data[idx++] = rgb[0];
            reductionImgData.data[idx++] = rgb[1];
            reductionImgData.data[idx++] = rgb[2];
            idx++;
          }
        }
        ctxReduction.putImageData(reductionImgData, 0, 0);
      }
    );
    //$(".status").removeClass("active");
    //$(".status.facetReduction").addClass("complete");
    //gui_1.timeEnd("Facet reduction");
  }
  static async processFacetBorderTracing(
    tabsOutput: any,
    facetResult: FacetResult,
    cancellationToken: CancellationToken,
    canvas: HTMLCanvasElement
  ) {
    //gui_1.time("Facet border tracing");
    //tabsOutput.select("borderpath-pane");
    //const cBorderPath = document.getElementById("cBorderPath");
    // cBorderPath.width = facetResult.width;
    // cBorderPath.height = facetResult.height;
    const ctxBorderPath = canvas.getContext("2d");
    //$(".status.facetBorderPath").addClass("active");
    await FacetBorderTracer.buildFacetBorderPaths(facetResult, (progress: number) => {
      if (cancellationToken.isCancelled) {
        throw new Error("Cancelled");
      }
      // update status & image
      //$("#statusFacetBorderPath").css("width", Math.round(progress * 100) + "%");
      ctxBorderPath.fillStyle = "white";
      ctxBorderPath.fillRect(0, 0, canvas.width, canvas.height);
      for (const f of facetResult.facets) {
        if (f != null && f.borderPath != null) {
          ctxBorderPath.beginPath();
          ctxBorderPath.moveTo(
            f.borderPath[0].getWallX(),
            f.borderPath[0].getWallY()
          );
          for (let i = 1; i < f.borderPath.length; i++) {
            ctxBorderPath.lineTo(
              f.borderPath[i].getWallX(),
              f.borderPath[i].getWallY()
            );
          }
          ctxBorderPath.stroke();
        }
      }
    });
    //$(".status").removeClass("active");
    //$(".status.facetBorderPath").addClass("complete");
    //gui_1.timeEnd("Facet border tracing");
  }
  static async processFacetBorderSegmentation(
    facetResult: FacetResult,
    tabsOutput: any,
    settings: Settings,
    cancellationToken: CancellationToken,
    canvas: HTMLCanvasElement
  ): Promise<HTMLCanvasElement> {
    //gui_1.time("Facet border segmentation");
    //const cBorderSegment = document.getElementById("cBorderSegmentation");
    //cBorderSegment.width = facetResult.width;
    //cBorderSegment.height = facetResult.height;
    const ctxBorderSegment = canvas.getContext("2d");
    // tabsOutput.select("bordersegmentation-pane");
    //$(".status.facetBorderSegmentation").addClass("active");
    await FacetBorderSegmenter.buildFacetBorderSegments(
      facetResult,
      settings.nrOfTimesToHalveBorderSegments,
      (progress) => {
        if (cancellationToken.isCancelled) {
          throw new Error("Cancelled");
        }
        // update status & image
        //$("#statusFacetBorderSegmentation").css("width", Math.round(progress * 100) + "%");
        ctxBorderSegment.fillStyle = "white";
        ctxBorderSegment.fillRect(0, 0, canvas.width, canvas.height);
        for (const f of facetResult.facets) {
          if (f != null && progress > f.id / facetResult.facets.length) {
            ctxBorderSegment.beginPath();
            const path = f.getFullPathFromBorderSegments(false);
            ctxBorderSegment.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
              ctxBorderSegment.lineTo(path[i].x, path[i].y);
            }
            ctxBorderSegment.stroke();
          }
        }
      }
    );
    //$(".status").removeClass("active");
    //$(".status.facetBorderSegmentation").addClass("complete");
    //gui_1.timeEnd("Facet border segmentation");
    return canvas;
  }
  static async processFacetLabelPlacement(
    facetResult: FacetResult,
    cBorderSegment: HTMLCanvasElement,
    tabsOutput: any,
    cancellationToken: CancellationToken,
    canvas: HTMLCanvasElement
  ) {
    //gui_1.time("Facet label placement");
    const cLabelPlacement = document.getElementById("cLabelPlacement");
    //cLabelPlacement.width = facetResult.width;
    //cLabelPlacement.height = facetResult.height;
    const ctxLabelPlacement = canvas.getContext("2d");
    ctxLabelPlacement.fillStyle = "white";
    ctxLabelPlacement.fillRect(
      0,
      0,
      cBorderSegment.width,
      cBorderSegment.height
    );
    ctxLabelPlacement.drawImage(cBorderSegment, 0, 0);
    //tabsOutput.select("labelplacement-pane");
    //$(".status.facetLabelPlacement").addClass("active");
    await FacetLabelPlacer.buildFacetLabelBounds(facetResult, (progress) => {
      if (cancellationToken.isCancelled) {
        throw new Error("Cancelled");
      }
      // update status & image
      //$("#statusFacetLabelPlacement").css("width", Math.round(progress * 100) + "%");
      for (const f of facetResult.facets) {
        if (f != null && f.labelBounds != null) {
          ctxLabelPlacement.fillStyle = "red";
          ctxLabelPlacement.fillRect(
            f.labelBounds.minX,
            f.labelBounds.minY,
            f.labelBounds.width,
            f.labelBounds.height
          );
        }
      }
    });
    //$(".status").removeClass("active");
    //$(".status.facetLabelPlacement").addClass("complete");
    //gui_1.timeEnd("Facet label placement");
  }
  /**
   *  Creates a vector based SVG image of the facets with the given configuration
   */
  static async createSVG(
    svg: SVGSVGElement,
    facetResult: FacetResult,
    colorsByIndex: [number, number, number][],
    sizeMultiplier: number,
    fill: boolean,
    stroke: boolean,
    addColorLabels: boolean,
    fontSize: number = 50,
    fontColor: string = "black",
    onUpdate: (progress: number) => void
  ) {
    const xmlns = "http://www.w3.org/2000/svg";
    svg.setAttribute("width", sizeMultiplier * facetResult.width + "");
    svg.setAttribute("height", sizeMultiplier * facetResult.height + "");
    let count = 0;
    for (const f of facetResult.facets) {
      if (f != null && f.borderSegments.length > 0) {
        let newpath: Point[] = [];
        const useSegments = true;
        if (useSegments) {
          newpath = f.getFullPathFromBorderSegments(false);
          // shift from wall coordinates to pixel centers
          /*for (const p of newpath) {
                        p.x+=0.5;
                        p.y+=0.5;
                    }*/
        } else {
          for (let i = 0; i < f.borderPath.length; i++) {
            newpath.push(
              new Point(
                f.borderPath[i].getWallX() + 0.5,
                f.borderPath[i].getWallY() + 0.5
              )
            );
          }
        }
        if (
          newpath[0].x !== newpath[newpath.length - 1].x ||
          newpath[0].y !== newpath[newpath.length - 1].y
        ) {
          newpath.push(newpath[0]);
        } // close loop if necessary
        // Create a path in SVG's namespace
        // using quadratic curve absolute positions
        const svgPath = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        let data = "M ";
        data +=
          newpath[0].x * sizeMultiplier +
          " " +
          newpath[0].y * sizeMultiplier +
          " ";
        for (let i = 1; i < newpath.length; i++) {
          const midpointX = (newpath[i].x + newpath[i - 1].x) / 2;
          const midpointY = (newpath[i].y + newpath[i - 1].y) / 2;
          data +=
            "Q " +
            midpointX * sizeMultiplier +
            " " +
            midpointY * sizeMultiplier +
            " " +
            newpath[i].x * sizeMultiplier +
            " " +
            newpath[i].y * sizeMultiplier +
            " ";
          // data += "L " + (newpath[i].x * sizeMultiplier) + " " + (newpath[i].y * sizeMultiplier) + " ";
        }
        data += "Z";
        svgPath.setAttribute("data-facetId", f.id + "");
        // Set path's data
        svgPath.setAttribute("d", data);
        if (stroke) {
          svgPath.style.stroke = "#000";
        } else {
          // make the border the same color as the fill color if there is no border stroke
          // to not have gaps in between facets
          if (fill) {
            svgPath.style.stroke = `rgb(${colorsByIndex[f.color][0]},${colorsByIndex[f.color][1]},${colorsByIndex[f.color][2]})`;
          }
        }
        svgPath.style.strokeWidth = "1px"; // Set stroke width
        if (fill) {
          svgPath.style.fill = `rgb(${colorsByIndex[f.color][0]},${colorsByIndex[f.color][1]},${colorsByIndex[f.color][2]})`;
        } else {
          svgPath.style.fill = "none";
        }
        svg.appendChild(svgPath);
        /*  for (const seg of f.borderSegments) {
                        const svgSegPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
                        let segData = "M ";
                        const segPoints = seg.originalSegment.points;
                        segData += segPoints[0].x * sizeMultiplier + " " + segPoints[0].y * sizeMultiplier + " ";
                        for (let i: number = 1; i < segPoints.length; i++) {
                            const midpointX = (segPoints[i].x + segPoints[i - 1].x) / 2;
                            const midpointY = (segPoints[i].y + segPoints[i - 1].y) / 2;
                            //data += "Q " + (midpointX * sizeMultiplier) + " " + (midpointY * sizeMultiplier) + " " + (newpath[i].x * sizeMultiplier) + " " + (newpath[i].y * sizeMultiplier) + " ";
                            segData += "L " + (segPoints[i].x * sizeMultiplier) + " " + (segPoints[i].y * sizeMultiplier) + " ";
                        }

                        console.log("Facet " + f.id + ", segment " + segPoints[0].x + "," + segPoints[0].y + " -> " + segPoints[segPoints.length-1].x + "," +  segPoints[segPoints.length-1].y);

                        svgSegPath.setAttribute("data-segmentFacet", f.id + "");
                        // Set path's data
                        svgSegPath.setAttribute("d", segData);
                        svgSegPath.style.stroke = "#FF0";
                        svgSegPath.style.fill = "none";
                        svg.appendChild(svgSegPath);
                    }
                    */
        // add the color labels if necessary. I mean, this is the whole idea behind the paint by numbers part
        // so I don't know why you would hide them
        if (addColorLabels) {
          const txt = document.createElementNS(xmlns, "text");
          txt.setAttribute("font-family", "Tahoma");
          const nrOfDigits = (f.color + "").length;
          txt.setAttribute("font-size", fontSize / nrOfDigits + "");
          txt.setAttribute("dominant-baseline", "middle");
          txt.setAttribute("text-anchor", "middle");
          txt.setAttribute("fill", fontColor);
          txt.textContent = f.color + "";
          const subsvg = document.createElementNS(xmlns, "svg");
          subsvg.setAttribute(
            "width",
            f.labelBounds.width * sizeMultiplier + ""
          );
          subsvg.setAttribute(
            "height",
            f.labelBounds.height * sizeMultiplier + ""
          );
          subsvg.setAttribute("overflow", "visible");
          subsvg.setAttribute("viewBox", "-50 -50 100 100");
          subsvg.setAttribute("preserveAspectRatio", "xMidYMid meet");
          subsvg.appendChild(txt);
          const g = document.createElementNS(xmlns, "g");
          g.setAttribute("class", "label");
          g.setAttribute(
            "transform",
            "translate(" +
              f.labelBounds.minX * sizeMultiplier +
              "," +
              f.labelBounds.minY * sizeMultiplier +
              ")"
          );
          g.appendChild(subsvg);
          svg.appendChild(g);
        }
        if (count % 100 === 0) {
          await delay(0);
          if (onUpdate != null) {
            onUpdate(f.id / facetResult.facets.length);
          }
        }
      }
      count++;
    }
    if (onUpdate != null) {
      onUpdate(1);
    }
    return svg;
  }
}
