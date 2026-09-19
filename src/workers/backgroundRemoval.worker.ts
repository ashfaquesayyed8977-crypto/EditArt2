/**
 * Background Removal Web Worker
 * 
 * Offloads heavy neural network inference, bilinear upsampling,
 * and mask refinement away from the browser UI thread.
 * 
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  WorkerRequestPayload,
  WorkerProgressMessage,
  WorkerSuccessMessage,
  WorkerErrorMessage,
  ProgressInfo,
  PipelineTimings,
} from '../lib/background-removal/types';
import { preprocessImage } from '../lib/background-removal/preprocess';
import { getInferenceSession, runInference } from '../lib/background-removal/segmentation';
import { upsampleMaskBilinear } from '../lib/background-removal/mask';
import { refineMask } from '../lib/background-removal/refineMask';
import { applyAlphaMask } from '../lib/background-removal/alpha';
import { maskToImageData } from '../lib/background-removal/mask';

// Send progress update back to main thread
function postProgress(id: string, progress: ProgressInfo): void {
  const msg: WorkerProgressMessage = {
    type: 'progress',
    id,
    data: progress,
  };
  self.postMessage(msg);
}

self.onmessage = async (e: MessageEvent<WorkerRequestPayload>) => {
  const { id, imageData, options } = e.data;
  const startTime = performance.now();

  const timings: PipelineTimings = {
    decodeMs: 0,
    preprocessMs: 0,
    inferenceMs: 0,
    refinementMs: 0,
    alphaMs: 0,
    encodeMs: 0,
    totalMs: 0,
  };

  try {
    const origW = imageData.width;
    const origH = imageData.height;

    // 1. Loading Model
    postProgress(id, {
      stage: 'loading-model',
      progress: 5,
      message: 'Preparing segmentation model in Web Worker...',
      elapsedMs: Math.round(performance.now() - startTime),
    });

    const modelType = options.model || 'u2netp';
    const session = await getInferenceSession(
      modelType,
      options.modelUrl,
      (progress) => postProgress(id, { ...progress, elapsedMs: Math.round(performance.now() - startTime) })
    );

    // 2. Preprocess
    const tPre0 = performance.now();
    postProgress(id, {
      stage: 'preprocessing',
      progress: 40,
      message: 'Preprocessing image for neural input...',
      elapsedMs: Math.round(performance.now() - startTime),
    });

    const preprocessed = preprocessImage(imageData, modelType, true);
    timings.preprocessMs = Math.round(performance.now() - tPre0);

    // 3. AI Segmentation Inference
    const tInf0 = performance.now();
    postProgress(id, {
      stage: 'segmenting',
      progress: 55,
      message: 'Running AI foreground segmentation...',
      elapsedMs: Math.round(performance.now() - startTime),
    });

    const inferenceResult = await runInference(
      session,
      preprocessed.tensorData,
      preprocessed.dims,
      preprocessed.letterbox,
      modelType
    );
    timings.inferenceMs = Math.round(performance.now() - tInf0);

    // 4. Bilinear Upsampling & Mask Refinement
    const tRef0 = performance.now();
    postProgress(id, {
      stage: 'refining',
      progress: 75,
      message: 'Upsampling & refining edge contours...',
      elapsedMs: Math.round(performance.now() - startTime),
    });

    // Upsample raw mask directly to original image resolution
    const fullResRawMask = upsampleMaskBilinear(
      inferenceResult.rawMask,
      inferenceResult.maskWidth,
      inferenceResult.maskHeight,
      origW,
      origH
    );

    // Refine mask with smoothstep, hole-filling, artifact-removal, and boundary feathering
    const refinedMask = refineMask(fullResRawMask, origW, origH, {
      edgeRefinement: options.edgeRefinement,
      quality: options.quality,
      threshold: options.threshold,
      holeFilling: options.holeFilling,
      artifactRemoval: options.artifactRemoval,
    });
    timings.refinementMs = Math.round(performance.now() - tRef0);

    // 5. Apply Alpha Mask & Defringe
    const tAlpha0 = performance.now();
    postProgress(id, {
      stage: 'applying-alpha',
      progress: 88,
      message: 'Applying alpha matte & decontaminating edges...',
      elapsedMs: Math.round(performance.now() - startTime),
    });

    const transparentImageData = applyAlphaMask(imageData, refinedMask, {
      defringe: options.defringe,
    });
    timings.alphaMs = Math.round(performance.now() - tAlpha0);

    // Construct raw and refined mask visual ImageData
    const refinedMaskImageData = maskToImageData(refinedMask, origW, origH);
    const rawMaskImageData = maskToImageData(
      inferenceResult.rawMask,
      inferenceResult.maskWidth,
      inferenceResult.maskHeight
    );

    timings.totalMs = Math.round(performance.now() - startTime);

    postProgress(id, {
      stage: 'complete',
      progress: 100,
      message: 'Worker pipeline completed.',
      elapsedMs: timings.totalMs,
    });

    const modelName = modelType === 'modnet' ? 'MODNet Portrait Matting (Apache-2.0)' : 'U²-Netp Universal Salient Object (Apache-2.0)';

    const successMsg: WorkerSuccessMessage = {
      type: 'success',
      id,
      transparentImageData,
      refinedMaskImageData,
      rawMaskImageData,
      timings,
      modelName,
    };

    // Transfer buffers for zero-copy performance
    (self as any).postMessage(successMsg, [
      transparentImageData.data.buffer,
      refinedMaskImageData.data.buffer,
      rawMaskImageData.data.buffer,
    ]);
  } catch (err: any) {
    const errorMsg: WorkerErrorMessage = {
      type: 'error',
      id,
      error: err?.message || String(err),
    };
    self.postMessage(errorMsg);
  }
};
