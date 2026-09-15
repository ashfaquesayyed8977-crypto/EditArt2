import { useState, useRef, useCallback, useEffect } from 'react';
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
  Layers,
} from 'lucide-react';
import { removeBg, preloadModel, isModelCached } from '../segmentationService';
import { fileToDataURL, loadImage, canvasToBlob, downloadBlob } from '../canvasUtils';
import { floodFill, featherMask } from '../magicTool';

type Tool = 'auto' | 'magic' | 'manual' | 'repair' | 'zoom';
type Stage = 'select' | 'edit' | 'processing' | 'error';
type AIPhase = 'idle' | 'downloading' | 'analyzing' | 'removing' | 'done';

interface Props {
  onBack: () => void;
}

interface HistoryEntry {
  imageData: ImageData;
}

export default function BackgroundEraser({ onBack }: Props) {
  const [stage, setStage] = useState<Stage>('select');
  const [originalUrl, setOriginalUrl] = useState('');
  const [originalBlob, setOriginalBlob] = useState<Blob | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('manual');
  const [brushSize, setBrushSize] = useState(40);
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
  const [aiPhase, setAiPhase] = useState<AIPhase>('idle');
  const [progressLabel, setProgressLabel] = useState('');
  const [progressValue, setProgressValue] = useState(0);
  const [magicTolerance, setMagicTolerance] = useState(32);
  const [hasAIBeenRun, setHasAIBeenRun] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<HistoryEntry[]>([]);
  const redoRef = useRef<HistoryEntry[]>([]);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const panStartRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  // ── Rendering ──────────────────────────────────────────────

  const renderDisplay = useCallback(() => {
    const display = displayCanvasRef.current;
    const mask = maskCanvasRef.current;
    const orig = originalCanvasRef.current;
    if (!display || !mask || !orig) return;

    const ctx = display.getContext('2d')!;
    ctx.clearRect(0, 0, display.width, display.height);
    ctx.drawImage(orig, 0, 0);
    // Keep pixels where mask is opaque, remove where transparent
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(mask, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  }, []);

  // ── History ────────────────────────────────────────────────

  const pushHistory = useCallback(() => {
    const mask = maskCanvasRef.current;
    if (!mask) return;
    const ctx = mask.getContext('2d')!;
    const data = ctx.getImageData(0, 0, mask.width, mask.height);
    historyRef.current.push({ imageData: data });
    if (historyRef.current.length > 30) historyRef.current.shift();
    setCanUndo(historyRef.current.length > 1);
    setCanRedo(redoRef.current.length > 0);
  }, []);

  // ── Image init ─────────────────────────────────────────────

  const initImage = useCallback(async (file: File) => {
    const dataUrl = await fileToDataURL(file);
    const img = await loadImage(dataUrl);
    setOriginalUrl(dataUrl);
    setOriginalBlob(file);
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
    maskCtx.fillStyle = 'rgba(0,0,0,1)';
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
    setAiPhase('idle');
    setStage('edit');
  }, []);

  // Set display canvas size once it's in the DOM
  useEffect(() => {
    if (stage === 'edit' && imgSize.w > 0 && !canvasReady) {
      const display = displayCanvasRef.current;
      if (display) {
        display.width = imgSize.w;
        display.height = imgSize.h;
        renderDisplay();
        setCanvasReady(true);
      }
    }
  }, [stage, imgSize, canvasReady, renderDisplay]);

  // Re-render when showOriginal toggles
  useEffect(() => {
    if (stage !== 'edit' || !canvasReady) return;
    const display = displayCanvasRef.current;
    const orig = originalCanvasRef.current;
    if (!display || !orig) return;
    if (showOriginal) {
      const ctx = display.getContext('2d')!;
      ctx.clearRect(0, 0, display.width, display.height);
      ctx.drawImage(orig, 0, 0);
    } else {
      renderDisplay();
    }
  }, [showOriginal, stage, canvasReady, renderDisplay]);

  // ── Canvas pointer → mask coords ───────────────────────────

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

  // ── Brush erase / restore ──────────────────────────────────

  const eraseAt = useCallback((from: { x: number; y: number }, to: { x: number; y: number }) => {
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
  }, [brushSize]);

  const restoreAt = useCallback((from: { x: number; y: number }, to: { x: number; y: number }) => {
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
  }, [brushSize]);

  // ── Pointer handlers ───────────────────────────────────────

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (activeTool === 'zoom') {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }
    if (activeTool === 'magic') {
      // Flood fill handled in click handler, not pointer drag
      return;
    }
    if (activeTool !== 'manual' && activeTool !== 'repair') return;
    e.preventDefault();
    setIsPainting(true);
    const pos = getCanvasPos(e);
    lastPointRef.current = pos;
    if (activeTool === 'manual') eraseAt(pos, pos);
    else restoreAt(pos, pos);
    renderDisplay();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [activeTool, getCanvasPos, eraseAt, restoreAt, renderDisplay, pan]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
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
  }, [isPanning, isPainting, getCanvasPos, activeTool, eraseAt, restoreAt, renderDisplay]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
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
  }, [isPanning, isPainting, pushHistory]);

  // ── Magic tool: flood-fill erase ────────────────────────────

  const handleMagicTap = useCallback((e: React.PointerEvent) => {
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

    // Apply to mask: where fillMask is 1, erase the mask (make transparent)
    const maskCtx = mask.getContext('2d')!;
    const maskData = maskCtx.getImageData(0, 0, mask.width, mask.height);
    for (let i = 0; i < feathered.length; i++) {
      if (feathered[i] > 0.5) {
        // Erase this area: reduce alpha proportionally
        const idx = i * 4 + 3;
        maskData.data[idx] = Math.round(maskData.data[idx] * (1 - feathered[i]));
      }
    }
    maskCtx.putImageData(maskData, 0, 0);
    pushHistory();
    renderDisplay();
  }, [activeTool, getCanvasPos, magicTolerance, pushHistory, renderDisplay]);

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
    setCanRedo(redoRef.current.length > 0);
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
    setCanUndo(historyRef.current.length > 1);
    setCanRedo(redoRef.current.length > 0);
  }, [renderDisplay]);

  // ── Auto ─────────────────────────────────────────────────

  const handleAuto = useCallback(async () => {
    if (!originalBlob) return;
    setStage('processing');
    setErrorMsg('');

    try {
      // Phase 1: Download model if not cached
      if (!isModelCached()) {
        setAiPhase('downloading');
        setProgressLabel('Downloading AI Model (20MB one-time)');
        setProgressValue(0);
        await preloadModel((key, current, total) => {
          const isDownload = key.includes('fetch') || key.includes('download') || key.includes('progress') || total > 100000;
          if (isDownload) {
            setAiPhase('downloading');
            const pct = total > 0 ? current / total : 0;
            setProgressValue(pct);
            setProgressLabel(`Downloading AI Model (20MB one-time) ${Math.round(pct * 100)}%`);
          }
        });
      }

      // Phase 2: Analyze image
      setAiPhase('analyzing');
      setProgressLabel('Analyzing image...');
      setProgressValue(0);

      const result = await removeBg(originalBlob, (key, current, total) => {
        const isDownload = key.includes('fetch') || key.includes('download') || key.includes('progress') || total > 100000;
        if (isDownload) {
          setAiPhase('downloading');
          const pct = total > 0 ? current / total : 0;
          setProgressValue(pct);
          setProgressLabel(`Downloading AI Model (20MB one-time) ${Math.round(pct * 100)}%`);
        } else if (key.includes('compute') || key.includes('inference')) {
          setAiPhase('removing');
          setProgressLabel('Removing background...');
          setProgressValue(total > 0 ? current / total : 0);
        } else {
          setAiPhase('analyzing');
          setProgressLabel('Analyzing image...');
          setProgressValue(total > 0 ? current / total : 0);
        }
      });

      // Phase 3: Apply the alpha mask with edge refinement
      const resultImg = await loadImage(result.url);
      const mask = maskCanvasRef.current;
      if (mask) {
        const ctx = mask.getContext('2d')!;
        ctx.clearRect(0, 0, mask.width, mask.height);

        // Draw the AI result at full mask resolution to extract alpha
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = mask.width;
        tempCanvas.height = mask.height;
        const tempCtx = tempCanvas.getContext('2d')!;
        tempCtx.drawImage(resultImg, 0, 0, mask.width, mask.height);
        const tempData = tempCtx.getImageData(0, 0, mask.width, mask.height);

        // Build mask: alpha channel from AI result becomes our mask alpha
        const maskData = ctx.createImageData(mask.width, mask.height);
        for (let i = 0; i < tempData.data.length; i += 4) {
          maskData.data[i] = 0;
          maskData.data[i + 1] = 0;
          maskData.data[i + 2] = 0;
          maskData.data[i + 3] = tempData.data[i + 3];
        }
        ctx.putImageData(maskData, 0, 0);
        pushHistory();
      }

      setHasAIBeenRun(true);
      setAiPhase('done');
      setProgressLabel(result.method === 'fallback' ? 'Background removed (basic mode)' : 'Background Removed');
      setStage('edit');
      renderDisplay();

      if (result.method === 'fallback') {
        setTimeout(() => {
          setErrorMsg('AI model is blocked in this preview environment. The basic color-difference method was used instead. For perfect results, use the Manual Eraser tools, or build the APK where the full AI model runs 100% offline.');
          setStage('error');
        }, 100);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred during background removal.';
      if (msg.includes('transferable') || msg.includes('Worker') || msg.includes('postMessage')) {
        setErrorMsg('Preview me Worker block hai, APK me 100% chalega. For testing use Manual Eraser.');
      } else {
        setErrorMsg(msg);
      }
      setStage('error');
    }
  }, [originalBlob, pushHistory, renderDisplay]);

  // ── Reset / Save ────────────────────────────────────────────

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

  const handleSave = useCallback(async () => {
    const display = displayCanvasRef.current;
    if (!display) return;
    const blob = await canvasToBlob(display, 'image/png', 1.0);
    downloadBlob(blob, `bg-erased-${Date.now()}.png`);
  }, []);

  const reset = useCallback(() => {
    setOriginalUrl('');
    setOriginalBlob(null);
    setErrorMsg('');
    maskCanvasRef.current = null;
    originalCanvasRef.current = null;
    historyRef.current = [];
    redoRef.current = [];
    setCanvasReady(false);
    setHasAIBeenRun(false);
    setAiPhase('idle');
    setStage('select');
  }, []);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await initImage(file);
    e.target.value = '';
  }, [initImage]);

  const zoomIn = () => setZoom((z) => Math.min(5, z + 0.5));
  const zoomOut = () => {
    setZoom((z) => Math.max(0.5, z - 0.5));
    if (zoom <= 1) setPan({ x: 0, y: 0 });
  };
  const fitToScreen = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const tools: { id: Tool; label: string; icon: typeof Sparkles }[] = [
    { id: 'auto', label: 'Auto', icon: Sparkles },
    { id: 'magic', label: 'Magic', icon: Wand2 },
    { id: 'manual', label: 'Manual', icon: Eraser },
    { id: 'repair', label: 'Repair', icon: Brush },
    { id: 'zoom', label: 'Zoom', icon: ZoomIn },
  ];

  const cursorForTool = (): string => {
    if (showOriginal) return 'default';
    switch (activeTool) {
      case 'manual': return 'crosshair';
      case 'repair': return 'cell';
      case 'magic': return 'pointer';
      case 'zoom': return 'grab';
      default: return 'default';
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 safe-top shrink-0">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-neutral-800/80 hover:bg-neutral-800 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Eraser className="w-4 h-4 text-rose-400 shrink-0" />
          <h1 className="text-base font-bold text-white truncate">Background Eraser</h1>
          {hasAIBeenRun && aiPhase === 'done' && (
            <span className="flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-medium shrink-0">
              <Check className="w-3 h-3" /> AI
            </span>
          )}
        </div>
        {stage === 'edit' && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowOriginal((v) => !v)}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-95 ${
                showOriginal ? 'bg-rose-500/15 text-rose-400' : 'bg-neutral-800/80 text-neutral-400 hover:bg-neutral-800'
              }`}
              title="Before / After"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-semibold shadow-lg shadow-rose-500/25 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              Save
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-3 pb-2 min-h-0">
        {/* Select stage */}
        {stage === 'select' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-fade-in">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-xl shadow-rose-500/20">
              <Eraser className="w-12 h-12 text-white" strokeWidth={2} />
            </div>
            <div className="text-center max-w-xs">
              <h2 className="text-xl font-bold text-white mb-2">Remove Backgrounds</h2>
              <p className="text-neutral-400 text-sm leading-relaxed">
                100% offline AI removes backgrounds from any photo — people, products, animals, objects. Manual touch-up tools included. Export as transparent PNG.
              </p>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold shadow-lg shadow-rose-500/25 active:scale-95 transition-all"
            >
              <Upload className="w-5 h-5" />
              Select Photo
            </button>
          </div>
        )}

        {/* Edit stage */}
        {stage === 'edit' && (
          <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
            {/* Canvas area — checkerboard behind, image on top */}
            <div className="flex-1 flex items-center justify-center min-h-0 relative overflow-hidden rounded-2xl bg-neutral-900/50">
              <div
                className="relative checkerboard rounded-xl overflow-hidden"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transition: isPanning ? 'none' : 'transform 0.15s ease-out',
                  transformOrigin: 'center',
                  maxWidth: '100%',
                  maxHeight: '100%',
                }}
              >
                <canvas
                  ref={displayCanvasRef}
                  onPointerDown={(e) => {
                    if (activeTool === 'magic') handleMagicTap(e);
                    else handlePointerDown(e);
                  }}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="block"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 'calc(100dvh - 280px)',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                    cursor: cursorForTool(),
                    touchAction: 'none',
                  }}
                />
              </div>

              {/* Floating status indicator */}
              {isPainting && (activeTool === 'manual' || activeTool === 'repair') && (
                <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur text-white text-[10px] font-medium pointer-events-none">
                  {activeTool === 'manual' ? 'Erasing' : 'Restoring'} • {brushSize}px
                </div>
              )}
              {activeTool === 'magic' && (
                <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur text-white text-[10px] font-medium pointer-events-none">
                  Tap area to erase
                </div>
              )}
            </div>

            {/* Compact controls */}
            <div className="shrink-0 pt-2 space-y-2">
              {/* Tool-specific controls */}
              {(activeTool === 'manual' || activeTool === 'repair') && (
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs text-neutral-400 w-12 shrink-0">
                    {activeTool === 'manual' ? 'Erase' : 'Keep'}
                  </span>
                  <input
                    type="range"
                    min={10}
                    max={150}
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs text-neutral-500 tabular-nums w-10 text-right shrink-0">{brushSize}px</span>
                </div>
              )}

              {activeTool === 'magic' && (
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs text-neutral-400 w-12 shrink-0">Tol</span>
                  <input
                    type="range"
                    min={4}
                    max={128}
                    value={magicTolerance}
                    onChange={(e) => setMagicTolerance(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs text-neutral-500 tabular-nums w-10 text-right shrink-0">{magicTolerance}</span>
                </div>
              )}

              {activeTool === 'zoom' && (
                <div className="flex items-center gap-2 px-1">
                  <button onClick={zoomOut} className="w-9 h-9 flex items-center justify-center rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all shrink-0">
                    <ZoomOut className="w-4 h-4 text-white" />
                  </button>
                  <span className="text-xs text-neutral-400 flex-1 text-center">{zoom.toFixed(1)}x</span>
                  <button onClick={zoomIn} className="w-9 h-9 flex items-center justify-center rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all shrink-0">
                    <ZoomIn className="w-4 h-4 text-white" />
                  </button>
                  <button onClick={fitToScreen} className="w-9 h-9 flex items-center justify-center rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all shrink-0">
                    <Maximize2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}

              {activeTool === 'auto' && (
                <button
                  onClick={handleAuto}
                  disabled={aiPhase === 'analyzing' || aiPhase === 'removing' || aiPhase === 'downloading'}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold shadow-lg shadow-rose-500/25 active:scale-95 transition-all disabled:opacity-60"
                >
                  <Sparkles className="w-5 h-5" />
                  {hasAIBeenRun ? 'Re-run Auto' : 'Auto Erase Background'}
                </button>
              )}

              {/* Undo / Redo / Reset — compact row */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUndo}
                  disabled={!canUndo}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all text-sm text-white disabled:opacity-30"
                >
                  <Undo2 className="w-4 h-4" /> Undo
                </button>
                <button
                  onClick={handleRedo}
                  disabled={!canRedo}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all text-sm text-white disabled:opacity-30"
                >
                  <Redo2 className="w-4 h-4" /> Redo
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all text-sm text-white"
                >
                  <RotateCcw className="w-4 h-4" /> Reset
                </button>
              </div>
            </div>

            {/* Bottom tool bar — fixed at bottom */}
            <div className="shrink-0 flex items-center justify-around pt-2 mt-1 border-t border-neutral-800 safe-bottom">
              {tools.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all active:scale-95 ${
                      isActive ? 'text-rose-400' : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">{tool.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Processing stage */}
        {stage === 'processing' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-fade-in px-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-neutral-800 border-t-rose-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                {aiPhase === 'downloading' ? (
                  <Layers className="w-9 h-9 text-rose-400 animate-pulse" />
                ) : (
                  <Sparkles className="w-9 h-9 text-rose-400 animate-pulse" />
                )}
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-white mb-1">
                {aiPhase === 'downloading' && 'Loading AI Model'}
                {aiPhase === 'analyzing' && 'Analyzing Image'}
                {aiPhase === 'removing' && 'Removing Background'}
                {aiPhase === 'done' && 'Done'}
              </h2>
              <p className="text-neutral-400 text-sm">{progressLabel}</p>
            </div>
            {/* Progress bar */}
            <div className="w-64 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-600 transition-all duration-300"
                style={{ width: `${Math.max(3, progressValue * 100)}%` }}
              />
            </div>
            {aiPhase === 'downloading' && (
              <div className="text-center max-w-xs">
                <p className="text-xs text-neutral-500">
                  One-time download for offline use. After this, Auto works without internet.
                </p>
                <p className="text-xs text-rose-400/70 font-medium mt-1 tabular-nums">
                  {Math.round(progressValue * 100)}%
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error stage */}
        {stage === 'error' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-red-500/15 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <div className="text-center max-w-xs">
              <h2 className="text-lg font-bold text-white mb-2">Background Removal Failed</h2>
              <p className="text-neutral-400 text-sm leading-relaxed">{errorMsg}</p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {originalUrl && (
                <button
                  onClick={() => setStage('edit')}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium active:scale-95 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  Back to Editor
                </button>
              )}
              <button
                onClick={reset}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 font-medium active:scale-95 transition-all"
              >
                <Upload className="w-4 h-4" />
                Select New Photo
              </button>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
