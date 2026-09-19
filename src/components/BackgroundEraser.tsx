import React, { useState, useRef, useCallback, useEffect } from 'react';
import { removeBackground } from '../lib/background-removal';
import {
  ArrowLeft,
  Upload,
  Download,
  Undo2,
  Redo2,
  Sparkles,
  Eraser,
  Wand2,
  Brush,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  AlertCircle,
  Maximize2,
  Check,
  Palette,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';

// ── Inlined Canvas & Magic Tool Utilities (100% Self-Contained) ───────────────

function fileToDataURL(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png', quality = 1.0): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas export to Blob failed'));
      },
      type,
      quality
    );
  });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * High-performance BFS flood-fill for the Magic Wand tool.
 */
function floodFill(imageData: ImageData, startX: number, startY: number, tolerance: number): Uint8Array {
  const { width, height, data } = imageData;
  const mask = new Uint8Array(width * height);
  if (startX < 0 || startX >= width || startY < 0 || startY >= height) return mask;

  const startIndex = (startY * width + startX) * 4;
  const targetR = data[startIndex];
  const targetG = data[startIndex + 1];
  const targetB = data[startIndex + 2];
  const targetA = data[startIndex + 3];

  if (targetA < 10) return mask;

  const tolSq = tolerance * tolerance * 3;
  const visited = new Uint8Array(width * height);
  const queue: number[] = [startX + startY * width];
  visited[startX + startY * width] = 1;

  while (queue.length > 0) {
    const curr = queue.pop()!;
    const cx = curr % width;
    const cy = Math.floor(curr / width);

    mask[curr] = 255;

    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
    ];

    for (let i = 0; i < 4; i++) {
      const [nx, ny] = neighbors[i];
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = nx + ny * width;
        if (!visited[nIdx]) {
          visited[nIdx] = 1;
          const pIdx = nIdx * 4;
          const dr = data[pIdx] - targetR;
          const dg = data[pIdx + 1] - targetG;
          const db = data[pIdx + 2] - targetB;
          const distSq = dr * dr + dg * dg + db * db;
          if (distSq <= tolSq && data[pIdx + 3] > 10) {
            queue.push(nIdx);
          }
        }
      }
    }
  }

  return mask;
}

/**
 * Feathering and edge anti-aliasing for smooth mask contours.
 */
function featherMask(mask: Uint8Array, width: number, height: number, radius = 1): Float32Array {
  const result = new Float32Array(width * height);
  const r = Math.max(1, Math.round(radius));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -r; dy <= r; dy++) {
        const ny = y + dy;
        if (ny >= 0 && ny < height) {
          for (let dx = -r; dx <= r; dx++) {
            const nx = x + dx;
            if (nx >= 0 && nx < width) {
              sum += mask[ny * width + nx];
              count++;
            }
          }
        }
      }
      result[y * width + x] = sum / (count * 255);
    }
  }

  return result;
}

/**
 * Intelligent Salient Edge & Background Segmentation Engine.
 * Runs completely client-side with zero WebAssembly fetch crashes.
 */
async function performSmartBackgroundRemoval(
  img: HTMLImageElement,
  onProgress: (phase: string, progress: number) => void
): Promise<ImageData> {
  const response = await fetch(img.src);
  const imageBlob = await response.blob();

  const result = await removeBackground(imageBlob, {
    model: 'u2netp',
    useWorker: false,
    preserveResolution: true,
    onProgress: (info: any) => {
      const progress = Number(info?.progress ?? 0);
      const message = String(info?.message ?? 'Processing image...');
      onProgress(message, Math.max(0, Math.min(1, progress / 100)));
    },
  });

  onProgress('Creating transparent cutout...', 0.95);

  const width = img.naturalWidth;
  const height = img.naturalHeight;

  // result.mask is an ImageData with dimensions (result.width, result.height).
  // The pixel values in result.mask.data are grayscale (R=G=B=maskByte, A=255).
  // In BackgroundEraser, the mask canvas requires the foreground saliency in the ALPHA channel (R=G=B=0, A=maskByte)
  // so that destination-in compositing, manual eraser (destination-out), restore (source-over),
  // and magic wand correctly operate on the alpha matte.
  const maskData = new ImageData(width, height);

  if (result.mask && result.mask.width === width && result.mask.height === height) {
    const src = result.mask.data;
    const dst = maskData.data;
    const count = width * height;
    for (let i = 0; i < count; i++) {
      dst[i * 4 + 3] = src[i * 4];
    }
  } else if (result.mask) {
    // If mask dimensions differ from the natural image dimensions, resample with smooth interpolation
    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = result.mask.width;
    srcCanvas.height = result.mask.height;
    const srcCtx = srcCanvas.getContext('2d')!;
    srcCtx.putImageData(result.mask, 0, 0);

    const dstCanvas = document.createElement('canvas');
    dstCanvas.width = width;
    dstCanvas.height = height;
    const dstCtx = dstCanvas.getContext('2d')!;
    dstCtx.imageSmoothingEnabled = true;
    dstCtx.imageSmoothingQuality = 'high';
    dstCtx.drawImage(srcCanvas, 0, 0, width, height);

    const scaled = dstCtx.getImageData(0, 0, width, height);
    const src = scaled.data;
    const dst = maskData.data;
    const count = width * height;
    for (let i = 0; i < count; i++) {
      dst[i * 4 + 3] = src[i * 4];
    }
  }

  if (result.cleanup) {
    result.cleanup();
  }

  onProgress('Background removed successfully', 1);
  return maskData;
}

// ── Types ────────────────────────────────────────────────────────────────────

type Tool = 'auto' | 'magic' | 'manual' | 'repair' | 'zoom';
type Stage = 'select' | 'edit' | 'processing' | 'error';
type BgMode = 'transparent' | 'solid' | 'image';

interface Props {
  onBack: () => void;
}

interface HistoryEntry {
  imageData: ImageData;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function BackgroundEraser({ onBack }: Props) {
  const [stage, setStage] = useState<Stage>('select');
  const [originalUrl, setOriginalUrl] = useState('');
  const [originalImg, setOriginalImg] = useState<HTMLImageElement | null>(null);

  // Tools & Canvas State
  const [activeTool, setActiveTool] = useState<Tool>('auto');
  const [brushSize, setBrushSize] = useState(38);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showOriginal, setShowOriginal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isPainting, setIsPainting] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [canvasReady, setCanvasReady] = useState(false);
  const [magicTolerance, setMagicTolerance] = useState(32);
  const [hasAIBeenRun, setHasAIBeenRun] = useState(false);

  // Background Options (Transparent, Solid, Image)
  const [bgMode, setBgMode] = useState<BgMode>('transparent');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [bgCustomImg, setBgCustomImg] = useState<HTMLImageElement | null>(null);

  // Progress
  const [progressLabel, setProgressLabel] = useState('');
  const [progressValue, setProgressValue] = useState(0);

  // Refs
  const fileRef = useRef<HTMLInputElement>(null);
  const bgFileRef = useRef<HTMLInputElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<HistoryEntry[]>([]);
  const redoRef = useRef<HistoryEntry[]>([]);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const panStartRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  // ── Render Display ──────────────────────────────────────────

  const renderDisplay = useCallback(() => {
    const display = displayCanvasRef.current;
    const mask = maskCanvasRef.current;
    const orig = originalCanvasRef.current;
    if (!display || !mask || !orig) return;

    if (display.width !== orig.width || display.height !== orig.height) {
      display.width = orig.width;
      display.height = orig.height;
    }

    const ctx = display.getContext('2d')!;
    ctx.clearRect(0, 0, display.width, display.height);

    // 1. Draw custom background if selected
    if (bgMode === 'solid') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, display.width, display.height);
    } else if (bgMode === 'image' && bgCustomImg) {
      ctx.drawImage(bgCustomImg, 0, 0, display.width, display.height);
    }

    // 2. Composite foreground subject with alpha mask
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = display.width;
    tempCanvas.height = display.height;
    const tCtx = tempCanvas.getContext('2d')!;

    tCtx.drawImage(orig, 0, 0);
    tCtx.globalCompositeOperation = 'destination-in';
    tCtx.drawImage(mask, 0, 0);

    ctx.drawImage(tempCanvas, 0, 0);
  }, [bgMode, bgColor, bgCustomImg]);

  // ── History Management ──────────────────────────────────────

  const pushHistory = useCallback(() => {
    const mask = maskCanvasRef.current;
    if (!mask) return;

    const ctx = mask.getContext('2d')!;
    const data = ctx.getImageData(0, 0, mask.width, mask.height);
    historyRef.current.push({ imageData: data });

    if (historyRef.current.length > 30) {
      historyRef.current.shift();
    }
    redoRef.current = [];
    setCanUndo(historyRef.current.length > 1);
    setCanRedo(false);
  }, []);

  // ── Init Image ─────────────────────────────────────────────

  const initImage = useCallback(async (file: File) => {
    const dataUrl = await fileToDataURL(file);
    const img = await loadImage(dataUrl);

    setOriginalUrl(dataUrl);
    setOriginalImg(img);
    setImgSize({ w: img.naturalWidth, h: img.naturalHeight });

    const origCanvas = document.createElement('canvas');
    origCanvas.width = img.naturalWidth;
    origCanvas.height = img.naturalHeight;
    origCanvas.getContext('2d')!.drawImage(img, 0, 0);
    originalCanvasRef.current = origCanvas;

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = img.naturalWidth;
    maskCanvas.height = img.naturalHeight;
    const maskCtx = maskCanvas.getContext('2d')!;
    maskCtx.fillStyle = '#000000';
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    maskCanvasRef.current = maskCanvas;

    historyRef.current = [];
    redoRef.current = [];
    const data = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    historyRef.current.push({ imageData: data });

    setCanUndo(false);
    setCanRedo(false);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setShowOriginal(false);
    setCanvasReady(false);
    setHasAIBeenRun(false);
    setBgMode('transparent');
    setStage('edit');
    setActiveTool('auto');
  }, []);

  useEffect(() => {
    if ((stage === 'edit' || stage === 'processing') && imgSize.w > 0) {
      const display = displayCanvasRef.current;
      if (display && (display.width !== imgSize.w || display.height !== imgSize.h || !canvasReady)) {
        display.width = imgSize.w;
        display.height = imgSize.h;
        renderDisplay();
        setCanvasReady(true);
      }
    }
  }, [stage, imgSize, canvasReady, renderDisplay]);

  useEffect(() => {
    if (stage !== 'edit' || !canvasReady) return;
    const display = displayCanvasRef.current;
    const orig = originalCanvasRef.current;
    if (!display || !orig) return;

    if (display.width !== orig.width || display.height !== orig.height) {
      display.width = orig.width;
      display.height = orig.height;
    }

    if (showOriginal) {
      const ctx = display.getContext('2d')!;
      ctx.clearRect(0, 0, display.width, display.height);
      ctx.drawImage(orig, 0, 0);
    } else {
      renderDisplay();
    }
  }, [showOriginal, stage, canvasReady, renderDisplay]);

  // ── Coordinates Helper ─────────────────────────────────────

  const getCanvasPos = useCallback((e: React.PointerEvent): { x: number; y: number } => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    };
  }, []);

  // ── Brush Erase / Restore ───────────────────────────────────

  const eraseAt = useCallback(
    (from: { x: number; y: number }, to: { x: number; y: number }) => {
      const mask = maskCanvasRef.current;
      if (!mask) return;
      const ctx = mask.getContext('2d')!;
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';

      const dist = Math.hypot(to.x - from.x, to.y - from.y);
      const steps = Math.max(1, Math.ceil(dist / (brushSize * 0.3)));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        ctx.beginPath();
        ctx.arc(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, brushSize, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },
    [brushSize]
  );

  const restoreAt = useCallback(
    (from: { x: number; y: number }, to: { x: number; y: number }) => {
      const mask = maskCanvasRef.current;
      if (!mask) return;
      const ctx = mask.getContext('2d')!;
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(0,0,0,1)';

      const dist = Math.hypot(to.x - from.x, to.y - from.y);
      const steps = Math.max(1, Math.ceil(dist / (brushSize * 0.3)));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        ctx.beginPath();
        ctx.arc(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, brushSize, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },
    [brushSize]
  );

  // ── Pointer Handlers ───────────────────────────────────────

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (activeTool === 'zoom') {
        setIsPanning(true);
        panStartRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }
      if (activeTool === 'magic') return;
      if (activeTool !== 'manual' && activeTool !== 'repair') return;

      e.preventDefault();
      setIsPainting(true);
      const pos = getCanvasPos(e);
      lastPointRef.current = pos;

      if (activeTool === 'manual') eraseAt(pos, pos);
      else restoreAt(pos, pos);

      renderDisplay();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [activeTool, getCanvasPos, eraseAt, restoreAt, renderDisplay, pan]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (isPanning && panStartRef.current) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        setPan({ x: panStartRef.current.px + dx, y: panStartRef.current.py + dy });
        return;
      }
      if (!isPainting) return;

      const pos = getCanvasPos(e);
      const last = lastPointRef.current;
      if (!last) return;

      if (activeTool === 'manual') eraseAt(last, pos);
      else if (activeTool === 'repair') restoreAt(last, pos);

      lastPointRef.current = pos;
      renderDisplay();
    },
    [isPanning, isPainting, getCanvasPos, activeTool, eraseAt, restoreAt, renderDisplay]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (isPanning) {
        setIsPanning(false);
        panStartRef.current = null;
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
        return;
      }
      if (isPainting) {
        setIsPainting(false);
        lastPointRef.current = null;
        pushHistory();
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      }
    },
    [isPanning, isPainting, pushHistory]
  );

  // ── Magic Tap Handler ──────────────────────────────────────

  const handleMagicTap = useCallback(
    (e: React.PointerEvent) => {
      if (activeTool !== 'magic') return;
      e.preventDefault();

      const orig = originalCanvasRef.current;
      const mask = maskCanvasRef.current;
      if (!orig || !mask) return;

      const pos = getCanvasPos(e);
      const ctx = orig.getContext('2d')!;
      const imageData = ctx.getImageData(0, 0, orig.width, orig.height);
      const fillMask = floodFill(imageData, pos.x, pos.y, magicTolerance);
      const feathered = featherMask(fillMask, orig.width, orig.height, 1);

      const maskCtx = mask.getContext('2d')!;
      const maskData = maskCtx.getImageData(0, 0, mask.width, mask.height);

      for (let i = 0; i < feathered.length; i++) {
        if (feathered[i] > 0.3) {
          const idx = i * 4 + 3;
          maskData.data[idx] = Math.round(maskData.data[idx] * (1 - feathered[i]));
        }
      }

      maskCtx.putImageData(maskData, 0, 0);
      pushHistory();
      renderDisplay();
    },
    [activeTool, getCanvasPos, magicTolerance, pushHistory, renderDisplay]
  );

  // ── Undo / Redo ────────────────────────────────────────────

  const handleUndo = useCallback(() => {
    if (historyRef.current.length <= 1) return;
    const current = historyRef.current.pop()!;
    redoRef.current.push(current);

    const prev = historyRef.current[historyRef.current.length - 1];
    const mask = maskCanvasRef.current;
    if (mask && prev) {
      mask.getContext('2d')!.putImageData(prev.imageData, 0, 0);
      renderDisplay();
    }
    setCanUndo(historyRef.current.length > 1);
    setCanRedo(true);
  }, [renderDisplay]);

  const handleRedo = useCallback(() => {
    if (redoRef.current.length === 0) return;
    const entry = redoRef.current.pop()!;
    historyRef.current.push(entry);

    const mask = maskCanvasRef.current;
    if (mask) {
      mask.getContext('2d')!.putImageData(entry.imageData, 0, 0);
      renderDisplay();
    }
    setCanUndo(true);
    setCanRedo(redoRef.current.length > 0);
  }, [renderDisplay]);

  // ── Auto Background Removal ────────────────────────────────

  const handleAuto = useCallback(async () => {
    if (!originalImg) return;
    setStage('processing');
    setErrorMsg('');

    try {
      const maskImageData = await performSmartBackgroundRemoval(originalImg, (label, val) => {
        setProgressLabel(label);
        setProgressValue(val);
      });

      const mask = maskCanvasRef.current;

if (mask) {
  const ctx = mask.getContext('2d')!;

  // Safety check: AI mask must match original canvas
  if (
    maskImageData.width !== mask.width ||
    maskImageData.height !== mask.height
  ) {
    throw new Error(
      `AI mask size mismatch: ${maskImageData.width}x${maskImageData.height} instead of ${mask.width}x${mask.height}`
    );
  }

  ctx.clearRect(
    0,
    0,
    mask.width,
    mask.height
  );

  ctx.putImageData(
    maskImageData,
    0,
    0
  );

  pushHistory();
}

      setHasAIBeenRun(true);
      setStage('edit');
      const display = displayCanvasRef.current;
      if (display && (display.width !== originalImg.naturalWidth || display.height !== originalImg.naturalHeight)) {
        display.width = originalImg.naturalWidth;
        display.height = originalImg.naturalHeight;
      }
      renderDisplay();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to complete automatic background removal.';
      setErrorMsg(msg);
      setStage('error');
    }
  }, [originalImg, pushHistory, renderDisplay]);

  // ── Reset & Save ───────────────────────────────────────────

  const handleReset = useCallback(() => {
    const mask = maskCanvasRef.current;
    if (mask) {
      const ctx = mask.getContext('2d')!;
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.fillRect(0, 0, mask.width, mask.height);
      pushHistory();
      renderDisplay();
    }
  }, [pushHistory, renderDisplay]);

  const handleClear = useCallback(() => {
    const mask = maskCanvasRef.current;
    if (mask) {
      const ctx = mask.getContext('2d')!;
      ctx.clearRect(0, 0, mask.width, mask.height);
      pushHistory();
      renderDisplay();
    }
  }, [pushHistory, renderDisplay]);

  const handleSave = useCallback(async () => {
    const display = displayCanvasRef.current;
    if (!display) return;
    const blob = await canvasToBlob(display, 'image/png', 1.0);
    downloadBlob(blob, `editart2-bg-removed-${Date.now()}.png`);
  }, []);

  const resetAll = useCallback(() => {
    setOriginalUrl('');
    setOriginalImg(null);
    setErrorMsg('');
    maskCanvasRef.current = null;
    originalCanvasRef.current = null;
    historyRef.current = [];
    redoRef.current = [];
    setCanvasReady(false);
    setHasAIBeenRun(false);
    setStage('select');
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        await initImage(file);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Unable to load photo.');
        setStage('error');
      }
      e.target.value = '';
    },
    [initImage]
  );

  const handleBgImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await fileToDataURL(file);
    const img = await loadImage(url);
    setBgCustomImg(img);
    setBgMode('image');
    e.target.value = '';
  }, []);

  const tools: { id: Tool; label: string; icon: typeof Sparkles }[] = [
    { id: 'auto', label: 'Auto AI', icon: Sparkles },
    { id: 'magic', label: 'Magic', icon: Wand2 },
    { id: 'manual', label: 'Erase', icon: Eraser },
    { id: 'repair', label: 'Restore', icon: Brush },
    { id: 'zoom', label: 'Zoom', icon: ZoomIn },
  ];

  const cursorForTool = (): string => {
    if (showOriginal) return 'default';
    switch (activeTool) {
      case 'manual':
        return 'crosshair';
      case 'repair':
        return 'cell';
      case 'magic':
        return 'pointer';
      case 'zoom':
        return 'grab';
      default:
        return 'default';
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 overflow-hidden select-none">
      {/* Top Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 shrink-0 border-b border-neutral-800/80 bg-neutral-950/70 backdrop-blur">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-neutral-800/80 hover:bg-neutral-800 active:scale-95 transition-all text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Eraser className="w-4 h-4 text-rose-400 shrink-0" />
          <h1 className="text-base font-bold text-white truncate">Background Eraser</h1>
          {hasAIBeenRun && (
            <span className="flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-medium shrink-0">
              <Check className="w-3 h-3" /> Cutout
            </span>
          )}
        </div>

        {stage === 'edit' && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowOriginal((v) => !v)}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-95 ${
                showOriginal ? 'bg-rose-500/20 text-rose-400' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
              title="Hold to view original photo"
            >
              <Eye className="w-4 h-4" />
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-semibold shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" /> Save
            </button>
          </div>
        )}
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col px-3 pb-2 min-h-0">
        {/* Stage 1: Select Image */}
        {stage === 'select' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-fade-in">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-xl shadow-rose-500/20">
              <Eraser className="w-12 h-12 text-white" strokeWidth={2} />
            </div>

            <div className="text-center max-w-xs">
              <h2 className="text-xl font-bold text-white mb-2">Instant Background Cutout</h2>
              <p className="text-neutral-400 text-xs leading-relaxed">
                100% offline edge cutout for people, products, animals, and objects. Manual eraser, magic wand & custom
                backdrops included.
              </p>
            </div>

            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold text-sm shadow-lg shadow-rose-500/25 active:scale-95 transition-all"
            >
              <Upload className="w-5 h-5" /> Select Photo
            </button>
          </div>
        )}

        {/* Stage 2: Editor (retained during processing to prevent canvas destruction) */}
        {(stage === 'edit' || stage === 'processing') && (
          <div className="flex-1 flex flex-col min-h-0 pt-2 animate-fade-in relative">
            {/* Canvas Stage */}
            <div className="flex-1 flex items-center justify-center min-h-0 relative overflow-hidden rounded-2xl bg-neutral-900/60 border border-neutral-800/60">
              <div
                className="relative rounded-xl overflow-hidden shadow-2xl"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transition: isPanning ? 'none' : 'transform 0.12s ease-out',
                  transformOrigin: 'center',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  backgroundImage:
                    bgMode === 'transparent'
                      ? 'linear-gradient(45deg, #1c1c1c 25%, transparent 25%), linear-gradient(-45deg, #1c1c1c 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1c1c1c 75%), linear-gradient(-45deg, transparent 75%, #1c1c1c 75%)'
                      : 'none',
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                }}
              >
                <canvas
                  ref={displayCanvasRef}
                  width={imgSize.w || 300}
                  height={imgSize.h || 150}
                  onPointerDown={(e) => {
                    if (stage === 'processing') return;
                    if (activeTool === 'magic') handleMagicTap(e);
                    else handlePointerDown(e);
                  }}
                  onPointerMove={(e) => {
                    if (stage === 'processing') return;
                    handlePointerMove(e);
                  }}
                  onPointerUp={(e) => {
                    if (stage === 'processing') return;
                    handlePointerUp(e);
                  }}
                  className="block"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 'calc(100dvh - 300px)',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                    cursor: stage === 'processing' ? 'wait' : cursorForTool(),
                    touchAction: 'none',
                  }}
                />
              </div>

              {/* Status Pill */}
              {isPainting && (activeTool === 'manual' || activeTool === 'repair') && stage === 'edit' && (
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur text-white text-[11px] font-medium pointer-events-none">
                  {activeTool === 'manual' ? 'Erasing' : 'Restoring'} • {brushSize}px
                </div>
              )}
              {activeTool === 'magic' && stage === 'edit' && (
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur text-rose-300 text-[11px] font-medium pointer-events-none">
                  Tap color to erase
                </div>
              )}

              {/* Processing Modal Overlay */}
              {stage === 'processing' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 px-6 bg-neutral-950/85 backdrop-blur-md animate-fade-in">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-neutral-800 border-t-rose-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-rose-400 animate-pulse" />
                    </div>
                  </div>

                  <div className="text-center">
                    <h2 className="text-base font-bold text-white mb-1">Removing Background</h2>
                    <p className="text-neutral-400 text-xs">{progressLabel}</p>
                  </div>

                  <div className="w-60 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-600 transition-all duration-200"
                      style={{ width: `${Math.max(5, progressValue * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Context Tool Controls & Bottom Navigation */}
            {stage === 'edit' && (
              <>
                {/* Context Tool Controls */}
                <div className="shrink-0 pt-2 space-y-2">
              {/* Brush Sliders for Manual & Repair */}
              {(activeTool === 'manual' || activeTool === 'repair') && (
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs text-neutral-400 w-12 shrink-0">
                    {activeTool === 'manual' ? 'Eraser' : 'Restore'}
                  </span>
                  <input
                    type="range"
                    min={10}
                    max={120}
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="flex-1 accent-rose-500"
                  />
                  <span className="text-xs text-neutral-500 tabular-nums w-10 text-right shrink-0">{brushSize}px</span>
                </div>
              )}

              {/* Magic Wand Slider */}
              {activeTool === 'magic' && (
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs text-neutral-400 w-16 shrink-0">Tolerance</span>
                  <input
                    type="range"
                    min={4}
                    max={90}
                    value={magicTolerance}
                    onChange={(e) => setMagicTolerance(Number(e.target.value))}
                    className="flex-1 accent-rose-500"
                  />
                  <span className="text-xs text-neutral-500 tabular-nums w-8 text-right shrink-0">{magicTolerance}</span>
                </div>
              )}

              {/* Zoom Buttons */}
              {activeTool === 'zoom' && (
                <div className="flex items-center gap-2 px-1">
                  <button
                    onClick={() => setZoom((z) => Math.max(0.5, z - 0.5))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-800 text-white active:scale-95"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-neutral-400 flex-1 text-center font-mono">{zoom.toFixed(1)}x</span>
                  <button
                    onClick={() => setZoom((z) => Math.min(5, z + 0.5))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-800 text-white active:scale-95"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setZoom(1);
                      setPan({ x: 0, y: 0 });
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-800 text-white active:scale-95"
                    title="Fit to Screen"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Auto Button Trigger */}
              {activeTool === 'auto' && (
                <button
                  onClick={handleAuto}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-semibold shadow-md shadow-rose-500/20 active:scale-95 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  {hasAIBeenRun ? 'Re-run Auto Cutout' : 'Auto Cutout Subject'}
                </button>
              )}

              {/* Background Style Switcher */}
              <div className="flex items-center gap-2 px-1 pt-1 border-t border-neutral-800/60">
                <span className="text-[11px] text-neutral-400 shrink-0">Backdrop:</span>
                <button
                  onClick={() => setBgMode('transparent')}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                    bgMode === 'transparent' ? 'bg-rose-500/20 text-rose-300' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  Transparent
                </button>
                <button
                  onClick={() => setBgMode('solid')}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium flex items-center gap-1 transition-all ${
                    bgMode === 'solid' ? 'bg-rose-500/20 text-rose-300' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  <Palette className="w-3 h-3" /> Color
                </button>
                {bgMode === 'solid' && (
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                )}
                <button
                  onClick={() => bgFileRef.current?.click()}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium flex items-center gap-1 transition-all ${
                    bgMode === 'image' ? 'bg-rose-500/20 text-rose-300' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  <ImageIcon className="w-3 h-3" /> Image
                </button>
              </div>

              {/* Undo / Redo / Reset Bar */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUndo}
                  disabled={!canUndo}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 active:scale-95 text-xs text-white disabled:opacity-30"
                >
                  <Undo2 className="w-3.5 h-3.5" /> Undo
                </button>
                <button
                  onClick={handleRedo}
                  disabled={!canRedo}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 active:scale-95 text-xs text-white disabled:opacity-30"
                >
                  <Redo2 className="w-3.5 h-3.5" /> Redo
                </button>
                <button
                  onClick={handleClear}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 active:scale-95 text-xs text-neutral-300"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 active:scale-95 text-xs text-neutral-300"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
              </div>
            </div>

            {/* Bottom Tool Navigation */}
            <div className="shrink-0 flex items-center justify-around pt-2 mt-1 border-t border-neutral-800/80">
              {tools.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all active:scale-95 ${
                      isActive ? 'text-rose-400 font-semibold' : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px]">{tool.label}</span>
                  </button>
                );
              })}
            </div>
              </>
            )}
          </div>
        )}

        {/* Stage 4: Error State */}
        {stage === 'error' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-red-500/15 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <div className="text-center max-w-xs">
              <h2 className="text-base font-bold text-white mb-1">Process Issue</h2>
              <p className="text-neutral-400 text-xs leading-relaxed">{errorMsg}</p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {originalUrl && (
                <button
                  onClick={() => setStage('edit')}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" /> Return to Editor
                </button>
              )}
              <button
                onClick={resetAll}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 text-xs font-medium active:scale-95"
              >
                <Upload className="w-4 h-4" /> Select Different Photo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={bgFileRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleBgImageUpload}
      />
    </div>
  );
      }
