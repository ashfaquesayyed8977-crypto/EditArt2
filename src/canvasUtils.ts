import type { Adjustments } from './types';

export function applyAdjustmentsToCtx(
  ctx: CanvasRenderingContext2D,
  adj: Adjustments,
  width: number,
  height: number
): void {
  const filters: string[] = [];

  const brightness = 1 + adj.brightness / 100 + adj.exposure / 100;
  const contrast = 1 + adj.contrast / 100;
  const saturate = 1 + adj.saturation / 100;

  filters.push(`brightness(${brightness})`);
  filters.push(`contrast(${contrast})`);
  filters.push(`saturate(${saturate})`);

  if (adj.blur > 0) filters.push(`blur(${adj.blur / 10}px)`);
  if (adj.sepia > 0) filters.push(`sepia(${adj.sepia / 100})`);
  if (adj.grayscale > 0) filters.push(`grayscale(${adj.grayscale / 100})`);

  ctx.filter = filters.join(' ');

  // Temperature & tint via overlay
  if (adj.temperature !== 0 || adj.tint !== 0) {
    ctx.filter = 'none';
  }
}

export function drawImageWithAdjustments(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  adj: Adjustments
): void {
  ctx.save();

  const filters: string[] = [];
  const brightness = 1 + adj.brightness / 100 + adj.exposure / 100;
  const contrast = 1 + adj.contrast / 100;
  const saturate = 1 + adj.saturation / 100;

  filters.push(`brightness(${brightness})`);
  filters.push(`contrast(${contrast})`);
  filters.push(`saturate(${saturate})`);

  if (adj.blur > 0) filters.push(`blur(${adj.blur / 10}px)`);
  if (adj.sepia > 0) filters.push(`sepia(${adj.sepia / 100})`);
  if (adj.grayscale > 0) filters.push(`grayscale(${adj.grayscale / 100})`);

  ctx.filter = filters.join(' ');
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.filter = 'none';

  // Temperature overlay (warm/cool)
  if (adj.temperature !== 0) {
    ctx.globalCompositeOperation = 'overlay';
    const temp = adj.temperature;
    if (temp > 0) {
      ctx.fillStyle = `rgba(255, 140, 0, ${Math.abs(temp) / 200})`;
    } else {
      ctx.fillStyle = `rgba(0, 140, 255, ${Math.abs(temp) / 200})`;
    }
    ctx.fillRect(dx, dy, dw, dh);
    ctx.globalCompositeOperation = 'source-over';
  }

  // Tint overlay
  if (adj.tint !== 0) {
    ctx.globalCompositeOperation = 'overlay';
    if (adj.tint > 0) {
      ctx.fillStyle = `rgba(120, 0, 200, ${Math.abs(adj.tint) / 200})`;
    } else {
      ctx.fillStyle = `rgba(0, 200, 120, ${Math.abs(adj.tint) / 200})`;
    }
    ctx.fillRect(dx, dy, dw, dh);
    ctx.globalCompositeOperation = 'source-over';
  }

  // Vignette
  if (adj.vignette > 0) {
    const cx = dx + dw / 2;
    const cy = dy + dh / 2;
    const innerR = Math.min(dw, dh) * 0.3;
    const outerR = Math.max(dw, dh) * 0.75;
    const grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(0,0,0,${adj.vignette / 100})`);
    ctx.fillStyle = grad;
    ctx.fillRect(dx, dy, dw, dh);
  }

  // Sharpness using a second draw with overlay
  if (adj.sharpness > 0) {
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = adj.sharpness / 200;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  ctx.restore();
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      loadImage(reader.result as string).then(resolve).catch(reject);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
      type,
      quality
    );
  });
}

export function getQualityValue(quality: 'standard' | 'high' | 'maximum'): number {
  switch (quality) {
    case 'standard': return 0.7;
    case 'high': return 0.9;
    case 'maximum': return 1.0;
  }
}

export function getMimeType(format: 'jpg' | 'png' | 'webp'): string {
  switch (format) {
    case 'jpg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'webp': return 'image/webp';
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
