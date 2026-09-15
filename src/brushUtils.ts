export interface BrushPoint {
  x: number;
  y: number;
}

export function drawSoftCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  hardness: number,
  fillStyle: string | CanvasGradient
): void {
  if (hardness >= 1) {
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const grad = ctx.createRadialGradient(cx, cy, radius * hardness, cx, cy, radius);
  if (typeof fillStyle === 'string') {
    grad.addColorStop(0, fillStyle);
    grad.addColorStop(1, fillStyle.replace(/[\d.]+\)$/, '0)'));
  }
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
}

export function strokeBetween(
  ctx: CanvasRenderingContext2D,
  from: BrushPoint,
  to: BrushPoint,
  radius: number,
  hardness: number,
  color: string,
  opacity: number
): void {
  ctx.save();
  ctx.globalAlpha = opacity;
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(1, Math.ceil(dist / (radius * 0.3)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t;
    drawSoftCircle(ctx, x, y, radius, hardness, color);
  }
  ctx.restore();
}

export function eraseStroke(
  ctx: CanvasRenderingContext2D,
  from: BrushPoint,
  to: BrushPoint,
  radius: number,
  hardness: number
): void {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  strokeBetween(ctx, from, to, radius, hardness, 'rgba(0,0,0,1)', 1);
  ctx.restore();
}

export function restoreStroke(
  ctx: CanvasRenderingContext2D,
  from: BrushPoint,
  to: BrushPoint,
  radius: number,
  hardness: number
): void {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  // To restore, we need the original mask inverted; handled by caller via snapshot
  strokeBetween(ctx, from, to, radius, hardness, 'rgba(0,0,0,1)', 1);
  ctx.restore();
}

export function cloneStroke(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  sourcePoint: BrushPoint,
  destPoint: BrushPoint,
  radius: number,
  hardness: number
): void {
  ctx.save();
  const dx = destPoint.x - sourcePoint.x;
  const dy = destPoint.y - sourcePoint.y;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / (radius * 0.3)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const sx = sourcePoint.x + dx * t;
    const sy = sourcePoint.y + dy * t;
    const dpx = destPoint.x + dx * t;
    const dpy = destPoint.y + dy * t;
    ctx.save();
    ctx.beginPath();
    ctx.arc(dpx, dpy, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(
      sourceCanvas,
      sx - radius, sy - radius, radius * 2, radius * 2,
      dpx - radius, dpy - radius, radius * 2, radius * 2
    );
    ctx.restore();
  }
  ctx.restore();
}

export function healStroke(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  point: BrushPoint,
  radius: number,
  intensity: number
): void {
  const r = Math.max(2, radius);
  const cx = Math.round(point.x);
  const cy = Math.round(point.y);
  const sx = Math.max(0, cx - r);
  const sy = Math.max(0, cy - r);
  const sw = Math.min(canvas.width - sx, r * 2);
  const sh = Math.min(canvas.height - sy, r * 2);
  if (sw <= 0 || sh <= 0) return;

  const ringR = r * 2;
  const ringSx = Math.max(0, cx - ringR);
  const ringSy = Math.max(0, cy - ringR);
  const ringSw = Math.min(canvas.width - ringSx, ringR * 2);
  const ringSh = Math.min(canvas.height - ringSy, ringR * 2);
  if (ringSw <= 0 || ringSh <= 0) return;

  const ringCanvas = document.createElement('canvas');
  ringCanvas.width = ringSw;
  ringCanvas.height = ringSh;
  const ringCtx = ringCanvas.getContext('2d')!;
  ringCtx.drawImage(canvas, ringSx, ringSy, ringSw, ringSh, 0, 0, ringSw, ringSh);

  ringCtx.save();
  ringCtx.globalCompositeOperation = 'destination-out';
  ringCtx.beginPath();
  ringCtx.arc(cx - ringSx, cy - ringSy, r, 0, Math.PI * 2);
  ringCtx.fill();
  ringCtx.restore();

  const samplePoints: BrushPoint[] = [];
  const numSamples = 8;
  for (let i = 0; i < numSamples; i++) {
    const angle = (i / numSamples) * Math.PI * 2;
    const px = cx - ringSx + Math.cos(angle) * r * 1.5;
    const py = cy - ringSy + Math.sin(angle) * r * 1.5;
    if (px >= 0 && px < ringSw && py >= 0 && py < ringSh) {
      samplePoints.push({ x: px, y: py });
    }
  }
  if (samplePoints.length === 0) return;

  let avgR = 0, avgG = 0, avgB = 0, count = 0;
  const ringData = ringCtx.getImageData(0, 0, ringSw, ringSh);
  for (const sp of samplePoints) {
    const idx = (Math.floor(sp.y) * ringSw + Math.floor(sp.x)) * 4;
    if (idx + 3 < ringData.data.length) {
      avgR += ringData.data[idx];
      avgG += ringData.data[idx + 1];
      avgB += ringData.data[idx + 2];
      count++;
    }
  }
  if (count === 0) return;
  avgR /= count; avgG /= count; avgB /= count;

  const blurred = document.createElement('canvas');
  blurred.width = sw;
  blurred.height = sh;
  const bCtx = blurred.getContext('2d')!;
  bCtx.filter = `blur(${Math.max(1, r / 3)}px)`;
  bCtx.drawImage(ringCanvas, 0, 0, ringSw, ringSh, 0, 0, sw, sh);
  bCtx.filter = 'none';

  ctx.save();
  ctx.globalAlpha = Math.max(0.1, Math.min(1, intensity / 100));
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(blurred, 0, 0, sw, sh, sx, sy, sw, sh);
  ctx.restore();
}

export function getCanvasPos(
  e: React.PointerEvent | PointerEvent,
  canvas: HTMLCanvasElement
): BrushPoint {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}
