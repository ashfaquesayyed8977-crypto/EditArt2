import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Check, RotateCw, FlipHorizontal, FlipVertical, Maximize2,
  Smartphone, Instagram, Youtube, Facebook, Crop as CropIcon,
  X, RotateCcw, ZoomIn,
} from 'lucide-react';

interface CropPanelProps {
  onCrop: (crop: { x: number; y: number; w: number; h: number }) => void;
  onRotate: (deg: number) => void;
  onFlipH: () => void;
  onFlipV: () => void;
  currentCrop: { x: number; y: number; w: number; h: number } | null;
  onCancel: () => void;
  imageWidth: number;
  imageHeight: number;
  imageSrc: string;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

type Category = 'free' | 'fullscreen' | 'social' | 'custom';

interface Preset {
  label: string;
  ratio: number | null;
}

const COMMON_PRESETS: Preset[] = [
  { label: '1:1', ratio: 1 },
  { label: '4:3', ratio: 4 / 3 },
  { label: '3:4', ratio: 3 / 4 },
  { label: '16:9', ratio: 16 / 9 },
  { label: '9:16', ratio: 9 / 16 },
  { label: '3:2', ratio: 3 / 2 },
  { label: '2:3', ratio: 2 / 3 },
];

const SOCIAL_PRESETS: { platform: string; icon: typeof Instagram; presets: Preset[] }[] = [
  {
    platform: 'Instagram',
    icon: Instagram,
    presets: [
      { label: 'Post Portrait', ratio: 4 / 5 },
      { label: 'Post Square', ratio: 1 },
      { label: 'Post Landscape', ratio: 1.91 / 1 },
      { label: 'Story/Reel', ratio: 9 / 16 },
    ],
  },
  {
    platform: 'YouTube',
    icon: Youtube,
    presets: [
      { label: 'Video/Thumbnail', ratio: 16 / 9 },
      { label: 'Shorts', ratio: 9 / 16 },
      { label: 'Channel/Profile', ratio: 1 },
    ],
  },
  {
    platform: 'Facebook',
    icon: Facebook,
    presets: [
      { label: 'Post', ratio: 1 },
      { label: 'Portrait Post', ratio: 4 / 5 },
      { label: 'Story/Reel', ratio: 9 / 16 },
      { label: 'Cover', ratio: 16 / 9 },
    ],
  },
];

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export default function CropPanel({
  onCrop,
  onRotate,
  onFlipH,
  onFlipV,
  currentCrop,
  onCancel,
  imageWidth,
  imageHeight,
  imageSrc,
  rotation,
  flipH,
  flipV,
}: CropPanelProps) {
  const [category, setCategory] = useState<Category>('free');
  const [ratio, setRatio] = useState<number | null>(null);
  const [crop, setCrop] = useState(currentCrop || { x: 0, y: 0, w: 1, h: 1 });
  const [zoom, setZoom] = useState(1);
  const [socialPlatform, setSocialPlatform] = useState(0);
  const [customW, setCustomW] = useState(imageWidth || 1080);
  const [customH, setCustomH] = useState(imageHeight || 1080);
  const [selectedPresetLabel, setSelectedPresetLabel] = useState('Free');

  const previewRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Touch gesture state
  const gestureRef = useRef<{
    mode: 'pan' | 'pinch' | null;
    startX: number;
    startY: number;
    startCropX: number;
    startCropY: number;
    startDist: number;
    startZoom: number;
  }>({ mode: null, startX: 0, startY: 0, startCropX: 0, startCropY: 0, startDist: 0, startZoom: 1 });

  // Load image for preview
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.onload = () => { imgRef.current = img; };
    img.src = imageSrc;
  }, [imageSrc]);

  const applyRatio = useCallback((r: number | null, label: string) => {
    setRatio(r);
    setSelectedPresetLabel(label);
    if (r === null) {
      setCrop({ x: 0, y: 0, w: 1, h: 1 });
    } else {
      const imgRatio = imageWidth / imageHeight;
      let w: number, h: number;
      if (r >= 1) {
        h = clamp(1 / Math.max(r / imgRatio, 1), 0.1, 1);
        w = clamp(h * r, 0.1, 1);
      } else {
        w = clamp(1 / Math.max(imgRatio / r, 1), 0.1, 1);
        h = clamp(w / r, 0.1, 1);
      }
      // Center the crop
      const x = (1 - w) / 2;
      const y = (1 - h) / 2;
      setCrop({ x, y, w, h });
    }
    setZoom(1);
  }, [imageWidth, imageHeight]);

  const applyFullScreen = useCallback(() => {
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const screenRatio = screenW / screenH;
    const imgRatio = imageWidth / imageHeight;
    setRatio(screenRatio);
    setSelectedPresetLabel('Full Screen');

    let w: number, h: number;
    if (imgRatio > screenRatio) {
      h = 1;
      w = clamp(screenRatio / imgRatio, 0.1, 1);
    } else {
      w = 1;
      h = clamp(imgRatio / screenRatio, 0.1, 1);
    }
    setCrop({ x: (1 - w) / 2, y: (1 - h) / 2, w, h });
    setZoom(1);
  }, [imageWidth, imageHeight]);

  const applyCustom = useCallback(() => {
    const r = customW / customH;
    setRatio(r);
    setSelectedPresetLabel(`Custom ${customW}x${customH}`);
    const imgRatio = imageWidth / imageHeight;
    let w: number, h: number;
    if (r >= 1) {
      h = clamp(1 / Math.max(r / imgRatio, 1), 0.1, 1);
      w = clamp(h * r, 0.1, 1);
    } else {
      w = clamp(1 / Math.max(imgRatio / r, 1), 0.1, 1);
      h = clamp(w / r, 0.1, 1);
    }
    setCrop({ x: (1 - w) / 2, y: (1 - h) / 2, w, h });
    setZoom(1);
  }, [customW, customH, imageWidth, imageHeight]);

  const resetCrop = useCallback(() => {
    setRatio(null);
    setCrop({ x: 0, y: 0, w: 1, h: 1 });
    setZoom(1);
    setSelectedPresetLabel('Free');
  }, []);

  // Constrain crop when ratio is locked
  const constrainCrop = useCallback((newCrop: { x: number; y: number; w: number; h: number }, r: number | null) => {
    if (r === null) {
      return {
        x: clamp(newCrop.x, 0, 1 - newCrop.w),
        y: clamp(newCrop.y, 0, 1 - newCrop.h),
        w: clamp(newCrop.w, 0.1, 1),
        h: clamp(newCrop.h, 0.1, 1),
      };
    }
    // Keep ratio locked — adjust h based on w
    let w = clamp(newCrop.w, 0.1, 1);
    let h = w / r;
    if (h > 1) { h = 1; w = h * r; }
    const x = clamp(newCrop.x, 0, 1 - w);
    const y = clamp(newCrop.y, 0, 1 - h);
    return { x, y, w, h };
  }, []);

  // Draw preview
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas || !imgRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imgRef.current;
    const containerW = canvas.clientWidth;
    const containerH = canvas.clientHeight;

    // Determine preview canvas size based on crop ratio
    const cropRatio = crop.w / crop.h;
    let previewW = containerW;
    let previewH = previewW / cropRatio;
    if (previewH > containerH) {
      previewH = containerH;
      previewW = previewH * cropRatio;
    }

    canvas.width = previewW * window.devicePixelRatio;
    canvas.height = previewH * window.devicePixelRatio;
    canvas.style.width = `${previewW}px`;
    canvas.style.height = `${previewH}px`;

    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    ctx.clearRect(0, 0, previewW, previewH);

    // Draw dark background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, previewW, previewH);

    // Calculate source region from image
    const sx = crop.x * img.naturalWidth;
    const sy = crop.y * img.naturalHeight;
    const sw = crop.w * img.naturalWidth;
    const sh = crop.h * img.naturalHeight;

    // Apply zoom by adjusting source region
    const z = zoom;
    const zoomSw = sw / z;
    const zoomSh = sh / z;
    const zoomSx = sx + (sw - zoomSw) / 2;
    const zoomSy = sy + (sh - zoomSh) / 2;

    ctx.save();
    ctx.translate(previewW / 2, previewH / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(img, zoomSx, zoomSy, zoomSw, zoomSh, -previewW / 2, -previewH / 2, previewW, previewH);
    ctx.restore();

    // Draw grid lines (rule of thirds)
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo((previewW / 3) * i, 0);
      ctx.lineTo((previewW / 3) * i, previewH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, (previewH / 3) * i);
      ctx.lineTo(previewW, (previewH / 3) * i);
      ctx.stroke();
    }

    // Draw border
    ctx.strokeStyle = '#f5a524';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, previewW - 2, previewH - 2);
  }, [crop, zoom, rotation, flipH, flipV]);



  // Touch handlers for drag/pinch
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    if (e.pointerType === 'touch' && e.isPrimary === false) {
      // Second finger — start pinch
      const touches = (e.nativeEvent as PointerEvent).pointerId;
      const firstTouch = gestureRef.current;
      if (firstTouch.mode === 'pan') {
        // Calculate distance between two pointers
        const dist = Math.hypot(
          e.clientX - firstTouch.startX,
          e.clientY - firstTouch.startY
        );
        gestureRef.current = {
          mode: 'pinch',
          startX: firstTouch.startX,
          startY: firstTouch.startY,
          startCropX: firstTouch.startCropX,
          startCropY: firstTouch.startCropY,
          startDist: dist,
          startZoom: zoom,
        };
      }
      return;
    }

    gestureRef.current = {
      mode: 'pan',
      startX: e.clientX,
      startY: e.clientY,
      startCropX: crop.x,
      startCropY: crop.y,
      startDist: 0,
      startZoom: zoom,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const g = gestureRef.current;
    if (!g.mode) return;

    if (g.mode === 'pan') {
      const canvas = previewRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dx = (e.clientX - g.startX) / rect.width;
      const dy = (e.clientY - g.startY) / rect.height;

      setCrop((prev) => constrainCrop({
        ...prev,
        x: g.startCropX - dx,
        y: g.startCropY - dy,
      }, ratio));
    } else if (g.mode === 'pinch') {
      // Pinch zoom
      const scaleFactor = 1; // Would need both pointers; simplified
      const newZoom = clamp(g.startZoom * scaleFactor, 1, 4);
      setZoom(newZoom);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    gestureRef.current.mode = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // Wheel/touch zoom via slider
  const handleZoomChange = (v: number) => {
    setZoom(clamp(v, 1, 4));
  };

  // Handle crop control changes
  const handleXChange = (v: number) => {
    setCrop((prev) => constrainCrop({ ...prev, x: v / 100 }, ratio));
  };
  const handleYChange = (v: number) => {
    setCrop((prev) => constrainCrop({ ...prev, y: v / 100 }, ratio));
  };
  const handleWChange = (v: number) => {
    setCrop((prev) => constrainCrop({ ...prev, w: v / 100 }, ratio));
  };
  const handleHChange = (v: number) => {
    setCrop((prev) => constrainCrop({ ...prev, h: v / 100 }, ratio));
  };

  // Custom dimension handlers
  const handleCustomWChange = (v: number) => {
    setCustomW(Math.max(1, Math.round(v)));
  };
  const handleCustomHChange = (v: number) => {
    setCustomH(Math.max(1, Math.round(v)));
  };

  return (
    <div className="space-y-3">
      {/* Live Preview */}
      <div
        ref={containerRef}
        className="relative w-full bg-neutral-950 rounded-xl overflow-hidden flex items-center justify-center"
        style={{ height: '180px', touchAction: 'none' }}
      >
        <canvas
          ref={previewRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="touch-none cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
        />
        {/* Zoom indicator */}
        <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/60 text-amber-400 text-xs font-medium tabular-nums">
          {zoom.toFixed(1)}x
        </div>
        {/* Selected ratio indicator */}
        <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-black/60 text-white text-xs font-medium">
          {selectedPresetLabel}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {([
          { id: 'free' as const, label: 'Free', icon: CropIcon },
          { id: 'fullscreen' as const, label: 'Full Screen', icon: Smartphone },
          { id: 'social' as const, label: 'Social Media', icon: Instagram },
          { id: 'custom' as const, label: 'Custom', icon: Maximize2 },
        ]).map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setCategory(cat.id);
              if (cat.id === 'free') applyRatio(null, 'Free');
              if (cat.id === 'fullscreen') applyFullScreen();
            }}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 ${
              category === cat.id
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'bg-neutral-800 text-neutral-400 border border-transparent'
            }`}
          >
            <cat.icon className="w-3.5 h-3.5" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Category content */}
      <div className="max-h-[180px] overflow-y-auto no-scrollbar">
        {/* Free / Common ratios */}
        {category === 'free' && (
          <div className="grid grid-cols-4 gap-2">
            {COMMON_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyRatio(p.ratio, p.label)}
                className={`px-2 py-2.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${
                  selectedPresetLabel === p.label
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Full Screen */}
        {category === 'fullscreen' && (
          <div className="space-y-2">
            <button
              onClick={applyFullScreen}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all active:scale-95 ${
                selectedPresetLabel === 'Full Screen'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-neutral-800 text-neutral-300 border border-transparent'
              }`}
            >
              <Smartphone className="w-5 h-5" />
              <div className="text-left">
                <p className="text-sm font-medium">Full Screen Crop</p>
                <p className="text-xs text-neutral-500">
                  {window.innerWidth}x{window.innerHeight} ({window.innerWidth > window.innerHeight ? 'Landscape' : 'Portrait'})
                </p>
              </div>
            </button>
            <p className="text-xs text-neutral-500 text-center px-2">
              Crops the image to fill your device screen. Drag and pinch the preview to position.
            </p>
          </div>
        )}

        {/* Social Media */}
        {category === 'social' && (
          <div className="space-y-3">
            {/* Platform selector */}
            <div className="flex gap-2">
              {SOCIAL_PRESETS.map((sp, idx) => (
                <button
                  key={sp.platform}
                  onClick={() => setSocialPlatform(idx)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 ${
                    socialPlatform === idx
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  <sp.icon className="w-3.5 h-3.5" />
                  {sp.platform}
                </button>
              ))}
            </div>
            {/* Presets for selected platform */}
            <div className="grid grid-cols-2 gap-2">
              {SOCIAL_PRESETS[socialPlatform].presets.map((p) => {
                const PlatformIcon = SOCIAL_PRESETS[socialPlatform].icon;
                return (
                <button
                  key={p.label}
                  onClick={() => applyRatio(p.ratio, `${SOCIAL_PRESETS[socialPlatform].platform} ${p.label}`)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${
                    selectedPresetLabel === `${SOCIAL_PRESETS[socialPlatform].platform} ${p.label}`
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  <PlatformIcon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{p.label}</span>
                </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Custom */}
        {category === 'custom' && (
          <div className="space-y-3">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="text-xs text-neutral-400 mb-1 block">Width (px)</label>
                <input
                  type="number"
                  min={1}
                  value={customW}
                  onChange={(e) => handleCustomWChange(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-800 text-white text-sm border border-neutral-700 focus:border-amber-500/50 outline-none"
                />
              </div>
              <div className="text-neutral-500 pb-2">x</div>
              <div className="flex-1">
                <label className="text-xs text-neutral-400 mb-1 block">Height (px)</label>
                <input
                  type="number"
                  min={1}
                  value={customH}
                  onChange={(e) => handleCustomHChange(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 text-white text-sm border border-neutral-700 focus:border-amber-500/50 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={applyCustom}
                className="flex-1 py-2.5 rounded-xl bg-amber-500/15 text-amber-400 text-sm font-medium hover:bg-amber-500/20 active:scale-95 transition-all border border-amber-500/30"
              >
                Apply Custom Ratio
              </button>
              <button
                onClick={() => { applyRatio(null, 'Free'); setCategory('free'); }}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-sm font-medium hover:bg-neutral-700 active:scale-95 transition-all"
              >
                Free Crop
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Crop controls */}
      <div className="space-y-2 pt-1 border-t border-neutral-800">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-neutral-400">X Position</span>
            <span className="text-xs text-neutral-500 tabular-nums">{Math.round(crop.x * 100)}%</span>
          </div>
          <input type="range" min={0} max={100} value={crop.x * 100} onChange={(e) => handleXChange(Number(e.target.value))} className="w-full" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-neutral-400">Y Position</span>
            <span className="text-xs text-neutral-500 tabular-nums">{Math.round(crop.y * 100)}%</span>
          </div>
          <input type="range" min={0} max={100} value={crop.y * 100} onChange={(e) => handleYChange(Number(e.target.value))} className="w-full" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-neutral-400">Width</span>
            <span className="text-xs text-neutral-500 tabular-nums">{Math.round(crop.w * 100)}%</span>
          </div>
          <input type="range" min={10} max={100} value={crop.w * 100} onChange={(e) => handleWChange(Number(e.target.value))} className="w-full" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-neutral-400">Height</span>
            <span className="text-xs text-neutral-500 tabular-nums">{Math.round(crop.h * 100)}%</span>
          </div>
          <input type="range" min={10} max={100} value={crop.h * 100} onChange={(e) => handleHChange(Number(e.target.value))} className="w-full" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-neutral-400 flex items-center gap-1"><ZoomIn className="w-3 h-3" /> Zoom</span>
            <span className="text-xs text-neutral-500 tabular-nums">{zoom.toFixed(1)}x</span>
          </div>
          <input type="range" min={100} max={400} value={zoom * 100} onChange={(e) => handleZoomChange(Number(e.target.value) / 100)} className="w-full" />
        </div>
      </div>

      {/* Transform buttons */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onRotate(90)}
          className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all"
        >
          <RotateCw className="w-4 h-4 text-sky-400" />
          <span className="text-[10px] text-neutral-400">Rotate 90</span>
        </button>
        <button
          onClick={onFlipH}
          className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all active:scale-95 ${
            flipH ? 'bg-amber-500/15' : 'bg-neutral-800 hover:bg-neutral-700'
          }`}
        >
          <FlipHorizontal className={`w-4 h-4 ${flipH ? 'text-amber-400' : 'text-sky-400'}`} />
          <span className="text-[10px] text-neutral-400">Flip H</span>
        </button>
        <button
          onClick={onFlipV}
          className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all active:scale-95 ${
            flipV ? 'bg-amber-500/15' : 'bg-neutral-800 hover:bg-neutral-700'
          }`}
        >
          <FlipVertical className={`w-4 h-4 ${flipV ? 'text-amber-400' : 'text-sky-400'}`} />
          <span className="text-[10px] text-neutral-400">Flip V</span>
        </button>
        <button
          onClick={resetCrop}
          className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all"
        >
          <RotateCcw className="w-4 h-4 text-rose-400" />
          <span className="text-[10px] text-neutral-400">Reset</span>
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all text-sm text-white">
          Cancel
        </button>
        <button
          onClick={() => onCrop(crop)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 transition-all text-sm font-semibold text-neutral-900"
        >
          <Check className="w-4 h-4" /> Apply
        </button>
      </div>
    </div>
  );
}
