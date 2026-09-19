/**
 * Alpha Channel & Matte Application Module
 * 
 * Applies refined alpha mask to original image buffer, preserves input transparency,
 * and performs color decontamination (defringing) to eradicate background halos.
 * 
 * SPDX-License-Identifier: Apache-2.0
 */

import { createImageData } from './imageUtils';

export interface ApplyAlphaOptions {
  defringe?: boolean;
}

/**
 * Applies a Float32Array alpha mask (0.0 to 1.0) onto an original ImageData buffer.
 * Produces a full-resolution 32-bit RGBA ImageData object with clean transparent background.
 */
export function applyAlphaMask(
  originalImageData: ImageData,
  refinedMask: Float32Array,
  options: ApplyAlphaOptions = {}
): ImageData {
  const { defringe = true } = options;

  const width = originalImageData.width;
  const height = originalImageData.height;
  const totalPixels = width * height;

  const srcData = originalImageData.data;
  const resultImageData = createImageData(width, height);
  const dstData = resultImageData.data;

  // First pass: apply alpha while honoring existing input transparency
  for (let i = 0; i < totalPixels; i++) {
    const srcIdx = i * 4;
    const maskAlpha = Math.max(0, Math.min(1, refinedMask[i]));

    // Existing alpha in original image (0 to 1)
    const originalAlpha = srcData[srcIdx + 3] / 255.0;

    // Combined alpha
    const finalAlpha = maskAlpha * originalAlpha;

    dstData[srcIdx] = srcData[srcIdx];         // R
    dstData[srcIdx + 1] = srcData[srcIdx + 1]; // G
    dstData[srcIdx + 2] = srcData[srcIdx + 2]; // B
    dstData[srcIdx + 3] = Math.round(finalAlpha * 255); // A
  }

  // Second pass: Defringe / Color decontamination to remove background halo bleed
  if (defringe) {
    decontaminateEdges(dstData, refinedMask, width, height);
  }

  return resultImageData;
}

/**
 * Eradicates background color bleeding (halo) along semi-transparent silhouette boundaries
 */
function decontaminateEdges(
  data: Uint8ClampedArray,
  mask: Float32Array,
  w: number,
  h: number
): void {
  // We target pixels in the transition band (alpha between 0.05 and 0.90)
  for (let y = 1; y < h - 1; y++) {
    const row = y * w;
    for (let x = 1; x < w - 1; x++) {
      const idx = row + x;
      const alpha = mask[idx];

      if (alpha > 0.05 && alpha < 0.90) {
        // Look for nearby confident solid foreground pixels (alpha >= 0.90)
        let fgR = 0;
        let fgG = 0;
        let fgB = 0;
        let fgWeight = 0;

        for (let dy = -2; dy <= 2; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= h) continue;
          const nRow = ny * w;

          for (let dx = -2; dx <= 2; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= w) continue;

            const nIdx = nRow + nx;
            const nAlpha = mask[nIdx];

            if (nAlpha >= 0.90) {
              const weight = 1 / (1 + Math.sqrt(dx * dx + dy * dy));
              const pIdx = nIdx * 4;
              fgR += data[pIdx] * weight;
              fgG += data[pIdx + 1] * weight;
              fgB += data[pIdx + 2] * weight;
              fgWeight += weight;
            }
          }
        }

        if (fgWeight > 0) {
          const avgFgR = fgR / fgWeight;
          const avgFgG = fgG / fgWeight;
          const avgFgB = fgB / fgWeight;

          const pIdx = idx * 4;
          // Smooth blend edge pixel color towards genuine foreground chromaticity
          const blendFactor = (1 - alpha) * 0.75;

          data[pIdx] = Math.round(data[pIdx] * (1 - blendFactor) + avgFgR * blendFactor);
          data[pIdx + 1] = Math.round(data[pIdx + 1] * (1 - blendFactor) + avgFgG * blendFactor);
          data[pIdx + 2] = Math.round(data[pIdx + 2] * (1 - blendFactor) + avgFgB * blendFactor);
        }
      }
    }
  }
}
