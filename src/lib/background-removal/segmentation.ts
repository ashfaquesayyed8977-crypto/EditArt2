/**
 * Segmentation Module for Background Removal Pipeline
 * 
 * Manages ONNX Runtime Web session lifecycle, model loading,
 * inference execution, and raw output tensor extraction.
 * 
 * SPDX-License-Identifier: Apache-2.0
 */

import * as ort from 'onnxruntime-web/wasm';
import { ModelType, ProgressInfo } from './types';
import { LetterboxInfo } from './preprocess';

// Global cache for loaded InferenceSession instances to avoid reloading weights
const sessionCache = new Map<string, ort.InferenceSession>();
let envConfigured = false;
let wasmBinaryPromise: Promise<void> | null = null;
let mjsBlobUrl: string | null = null;
let mjsBlobPromise: Promise<string | null> | null = null;

async function getMjsBlobUrl(): Promise<string | null> {
  if (mjsBlobUrl) return mjsBlobUrl;
  if (!mjsBlobPromise) {
    mjsBlobPromise = (async () => {
      try {
        const resp = await fetch('/ort-wasm/ort-wasm-simd-threaded.mjs');
        if (resp.ok) {
          const text = await resp.text();
          if (!text.trim().startsWith('<!DOCTYPE') && !text.trim().startsWith('<html')) {
            const blob = new Blob([text], { type: 'application/javascript' });
            mjsBlobUrl = URL.createObjectURL(blob);
            return mjsBlobUrl;
          }
        }
      } catch (err) {
        console.warn('[BackgroundRemoval] Could not create mjs Blob URL:', err);
      }
      return null;
    })();
  }
  return mjsBlobPromise;
}

/**
 * Configure ONNX Runtime Web environment safely for Web, Workers, and Capacitor WebViews.
 * Explicitly pre-fetches the WebAssembly binary and assigns it to ort.env.wasm.wasmBinary
 * to prevent wasm streaming compile/fetch failures in sandboxed iframes.
 */
export async function configureOrtEnvironment(): Promise<void> {
  if (envConfigured) return;

  try {
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.proxy = false;

    const blobUrl = await getMjsBlobUrl();
    if (blobUrl) {
      ort.env.wasm.wasmPaths = {
        wasm: '/ort-wasm/ort-wasm-simd-threaded.wasm',
        mjs: blobUrl,
      };
    } else {
      ort.env.wasm.wasmPaths = {
        wasm: '/ort-wasm/ort-wasm-simd-threaded.wasm',
      };
    }

    if (!ort.env.wasm.wasmBinary) {
      if (!wasmBinaryPromise) {
        wasmBinaryPromise = (async () => {
          try {
            const resp = await fetch('/ort-wasm/ort-wasm-simd-threaded.wasm');
            const contentType = resp.headers.get('content-type') || '';
            // Only accept if response is OK and not an HTML SPA fallback
            if (resp.ok && !contentType.includes('text/html')) {
              const buffer = await resp.arrayBuffer();
              const bytes = new Uint8Array(buffer);
              // Verify WASM magic word: \0asm (0x00, 0x61, 0x73, 0x6d)
              if (
                bytes.length >= 4 &&
                bytes[0] === 0x00 &&
                bytes[1] === 0x61 &&
                bytes[2] === 0x73 &&
                bytes[3] === 0x6d
              ) {
                ort.env.wasm.wasmBinary = bytes;
              } else {
                console.warn(
                  '[BackgroundRemoval] Fetched file does not have WebAssembly magic header, falling back to wasmPaths'
                );
              }
            } else {
              console.warn(
                '[BackgroundRemoval] Failed to fetch valid WASM binary (status: ' +
                  resp.status +
                  ', type: ' +
                  contentType +
                  '), relying on wasmPaths'
              );
            }
          } catch (fetchErr) {
            console.warn('[BackgroundRemoval] Could not pre-fetch wasmBinary, relying on wasmPaths:', fetchErr);
          }
        })();
      }
      await wasmBinaryPromise;
    }

    envConfigured = true;
  } catch (err) {
    console.warn('[BackgroundRemoval] Could not fully configure ORT env:', err);
  }
}

/**
 * Returns the default model asset path for a model type
 */
export function getDefaultModelUrl(_modelType?: ModelType): string {
  return '/models/u2netp.onnx';
}

/**
 * Loads or retrieves a cached InferenceSession with progress reporting
 */
export async function getInferenceSession(
  modelType: ModelType = 'u2netp',
  customUrl?: string,
  onProgress?: (progress: ProgressInfo) => void,
  signal?: AbortSignal
): Promise<ort.InferenceSession> {
  await configureOrtEnvironment();

  const modelUrl = customUrl || getDefaultModelUrl(modelType);

  if (sessionCache.has(modelUrl)) {
    return sessionCache.get(modelUrl)!;
  }

  if (signal?.aborted) {
    throw new DOMException('Processing cancelled by user', 'AbortError');
  }

  onProgress?.({
    stage: 'loading-model',
    progress: 10,
    message: 'Fetching U²-Netp neural model weights...',
  });

  // Fetch model binary with streaming progress
  const response = await fetch(modelUrl, { signal });
  if (!response.ok) {
    throw new Error(`Failed to load ONNX model file from ${modelUrl} (HTTP ${response.status} ${response.statusText})`);
  }

  const contentLength = response.headers.get('content-length');
  const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

  let modelBuffer: ArrayBuffer;

  if (response.body && totalBytes > 0) {
    const reader = response.body.getReader();
    let receivedBytes = 0;
    const chunks: Uint8Array[] = [];

    while (true) {
      if (signal?.aborted) {
        reader.cancel();
        throw new DOMException('Processing cancelled by user', 'AbortError');
      }

      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      receivedBytes += value.length;

      const pct = Math.min(85, Math.round(10 + (receivedBytes / totalBytes) * 75));
      const mbReceived = (receivedBytes / (1024 * 1024)).toFixed(1);
      const mbTotal = (totalBytes / (1024 * 1024)).toFixed(1);

      onProgress?.({
        stage: 'loading-model',
        progress: pct,
        message: `Loading model: ${mbReceived}MB / ${mbTotal}MB (${pct}%)`,
      });
    }

    // Assemble complete ArrayBuffer
    const fullArray = new Uint8Array(receivedBytes);
    let offset = 0;
    for (const chunk of chunks) {
      fullArray.set(chunk, offset);
      offset += chunk.length;
    }
    modelBuffer = fullArray.buffer;
  } else {
    // Fallback if content-length or stream reader not available
    modelBuffer = await response.arrayBuffer();
  }

  if (signal?.aborted) {
    throw new DOMException('Processing cancelled by user', 'AbortError');
  }

  onProgress?.({
    stage: 'loading-model',
    progress: 90,
    message: 'Compiling neural network WebAssembly session...',
  });

  // Create session with WebAssembly execution provider
  const session = await ort.InferenceSession.create(modelBuffer, {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'all',
  });

  sessionCache.set(modelUrl, session);

  onProgress?.({
    stage: 'loading-model',
    progress: 100,
    message: 'Model initialized and ready.',
  });

  return session;
}

/**
 * Runs inference on the preprocessed tensor and extracts unpadded raw float32 mask
 */
export async function runInference(
  session: ort.InferenceSession,
  tensorData: Float32Array,
  dims: [number, number, number, number],
  letterbox: LetterboxInfo,
  modelType: ModelType,
  signal?: AbortSignal
): Promise<{ rawMask: Float32Array; maskWidth: number; maskHeight: number }> {
  if (signal?.aborted) {
    throw new DOMException('Processing cancelled by user', 'AbortError');
  }

  // Create input tensor
  const inputTensor = new ort.Tensor('float32', tensorData, dims);

  // Identify input name
  const inputName = session.inputNames[0] || (modelType === 'modnet' ? 'input' : 'input.1');
  const feeds: Record<string, ort.Tensor> = { [inputName]: inputTensor };

  const results = await session.run(feeds);

  if (signal?.aborted) {
    throw new DOMException('Processing cancelled by user', 'AbortError');
  }

  // Get primary output tensor
  // For U2Net, output is d0 (first output name); for MODNet, output name is 'output'
  const primaryOutputName = session.outputNames[0] || (modelType === 'modnet' ? 'output' : '1959');
  const outputTensor = results[primaryOutputName];

  if (!outputTensor) {
    throw new Error(`Inference did not return expected output tensor '${primaryOutputName}'`);
  }

  const outputData = outputTensor.data as Float32Array;
  const targetW = letterbox.targetWidth;

  // Normalize raw saliency values:
  // For U2Net, map values to [0, 1] range using min-max normalization if necessary
  let minVal = Infinity;
  let maxVal = -Infinity;

  for (let i = 0; i < outputData.length; i++) {
    const v = outputData[i];
    if (v < minVal) minVal = v;
    if (v > maxVal) maxVal = v;
  }

  const range = maxVal - minVal;
  const needsMinMax = modelType === 'u2netp' && (minVal < 0 || maxVal > 1.05 || range > 1.2);

  // Crop / unpad letterboxed area back to the image aspect ratio
  const { padLeft, padTop, scaledWidth, scaledHeight } = letterbox;
  const unpaddedMask = new Float32Array(scaledWidth * scaledHeight);

  for (let y = 0; y < scaledHeight; y++) {
    const srcY = padTop + y;
    for (let x = 0; x < scaledWidth; x++) {
      const srcX = padLeft + x;
      const srcIdx = srcY * targetW + srcX;
      let val = outputData[srcIdx];

      if (needsMinMax && range > 1e-6) {
        val = (val - minVal) / range;
      }

      // Clamp to [0, 1]
      if (val < 0) val = 0;
      else if (val > 1) val = 1;

      unpaddedMask[y * scaledWidth + x] = val;
    }
  }

  return {
    rawMask: unpaddedMask,
    maskWidth: scaledWidth,
    maskHeight: scaledHeight,
  };
}

/**
 * Clears the session cache to free memory
 */
export function clearSessionCache(): void {
  sessionCache.clear();
}
