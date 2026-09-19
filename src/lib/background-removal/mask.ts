/**
 * Mask Operations Module for Background Removal Pipeline
 * 
 * Handles bilinear upsampling of neural network probability masks to full image dimensions,
 * and conversions between Float32Array mask buffers and visual grayscale ImageData.
 * 
 * SPDX-License-Identifier: Apache-2.0
 */

import { createImageData } from './imageUtils';

/**
 * Bilinear upsamples a Float32Array mask (0.0 - 1.0) from (srcW, srcH) to (destW, destH)
 */
export function upsampleMaskBilinear(
  srcMask: Float32Array,
  srcW: number,
  srcH: number,
  destW: number,
  destH: number
): Float32Array {
  if (srcW === destW && srcH === destH) {
    return new Float32Array(srcMask);
  }

  const destMask = new Float32Array(destW * destH);
  const xRatio = (srcW - 1) / Math.max(1, destW - 1);
  const yRatio = (srcH - 1) / Math.max(1, destH - 1);

  for (let dy = 0; dy < destH; dy++) {
    const srcY = dy * yRatio;
    const y0 = Math.floor(srcY);
    const y1 = Math.min(y0 + 1, srcH - 1);
    const yLerp = srcY - y0;

    const rowOffset = dy * destW;

    for (let dx = 0; dx < destW; dx++) {
      const srcX = dx * xRatio;
      const x0 = Math.floor(srcX);
      const x1 = Math.min(x0 + 1, srcW - 1);
      const xLerp = srcX - x0;

      const v00 = srcMask[y0 * srcW + x0];
      const v10 = srcMask[y0 * srcW + x1];
      const v01 = srcMask[y1 * srcW + x0];
      const v11 = srcMask[y1 * srcW + x1];

      const top = v00 * (1 - xLerp) + v10 * xLerp;
      const bottom = v01 * (1 - xLerp) + v11 * xLerp;
      const val = top * (1 - yLerp) + bottom * yLerp;

      destMask[rowOffset + dx] = val;
    }
  }

  return destMask;
}

/**
 * Converts a Float32Array alpha mask [0.0 - 1.0] into a grayscale ImageData object
 * where white (255) = foreground and black (0) = background.
 */
export function maskToImageData(
  mask: Float32Array,
  width: number,
  height: number
): ImageData {
  const imgData = createImageData(width, height);
  const data = imgData.data;
  const count = width * height;

  for (let i = 0; i < count; i++) {
    const byteVal = Math.round(Math.min(1, Math.max(0, mask[i])) * 255);
    const idx = i * 4;
    data[idx] = byteVal;     // R
    data[idx + 1] = byteVal; // G
    data[idx + 2] = byteVal; // B
    data[idx + 3] = 255;     // Fully opaque preview
  }

  return imgData;
}
