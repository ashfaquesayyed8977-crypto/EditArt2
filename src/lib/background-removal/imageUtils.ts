/**
 * Image Utilities for Background Removal Pipeline
 * 
 * Cross-platform image decoding, canvas manipulation, and buffer conversion.
 * Safe for browser main thread, Web Workers, and Capacitor WebViews.
 * 
 * SPDX-License-Identifier: Apache-2.0
 */

import { ImageSource } from './types';

/**
 * Decodes any supported ImageSource into an ImageData object and original pixel dimensions.
 */
export async function decodeImage(
  source: ImageSource,
  maxDimension?: number
): Promise<{ imageData: ImageData; width: number; height: number; originalWidth: number; originalHeight: number }> {
  let imgBitmap: ImageBitmap | null = null;
  let canvas: HTMLCanvasElement | OffscreenCanvas | null = null;
  let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;

  try {
    if (source instanceof ImageData) {
      return {
        imageData: source,
        width: source.width,
        height: source.height,
        originalWidth: source.width,
        originalHeight: source.height,
      };
    }

    if (source instanceof ImageBitmap) {
      imgBitmap = source;
    } else if (typeof createImageBitmap === 'function' && !(source instanceof HTMLImageElement)) {
      // Fast path using createImageBitmap (supported in both Workers and Window)
      // Wrapped in try/catch to gracefully handle formats or environments (e.g. iframes/sandboxes)
      // where createImageBitmap throws "The source image could not be decoded."
      try {
        if (source instanceof Blob) {
          imgBitmap = await createImageBitmap(source);
        } else if (typeof source === 'string') {
          const res = await fetch(source);
          const blob = await res.blob();
          imgBitmap = await createImageBitmap(blob);
        }
      } catch (bitmapErr) {
        console.warn('[imageUtils] createImageBitmap could not decode source, falling back to HTMLImageElement:', bitmapErr);
        imgBitmap = null;
      }
    }

    if (!imgBitmap) {
      // Fallback path using HTMLImageElement (for Window thread or HTMLImageElement input)
      const img = await loadImageElement(source);
      const originalWidth = img.naturalWidth || img.width;
      const originalHeight = img.naturalHeight || img.height;

      if (!originalWidth || !originalHeight) {
        throw new Error('Loaded image has invalid dimensions (0x0).');
      }

      let targetWidth = originalWidth;
      let targetHeight = originalHeight;

      if (maxDimension && (targetWidth > maxDimension || targetHeight > maxDimension)) {
        if (targetWidth > targetHeight) {
          targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
          targetWidth = maxDimension;
        } else {
          targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
          targetHeight = maxDimension;
        }
      }

      const c = document.createElement('canvas');
      c.width = targetWidth;
      c.height = targetHeight;
      const cCtx = c.getContext('2d', { willReadFrequently: true });
      if (!cCtx) throw new Error('Failed to acquire 2D canvas context');

      cCtx.drawImage(img, 0, 0, targetWidth, targetHeight);
      const data = cCtx.getImageData(0, 0, targetWidth, targetHeight);

      return {
        imageData: data,
        width: targetWidth,
        height: targetHeight,
        originalWidth,
        originalHeight,
      };
    }

    const originalWidth = imgBitmap.width;
    const originalHeight = imgBitmap.height;

    let targetWidth = originalWidth;
    let targetHeight = originalHeight;

    if (maxDimension && (targetWidth > maxDimension || targetHeight > maxDimension)) {
      if (targetWidth > targetHeight) {
        targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
        targetWidth = maxDimension;
      } else {
        targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
        targetHeight = maxDimension;
      }
    }

    if (typeof OffscreenCanvas !== 'undefined') {
      canvas = new OffscreenCanvas(targetWidth, targetHeight);
      ctx = canvas.getContext('2d', { willReadFrequently: true });
    } else if (typeof document !== 'undefined') {
      canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      ctx = canvas.getContext('2d', { willReadFrequently: true });
    }

    if (!ctx) throw new Error('Canvas 2D context is not supported in this runtime');

    ctx.drawImage(imgBitmap, 0, 0, targetWidth, targetHeight);
    const data = ctx.getImageData(0, 0, targetWidth, targetHeight);

    return {
      imageData: data,
      width: targetWidth,
      height: targetHeight,
      originalWidth,
      originalHeight,
    };
  } finally {
    // If we created a temporary ImageBitmap and it's not the user's input, close it
    if (imgBitmap && source !== imgBitmap && typeof imgBitmap.close === 'function') {
      imgBitmap.close();
    }
  }
}

/**
 * Helper to convert Blob to Data URL via FileReader for cross-origin / sandboxed resilience
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image Blob as Data URL'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Helper to safely load an HTMLImageElement from various sources
 */
function loadImageElement(source: ImageSource): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (typeof Image === 'undefined') {
      reject(new Error('HTMLImageElement is not available in WebWorker context. Use Blob or ImageData.'));
      return;
    }

    if (source instanceof HTMLImageElement) {
      if (source.complete && source.naturalWidth > 0) {
        resolve(source);
      } else {
        source.onload = () => resolve(source);
        source.onerror = () => reject(new Error('Failed to load image element'));
      }
      return;
    }

    const img = new Image();

    // Only set crossOrigin for remote HTTP/HTTPS URLs.
    // Setting crossOrigin on blob: or data: URLs can trigger security/CORS failures in sandboxed iframes.
    if (typeof source === 'string' && /^https?:\/\//i.test(source)) {
      img.crossOrigin = 'anonymous';
    }

    let objectUrlToRevoke: string | null = null;

    const cleanup = () => {
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
        objectUrlToRevoke = null;
      }
    };

    img.onload = () => {
      cleanup();
      resolve(img);
    };

    img.onerror = async (err) => {
      cleanup();
      // If object URL failed and source is a Blob, fallback to FileReader Data URL
      if (source instanceof Blob) {
        try {
          const dataUrl = await blobToDataUrl(source);
          const fallbackImg = new Image();
          fallbackImg.onload = () => resolve(fallbackImg);
          fallbackImg.onerror = () => reject(new Error('Failed to decode image from Blob data'));
          fallbackImg.src = dataUrl;
          return;
        } catch (e) {
          // fall through
        }
      }
      reject(new Error('Failed to decode image from source: ' + (err as any)?.message || 'Invalid image format'));
    };

    if (source instanceof Blob) {
      try {
        objectUrlToRevoke = URL.createObjectURL(source);
        img.src = objectUrlToRevoke;
      } catch {
        // In sandboxed environments where URL.createObjectURL is restricted, use FileReader
        blobToDataUrl(source)
          .then((dataUrl) => {
            img.src = dataUrl;
          })
          .catch(reject);
      }
    } else if (typeof source === 'string') {
      img.src = source;
    } else {
      reject(new Error('Unsupported source format for HTMLImageElement'));
    }
  });
}

/**
 * Converts ImageData to a PNG Blob in both Window and WebWorker environments
 */
export async function imageDataToBlob(imageData: ImageData): Promise<Blob> {
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(imageData.width, imageData.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get OffscreenCanvas 2D context');
    ctx.putImageData(imageData, 0, 0);
    return await canvas.convertToBlob({ type: 'image/png' });
  }

  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get Canvas 2D context');
    ctx.putImageData(imageData, 0, 0);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to serialize canvas to PNG Blob'));
      }, 'image/png');
    });
  }

  throw new Error('Neither OffscreenCanvas nor document Canvas is supported in this environment');
}

/**
 * Creates an ImageData object safely across environments
 */
export function createImageData(width: number, height: number): ImageData {
  if (typeof ImageData !== 'undefined') {
    return new ImageData(width, height);
  }
  const clamped = new Uint8ClampedArray(width * height * 4);
  return {
    data: clamped,
    width,
    height,
    colorSpace: 'srgb',
  } as ImageData;
}
