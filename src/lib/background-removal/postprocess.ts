/**
 * Post-processing Module for Background Removal Pipeline
 * 
 * Encoders for PNG Blobs, Object URL lifecycle management,
 * and result object aggregation.
 * 
 * SPDX-License-Identifier: Apache-2.0
 */

import { imageDataToBlob } from './imageUtils';
import { maskToImageData } from './mask';
import { BackgroundRemovalResult, PipelineTimings } from './types';

export interface AssembleResultParams {
  transparentImageData: ImageData;
  refinedMask: Float32Array;
  rawMask: Float32Array;
  rawMaskW: number;
  rawMaskH: number;
  timings: PipelineTimings;
  modelName: string;
}

/**
 * Assembles the full BackgroundRemovalResult containing blobs, object URLs, and cleanup hooks.
 */
export async function assembleResult(
  params: AssembleResultParams
): Promise<BackgroundRemovalResult> {
  const {
    transparentImageData,
    refinedMask,
    rawMask,
    rawMaskW,
    rawMaskH,
    timings,
    modelName,
  } = params;

  const width = transparentImageData.width;
  const height = transparentImageData.height;

  // Convert transparent ImageData to PNG Blob
  const transparentBlob = await imageDataToBlob(transparentImageData);
  const transparentImageURL = URL.createObjectURL(transparentBlob);

  // Convert refined mask to visual grayscale preview
  const refinedMaskImageData = maskToImageData(refinedMask, width, height);
  const refinedMaskBlob = await imageDataToBlob(refinedMaskImageData);
  const maskImageURL = URL.createObjectURL(refinedMaskBlob);

  // Convert raw model mask to visual grayscale preview
  const rawMaskImageData = maskToImageData(rawMask, rawMaskW, rawMaskH);
  const rawMaskBlob = await imageDataToBlob(rawMaskImageData);
  const rawMaskImageURL = URL.createObjectURL(rawMaskBlob);

  const objectUrls = [transparentImageURL, maskImageURL, rawMaskImageURL];

  return {
    transparentBlob,
    transparentImageURL,
    mask: refinedMaskImageData,
    maskImageURL,
    rawMaskImageURL,
    width,
    height,
    processingTime: timings.totalMs,
    timings,
    modelName,
    cleanup: () => {
      for (const url of objectUrls) {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // Ignore revocation errors
        }
      }
    },
  };
}
