/**
 * AI Background Removal Engine
 * 
 * Completely standalone, modular, client-side AI Background Removal pipeline.
 * Powered by ONNX Runtime Web and permissive Apache 2.0 open segmentation models.
 * 
 * Zero server uploads required. 100% offline capable once assets are cached.
 * Designed for direct transplantation into any React + Vite + TypeScript + Capacitor project.
 * 
 * SPDX-License-Identifier: Apache-2.0
 */

export { removeBackground } from './engine';
export { getInferenceSession, clearSessionCache } from './segmentation';
export { decodeImage, imageDataToBlob } from './imageUtils';
export { refineMask } from './refineMask';
export { applyAlphaMask } from './alpha';
export { upsampleMaskBilinear, maskToImageData } from './mask';

export * from './types';

import { ModelMetadata, ModelType } from './types';
import { getInferenceSession, clearSessionCache } from './segmentation';

/**
 * Registry of fully vetted, commercially permissive open-source models
 */
export const SUPPORTED_MODELS: Record<ModelType, ModelMetadata> = {
  u2netp: {
    id: 'u2netp',
    name: 'U²-Netp (Universal Salient Object Detector)',
    source: 'https://github.com/xuebinqin/U-2-Net (republished via Heliosoph/u2net-onnx)',
    license: 'Apache-2.0',
    licenseUrl: 'https://www.apache.org/licenses/LICENSE-2.0',
    commercialUse: true,
    sizeBytes: 4574861, // ~4.4 MB
    inputResolution: [320, 320],
    description: 'Nested U-structure network for salient object segmentation. Highly compact (~4.5MB), fast inference (~30-60ms).',
    recommendedFor: 'People, products, e-commerce goods, animals, common objects, and complex backgrounds.',
  },
  modnet: {
    id: 'modnet',
    name: 'MODNet (Photorealistic Portrait Matting)',
    source: 'https://github.com/ZHKKKe/MODNet (republished via facefusion/models-3.5.0)',
    license: 'Apache-2.0',
    licenseUrl: 'https://www.apache.org/licenses/LICENSE-2.0',
    commercialUse: true,
    sizeBytes: 25901946, // ~24.7 MB
    inputResolution: [512, 512],
    description: 'Objective-matting network for real-time portrait matting with fine hair edge fidelity.',
    recommendedFor: 'Portraits, human figures, hair detail preservation, and profile photos.',
  },
};

/**
 * Proactively preloads an ONNX model into memory to eliminate cold-start delay
 */
export async function preloadModel(
  modelType: ModelType = 'u2netp',
  customUrl?: string,
  onProgress?: (progress: any) => void
): Promise<void> {
  await getInferenceSession(modelType, customUrl, onProgress);
}

/**
 * Clears cached models from memory
 */
export function clearModelCache(): void {
  clearSessionCache();
}
