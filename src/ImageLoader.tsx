import CancellationToken from "cancellationtoken";
import React, { useEffect, useRef, useState } from "react";
import { GUIProcessManager } from "./utils/GUIProcessManager";
import { Settings } from "./utils/picture-by-number-generation/common/Settings";

export const settings: Settings = {
  kMeansNrOfClusters: 16,
  kMeansMinDeltaDifference: 1,
  kMeansClusteringColorSpace: 0,
  kMeansColorRestrictions: [],
  colorAliases: {},
  narrowPixelStripCleanupRuns: 3,
  removeFacetsSmallerThanNrOfPoints: 20,
  removeFacetsFromLargeToSmall: true,
  maximumNumberOfFacets: Number.MAX_VALUE,
  nrOfTimesToHalveBorderSegments: 2,
  resizeImageIfTooLarge: true,
  resizeImageWidth: 1024,
  resizeImageHeight: 1024,
  randomSeed: new Date().getTime(),
};

const ImageUploader: React.FC = () => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const tokenRef = useRef<{
    token: CancellationToken;
    cancel: (reason?: any) => void;
  }>();

  useEffect(() => {
    tokenRef.current = CancellationToken.create();
  }, []);

  const canvasRef = useRef<HTMLCanvasElement>();
  const svgRef = useRef<SVGSVGElement>();

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; // Проверяем, что файл выбран
    if (!file) return; // Если файл не выбран, просто выходим из функции

    const blobURL = URL.createObjectURL(file);
    setImgUrl(blobURL);
  };

  const onProcess = async () => {
    const img = new Image(500, 500);
    img.src = imgUrl;

    img.onload = async () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, img.width, img.height);
      const svgResult = await GUIProcessManager.process(
        settings,
        tokenRef.current.token,
        canvasRef.current,
      );
      GUIProcessManager.createSVG(
        svgRef.current,
        svgResult.facetResult,
        svgResult.colorsByIndex,
        1,
        true,
        true,
        true,
        50,
        "#000",
        (progress) => {},
      );
    };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      {imgUrl && <img width={500} height={500} src={imgUrl} alt="Preview" />}
      <canvas width={500} height={500} ref={canvasRef}></canvas>
      <svg width={500} height={500} ref={svgRef} />
      <button onClick={onProcess}>Process</button>
    </div>
  );
};

export default ImageUploader;
