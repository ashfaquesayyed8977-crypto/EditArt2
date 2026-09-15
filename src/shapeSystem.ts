import type { ShapeType } from './types';

/**
 * Returns a CSS clip-path polygon string for the given shape.
 * Coordinates are in percentages (0-100).
 */
export function shapeClipPath(shape: ShapeType, radius: number = 0.15): string {
  switch (shape) {
    case 'rect':
      return 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
    case 'rounded':
      return `inset(0 0 0 0 round ${Math.round(radius * 100)}%)`;
    case 'circle':
      return 'circle(50% at 50% 50%)';
    case 'oval':
      return 'ellipse(50% 50% at 50% 50%)';
    case 'triangle':
      return 'polygon(50% 0%, 100% 100%, 0% 100%)';
    case 'diamond':
      return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
    case 'hexagon':
      return 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
    case 'octagon':
      return 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)';
    case 'pentagon':
      return 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)';
    case 'star':
      return 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
    case 'heart':
      return 'polygon(50% 100%, 0% 50%, 0% 25%, 25% 0%, 50% 25%, 75% 0%, 100% 25%, 100% 50%)';
    case 'crescent':
      return 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 65%, 80% 90%, 50% 100%, 70% 80%, 85% 55%, 85% 30%, 60% 10%)';
    case 'cloud':
      return 'polygon(25% 60%, 15% 55%, 10% 45%, 15% 35%, 25% 30%, 35% 25%, 50% 20%, 65% 25%, 75% 30%, 85% 35%, 90% 45%, 85% 55%, 75% 60%, 25% 60%)';
    case 'flower':
      return 'polygon(50% 0%, 60% 25%, 85% 15%, 75% 40%, 100% 50%, 75% 60%, 85% 85%, 60% 75%, 50% 100%, 40% 75%, 15% 85%, 25% 60%, 0% 50%, 25% 40%, 15% 15%, 40% 25%)';
    case 'leaf':
      return 'polygon(50% 0%, 80% 20%, 100% 50%, 80% 80%, 50% 100%, 20% 80%, 0% 50%, 20% 20%)';
    case 'butterfly':
      return 'polygon(50% 50%, 0% 0%, 15% 40%, 0% 80%, 30% 100%, 50% 50%, 70% 100%, 100% 80%, 85% 40%, 100% 0%, 50% 50%)';
    case 'sun':
      return 'polygon(50% 0%, 56% 15%, 70% 5%, 65% 22%, 85% 15%, 75% 30%, 95% 30%, 80% 42%, 100% 50%, 80% 58%, 95% 70%, 75% 70%, 85% 85%, 65% 78%, 70% 95%, 56% 85%, 50% 100%, 44% 85%, 30% 95%, 35% 78%, 15% 85%, 25% 70%, 5% 70%, 20% 58%, 0% 50%, 20% 42%, 5% 30%, 25% 30%, 15% 15%, 35% 22%, 30% 5%, 44% 15%)';
    case 'moon':
      return 'polygon(65% 0%, 90% 20%, 100% 50%, 90% 80%, 65% 100%, 40% 95%, 60% 80%, 75% 50%, 60% 20%, 40% 5%)';
    case 'speech':
      return 'polygon(10% 10%, 90% 10%, 90% 70%, 60% 70%, 50% 100%, 40% 70%, 10% 70%)';
    case 'plus':
      return 'polygon(35% 0%, 65% 0%, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0% 65%, 0% 35%, 35% 35%)';
    case 'cross':
      return 'polygon(30% 0%, 70% 0%, 70% 30%, 100% 30%, 100% 70%, 70% 70%, 70% 100%, 30% 100%, 30% 70%, 0% 70%, 0% 30%, 30% 30%)';
    default:
      return 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
  }
}

/**
 * Clips the canvas context to the given shape within the bounds (x, y, w, h).
 * Used during canvas rendering for Save/export.
 */
export function clipCanvasToShape(
  ctx: CanvasRenderingContext2D,
  shape: ShapeType,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number = 0.15
): void {
  ctx.beginPath();

  switch (shape) {
    case 'rect':
      ctx.rect(x, y, w, h);
      break;
    case 'rounded': {
      const r = Math.min(w, h) * radius;
      roundRectPath(ctx, x, y, w, h, r);
      break;
    }
    case 'circle': {
      ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
      break;
    }
    case 'oval':
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      break;
    case 'triangle':
      ctx.moveTo(x + w / 2, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
      break;
    case 'diamond':
      ctx.moveTo(x + w / 2, y);
      ctx.lineTo(x + w, y + h / 2);
      ctx.lineTo(x + w / 2, y + h);
      ctx.lineTo(x, y + h / 2);
      ctx.closePath();
      break;
    case 'hexagon':
      polyPath(ctx, x, y, w, h, 6, 0);
      break;
    case 'octagon':
      polyPath(ctx, x, y, w, h, 8, 22.5);
      break;
    case 'pentagon':
      polyPath(ctx, x, y, w, h, 5, -90);
      break;
    case 'star':
      starPath(ctx, x, y, w, h, 5, 0.4);
      break;
    case 'heart':
      heartPath(ctx, x, y, w, h);
      break;
    case 'crescent':
      crescentPath(ctx, x, y, w, h);
      break;
    case 'cloud':
      cloudPath(ctx, x, y, w, h);
      break;
    case 'flower':
      flowerPath(ctx, x, y, w, h);
      break;
    case 'leaf':
      leafPath(ctx, x, y, w, h);
      break;
    case 'butterfly':
      butterflyPath(ctx, x, y, w, h);
      break;
    case 'sun':
      sunPath(ctx, x, y, w, h);
      break;
    case 'moon':
      moonPath(ctx, x, y, w, h);
      break;
    case 'speech':
      speechPath(ctx, x, y, w, h);
      break;
    case 'plus':
      plusPath(ctx, x, y, w, h);
      break;
    case 'cross':
      crossPath(ctx, x, y, w, h);
      break;
    default:
      ctx.rect(x, y, w, h);
  }

  ctx.clip();
}

// ── Shape path helpers ─────────────────────────────────────

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function polyPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  sides: number,
  startAngleDeg: number
) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rx = w / 2;
  const ry = h / 2;
  for (let i = 0; i <= sides; i++) {
    const angle = ((startAngleDeg + (360 / sides) * i) * Math.PI) / 180;
    const px = cx + rx * Math.cos(angle);
    const py = cy + ry * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function starPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  points: number,
  innerRatio: number
) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rOuter = Math.min(w, h) / 2;
  const rInner = rOuter * innerRatio;
  for (let i = 0; i <= points * 2; i++) {
    const angle = (-Math.PI / 2 + (Math.PI / points) * i);
    const r = i % 2 === 0 ? rOuter : rInner;
    const px = cx + r * Math.cos(angle) * (w / Math.min(w, h));
    const py = cy + r * Math.sin(angle) * (h / Math.min(w, h));
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function heartPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const cx = x + w / 2;
  const topY = y + h * 0.3;
  ctx.moveTo(cx, y + h);
  ctx.bezierCurveTo(x - w * 0.1, y + h * 0.7, x + w * 0.1, topY - h * 0.1, cx, y + h * 0.35);
  ctx.bezierCurveTo(x + w * 0.9, topY - h * 0.1, x + w * 1.1, y + h * 0.7, cx, y + h);
  ctx.closePath();
}

function crescentPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = Math.min(w, h) / 2;
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.3, cy, r * 0.85, 0, Math.PI * 2, true);
  ctx.closePath();
}

function cloudPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const cx = x + w / 2;
  const cy = y + h * 0.55;
  const r = Math.min(w, h) * 0.22;
  ctx.arc(x + w * 0.3, y + h * 0.55, r * 1.2, 0, Math.PI * 2);
  ctx.arc(x + w * 0.5, y + h * 0.4, r * 1.5, 0, Math.PI * 2);
  ctx.arc(x + w * 0.7, y + h * 0.55, r * 1.2, 0, Math.PI * 2);
  ctx.rect(x + w * 0.2, y + h * 0.55, w * 0.6, h * 0.35);
  ctx.closePath();
}

function flowerPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = Math.min(w, h) / 2;
  const petals = 6;
  for (let i = 0; i < petals; i++) {
    const angle = (i / petals) * Math.PI * 2;
    const px = cx + r * 0.5 * Math.cos(angle);
    const py = cy + r * 0.5 * Math.sin(angle);
    ctx.moveTo(px, py);
    ctx.arc(px, py, r * 0.45, 0, Math.PI * 2);
  }
  ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
}

function leafPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.moveTo(cx, y);
  ctx.bezierCurveTo(x + w, y + h * 0.3, x + w, y + h * 0.7, cx, y + h);
  ctx.bezierCurveTo(x, y + h * 0.7, x, y + h * 0.3, cx, y);
  ctx.closePath();
}

function butterflyPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  // Left wing
  ctx.moveTo(cx, cy);
  ctx.bezierCurveTo(x, y, x, y + h * 0.4, cx, cy);
  ctx.bezierCurveTo(x, y + h, x, y + h * 0.6, cx, cy);
  // Right wing
  ctx.moveTo(cx, cy);
  ctx.bezierCurveTo(x + w, y, x + w, y + h * 0.4, cx, cy);
  ctx.bezierCurveTo(x + w, y + h, x + w, y + h * 0.6, cx, cy);
  ctx.closePath();
}

function sunPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = Math.min(w, h) / 2;
  const rays = 12;
  for (let i = 0; i <= rays * 2; i++) {
    const angle = (i / (rays * 2)) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.75;
    const px = cx + rr * Math.cos(angle);
    const py = cy + rr * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function moonPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = Math.min(w, h) / 2;
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.3, cy - r * 0.1, r * 0.85, 0, Math.PI * 2, true);
  ctx.closePath();
}

function speechPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const r = Math.min(w, h) * 0.15;
  roundRectPath(ctx, x, y, w, h * 0.75, r);
  ctx.moveTo(x + w * 0.35, y + h * 0.75);
  ctx.lineTo(x + w * 0.35, y + h);
  ctx.lineTo(x + w * 0.55, y + h * 0.75);
  ctx.closePath();
}

function plusPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const dw = w * 0.3;
  const dh = h * 0.3;
  ctx.moveTo(x + w / 2 - dw / 2, y);
  ctx.lineTo(x + w / 2 + dw / 2, y);
  ctx.lineTo(x + w / 2 + dw / 2, y + h / 2 - dh / 2);
  ctx.lineTo(x + w, y + h / 2 - dh / 2);
  ctx.lineTo(x + w, y + h / 2 + dh / 2);
  ctx.lineTo(x + w / 2 + dw / 2, y + h / 2 + dh / 2);
  ctx.lineTo(x + w / 2 + dw / 2, y + h);
  ctx.lineTo(x + w / 2 - dw / 2, y + h);
  ctx.lineTo(x + w / 2 - dw / 2, y + h / 2 + dh / 2);
  ctx.lineTo(x, y + h / 2 + dh / 2);
  ctx.lineTo(x, y + h / 2 - dh / 2);
  ctx.lineTo(x + w / 2 - dw / 2, y + h / 2 - dh / 2);
  ctx.closePath();
}

function crossPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const dw = w * 0.3;
  const dh = h * 0.3;
  ctx.moveTo(x + w / 2 - dw / 2, y);
  ctx.lineTo(x + w / 2 + dw / 2, y);
  ctx.lineTo(x + w / 2 + dw / 2, y + h / 2 - dh / 2);
  ctx.lineTo(x + w, y + h / 2 - dh / 2);
  ctx.lineTo(x + w, y + h / 2 + dh / 2);
  ctx.lineTo(x + w / 2 + dw / 2, y + h / 2 + dh / 2);
  ctx.lineTo(x + w / 2 + dw / 2, y + h);
  ctx.lineTo(x + w / 2 - dw / 2, y + h);
  ctx.lineTo(x + w / 2 - dw / 2, y + h / 2 + dh / 2);
  ctx.lineTo(x, y + h / 2 + dh / 2);
  ctx.lineTo(x, y + h / 2 - dh / 2);
  ctx.lineTo(x + w / 2 - dw / 2, y + h / 2 - dh / 2);
  ctx.closePath();
}
