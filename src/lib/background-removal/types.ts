/**
 * AI Background Removal Engine - Types & Interfaces
 * 
 * Standalone, modular TypeScript definitions for client-side background removal.
 * Designed for cross-platform integration (Web, Vite, Capacitor/Android/iOS).
 * 
 * SPDX-License-Identifier: Apache-2.0
 */

export type QualityMode = 'fast' | 'balanced' | 'high';

export type EdgeRefinement = 'off' | 'standard' | 'strong';

export type ModelType = 'u2netp' | 'modnet';

export interface ModelMetadata {
  id: ModelType;
  name: string;
  source: string;
  license: string;
  licenseUrl: string;
  commercialUse: boolean;
  sizeBytes: number;
  inputResolution: [number, number];
  description: string;
  recommendedFor: string;
}

export interface BackgroundRemovalOptions {
  /**
   * Quality preset controlling input dimensions and refinement passes
   * Default: 'balanced'
   */
  quality?: QualityMode;

  /**
   * Level of boundary smoothing and feathering
   * Default: 'standard'
   */
  edgeRefinement?: EdgeRefinement;

  /**
   * Underlying segmentation model to use
   * Default: 'u2netp' (universal, fast, 4.5 MB, Apache-2.0)
   */
  model?: ModelType;

  /**
   * Optional custom URL or path to the ONNX model file
   */
  modelUrl?: string;

  /**
   * Keep original image resolution in output PNG
   * Default: true
   */
  preserveResolution?: boolean;

  /**
   * Optional maximum width/height dimension to cap memory usage on low-end devices
   */
  maxDimension?: number;

  /**
   * Fill small pinhole gaps in solid foreground objects
   * Default: true
   */
  holeFilling?: boolean;

  /**
   * Eliminate small stray speckles in the background
   * Default: true
   */
  artifactRemoval?: boolean;

  /**
   * Remove edge color contamination / background bleed around hair and edges (halo removal)
   * Default: true
   */
  defringe?: boolean;

  /**
   * Saliency threshold between 0.0 and 1.0
   * Default: 0.5
   */
  threshold?: number;

  /**
   * AbortSignal for user cancellation
   */
  signal?: AbortSignal;

  /**
   * Callback for progress updates across pipeline phases
   */
  onProgress?: (progress: ProgressInfo) => void;

  /**
   * Prefer running inference and refinement inside a Web Worker
   * Default: true (with automatic fallback to in-thread if workers are unavailable)
   */
  useWorker?: boolean;
}

export type PipelineStage =
  | 'idle'
  | 'init'
  | 'loading-model'
  | 'preprocessing'
  | 'segmenting'
  | 'refining'
  | 'applying-alpha'
  | 'encoding'
  | 'complete'
  | 'cancelled'
  | 'error';

export interface ProgressInfo {
  stage: PipelineStage;
  progress: number; // 0 - 100
  message: string;
  elapsedMs?: number;
}

export interface PipelineTimings {
  decodeMs: number;
  preprocessMs: number;
  inferenceMs: number;
  refinementMs: number;
  alphaMs: number;
  encodeMs: number;
  totalMs: number;
}

export interface BackgroundRemovalResult {
  /**
   * The transparent output PNG as a binary Blob
   */
  transparentBlob: Blob;

  /**
   * Blob object URL for immediate <img> display.
   * Call `cleanup()` or revokeObjectURL when no longer needed.
   */
  transparentImageURL: string;

  /**
   * Full-resolution binary/grayscale alpha mask as ImageData
   */
  mask: ImageData;

  /**
   * Blob URL of the refined grayscale mask (useful for preview & debug)
   */
  maskImageURL: string;

  /**
   * Blob URL of the raw model segmentation mask before refinement
   */
  rawMaskImageURL: string;

  /**
   * Output width in pixels
   */
  width: number;

  /**
   * Output height in pixels
   */
  height: number;

  /**
   * Total pipeline processing time in milliseconds
   */
  processingTime: number;

  /**
   * Detailed breakdown of execution time across stages
   */
  timings: PipelineTimings;

  /**
   * Name and version of the model used
   */
  modelName: string;

  /**
   * Revokes all generated object URLs to free memory
   */
  cleanup: () => void;
}

export type ImageSource =
  | File
  | Blob
  | HTMLImageElement
  | ImageBitmap
  | ImageData
  | string; // Data URL or HTTP URL

// Worker message protocol
export interface WorkerRequestPayload {
  id: string;
  imageData: ImageData;
  options: {
    quality: QualityMode;
    edgeRefinement: EdgeRefinement;
    model: ModelType;
    modelUrl?: string;
    preserveResolution: boolean;
    maxDimension?: number;
    holeFilling: boolean;
    artifactRemoval: boolean;
    defringe: boolean;
    threshold: number;
  };
}

export interface WorkerProgressMessage {
  type: 'progress';
  id: string;
  data: ProgressInfo;
}

export interface WorkerSuccessMessage {
  type: 'success';
  id: string;
  transparentImageData: ImageData;
  refinedMaskImageData: ImageData;
  rawMaskImageData: ImageData;
  timings: PipelineTimings;
  modelName: string;
}

export interface WorkerErrorMessage {
  type: 'error';
  id: string;
  error: string;
}

export type WorkerMessage =
  | WorkerProgressMessage
  | WorkerSuccessMessage
  | WorkerErrorMessage;
