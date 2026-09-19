/**
 * Core Background Removal Engine
 * 
 * High-level orchestration of image decoding, Web Worker execution,
 * seamless in-thread fallback, AbortController cancellation,
 * and result assembly.
 * 
 * Completely decoupled from React and UI layers.
 * 
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ImageSource,
  BackgroundRemovalOptions,
  BackgroundRemovalResult,
  PipelineTimings,
  ProgressInfo,
  WorkerMessage,
  WorkerRequestPayload,
} from './types';
import { decodeImage, imageDataToBlob } from './imageUtils';
import { preprocessImage } from './preprocess';
import { getInferenceSession, runInference } from './segmentation';
import { upsampleMaskBilinear, maskToImageData } from './mask';
import { refineMask } from './refineMask';
import { applyAlphaMask } from './alpha';

// Module-level worker instance to reuse worker across sequential requests
let sharedWorker: Worker | null = null;
let workerUnavailable = false;

function getWorker(): Worker | null {
  if (workerUnavailable || typeof Worker === 'undefined') {
    return null;
  }
  if (!sharedWorker) {
    try {
      sharedWorker = new Worker(
        new URL('../../workers/backgroundRemoval.worker.ts', import.meta.url),
        { type: 'module' }
      );
    } catch (e) {
      console.warn('[BackgroundRemoval] Could not instantiate Web Worker, using in-thread pipeline:', e);
      workerUnavailable = true;
      return null;
    }
  }
  return sharedWorker;
}

/**
 * Main public entry point: Removes background from an image.
 * 
 * @param source - File, Blob, HTMLImageElement, ImageBitmap, ImageData, or URL
 * @param options - Configuration options for quality, model, edge refinement, progress, and cancellation
 * @returns Promise resolving to the complete BackgroundRemovalResult
 */
export async function removeBackground(
  source: ImageSource,
  options: BackgroundRemovalOptions = {}
): Promise<BackgroundRemovalResult> {
  const {
    quality = 'balanced',
    edgeRefinement = 'standard',
    model = 'u2netp',
    modelUrl,
    preserveResolution = true,
    maxDimension,
    holeFilling = true,
    artifactRemoval = true,
    defringe = true,
    threshold = 0.5,
    signal,
    onProgress,
    useWorker = true,
  } = options;

  const startTime = performance.now();

  const reportProgress = (info: ProgressInfo) => {
    onProgress?.({
      ...info,
      elapsedMs: Math.round(performance.now() - startTime),
    });
  };

  reportProgress({
    stage: 'init',
    progress: 0,
    message: 'Initializing background removal pipeline...',
  });

  if (signal?.aborted) {
    throw new DOMException('Processing cancelled by user', 'AbortError');
  }

  // 1. Image Decode
  const tDec0 = performance.now();
  reportProgress({
    stage: 'preprocessing',
    progress: 5,
    message: 'Decoding original image data...',
  });

  const effectiveMaxDim = preserveResolution ? maxDimension : (maxDimension || 1920);
  const decoded = await decodeImage(source, effectiveMaxDim);
  const decodeMs = Math.round(performance.now() - tDec0);

  if (signal?.aborted) {
    throw new DOMException('Processing cancelled by user', 'AbortError');
  }

  const origW = decoded.width;
  const origH = decoded.height;

  const modelName = model === 'modnet'
    ? 'MODNet Portrait Matting (Apache-2.0)'
    : 'U²-Netp Universal Salient Object (Apache-2.0)';

  const worker = useWorker ? getWorker() : null;

  if (worker) {
    try {
      return await executeInWorker(
        worker,
        decoded.imageData,
        {
          quality,
          edgeRefinement,
          model,
          modelUrl,
          preserveResolution,
          maxDimension: effectiveMaxDim,
          holeFilling,
          artifactRemoval,
          defringe,
          threshold,
        },
        decodeMs,
        startTime,
        reportProgress,
        signal
      );
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw err;
      }
      console.warn('[BackgroundRemoval] Worker execution failed, falling back to in-thread processing:', err);
      // Fall through to in-thread execution
    }
  }

  // In-Thread Execution (fallback for non-worker environments or Capacitor WebViews)
  return await executeInThread(
    decoded.imageData,
    {
      quality,
      edgeRefinement,
      model,
      modelUrl,
      holeFilling,
      artifactRemoval,
      defringe,
      threshold,
    },
    decodeMs,
    startTime,
    reportProgress,
    signal,
    modelName
  );
}

/**
 * Executes the pipeline in a Web Worker
 */
function executeInWorker(
  worker: Worker,
  imageData: ImageData,
  options: any,
  decodeMs: number,
  startTime: number,
  reportProgress: (info: ProgressInfo) => void,
  signal?: AbortSignal
): Promise<BackgroundRemovalResult> {
  return new Promise<BackgroundRemovalResult>((resolve, reject) => {
    const reqId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const onAbort = () => {
      // Re-spawn worker to safely discard current running inference
      try {
        worker.terminate();
        sharedWorker = null;
      } catch {}
      reject(new DOMException('Processing cancelled by user', 'AbortError'));
    };

    if (signal) {
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener('abort', onAbort, { once: true });
    }

    const messageHandler = async (e: MessageEvent<WorkerMessage>) => {
      const msg = e.data;
      if (!msg || msg.id !== reqId) return;

      if (msg.type === 'progress') {
        reportProgress(msg.data);
      } else if (msg.type === 'error') {
        cleanupListeners();
        reject(new Error(msg.error));
      } else if (msg.type === 'success') {
        cleanupListeners();
        try {
          reportProgress({
            stage: 'encoding',
            progress: 92,
            message: 'Encoding final transparent PNG blob...',
          });

          const tEnc0 = performance.now();
          const transparentBlob = await imageDataToBlob(msg.transparentImageData);
          const maskBlob = await imageDataToBlob(msg.refinedMaskImageData);
          const rawMaskBlob = await imageDataToBlob(msg.rawMaskImageData);
          const encodeMs = Math.round(performance.now() - tEnc0);

          const transparentImageURL = URL.createObjectURL(transparentBlob);
          const maskImageURL = URL.createObjectURL(maskBlob);
          const rawMaskImageURL = URL.createObjectURL(rawMaskBlob);

          const objectUrls = [transparentImageURL, maskImageURL, rawMaskImageURL];

          const totalMs = Math.round(performance.now() - startTime);
          const timings: PipelineTimings = {
            ...msg.timings,
            decodeMs,
            encodeMs,
            totalMs,
          };

          reportProgress({
            stage: 'complete',
            progress: 100,
            message: 'Background removal completed successfully.',
          });

          resolve({
            transparentBlob,
            transparentImageURL,
            mask: msg.refinedMaskImageData,
            maskImageURL,
            rawMaskImageURL,
            width: msg.transparentImageData.width,
            height: msg.transparentImageData.height,
            processingTime: totalMs,
            timings,
            modelName: msg.modelName,
            cleanup: () => {
              for (const url of objectUrls) {
                try {
                  URL.revokeObjectURL(url);
                } catch {}
              }
            },
          });
        } catch (encErr) {
          reject(encErr);
        }
      }
    };

    const cleanupListeners = () => {
      worker.removeEventListener('message', messageHandler);
      if (signal) {
        signal.removeEventListener('abort', onAbort);
      }
    };

    worker.addEventListener('message', messageHandler);

    // Send payload to worker
    const payload: WorkerRequestPayload = {
      id: reqId,
      imageData,
      options,
    };

    worker.postMessage(payload);
  });
}

/**
 * Executes the pipeline in the main thread (fallback)
 */
async function executeInThread(
  imageData: ImageData,
  options: any,
  decodeMs: number,
  startTime: number,
  reportProgress: (info: ProgressInfo) => void,
  signal: AbortSignal | undefined,
  modelName: string
): Promise<BackgroundRemovalResult> {
  const origW = imageData.width;
  const origH = imageData.height;

  // 1. Model Session
  reportProgress({
    stage: 'loading-model',
    progress: 15,
    message: 'Initializing neural segmentation session...',
  });

  const session = await getInferenceSession(
    options.model,
    options.modelUrl,
    reportProgress,
    signal
  );

  // 2. Preprocessing
  const tPre0 = performance.now();
  reportProgress({
    stage: 'preprocessing',
    progress: 40,
    message: 'Resizing and normalizing image tensor...',
  });

  const preprocessed = preprocessImage(imageData, options.model, true);
  const preprocessMs = Math.round(performance.now() - tPre0);

  if (signal?.aborted) {
    throw new DOMException('Processing cancelled by user', 'AbortError');
  }

  // 3. Inference
  const tInf0 = performance.now();
  reportProgress({
    stage: 'segmenting',
    progress: 55,
    message: 'Computing foreground saliency mask...',
  });

  const inferenceResult = await runInference(
    session,
    preprocessed.tensorData,
    preprocessed.dims,
    preprocessed.letterbox,
    options.model,
    signal
  );
  const inferenceMs = Math.round(performance.now() - tInf0);

  if (signal?.aborted) {
    throw new DOMException('Processing cancelled by user', 'AbortError');
  }

  // 4. Bilinear Upsampling & Refinement
  const tRef0 = performance.now();
  reportProgress({
    stage: 'refining',
    progress: 75,
    message: 'Upsampling mask & anti-aliasing edges...',
  });

  const fullResRawMask = upsampleMaskBilinear(
    inferenceResult.rawMask,
    inferenceResult.maskWidth,
    inferenceResult.maskHeight,
    origW,
    origH
  );

  const refinedMask = refineMask(fullResRawMask, origW, origH, {
    edgeRefinement: options.edgeRefinement,
    quality: options.quality,
    threshold: options.threshold,
    holeFilling: options.holeFilling,
    artifactRemoval: options.artifactRemoval,
  });
  const refinementMs = Math.round(performance.now() - tRef0);

  if (signal?.aborted) {
    throw new DOMException('Processing cancelled by user', 'AbortError');
  }

  // 5. Apply Alpha & Defringe
  const tAlpha0 = performance.now();
  reportProgress({
    stage: 'applying-alpha',
    progress: 88,
    message: 'Applying alpha transparency and removing halo bleed...',
  });

  const transparentImageData = applyAlphaMask(imageData, refinedMask, {
    defringe: options.defringe,
  });
  const alphaMs = Math.round(performance.now() - tAlpha0);

  // 6. Encoding
  reportProgress({
    stage: 'encoding',
    progress: 94,
    message: 'Generating transparent PNG output...',
  });

  const tEnc0 = performance.now();
  const refinedMaskImageData = maskToImageData(refinedMask, origW, origH);
  const rawMaskImageData = maskToImageData(
    inferenceResult.rawMask,
    inferenceResult.maskWidth,
    inferenceResult.maskHeight
  );

  const transparentBlob = await imageDataToBlob(transparentImageData);
  const maskBlob = await imageDataToBlob(refinedMaskImageData);
  const rawMaskBlob = await imageDataToBlob(rawMaskImageData);
  const encodeMs = Math.round(performance.now() - tEnc0);

  const transparentImageURL = URL.createObjectURL(transparentBlob);
  const maskImageURL = URL.createObjectURL(maskBlob);
  const rawMaskImageURL = URL.createObjectURL(rawMaskBlob);

  const objectUrls = [transparentImageURL, maskImageURL, rawMaskImageURL];
  const totalMs = Math.round(performance.now() - startTime);

  reportProgress({
    stage: 'complete',
    progress: 100,
    message: 'Background removal completed successfully.',
  });

  return {
    transparentBlob,
    transparentImageURL,
    mask: refinedMaskImageData,
    maskImageURL,
    rawMaskImageURL,
    width: origW,
    height: origH,
    processingTime: totalMs,
    timings: {
      decodeMs,
      preprocessMs,
      inferenceMs,
      refinementMs,
      alphaMs,
      encodeMs,
      totalMs,
    },
    modelName,
    cleanup: () => {
      for (const url of objectUrls) {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      }
    },
  };
}
