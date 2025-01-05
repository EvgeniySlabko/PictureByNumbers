import { Uint8Array2D } from "./arrays/Uint8Array2D";

export type ColorMapResult = {
    imgColorIndices: Uint8Array2D;
    colorsByIndex: [number, number, number][];
    width: number;
    height: number
}