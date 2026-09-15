import { loadImageFromBlob, canvasToBlob } from './canvasUtils';

export type EnhanceMode = 'auto' | 'more' | 'hd';

export interface EnhanceOptions {
  mode: EnhanceMode;
  intensity?: number;
  signal?: AbortSignal;
}

export interface EnhanceResult {
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

export class EnhanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnhanceError';
  }
}

export const ENHANCE_MODES: { id: EnhanceMode; label: string; description: string }[] = [
  { id: 'auto', label: 'Auto Enhance', description: 'One-tap full pipeline' },
  { id: 'hd', label: 'HD Ultra', description: '4x Ultra HD upscaling — best quality' },
];

interface PipelineParams {
  contrastBoost: number;
  saturationBoost: number;
  vibranceBoost: number;
  dehazeAmount: number;
  shadowLift: number;
  highlightReduce: number;
  sharpenAmount: number;
  sharpenRadius: number;
  denoiseAmount: number;
}

function getParams(mode: EnhanceMode, intensity: number): PipelineParams {
  const i = intensity / 100;
  const hd = mode === 'hd';

  return {
    contrastBoost: (0.15 + (hd ? 0.10 : 0)) * i,
    saturationBoost: (0.25 + (hd ? 0.10 : 0)) * i,
    vibranceBoost: 0.20 * i,
    dehazeAmount: (0.30 + (hd ? 0.05 : 0)) * i,
    shadowLift: 0.35 * i,
    highlightReduce: 0.25 * i,
    sharpenAmount: (1.5 + (hd ? 0.30 : 0)) * i,
    sharpenRadius: 1.5,
    denoiseAmount: 0.15 * i,
  };
}

function clamp(v: number, min = 0, max = 255): number {
  return v < min ? min : v > max ? max : v;
}

function autoWhiteBalance(data: Uint8ClampedArray, len: number): void {
  let rSum = 0, gSum = 0, bSum = 0;
  for (let i = 0; i < len; i += 4) {
    rSum += data[i];
    gSum += data[i + 1];
    bSum += data[i + 2];
  }
  const count = len / 4;
  const avgR = rSum / count;
  const avgG = gSum / count;
  const avgB = bSum / count;
  const gray = (avgR + avgG + avgB) / 3;
  if (gray < 1) return;
  const rGain = gray / avgR;
  const gGain = gray / avgG;
  const bGain = gray / avgB;
  for (let i = 0; i < len; i += 4) {
    data[i] = clamp(data[i] * rGain);
    data[i + 1] = clamp(data[i + 1] * gGain);
    data[i + 2] = clamp(data[i + 2] * bGain);
  }
}

function autoExposure(data: Uint8ClampedArray, len: number): void {
  let lumSum = 0;
  for (let i = 0; i < len; i += 4) {
    lumSum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  const avgLum = lumSum / (len / 4);
  const target = 128;
  if (Math.abs(avgLum - target) < 5) return;
  const factor = target / avgLum;
  for (let i = 0; i < len; i += 4) {
    data[i] = clamp(data[i] * factor);
    data[i + 1] = clamp(data[i + 1] * factor);
    data[i + 2] = clamp(data[i + 2] * factor);
  }
}

function applyContrast(data: Uint8ClampedArray, len: number, amount: number): void {
  if (amount === 0) return;
  const factor = (259 * (amount * 255 + 255)) / (255 * (259 - amount * 255));
  for (let i = 0; i < len; i += 4) {
    data[i] = clamp(factor * (data[i] - 128) + 128);
    data[i + 1] = clamp(factor * (data[i + 1] - 128) + 128);
    data[i + 2] = clamp(factor * (data[i + 2] - 128) + 128);
  }
}

function applySaturation(data: Uint8ClampedArray, len: number, amount: number): void {
  if (amount === 0) return;
  const sat = 1 + amount;
  for (let i = 0; i < len; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = clamp(gray + (data[i] - gray) * sat);
    data[i + 1] = clamp(gray + (data[i + 1] - gray) * sat);
    data[i + 2] = clamp(gray + (data[i + 2] - gray) * sat);
  }
}

function applyVibrance(data: Uint8ClampedArray, len: number, amount: number): void {
  if (amount === 0) return;
  for (let i = 0; i < len; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const max = Math.max(r, g, b);
    const avg = (r + g + b) / 3;
    const sat = Math.abs(max - avg) / 255;
    const factor = 1 + amount * (1 - sat);
    data[i] = clamp(avg + (r - avg) * factor);
    data[i + 1] = clamp(avg + (g - avg) * factor);
    data[i + 2] = clamp(avg + (b - avg) * factor);
  }
}

function applyShadowHighlight(
  data: Uint8ClampedArray,
  len: number,
  shadowLift: number,
  highlightReduce: number
): void {
  for (let i = 0; i < len; i += 4) {
    for (let c = 0; c < 3; c++) {
      const v = data[i + c];
      if (v < 80 && shadowLift > 0) {
        const t = (80 - v) / 80;
        data[i + c] = clamp(v + shadowLift * 80 * t);
      }
      if (v > 180 && highlightReduce > 0) {
        const t = (v - 180) / 75;
        data[i + c] = clamp(v - highlightReduce * (v - 180) * t);
      }
    }
  }
}

function boxBlur(
  src: Uint8ClampedArray,
  dst: Uint8ClampedArray,
  w: number,
  h: number,
  radius: number
): void {
  const tmp = new Uint8ClampedArray(src.length);
  const r = Math.max(1, Math.round(radius));
  // Horizontal
  for (let y = 0; y < h; y++) {
    for (let c = 0; c < 3; c++) {
      let sum = 0;
      for (let x = -r; x <= r; x++) {
        const xi = Math.min(w - 1, Math.max(0, x));
        sum += src[(y * w + xi) * 4 + c];
      }
      for (let x = 0; x < w; x++) {
        tmp[(y * w + x) * 4 + c] = sum / (2 * r + 1);
        const xOut = Math.min(w - 1, Math.max(0, x - r));
        const xIn = Math.min(w - 1, Math.max(0, x + r + 1));
        sum += src[(y * w + xIn) * 4 + c] - src[(y * w + xOut) * 4 + c];
      }
    }
  }
  // Vertical
  for (let x = 0; x < w; x++) {
    for (let c = 0; c < 3; c++) {
      let sum = 0;
      for (let y = -r; y <= r; y++) {
        const yi = Math.min(h - 1, Math.max(0, y));
        sum += tmp[(yi * w + x) * 4 + c];
      }
      for (let y = 0; y < h; y++) {
        dst[(y * w + x) * 4 + c] = sum / (2 * r + 1);
        const yOut = Math.min(h - 1, Math.max(0, y - r));
        const yIn = Math.min(h - 1, Math.max(0, y + r + 1));
        sum += tmp[(yIn * w + x) * 4 + c] - tmp[(yOut * w + x) * 4 + c];
      }
    }
  }
  // Copy alpha
  for (let i = 3; i < src.length; i += 4) {
    dst[i] = src[i];
  }
}

function unsharpMask(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  amount: number,
  radius: number
): void {
  if (amount <= 0) return;
  const blurred = new Uint8ClampedArray(data.length);
  boxBlur(data, blurred, w, h, radius);
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const orig = data[i + c];
      const blur = blurred[i + c];
      data[i + c] = clamp(orig + amount * (orig - blur));
    }
  }
}

function denoise(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  amount: number
): void {
  if (amount <= 0) return;
  const blurred = new Uint8ClampedArray(data.length);
  boxBlur(data, blurred, w, h, 1);
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const orig = data[i + c];
      const blur = blurred[i + c];
      const diff = Math.abs(orig - blur);
      if (diff < 15) {
        data[i + c] = clamp(orig * (1 - amount) + blur * amount);
      }
    }
  }
}

function dehaze(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  amount: number
): void {
  if (amount <= 0) return;
  const blurred = new Uint8ClampedArray(data.length);
  boxBlur(data, blurred, w, h, 8);
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const orig = data[i + c];
      const local = blurred[i + c];
      const localContrast = (orig - local) * (1 + amount);
      data[i + c] = clamp(local + localContrast);
    }
  }
}

export async function enhanceImage(
  imageBlob: Blob,
  options: EnhanceOptions
): Promise<EnhanceResult> {
  const mode = options.mode;
  const intensity = options.intensity ?? 100;

  let img: HTMLImageElement;
  try {
    img = await loadImageFromBlob(imageBlob);
  } catch {
    throw new EnhanceError('Could not load the image. Please try a different file.');
  }

  if (options.signal?.aborted) throw new EnhanceError('Enhancement was cancelled.');

  // Cap resolution for performance (< 2s target)
  const maxDim = mode === 'hd' ? 1600 : 2400;
  let { naturalWidth: w, naturalHeight: h } = img;
  if (w > maxDim || h > maxDim) {
    const scale = maxDim / Math.max(w, h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  // HD mode: 4x upscale via two 2x passes (less memory than one 4x)
  if (mode === 'hd') {
    w = Math.round(w * 2);
    h = Math.round(h * 2);
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const len = data.length;

  const params = getParams(mode, intensity);

  // 1. Auto White Balance
  autoWhiteBalance(data, len);

  // 2. Auto Exposure
  autoExposure(data, len);

  // 3. Smart Contrast (+15%)
  applyContrast(data, len, params.contrastBoost);

  // 4. Color Pop — saturation +25%, vibrance for dull colors
  applySaturation(data, len, params.saturationBoost);
  applyVibrance(data, len, params.vibranceBoost);

  // 5. Dehaze / Clarity — local contrast
  dehaze(data, w, h, params.dehazeAmount);

  // 6. Shadow Lift + 7. Highlight Protect
  applyShadowHighlight(data, len, params.shadowLift, params.highlightReduce);

  // 8. Sharpen (unsharp mask)
  unsharpMask(data, w, h, params.sharpenAmount, params.sharpenRadius);

  // 9. Denoise (edge-preserving)
  denoise(data, w, h, params.denoiseAmount);

  ctx.putImageData(imageData, 0, 0);

  const quality = mode === 'hd' ? 0.98 : 0.95;
  const blob = await canvasToBlob(canvas, 'image/jpeg', quality);
  const url = URL.createObjectURL(blob);

  return { blob, url, width: w, height: h };
}
