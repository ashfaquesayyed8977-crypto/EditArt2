/**
 * Preprocessing module for Background Removal Pipeline
 * 
 * Scales input image to model dimensions with aspect-ratio preserving letterboxing,
 * and normalizes color channels into NCHW Float32 tensor buffers.
 * 
 * SPDX-License-Identifier: Apache-2.0
 */

import { ModelType } from './types';

export interface LetterboxInfo {
  padLeft: number;
  padTop: number;
  scaledWidth: number;
  scaledHeight: number;
  targetWidth: number;
  targetHeight: number;
  originalWidth: number;
  originalHeight: number;
}

export interface PreprocessResult {
  tensorData: Float32Array;
  dims: [number, number, number, number];
  letterbox: LetterboxInfo;
}

/**
 * Preprocesses an ImageData buffer for ONNX model inference
 */
export function preprocessImage(
  imageData: ImageData,
  modelType: ModelType,
  letterboxMode = true
): PreprocessResult {
  const origW = imageData.width;
  const origH = imageData.height;

  const [targetW, targetH] = modelType === 'modnet' ? [512, 512] : [320, 320];

  let scaledW = targetW;
  let scaledH = targetH;
  let padLeft = 0;
  let padTop = 0;

  if (letterboxMode) {
    const scale = Math.min(targetW / origW, targetH / origH);
    scaledW = Math.round(origW * scale);
    scaledH = Math.round(origH * scale);
    padLeft = Math.floor((targetW - scaledW) / 2);
    padTop = Math.floor((targetH - scaledH) / 2);
  }

  const letterbox: LetterboxInfo = {
    padLeft,
    padTop,
    scaledWidth: scaledW,
    scaledHeight: scaledH,
    targetWidth: targetW,
    targetHeight: targetH,
    originalWidth: origW,
    originalHeight: origH,
  };

  // NCHW tensor buffer: shape [1, 3, targetH, targetW]
  const channelSize = targetW * targetH;
  const tensorData = new Float32Array(3 * channelSize);

  // Normalization parameters
  // U2Net uses ImageNet statistics
  const meanU2 = [0.485, 0.456, 0.406];
  const stdU2 = [0.229, 0.224, 0.225];

  // Prepare padded letterbox buffer using bilinear resampling from original ImageData
  const srcData = imageData.data;

  // Initialize tensor with neutral normalized background (0.0 in normalized space)
  if (letterboxMode && (padLeft > 0 || padTop > 0 || scaledW < targetW || scaledH < targetH)) {
    const defaultR = modelType === 'modnet' ? 0 : (0 - meanU2[0]) / stdU2[0];
    const defaultG = modelType === 'modnet' ? 0 : (0 - meanU2[1]) / stdU2[1];
    const defaultB = modelType === 'modnet' ? 0 : (0 - meanU2[2]) / stdU2[2];

    for (let i = 0; i < channelSize; i++) {
      tensorData[i] = defaultR;
      tensorData[channelSize + i] = defaultG;
      tensorData[2 * channelSize + i] = defaultB;
    }
  }

  // Bilinear sampling from original image into scaled rectangle inside target canvas
  const xRatio = origW / scaledW;
  const yRatio = origH / scaledH;

  for (let dy = 0; dy < scaledH; dy++) {
    const ty = padTop + dy;
    const srcY = dy * yRatio;
    const y0 = Math.floor(srcY);
    const y1 = Math.min(y0 + 1, origH - 1);
    const yLerp = srcY - y0;

    for (let dx = 0; dx < scaledW; dx++) {
      const tx = padLeft + dx;
      const srcX = dx * xRatio;
      const x0 = Math.floor(srcX);
      const x1 = Math.min(x0 + 1, origW - 1);
      const xLerp = srcX - x0;

      // 4 neighboring source pixels
      const idx00 = (y0 * origW + x0) * 4;
      const idx10 = (y0 * origW + x1) * 4;
      const idx01 = (y1 * origW + x0) * 4;
      const idx11 = (y1 * origW + x1) * 4;

      // Bilinear interpolation for R, G, B
      for (let c = 0; c < 3; c++) {
        const top = srcData[idx00 + c] * (1 - xLerp) + srcData[idx10 + c] * xLerp;
        const bottom = srcData[idx01 + c] * (1 - xLerp) + srcData[idx11 + c] * xLerp;
        const val = top * (1 - yLerp) + bottom * yLerp;

        const normalizedVal = val / 255.0;
        let finalVal: number;

        if (modelType === 'modnet') {
          // MODNet normalization: (x / 255 - 0.5) / 0.5
          finalVal = (normalizedVal - 0.5) / 0.5;
        } else {
          // U2Net / U2Netp: ImageNet normalization
          finalVal = (normalizedVal - meanU2[c]) / stdU2[c];
        }

        // Write to NCHW channel
        const destIdx = c * channelSize + (ty * targetW + tx);
        tensorData[destIdx] = finalVal;
      }
    }
  }

  return {
    tensorData,
    dims: [1, 3, targetH, targetW],
    letterbox,
  };
}
