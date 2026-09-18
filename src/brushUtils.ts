export interface BrushPoint {
  x: number;
  y: number;
}

function toRgba(color: string, alpha: number = 1): string {
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  if (color.startsWith('rgb')) {
    const parts = color.match(/\d+/g)?.slice(0, 3).join(',') || '0,0,0';
    return `rgba(${parts},${alpha})`;
  }
  return color;
}

export function drawSoftCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  hardness: number,
  fillStyle: string | CanvasGradient
): void {
  if (hardness >= 0.95 || typeof fillStyle !== 'string') {
    ctx.fillStyle = fillStyle as any;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  grad.addColorStop(0, toRgba(fillStyle as string, 1));
  grad.addColorStop(hardness, toRgba(fillStyle as string, 1));
  grad.addColorStop(1, toRgba(fillStyle as string, 0));
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
  const steps = Math.max(1, Math.ceil(dist / (radius * 0.5)));
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
  // Restore = Erase on mask
  eraseStroke(ctx, from, to, radius, hardness);
}

// Clone aur Heal ko simple rakha hai, ab lag nahi karega
export function cloneStroke(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  sourcePoint: BrushPoint,
  destPoint: BrushPoint,
  radius: number
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(destPoint.x, destPoint.y, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(
    sourceCanvas,
    sourcePoint.x - radius, sourcePoint.y - radius, radius * 2, radius * 2,
    destPoint.x - radius, destPoint.y - radius, radius * 2, radius * 2
  );
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
  ctx.save();
  ctx.globalAlpha = Math.max(0.1, Math.min(1, intensity / 100));
  ctx.filter = `blur(${r / 3}px)`;
  ctx.beginPath();
  ctx.arc(point.x, point.y, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(canvas, 0, 0);
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
