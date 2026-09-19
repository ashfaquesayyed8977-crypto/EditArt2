/**
 * Mask Refinement Module for Background Removal Pipeline
 * 
 * Provides edge refinement, anti-aliasing smoothstep curve,
 * hole filling, small artifact removal, and trimap feathering.
 * 
 * SPDX-License-Identifier: Apache-2.0
 */

import { EdgeRefinement, QualityMode } from './types';

export interface RefineMaskOptions {
  edgeRefinement?: EdgeRefinement;
  quality?: QualityMode;
  threshold?: number;
  holeFilling?: boolean;
  artifactRemoval?: boolean;
}

/**
 * Mathematical smoothstep function for organic, anti-aliased edge transitions
 */
function smoothstep(min: number, max: number, value: number): number {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

/**
 * Refines a full-resolution Float32Array mask
 */
export function refineMask(
  rawMask: Float32Array,
  width: number,
  height: number,
  options: RefineMaskOptions = {}
): Float32Array {
  const {
    edgeRefinement = 'standard',
    threshold = 0.5,
    holeFilling = true,
    artifactRemoval = true,
  } = options;

  let currentMask: Float32Array = new Float32Array(width * height);
  currentMask.set(rawMask);

  // Determine transition window for smoothstep anti-aliasing
  // Standard: 0.15 window for natural soft anti-aliased boundary
  // Strong: 0.25 window for hair/fur strands and organic contours
  // Off: 0.05 window for crisp sharp edges
  const windowWidth =
    edgeRefinement === 'strong' ? 0.25 :
    edgeRefinement === 'off' ? 0.05 : 0.15;

  const lowBound = Math.max(0.01, threshold - windowWidth);
  const highBound = Math.min(0.99, threshold + windowWidth);

  // 1. Anti-aliasing smoothstep transition pass
  const totalPixels = width * height;
  for (let i = 0; i < totalPixels; i++) {
    const v = currentMask[i];
    if (v <= lowBound) {
      currentMask[i] = 0.0;
    } else if (v >= highBound) {
      currentMask[i] = 1.0;
    } else {
      currentMask[i] = smoothstep(lowBound, highBound, v);
    }
  }

  // 2. Morphological cleanup: remove small isolated background speckles (artifact removal)
  if (artifactRemoval) {
    currentMask = removeSmallArtifacts(currentMask, width, height);
  }

  // 3. Hole filling: fill small pinholes in solid foreground objects
  if (holeFilling) {
    currentMask = fillPinholeGaps(currentMask, width, height);
  }

  // 4. Edge-guided feathering on trimap transition boundary (0.0 < alpha < 1.0)
  if (edgeRefinement !== 'off') {
    const radius = edgeRefinement === 'strong' ? 2 : 1;
    currentMask = featherEdgeTransition(currentMask, width, height, radius);
  }

  return currentMask;
}

/**
 * Removes isolated high-frequency speckles in the background using morphological opening
 */
function removeSmallArtifacts(
  mask: Float32Array,
  w: number,
  h: number
): Float32Array {
  const eroded = new Float32Array(w * h);

  // Erosion pass on near-background pixels
  for (let y = 1; y < h - 1; y++) {
    const row = y * w;
    for (let x = 1; x < w - 1; x++) {
      const idx = row + x;
      const v = mask[idx];

      if (v < 0.8) {
        // Find minimum in 3x3 neighborhood
        let minNeighbor = v;
        for (let dy = -1; dy <= 1; dy++) {
          const nRow = (y + dy) * w;
          for (let dx = -1; dx <= 1; dx++) {
            const nv = mask[nRow + x + dx];
            if (nv < minNeighbor) minNeighbor = nv;
          }
        }
        eroded[idx] = minNeighbor;
      } else {
        eroded[idx] = v;
      }
    }
  }

  // Dilation pass back to restore boundary
  const restored = new Float32Array(w * h);
  restored.set(eroded);
  for (let y = 1; y < h - 1; y++) {
    const row = y * w;
    for (let x = 1; x < w - 1; x++) {
      const idx = row + x;
      const v = eroded[idx];

      if (v > 0.0 && v < 0.8) {
        let maxNeighbor = v;
        for (let dy = -1; dy <= 1; dy++) {
          const nRow = (y + dy) * w;
          for (let dx = -1; dx <= 1; dx++) {
            const nv = eroded[nRow + x + dx];
            if (nv > maxNeighbor) maxNeighbor = nv;
          }
        }
        restored[idx] = Math.min(mask[idx], maxNeighbor);
      }
    }
  }

  return restored;
}

/**
 * Fills small dark pinholes surrounded by solid foreground (morphological closing)
 */
function fillPinholeGaps(
  mask: Float32Array,
  w: number,
  h: number
): Float32Array {
  const dilated = new Float32Array(w * h);

  // Dilation pass on internal holes
  for (let y = 1; y < h - 1; y++) {
    const row = y * w;
    for (let x = 1; x < w - 1; x++) {
      const idx = row + x;
      const v = mask[idx];

      if (v > 0.2 && v < 0.99) {
        let maxNeighbor = v;
        for (let dy = -1; dy <= 1; dy++) {
          const nRow = (y + dy) * w;
          for (let dx = -1; dx <= 1; dx++) {
            const nv = mask[nRow + x + dx];
            if (nv > maxNeighbor) maxNeighbor = nv;
          }
        }
        dilated[idx] = maxNeighbor;
      } else {
        dilated[idx] = v;
      }
    }
  }

  // Erosion pass
  const closed = new Float32Array(w * h);
  closed.set(dilated);
  for (let y = 1; y < h - 1; y++) {
    const row = y * w;
    for (let x = 1; x < w - 1; x++) {
      const idx = row + x;
      const v = dilated[idx];

      if (v > 0.2 && v < 0.99) {
        let minNeighbor = v;
        for (let dy = -1; dy <= 1; dy++) {
          const nRow = (y + dy) * w;
          for (let dx = -1; dx <= 1; dx++) {
            const nv = dilated[nRow + x + dx];
            if (nv < minNeighbor) minNeighbor = nv;
          }
        }
        closed[idx] = Math.max(mask[idx], minNeighbor);
      }
    }
  }

  return closed;
}

/**
 * Localized boundary feathering on semi-transparent transition pixels
 */
function featherEdgeTransition(
  mask: Float32Array,
  w: number,
  h: number,
  radius: number
): Float32Array {
  const result = new Float32Array(w * h);
  result.set(mask);

  for (let y = radius; y < h - radius; y++) {
    const row = y * w;
    for (let x = radius; x < w - radius; x++) {
      const idx = row + x;
      const val = mask[idx];

      // Only feather boundary pixels (0.01 to 0.99)
      if (val > 0.01 && val < 0.99) {
        let sum = 0;
        let count = 0;

        for (let dy = -radius; dy <= radius; dy++) {
          const nRow = (y + dy) * w;
          for (let dx = -radius; dx <= radius; dx++) {
            sum += mask[nRow + x + dx];
            count++;
          }
        }

        result[idx] = sum / count;
      }
    }
  }

  return result;
}
