import { removeBackground, type Config } from '@imgly/background-removal';
import { loadImageFromBlob } from './canvasUtils';

export type SegmentationProgress = (key: string, current: number, total: number) => void;

export interface SegmentationResult {
  blob: Blob;
  url: string;
  method: 'imgly' | 'fallback';
}

let modelCached = false;

export function isModelCached(): boolean {
  return modelCached;
}

const baseConfig: Config = {
  model: 'small',
  device: 'cpu',
  proxyToWorker: false,
  output: { format: 'image/png', quality: 1 },
  publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/',
};

/**
 * Preload the AI model. On first call, downloads the model from CDN and
 * caches it in the browser (IndexedDB). Subsequent calls are instant.
 * Runs on the main thread with proxyToWorker: false to avoid Worker
 * transferable errors in sandboxed iframes (e.g. Bolt preview).
 */
export async function preloadModel(onProgress?: SegmentationProgress): Promise<void> {
  if (modelCached) return;
  const config: Config = {
    ...baseConfig,
    progress: (key: string, current: number, total: number) => {
      onProgress?.(key, current, total);
    },
  };
  // Actually run a tiny removeBackground on a 1x1 image to force model download
  const tinyCanvas = document.createElement('canvas');
  tinyCanvas.width = 4;
  tinyCanvas.height = 4;
  const ctx = tinyCanvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 4, 4);
  const tinyBlob = await new Promise<Blob>((res, rej) =>
    tinyCanvas.toBlob((b) => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/png')
  );
  await removeBackground(tinyBlob, config);
  modelCached = true;
}

/**
 * Remove the background from an image blob using the offline AI model.
 * Runs on the main thread (no custom Worker) to avoid transferable errors.
 * Falls back to a canvas-based color-difference method if the AI model fails.
 */
export async function removeBg(
  image: Blob,
  onProgress?: SegmentationProgress
): Promise<SegmentationResult> {
  // Convert File to Blob explicitly (fixes transferable type error)
  const blob = new Blob([await image.arrayBuffer()], { type: image.type || 'image/png' });

  const config: Config = {
    ...baseConfig,
    progress: (key: string, current: number, total: number) => {
      onProgress?.(key, current, total);
    },
  };

  try {
    const resultBlob = await removeBackground(blob, config);
    modelCached = true;
    const url = URL.createObjectURL(resultBlob);
    return { blob: resultBlob, url, method: 'imgly' };
  } catch (err) {
    // Fallback: try passing a URL string instead of blob
    try {
      const imgURL = URL.createObjectURL(blob);
      const resultBlob = await removeBackground(imgURL, config);
      URL.revokeObjectURL(imgURL);
      modelCached = true;
      const url = URL.createObjectURL(resultBlob);
      return { blob: resultBlob, url, method: 'imgly' };
    } catch {
      // Last resort: canvas-based color-difference fallback
      const fallbackBlob = await canvasColorDifferenceFallback(blob);
      const url = URL.createObjectURL(fallbackBlob);
      return { blob: fallbackBlob, url, method: 'fallback' };
    }
  }
}

/**
 * Canvas-based color-difference background removal fallback.
 * Samples corner colors as background, removes pixels close to those colors.
 */
async function canvasColorDifferenceFallback(blob: Blob): Promise<Blob> {
  const img = await loadImageFromBlob(blob);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);

  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  // Sample background colors from corners and edges
  const samplePoints = [
    [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],
    [Math.floor(w / 2), 0], [Math.floor(w / 2), h - 1],
    [0, Math.floor(h / 2)], [w - 1, Math.floor(h / 2)],
  ];

  const bgColors: number[][] = [];
  for (const [x, y] of samplePoints) {
    const idx = (y * w + x) * 4;
    bgColors.push([data[idx], data[idx + 1], data[idx + 2]]);
  }

  // Average background color
  const avgBg = bgColors.reduce(
    (acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]],
    [0, 0, 0]
  ).map((v) => v / bgColors.length);

  // Tolerance for color matching (adaptive)
  const tolerance = 60;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const dist = Math.sqrt(
      (r - avgBg[0]) ** 2 + (g - avgBg[1]) ** 2 + (b - avgBg[2]) ** 2
    );
    if (dist < tolerance) {
      data[i + 3] = 0; // Make transparent
    } else if (dist < tolerance * 1.5) {
      // Feather edges
      const alpha = Math.round(((dist - tolerance) / (tolerance * 0.5)) * 255);
      data[i + 3] = Math.min(255, Math.max(0, alpha));
    }
  }

  ctx.putImageData(imageData, 0, 0);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      'image/png',
      1
    );
  });
}

export function revokeResult(result: SegmentationResult): void {
  URL.revokeObjectURL(result.url);
}
