import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import {
  Check, X, RotateCw, RotateCcw, FlipHorizontal, FlipVertical,
  Crop as CropIcon, Maximize2, Shapes, Lock, Unlock,
  Smartphone, Instagram, Youtube, Facebook,
} from 'lucide-react';
import { clipCanvasToShape } from '../shapeSystem';
import type { ShapeType } from '../types';

export interface CropResult {
  crop: { x: number; y: number; w: number; h: number };
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  straighten: number;
  shape: ShapeType;
}

interface CropEditorProps {
  image: HTMLImageElement;
  currentCrop: { x: number; y: number; w: number; h: number } | null;
  currentRotation: number;
  currentFlipH: boolean;
  currentFlipV: boolean;
  onDone: (result: CropResult, dataUrl: string) => void;
  onCancel: () => void;
}

type Tool = 'crop' | 'rotate' | 'flip' | 'straighten' | 'aspect' | 'shape' | 'reset';

type ShapeMask = 'rect' | 'rounded' | 'circle' | 'oval' | 'heart' | 'star';

const SHAPE_MASKS: { id: ShapeMask; label: string }[] = [
  { id: 'rect', label: 'Rectangle' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'circle', label: 'Circle' },
  { id: 'oval', label: 'Oval' },
  { id: 'heart', label: 'Heart' },
  { id: 'star', label: 'Star' },
];

interface RatioPreset {
  label: string;
  ratio: number | null;
}

const COMMON_RATIOS: RatioPreset[] = [
  { label: 'Original', ratio: null },
  { label: 'Free', ratio: null },
  { label: '1:1', ratio: 1 },
  { label: '4:5', ratio: 4 / 5 },
  { label: '5:4', ratio: 5 / 4 },
  { label: '3:4', ratio: 3 / 4 },
  { label: '4:3', ratio: 4 / 3 },
  { label: '2:3', ratio: 2 / 3 },
  { label: '3:2', ratio: 3 / 2 },
  { label: '9:16', ratio: 9 / 16 },
  { label: '16:9', ratio: 16 / 9 },
  { label: '21:9', ratio: 21 / 9 },
];

const SOCIAL_PLATFORMS: { name: string; icon: typeof Instagram; presets: RatioPreset[] }[] = [
  {
    name: 'Instagram', icon: Instagram,
    presets: [
      { label: 'Post 1:1', ratio: 1 },
      { label: 'Portrait 4:5', ratio: 4 / 5 },
      { label: 'Landscape 1.91:1', ratio: 1.91 },
      { label: 'Story 9:16', ratio: 9 / 16 },
      { label: 'Reel 9:16', ratio: 9 / 16 },
    ],
  },
  {
    name: 'YouTube', icon: Youtube,
    presets: [
      { label: 'Video 16:9', ratio: 16 / 9 },
      { label: 'Shorts 9:16', ratio: 9 / 16 },
      { label: 'Thumbnail 16:9', ratio: 16 / 9 },
      { label: 'Channel 1:1', ratio: 1 },
    ],
  },
  {
    name: 'Facebook', icon: Facebook,
    presets: [
      { label: 'Post 1:1', ratio: 1 },
      { label: 'Portrait 4:5', ratio: 4 / 5 },
      { label: 'Story 9:16', ratio: 9 / 16 },
      { label: 'Cover 16:9', ratio: 16 / 9 },
    ],
  },
];

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// Crop rect in normalized image coordinates (0..1)
interface CropRect { x: number; y: number; w: number; h: number; }

type DragMode = 'none' | 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | 'pan';

export default function CropEditor({
  image,
  currentCrop,
  currentRotation,
  currentFlipH,
  currentFlipV,
  onDone,
  onCancel,
}: CropEditorProps) {
  const imgW = image.naturalWidth;
  const imgH = image.naturalHeight;
  const imgRatio = imgW / imgH;

  const [crop, setCrop] = useState<CropRect>(currentCrop || { x: 0, y: 0, w: 1, h: 1 });
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [aspectLabel, setAspectLabel] = useState('Free');
  const [isOriginalRatio, setIsOriginalRatio] = useState(false);
  const [rotation, setRotation] = useState(currentRotation);
  const [flipH, setFlipH] = useState(currentFlipH);
  const [flipV, setFlipV] = useState(currentFlipV);
  const [straighten, setStraighten] = useState(0);
  const [activeTool, setActiveTool] = useState<Tool>('crop');
  const [shapeMask, setShapeMask] = useState<ShapeMask | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [customW, setCustomW] = useState(1080);
  const [customH, setCustomH] = useState(1920);
  const [customLocked, setCustomLocked] = useState(true);

  // Sheet visibility
  const [showAspectSheet, setShowAspectSheet] = useState(false);
  const [showShapeSheet, setShowShapeSheet] = useState(false);
  const [socialTab, setSocialTab] = useState(0);

  // Display layout
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayRect, setDisplayRect] = useState({ x: 0, y: 0, w: 0, h: 0 });

  // Gesture state
  const dragRef = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    startCrop: CropRect;
    startPanX: number;
    startPanY: number;
    pointers: Map<number, { x: number; y: number }>;
    startDist: number;
    startZoom: number;
    startCenterX: number;
    startCenterY: number;
  }>({
    mode: 'none', startX: 0, startY: 0, startCrop: { x: 0, y: 0, w: 1, h: 1 },
    startPanX: 0, startPanY: 0, pointers: new Map(), startDist: 0, startZoom: 1,
    startCenterX: 0, startCenterY: 0,
  });

  // Compute the image display area (fit inside container)
  const computeDisplay = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    if (cw === 0 || ch === 0) return;

    // The displayed image fits the container, keeping the original image aspect ratio
    const padding = 24;
    const availW = cw - padding * 2;
    const availH = ch - padding * 2;

    let dw = availW;
    let dh = dw / imgRatio;
    if (dh > availH) {
      dh = availH;
      dw = dh * imgRatio;
    }

    setDisplayRect({
      x: (cw - dw) / 2,
      y: (ch - dh) / 2,
      w: dw,
      h: dh,
    });
  }, [imgRatio]);

  useLayoutEffect(() => {
    computeDisplay();
  }, [computeDisplay]);

  useEffect(() => {
    const handler = () => computeDisplay();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [computeDisplay]);

  // Convert screen coords to normalized image coords
  const screenToNorm = useCallback((sx: number, sy: number): { x: number; y: number } => {
    return {
      x: (sx - displayRect.x) / displayRect.w,
      y: (sy - displayRect.y) / displayRect.h,
    };
  }, [displayRect]);

  // Constrain crop to valid bounds with optional aspect ratio lock
  const constrainCrop = useCallback((c: CropRect, ratio: number | null): CropRect => {
    let w = clamp(c.w, 0.05, 1);
    let h = clamp(c.h, 0.05, 1);

    if (ratio !== null && ratio > 0) {
      // Lock aspect ratio
      if (w / h > ratio) {
        w = h * ratio;
      } else {
        h = w / ratio;
      }
      w = clamp(w, 0.05, 1);
      h = clamp(h, 0.05, 1);
      if (h * ratio > 1) {
        h = 1 / ratio;
        w = 1;
      }
      if (w / ratio > 1) {
        w = 1;
        h = 1 / ratio;
      }
    }

    const x = clamp(c.x, 0, 1 - w);
    const y = clamp(c.y, 0, 1 - h);
    return { x, y, w, h };
  }, []);

  // Apply aspect ratio
  const applyAspect = useCallback((r: number | null, label: string, original = false) => {
    setAspectRatio(r);
    setAspectLabel(label);
    setIsOriginalRatio(original);

    if (original) {
      // Original = full image
      setCrop({ x: 0, y: 0, w: 1, h: 1 });
      return;
    }

    if (r === null) {
      // Free — keep current crop but unlock
      return;
    }

    // Fit the ratio inside the image, centered
    let w: number, h: number;
    if (r >= imgRatio) {
      w = 1;
      h = 1 / r;
    } else {
      h = 1;
      w = r;
    }
    w = clamp(w, 0.05, 1);
    h = clamp(h, 0.05, 1);
    setCrop({ x: (1 - w) / 2, y: (1 - h) / 2, w, h });
  }, [imgRatio]);

  // Full screen crop
  const applyFullScreen = useCallback(() => {
    const screenRatio = window.innerWidth / window.innerHeight;
    applyAspect(screenRatio, 'Full Screen');
  }, [applyAspect]);

  // Custom ratio
  const applyCustom = useCallback(() => {
    const r = customW / customH;
    applyAspect(r, `Custom ${customW}×${customH}`);
  }, [customW, customH, applyAspect]);

  // Reset everything
  const resetAll = useCallback(() => {
    setCrop({ x: 0, y: 0, w: 1, h: 1 });
    setAspectRatio(null);
    setAspectLabel('Free');
    setIsOriginalRatio(false);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setStraighten(0);
    setShapeMask(null);
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setActiveTool('crop');
  }, []);

  // Determine which handle based on point relative to crop rect on screen
  const getDragMode = useCallback((sx: number, sy: number): DragMode => {
    const cropScreen = {
      x: displayRect.x + crop.x * displayRect.w,
      y: displayRect.y + crop.y * displayRect.h,
      w: crop.w * displayRect.w,
      h: crop.h * displayRect.h,
    };
    const handleSize = 40; // touch-friendly hit area
    const onLeft = Math.abs(sx - cropScreen.x) < handleSize;
    const onRight = Math.abs(sx - (cropScreen.x + cropScreen.w)) < handleSize;
    const onTop = Math.abs(sy - cropScreen.y) < handleSize;
    const onBottom = Math.abs(sy - (cropScreen.y + cropScreen.h)) < handleSize;
    const inside = sx > cropScreen.x && sx < cropScreen.x + cropScreen.w && sy > cropScreen.y && sy < cropScreen.y + cropScreen.h;

    if (onLeft && onTop) return 'nw';
    if (onRight && onTop) return 'ne';
    if (onLeft && onBottom) return 'sw';
    if (onRight && onBottom) return 'se';
    if (onTop) return 'n';
    if (onBottom) return 's';
    if (onLeft) return 'w';
    if (onRight) return 'e';
    if (inside) return 'move';
    return 'none';
  }, [crop, displayRect]);

  // Pointer handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const g = dragRef.current;
    g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (g.pointers.size === 2) {
      // Start pinch zoom
      const pts = Array.from(g.pointers.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      g.mode = 'pan';
      g.startDist = dist;
      g.startZoom = zoom;
      g.startPanX = panX;
      g.startPanY = panY;
      g.startCenterX = (pts[0].x + pts[1].x) / 2;
      g.startCenterY = (pts[0].y + pts[1].y) / 2;
      return;
    }

    const mode = getDragMode(e.clientX, e.clientY);
    g.mode = mode;
    g.startX = e.clientX;
    g.startY = e.clientY;
    g.startCrop = { ...crop };
    g.startPanX = panX;
    g.startPanY = panY;
  }, [crop, zoom, panX, panY, getDragMode]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const g = dragRef.current;
    if (g.mode === 'none') return;

    g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Pinch zoom
    if (g.pointers.size >= 2 && g.mode === 'pan') {
      const pts = Array.from(g.pointers.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (g.startDist > 0) {
        const newZoom = clamp(g.startZoom * (dist / g.startDist), 1, 5);
        setZoom(newZoom);
      }
      return;
    }

    const dx = (e.clientX - g.startX) / displayRect.w;
    const dy = (e.clientY - g.startY) / displayRect.h;

    if (g.mode === 'move') {
      const newCrop = constrainCrop({
        ...g.startCrop,
        x: g.startCrop.x + dx,
        y: g.startCrop.y + dy,
      }, aspectRatio);
      setCrop(newCrop);
      return;
    }

    // Handle resizing
    const sc = g.startCrop;
    let newX = sc.x, newY = sc.y, newW = sc.w, newH = sc.h;

    if (g.mode.includes('w') || g.mode === 'nw' || g.mode === 'sw') {
      newX = sc.x + dx;
      newW = sc.w - dx;
    }
    if (g.mode.includes('e') || g.mode === 'ne' || g.mode === 'se') {
      newW = sc.w + dx;
    }
    if (g.mode.includes('n') || g.mode === 'nw' || g.mode === 'ne') {
      newY = sc.y + dy;
      newH = sc.h - dy;
    }
    if (g.mode.includes('s') || g.mode === 'sw' || g.mode === 'se') {
      newH = sc.h + dy;
    }

    // For single-edge drags with locked ratio, expand both dims
    if (aspectRatio !== null && aspectRatio > 0) {
      if (g.mode === 'n' || g.mode === 's') {
        newW = newH * aspectRatio;
        newX = sc.x + (sc.w - newW) / 2;
      } else if (g.mode === 'e' || g.mode === 'w') {
        newH = newW / aspectRatio;
        newY = sc.y + (sc.h - newH) / 2;
      }
    }

    // Min size
    if (newW < 0.05) { newW = 0.05; }
    if (newH < 0.05) { newH = 0.05; }

    setCrop(constrainCrop({ x: newX, y: newY, w: newW, h: newH }, aspectRatio));
  }, [displayRect, aspectRatio, constrainCrop]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const g = dragRef.current;
    g.pointers.delete(e.pointerId);
    if (g.pointers.size < 2) {
      g.mode = 'none';
    }
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* noop */ }
  }, []);

  // Double tap to reset/fit
  const lastTapRef = useRef(0);
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      setZoom(1);
      setPanX(0);
      setPanY(0);
      if (aspectRatio === null) {
        setCrop({ x: 0, y: 0, w: 1, h: 1 });
      } else {
        applyAspect(aspectRatio, aspectLabel, isOriginalRatio);
      }
    }
    lastTapRef.current = now;
  }, [aspectRatio, aspectLabel, isOriginalRatio, applyAspect]);

  // Generate the cropped image
  const generateCroppedImage = useCallback(async (): Promise<string> => {
    const maxDim = 4096;
    let srcW = imgW, srcH = imgH;
    if (srcW > maxDim || srcH > maxDim) {
      const r = Math.min(maxDim / srcW, maxDim / srcH);
      srcW = Math.round(srcW * r);
      srcH = Math.round(srcH * r);
    }

    // Source crop region in image pixels
    const sx = crop.x * srcW;
    const sy = crop.y * srcH;
    const sw = crop.w * srcW;
    const sh = crop.h * srcH;

    // Determine output dimensions based on aspect ratio of crop
    const outRatio = sw / sh;
    let outW = Math.round(sw);
    let outH = Math.round(sh);

    // For specific ratio presets, use exact target dimensions
    if (aspectRatio !== null && aspectRatio > 0 && !isOriginalRatio) {
      // Use the crop width, compute height from ratio
      outW = Math.round(sw);
      outH = Math.round(outW / aspectRatio);
    }

    // Apply max dimension constraint
    if (outW > maxDim || outH > maxDim) {
      const r = Math.min(maxDim / outW, maxDim / outH);
      outW = Math.round(outW * r);
      outH = Math.round(outH * r);
    }

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Apply shape mask clipping
    if (shapeMask) {
      ctx.save();
      clipCanvasToShape(ctx, shapeMask, 0, 0, outW, outH, 0.15);
    }

    // Apply rotation + straighten + flip
    ctx.save();
    ctx.translate(outW / 2, outH / 2);
    const totalRotation = ((rotation + straighten) * Math.PI) / 180;
    ctx.rotate(totalRotation);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    // Draw the image, accounting for zoom and pan
    // The source region is the crop area, but zoomed in
    const z = zoom;
    const zoomSw = sw / z;
    const zoomSh = sh / z;
    const zoomSx = sx + (sw - zoomSw) / 2 - (panX / displayRect.w) * srcW;
    const zoomSy = sy + (sh - zoomSh) / 2 - (panY / displayRect.h) * srcH;

    ctx.drawImage(image, zoomSx, zoomSy, zoomSw, zoomSh, -outW / 2, -outH / 2, outW, outH);
    ctx.restore();

    if (shapeMask) {
      ctx.restore();
    }

    return canvas.toDataURL('image/png');
  }, [image, imgW, imgH, crop, aspectRatio, isOriginalRatio, rotation, straighten, flipH, flipV, zoom, panX, panY, displayRect, shapeMask]);

  const handleDone = useCallback(async () => {
    const dataUrl = await generateCroppedImage();
    onDone({
      crop,
      rotation: (rotation + straighten) % 360,
      flipH,
      flipV,
      straighten: 0,
      shape: (shapeMask || 'rect') as ShapeType,
    }, dataUrl);
  }, [generateCroppedImage, onDone, crop, rotation, straighten, flipH, flipV, shapeMask]);

  // Crop rect in screen coordinates
  const cropScreen = {
    x: displayRect.x + crop.x * displayRect.w,
    y: displayRect.y + crop.y * displayRect.h,
    w: crop.w * displayRect.w,
    h: crop.h * displayRect.h,
  };

  const handleSize = 14;
  const handleTouchSize = 20;

  // Shape clip path for overlay
  const shapeClipPath = shapeMask ? getShapeClipPath(shapeMask, cropScreen) : null;

  const tools: { id: Tool; icon: typeof CropIcon; label: string }[] = [
    { id: 'crop', icon: CropIcon, label: 'Crop' },
    { id: 'rotate', icon: RotateCw, label: 'Rotate' },
    { id: 'flip', icon: FlipHorizontal, label: 'Flip' },
    { id: 'straighten', icon: RotateCcw, label: 'Straighten' },
    { id: 'aspect', icon: Maximize2, label: 'Aspect' },
    { id: 'shape', icon: Shapes, label: 'Shape' },
    { id: 'reset', icon: RotateCcw, label: 'Reset' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950 select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-900/80 backdrop-blur-md border-b border-neutral-800 shrink-0 safe-top">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-neutral-800 active:scale-95 transition-all">
            <X className="w-5 h-5 text-neutral-300" />
          </button>
          <span className="text-white font-semibold text-base">Crop</span>
          <button onClick={resetAll} className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all text-xs text-neutral-300 font-medium">
            Reset
          </button>
        </div>
        <button
          onClick={handleDone}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 transition-all text-sm font-semibold text-neutral-900"
        >
          <Check className="w-4 h-4" />
          Done
        </button>
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden min-h-0"
        style={{ touchAction: 'none' }}
      >
        {/* Image */}
        <div
          className="absolute"
          style={{
            left: displayRect.x + panX,
            top: displayRect.y + panY,
            width: displayRect.w,
            height: displayRect.h,
          }}
        >
          <img
            src={image.src}
            alt="crop"
            className="w-full h-full object-cover pointer-events-none"
            draggable={false}
            style={{
              transform: `scale(${zoom}) rotate(${straighten}deg)`,
              transformOrigin: 'center',
              transformStyle: 'preserve-3d',
            }}
          />
        </div>

        {/* Darkened overlay outside crop */}
        <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
          <defs>
            <mask id="cropMask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {shapeClipPath ? (
                <path d={shapeClipPath} fill="black" />
              ) : (
                <rect
                  x={cropScreen.x} y={cropScreen.y}
                  width={cropScreen.w} height={cropScreen.h}
                  fill="black" rx={shapeMask === 'rounded' ? Math.min(cropScreen.w, cropScreen.h) * 0.15 : 0}
                />
              )}
            </mask>
          </defs>
          <rect
            x="0" y="0" width="100%" height="100%"
            fill="rgba(0,0,0,0.65)"
            mask="url(#cropMask)"
          />
        </svg>

        {/* Crop box overlay (interactive) */}
        <div
          className="absolute"
          style={{
            left: cropScreen.x,
            top: cropScreen.y,
            width: cropScreen.w,
            height: cropScreen.h,
            touchAction: 'none',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={handleDoubleTap}
        >
          {/* Shape mask clip for grid + border */}
          <div
            className="absolute inset-0"
            style={shapeMask ? { clipPath: getShapeClipPathCSS(shapeMask) } : undefined}
          >
            {/* Border */}
            <div className="absolute inset-0 border-2 border-white/90" />

            {/* Rule of thirds grid */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
              <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
              <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
              <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
            </div>
          </div>

          {/* Corner handles */}
          {(['nw', 'ne', 'sw', 'se'] as const).map((h) => {
            const isLeft = h.includes('w');
            const isTop = h.includes('n');
            return (
              <div
                key={h}
                className="absolute"
                style={{
                  left: isLeft ? -handleSize / 2 : 'auto',
                  right: isLeft ? 'auto' : -handleSize / 2,
                  top: isTop ? -handleSize / 2 : 'auto',
                  bottom: isTop ? 'auto' : -handleSize / 2,
                  width: handleSize,
                  height: handleSize,
                }}
              >
                <div
                  className="absolute rounded-sm bg-white border-2 border-sky-500"
                  style={{
                    left: (handleSize - 10) / 2,
                    top: (handleSize - 10) / 2,
                    width: 10,
                    height: 10,
                  }}
                />
              </div>
            );
          })}

          {/* Edge handles */}
          {(['n', 's', 'e', 'w'] as const).map((h) => {
            const isHoriz = h === 'n' || h === 's';
            const isLeft = h === 'w';
            const isTop = h === 'n';
            return (
              <div
                key={h}
                className="absolute"
                style={{
                  left: isHoriz ? '50%' : (isLeft ? -handleTouchSize / 2 : 'auto'),
                  right: isHoriz ? 'auto' : (isLeft ? 'auto' : -handleTouchSize / 2),
                  top: isHoriz ? (isTop ? -handleTouchSize / 2 : 'auto') : '50%',
                  bottom: isHoriz ? (isTop ? 'auto' : -handleTouchSize / 2) : 'auto',
                  width: isHoriz ? handleTouchSize * 2 : handleTouchSize,
                  height: isHoriz ? handleTouchSize : handleTouchSize * 2,
                  transform: isHoriz ? 'translateX(-50%)' : 'translateY(-50%)',
                }}
              >
                <div
                  className="absolute bg-white/80 rounded-full"
                  style={
                    isHoriz
                      ? { left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 24, height: 4 }
                      : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 4, height: 24 }
                  }
                />
              </div>
            );
          })}
        </div>

        {/* Zoom indicator */}
        {zoom > 1.01 && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 text-amber-400 text-xs font-medium tabular-nums pointer-events-none">
            {zoom.toFixed(1)}x
          </div>
        )}

        {/* Straighten angle indicator */}
        {activeTool === 'straighten' && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg bg-black/60 text-white text-xs font-medium tabular-nums pointer-events-none">
            {straighten > 0 ? '+' : ''}{straighten.toFixed(1)}°
          </div>
        )}
      </div>

      {/* Tool-specific controls */}
      <div className="bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800 shrink-0 px-4 pt-3 pb-1 safe-bottom">
        {/* Rotate tool */}
        {activeTool === 'rotate' && (
          <div className="flex items-center justify-center gap-4 pb-3">
            <button
              onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
              className="flex flex-col items-center gap-1 px-6 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all"
            >
              <RotateCcw className="w-5 h-5 text-sky-400" />
              <span className="text-xs text-neutral-300">90° Left</span>
            </button>
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="flex flex-col items-center gap-1 px-6 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all"
            >
              <RotateCw className="w-5 h-5 text-sky-400" />
              <span className="text-xs text-neutral-300">90° Right</span>
            </button>
          </div>
        )}

        {/* Flip tool */}
        {activeTool === 'flip' && (
          <div className="flex items-center justify-center gap-4 pb-3">
            <button
              onClick={() => setFlipH(!flipH)}
              className={`flex flex-col items-center gap-1 px-6 py-2.5 rounded-xl transition-all active:scale-95 ${
                flipH ? 'bg-amber-500/15 text-amber-400' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              <FlipHorizontal className="w-5 h-5" />
              <span className="text-xs">Horizontal</span>
            </button>
            <button
              onClick={() => setFlipV(!flipV)}
              className={`flex flex-col items-center gap-1 px-6 py-2.5 rounded-xl transition-all active:scale-95 ${
                flipV ? 'bg-amber-500/15 text-amber-400' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              <FlipVertical className="w-5 h-5" />
              <span className="text-xs">Vertical</span>
            </button>
          </div>
        )}

        {/* Straighten tool */}
        {activeTool === 'straighten' && (
          <div className="pb-3 px-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-neutral-400">Straighten</span>
              <span className="text-xs text-amber-400 tabular-nums font-medium">
                {straighten > 0 ? '+' : ''}{straighten.toFixed(1)}°
              </span>
            </div>
            <input
              type="range"
              min={-45}
              max={45}
              step={0.5}
              value={straighten}
              onChange={(e) => setStraighten(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-neutral-600">-45°</span>
              <span className="text-[10px] text-neutral-600">0°</span>
              <span className="text-[10px] text-neutral-600">+45°</span>
            </div>
          </div>
        )}

        {/* Zoom slider (always available in crop mode) */}
        {activeTool === 'crop' && (
          <div className="pb-3 px-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-neutral-400">Zoom</span>
              <span className="text-xs text-neutral-500 tabular-nums">{zoom.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={100}
              max={500}
              value={zoom * 100}
              onChange={(e) => setZoom(Number(e.target.value) / 100)}
              className="w-full accent-amber-500"
            />
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-2">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                if (t.id === 'reset') {
                  resetAll();
                } else if (t.id === 'aspect') {
                  setShowAspectSheet(true);
                  setShowShapeSheet(false);
                  setActiveTool('aspect');
                } else if (t.id === 'shape') {
                  setShowShapeSheet(true);
                  setShowAspectSheet(false);
                  setActiveTool('shape');
                } else {
                  setShowAspectSheet(false);
                  setShowShapeSheet(false);
                  setActiveTool(t.id);
                }
              }}
              className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all active:scale-95 ${
                activeTool === t.id
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <t.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Current selection indicator */}
        <div className="flex items-center justify-center gap-2 pb-2">
          <span className="text-[11px] text-neutral-500">
            {aspectLabel}
            {shapeMask && ` · ${SHAPE_MASKS.find((s) => s.id === shapeMask)?.label}`}
          </span>
        </div>
      </div>

      {/* Aspect Ratio bottom sheet */}
      {showAspectSheet && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowAspectSheet(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative w-full bg-neutral-900 rounded-t-3xl border-t border-neutral-800 max-h-[70vh] overflow-y-auto no-scrollbar animate-slide-up safe-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-neutral-900 px-5 pt-4 pb-3 border-b border-neutral-800">
              <div className="w-10 h-1 rounded-full bg-neutral-700 mx-auto mb-3" />
              <h3 className="text-white font-semibold text-base">Aspect Ratio</h3>
            </div>

            <div className="px-5 py-4 space-y-5">
              {/* Common ratios */}
              <div>
                <p className="text-xs text-neutral-500 mb-2 font-medium uppercase tracking-wide">Common</p>
                <div className="grid grid-cols-4 gap-2">
                  {COMMON_RATIOS.map((r) => (
                    <button
                      key={r.label}
                      onClick={() => {
                        if (r.label === 'Original') {
                          applyAspect(null, 'Original', true);
                        } else {
                          applyAspect(r.ratio, r.label);
                        }
                        setShowAspectSheet(false);
                      }}
                      className={`py-2.5 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                        aspectLabel === r.label
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-neutral-800 text-neutral-300 border border-transparent'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Screen */}
              <div>
                <p className="text-xs text-neutral-500 mb-2 font-medium uppercase tracking-wide">Device</p>
                <button
                  onClick={() => { applyFullScreen(); setShowAspectSheet(false); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all active:scale-95 ${
                    aspectLabel === 'Full Screen'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-neutral-800 text-neutral-300 border border-transparent'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Full Screen</p>
                    <p className="text-xs text-neutral-500">
                      {window.innerWidth} × {window.innerHeight}
                    </p>
                  </div>
                </button>
              </div>

              {/* Social platforms */}
              <div>
                <p className="text-xs text-neutral-500 mb-2 font-medium uppercase tracking-wide">Social Media</p>
                <div className="flex gap-2 mb-3">
                  {SOCIAL_PLATFORMS.map((sp, idx) => {
                    const Icon = sp.icon;
                    return (
                      <button
                        key={sp.name}
                        onClick={() => setSocialTab(idx)}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 ${
                          socialTab === idx
                            ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {sp.name}
                      </button>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {SOCIAL_PLATFORMS[socialTab].presets.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => {
                        applyAspect(p.ratio, `${SOCIAL_PLATFORMS[socialTab].name} ${p.label}`);
                        setShowAspectSheet(false);
                      }}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                        aspectLabel === `${SOCIAL_PLATFORMS[socialTab].name} ${p.label}`
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom ratio */}
              <div>
                <p className="text-xs text-neutral-500 mb-2 font-medium uppercase tracking-wide">Custom</p>
                <div className="flex items-end gap-2 mb-3">
                  <div className="flex-1">
                    <label className="text-xs text-neutral-500 mb-1 block">Width</label>
                    <input
                      type="number"
                      min={1}
                      value={customW}
                      onChange={(e) => {
                        const v = Math.max(1, Math.round(Number(e.target.value)));
                        setCustomW(v);
                        if (customLocked) setCustomH(Math.round(v / (customW / customH || 1)));
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-neutral-800 text-white text-sm border border-neutral-700 focus:border-amber-500/50 outline-none"
                    />
                  </div>
                  <button
                    onClick={() => setCustomLocked(!customLocked)}
                    className="pb-2.5 px-2"
                  >
                    {customLocked
                      ? <Lock className="w-4 h-4 text-amber-400" />
                      : <Unlock className="w-4 h-4 text-neutral-500" />}
                  </button>
                  <div className="flex-1">
                    <label className="text-xs text-neutral-500 mb-1 block">Height</label>
                    <input
                      type="number"
                      min={1}
                      value={customH}
                      onChange={(e) => {
                        const v = Math.max(1, Math.round(Number(e.target.value)));
                        setCustomH(v);
                        if (customLocked) setCustomW(Math.round(v * (customW / customH || 1)));
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-neutral-800 text-white text-sm border border-neutral-700 focus:border-amber-500/50 outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={() => { applyCustom(); setShowAspectSheet(false); }}
                  className="w-full py-2.5 rounded-xl bg-amber-500/15 text-amber-400 text-sm font-medium border border-amber-500/30 active:scale-95 transition-all"
                >
                  Apply {customW} × {customH}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shape/Mask bottom sheet */}
      {showShapeSheet && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowShapeSheet(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative w-full bg-neutral-900 rounded-t-3xl border-t border-neutral-800 safe-bottom animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-4 pb-2">
              <div className="w-10 h-1 rounded-full bg-neutral-700 mx-auto mb-3" />
              <h3 className="text-white font-semibold text-base mb-3">Shape / Mask</h3>
              <div className="grid grid-cols-3 gap-3 pb-4">
                <button
                  onClick={() => { setShapeMask(null); setShowShapeSheet(false); }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all active:scale-95 ${
                    !shapeMask ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-neutral-800 text-neutral-300 border border-transparent'
                  }`}
                >
                  <CropIcon className="w-6 h-6" />
                  <span className="text-xs font-medium">None</span>
                </button>
                {SHAPE_MASKS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setShapeMask(s.id); setShowShapeSheet(false); }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all active:scale-95 ${
                      shapeMask === s.id ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-neutral-800 text-neutral-300 border border-transparent'
                    }`}
                  >
                    <div
                      className="w-10 h-10 border-2 border-current rounded-sm"
                      style={{ clipPath: getShapeClipPathCSS(s.id) }}
                    />
                    <span className="text-xs font-medium">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper: get SVG path for shape mask (for the dark overlay)
function getShapeClipPath(shape: ShapeMask, rect: { x: number; y: number; w: number; h: number }): string {
  const { x, y, w, h } = rect;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = Math.min(w, h) / 2;

  switch (shape) {
    case 'rect':
      return `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`;
    case 'rounded': {
      const rr = Math.min(w, h) * 0.15;
      return `M ${x + rr} ${y} L ${x + w - rr} ${y} Q ${x + w} ${y} ${x + w} ${y + rr} L ${x + w} ${y + h - rr} Q ${x + w} ${y + h} ${x + w - rr} ${y + h} L ${x + rr} ${y + h} Q ${x} ${y + h} ${x} ${y + h - rr} L ${x} ${y + rr} Q ${x} ${y} ${x + rr} ${y} Z`;
    }
    case 'circle':
      return `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
    case 'oval':
      return `M ${x} ${cy} A ${w / 2} ${h / 2} 0 1 0 ${x + w} ${cy} A ${w / 2} ${h / 2} 0 1 0 ${x} ${cy} Z`;
    case 'heart':
      return `M ${cx} ${y + h} C ${x - w * 0.1} ${y + h * 0.7} ${x + w * 0.1} ${y + h * 0.2} ${cx} ${y + h * 0.35} C ${x + w * 0.9} ${y + h * 0.2} ${x + w * 1.1} ${y + h * 0.7} ${cx} ${y + h} Z`;
    case 'star': {
      const pts: string[] = [];
      const outerR = r;
      const innerR = r * 0.4;
      for (let i = 0; i < 10; i++) {
        const angle = -Math.PI / 2 + (Math.PI / 5) * i;
        const rr = i % 2 === 0 ? outerR : innerR;
        const px = cx + rr * Math.cos(angle) * (w / Math.min(w, h));
        const py = cy + rr * Math.sin(angle) * (h / Math.min(w, h));
        pts.push(`${i === 0 ? 'M' : 'L'} ${px} ${py}`);
      }
      return pts.join(' ') + ' Z';
    }
    default:
      return `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`;
  }
}

// Helper: get CSS clip-path for shape mask (for grid + border display)
function getShapeClipPathCSS(shape: ShapeMask): string {
  switch (shape) {
    case 'rect':
      return 'inset(0)';
    case 'rounded':
      return 'inset(0 0 0 0 round 15%)';
    case 'circle':
      return 'circle(50% at 50% 50%)';
    case 'oval':
      return 'ellipse(50% 50% at 50% 50%)';
    case 'heart':
      return 'polygon(50% 100%, 0% 50%, 0% 25%, 25% 0%, 50% 25%, 75% 0%, 100% 25%, 100% 50%)';
    case 'star':
      return 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
    default:
      return 'inset(0)';
  }
}
