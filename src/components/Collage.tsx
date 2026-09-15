import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { ArrowLeft, Download, X, Plus, ZoomIn, ZoomOut, RotateCw, Grid2x2 } from 'lucide-react';
import type { CollagePhoto, CollageTemplate, TemplateCategory, AspectRatio } from '../types';
import { shapeClipPath, clipCanvasToShape } from '../shapeSystem';
import {
  ALL_TEMPLATES, TEMPLATE_CATEGORIES, CATEGORY_LABELS,
  getTemplatesByCategory, ASPECT_RATIOS, aspectRatioValue,
} from '../collageTemplates';
import { loadImage, canvasToBlob, getQualityValue, getMimeType, downloadBlob, fileToDataURL } from '../canvasUtils';
import ExportPanel from './panels/ExportPanel';
import TemplateThumbnail from './TemplateThumbnail';

interface CollageProps {
  onBack: () => void;
}

export default function Collage({ onBack }: CollageProps) {
  const [template, setTemplate] = useState<CollageTemplate>(ALL_TEMPLATES[1]); // 2 Vertical
  const [photos, setPhotos] = useState<(CollagePhoto | null)[]>([]);
  const [borderThickness, setBorderThickness] = useState(8);
  const [borderColor, setBorderColor] = useState('#ffffff');
  const [cornerRadius, setCornerRadius] = useState(0);
  const [spacing, setSpacing] = useState(4);
  const [bgColor, setBgColor] = useState('#1a1a1a');
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [bgTransparent, setBgTransparent] = useState(false);
  const [bgGradient, setBgGradient] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('grid');
  const [showExport, setShowExport] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bgFileRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ slot: number; startX: number; startY: number; offsetX: number; offsetY: number } | null>(null);

  // Resize photos array when template changes — preserve existing photos
  useEffect(() => {
    setPhotos((prev) => {
      const arr = new Array(template.slotCount).fill(null);
      for (let i = 0; i < Math.min(prev.length, arr.length); i++) arr[i] = prev[i];
      return arr;
    });
  }, [template]);

  const aspectRatio = aspectRatioValue(template.aspectRatio);

  // ── Canvas rendering for Save/export ──────────────────────

  const renderToCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseSize = 1080;
    const w = aspectRatio >= 1 ? baseSize : Math.round(baseSize * aspectRatio);
    const h = aspectRatio >= 1 ? Math.round(baseSize / aspectRatio) : baseSize;
    canvas.width = w;
    canvas.height = h;

    // Background
    if (bgTransparent) {
      ctx.clearRect(0, 0, w, h);
    } else if (bgGradient) {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      const colors = bgGradient.split(',');
      colors.forEach((c, i) => grad.addColorStop(i / Math.max(1, colors.length - 1), c.trim()));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    } else if (bgImage) {
      ctx.drawImage(bgImage, 0, 0, w, h);
    } else {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);
    }

    const bt = borderThickness;
    const sp = spacing;

    // Sort slots by z-index for proper layering
    const sortedIndices = template.slots
      .map((_, i) => i)
      .sort((a, b) => (template.slots[a].z ?? 1) - (template.slots[b].z ?? 1));

    for (const i of sortedIndices) {
      const slot = template.slots[i];
      const sx = slot.x * w;
      const sy = slot.y * h;
      const sw = slot.w * w;
      const sh = slot.h * h;

      ctx.save();

      // Apply rotation around slot center
      if (slot.rotation) {
        ctx.translate(sx + sw / 2, sy + sh / 2);
        ctx.rotate((slot.rotation * Math.PI) / 180);
        ctx.translate(-(sx + sw / 2), -(sy + sh / 2));
      }

      // Draw border/background fill behind the shape
      if (bt > 0 || sp > 0) {
        ctx.save();
        clipCanvasToShape(ctx, slot.shape === 'rect' ? 'rect' : slot.shape, sx - bt - sp, sy - bt - sp, sw + bt * 2 + sp * 2, sh + bt * 2 + sp * 2, slot.radius);
        ctx.fillStyle = borderColor;
        ctx.fill();
        ctx.restore();
      }

      // Draw photo or placeholder, clipped to shape
      ctx.save();
      clipCanvasToShape(ctx, slot.shape, sx, sy, sw, sh, slot.radius);

      const photo = photos[i];
      if (photo) {
        const img = photo.image;
        const maxScale = Math.max(sw / img.naturalWidth, sh / img.naturalHeight);
        const effectiveScale = Math.max(photo.scale, maxScale);
        const edw = img.naturalWidth * effectiveScale;
        const edh = img.naturalHeight * effectiveScale;
        const dx = sx + photo.offsetX + (sw - edw) / 2;
        const dy = sy + photo.offsetY + (sh - edh) / 2;

        ctx.translate(sx + sw / 2, sy + sh / 2);
        ctx.rotate((photo.rotation * Math.PI) / 180);
        ctx.translate(-(sx + sw / 2), -(sy + sh / 2));
        ctx.drawImage(img, dx, dy, edw, edh);
      } else {
        ctx.fillStyle = '#2a2a2e';
        ctx.fillRect(sx, sy, sw, sh);
      }
      ctx.restore();

      ctx.restore();
    }
  }, [template, photos, borderThickness, borderColor, spacing, bgColor, bgImage, bgTransparent, bgGradient, aspectRatio]);

  useEffect(() => {
    renderToCanvas();
  }, [renderToCanvas]);

  // ── Photo management ──────────────────────────────────────

  const handleAddPhoto = async (file: File, slotIndex: number) => {
    const dataUrl = await fileToDataURL(file);
    const img = await loadImage(dataUrl);
    const newPhoto: CollagePhoto = { image: img, offsetX: 0, offsetY: 0, scale: 1, rotation: 0 };
    setPhotos((prev) => {
      const arr = [...prev];
      arr[slotIndex] = newPhoto;
      return arr;
    });
    setSelectedSlot(null);
  };

  const handleBgImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataURL(file);
    const img = await loadImage(dataUrl);
    setBgImage(img);
    setBgTransparent(false);
    e.target.value = '';
  };

  // ── Per-slot photo editing (drag to pan) ────────────────────

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;

    // Check slots in reverse z-order (topmost first)
    const sorted = template.slots
      .map((s, i) => ({ s, i }))
      .sort((a, b) => (b.s.z ?? 1) - (a.s.z ?? 1));

    for (const { s, i } of sorted) {
      // Account for rotation by checking in rotated space
      let lx = nx, ly = ny;
      if (s.rotation) {
        const cx = s.x + s.w / 2;
        const cy = s.y + s.h / 2;
        const angle = (-s.rotation * Math.PI) / 180;
        const dx = nx - cx;
        const dy = ny - cy;
        lx = cx + dx * Math.cos(angle) - dy * Math.sin(angle);
        ly = cy + dx * Math.sin(angle) + dy * Math.cos(angle);
      }
      if (lx >= s.x && lx <= s.x + s.w && ly >= s.y && ly <= s.y + s.h) {
        if (photos[i]) {
          dragRef.current = {
            slot: i,
            startX: e.clientX,
            startY: e.clientY,
            offsetX: photos[i]!.offsetX,
            offsetY: photos[i]!.offsetY,
          };
          setSelectedSlot(i);
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        } else {
          setSelectedSlot(i);
        }
        return;
      }
    }
    setSelectedSlot(null);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const { slot, startX, startY, offsetX, offsetY } = dragRef.current;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const dx = (e.clientX - startX) * scale;
    const dy = (e.clientY - startY) * scale;
    setPhotos((prev) => {
      const arr = [...prev];
      if (arr[slot]) {
        arr[slot] = { ...arr[slot]!, offsetX: offsetX + dx, offsetY: offsetY + dy };
      }
      return arr;
    });
  };

  const handleCanvasPointerUp = () => {
    dragRef.current = null;
  };

  const adjustPhotoScale = (slotIndex: number, delta: number) => {
    setPhotos((prev) => {
      const arr = [...prev];
      if (arr[slotIndex]) {
        arr[slotIndex] = { ...arr[slotIndex]!, scale: Math.max(0.1, Math.min(5, arr[slotIndex]!.scale + delta)) };
      }
      return arr;
    });
  };

  const adjustPhotoRotation = (slotIndex: number, delta: number) => {
    setPhotos((prev) => {
      const arr = [...prev];
      if (arr[slotIndex]) {
        arr[slotIndex] = { ...arr[slotIndex]!, rotation: arr[slotIndex]!.rotation + delta };
      }
      return arr;
    });
  };

  // ── Template selection ────────────────────────────────────

  const handleSelectTemplate = (t: CollageTemplate) => {
    setTemplate(t);
    setSelectedSlot(null);
  };

  const handleSelectCategory = (cat: TemplateCategory) => {
    setActiveCategory(cat);
  };

  const categoryTemplates = useMemo(() => getTemplatesByCategory(activeCategory), [activeCategory]);

  // ── Canvas display size ────────────────────────────────────

  const canvasDisplayStyle = useMemo(() => {
    if (aspectRatio >= 1) {
      return { maxWidth: '100%', maxHeight: '100%', aspectRatio: `${aspectRatio}`, width: 'auto' as const };
    }
    return { maxHeight: '100%', maxWidth: '100%', aspectRatio: `${aspectRatio}`, height: 'auto' as const };
  }, [aspectRatio]);

  return (
    <div className="h-[100dvh] flex flex-col bg-neutral-950">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-neutral-900/95 backdrop-blur border-b border-neutral-800 safe-top shrink-0">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-neutral-800 active:scale-95 transition-all">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-base font-semibold text-white">Collage</h1>
        <button onClick={() => setShowExport(true)} className="flex items-center gap-1.5 px-4 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 transition-all font-semibold text-sm text-neutral-900">
          <Download className="w-4 h-4" /> Save
        </button>
      </div>

      {/* Canvas preview */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-4 min-h-0">
        <div className="relative" style={canvasDisplayStyle}>
          {/* Checkerboard for transparent bg */}
          {bgTransparent && (
            <div className="absolute inset-0 checkerboard rounded-lg" />
          )}
          {/* CSS-based preview overlay (for interactive slot selection) */}
          <canvas
            ref={canvasRef}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            className="relative block max-w-full max-h-full touch-none rounded-lg"
            style={{ touchAction: 'none', ...canvasDisplayStyle }}
          />
          {/* Slot tap targets — invisible overlays for empty slot "+" buttons */}
          {template.slots.map((slot, i) => {
            if (photos[i]) return null; // Only show + on empty slots
            return (
              <button
                key={i}
                onPointerDown={(e) => { e.stopPropagation(); setSelectedSlot(i); }}
                className="absolute flex items-center justify-center bg-neutral-800/40 hover:bg-neutral-800/60 transition-colors"
                style={{
                  left: `${slot.x * 100}%`,
                  top: `${slot.y * 100}%`,
                  width: `${slot.w * 100}%`,
                  height: `${slot.h * 100}%`,
                  clipPath: shapeClipPath(slot.shape, slot.radius),
                  transform: slot.rotation ? `rotate(${slot.rotation}deg)` : undefined,
                  zIndex: slot.z ?? 1,
                }}
              >
                <Plus className="w-6 h-6 text-white/70" />
              </button>
            );
          })}
          {/* Selected slot highlight */}
          {selectedSlot !== null && (
            <div
              className="absolute pointer-events-none border-2 border-amber-400 rounded-sm"
              style={{
                left: `${template.slots[selectedSlot].x * 100}%`,
                top: `${template.slots[selectedSlot].y * 100}%`,
                width: `${template.slots[selectedSlot].w * 100}%`,
                height: `${template.slots[selectedSlot].h * 100}%`,
                clipPath: shapeClipPath(template.slots[selectedSlot].shape, template.slots[selectedSlot].radius),
                transform: template.slots[selectedSlot].rotation ? `rotate(${template.slots[selectedSlot].rotation}deg)` : undefined,
                zIndex: 100,
              }}
            />
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-neutral-900/95 backdrop-blur border-t border-neutral-800 px-4 py-3 max-h-[48vh] overflow-y-auto no-scrollbar safe-bottom shrink-0">
        {/* Category tabs */}
        <div className="mb-3">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {TEMPLATE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleSelectCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${
                  activeCategory === cat ? 'bg-amber-500/15 text-amber-400' : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Template thumbnails — horizontally scrollable */}
        <div className="mb-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {categoryTemplates.map((t) => (
              <TemplateThumbnail
                key={t.id}
                template={t}
                isSelected={template.id === t.id}
                onClick={() => handleSelectTemplate(t)}
              />
            ))}
          </div>
        </div>

        {/* Aspect ratio */}
        <div className="mb-3">
          <span className="text-xs text-neutral-400 mb-1.5 block">Canvas Ratio</span>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {ASPECT_RATIOS.map((ar) => (
              <button
                key={ar.id}
                onClick={() => {
                  setTemplate((prev) => ({ ...prev, aspectRatio: ar.id }));
                }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${
                  template.aspectRatio === ar.id ? 'bg-amber-500/15 text-amber-400' : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {ar.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selected slot controls */}
        {selectedSlot !== null && (
          <div className="mb-3 p-3 rounded-xl bg-neutral-800/50 border border-neutral-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-neutral-300">Slot {selectedSlot + 1}</span>
              <button onClick={() => setSelectedSlot(null)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-neutral-700">
                <X className="w-3.5 h-3.5 text-neutral-400" />
              </button>
            </div>
            {photos[selectedSlot] ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button onClick={() => adjustPhotoScale(selectedSlot, -0.1)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-neutral-700 active:scale-95">
                    <ZoomOut className="w-4 h-4 text-white" />
                  </button>
                  <span className="text-xs text-neutral-400 flex-1 text-center">Zoom: {photos[selectedSlot]!.scale.toFixed(1)}x</span>
                  <button onClick={() => adjustPhotoScale(selectedSlot, 0.1)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-neutral-700 active:scale-95">
                    <ZoomIn className="w-4 h-4 text-white" />
                  </button>
                  <button onClick={() => adjustPhotoRotation(selectedSlot, 90)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-neutral-700 active:scale-95">
                    <RotateCw className="w-4 h-4 text-white" />
                  </button>
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-2 rounded-lg bg-neutral-700 text-white text-xs"
                >
                  Replace Photo
                </button>
                <button
                  onClick={() => {
                    setPhotos((prev) => {
                      const arr = [...prev];
                      arr[selectedSlot] = null;
                      return arr;
                    });
                    setSelectedSlot(null);
                  }}
                  className="w-full py-2 rounded-lg bg-red-500/10 text-red-400 text-xs"
                >
                  Remove Photo
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-amber-500 text-neutral-900 text-sm font-medium active:scale-95"
              >
                <Plus className="w-4 h-4" /> Add Photo
              </button>
            )}
          </div>
        )}

        {/* Customize */}
        <div className="space-y-2.5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-neutral-400">Border</span>
              <span className="text-xs text-neutral-500 tabular-nums">{borderThickness}px</span>
            </div>
            <input type="range" min={0} max={30} value={borderThickness} onChange={(e) => setBorderThickness(Number(e.target.value))} className="w-full" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">Border Color</span>
              <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} className="w-8 h-8 rounded-lg" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">BG Color</span>
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-8 h-8 rounded-lg" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-neutral-400">Corner Radius</span>
              <span className="text-xs text-neutral-500 tabular-nums">{cornerRadius}px</span>
            </div>
            <input type="range" min={0} max={40} value={cornerRadius} onChange={(e) => setCornerRadius(Number(e.target.value))} className="w-full" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-neutral-400">Spacing</span>
              <span className="text-xs text-neutral-500 tabular-nums">{spacing}px</span>
            </div>
            <input type="range" min={0} max={20} value={spacing} onChange={(e) => setSpacing(Number(e.target.value))} className="w-full" />
          </div>

          {/* Background options */}
          <div>
            <span className="text-xs text-neutral-400 mb-1.5 block">Background</span>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => { setBgTransparent(false); setBgGradient(''); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${!bgTransparent && !bgGradient ? 'bg-amber-500/15 text-amber-400' : 'bg-neutral-800 text-neutral-400'}`}
              >
                Solid
              </button>
              <button
                onClick={() => { setBgTransparent(true); setBgGradient(''); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${bgTransparent ? 'bg-amber-500/15 text-amber-400' : 'bg-neutral-800 text-neutral-400'}`}
              >
                Transparent
              </button>
              <button
                onClick={() => { setBgGradient('#667eea,#764ba2'); setBgTransparent(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${bgGradient ? 'bg-amber-500/15 text-amber-400' : 'bg-neutral-800 text-neutral-400'}`}
              >
                Gradient
              </button>
              <button
                onClick={() => bgFileRef.current?.click()}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 text-neutral-400 active:scale-95"
              >
                {bgImage ? 'Change Image' : 'BG Image'}
              </button>
            </div>
            {bgGradient && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={bgGradient}
                  onChange={(e) => setBgGradient(e.target.value)}
                  placeholder="#color1,#color2"
                  className="flex-1 px-2 py-1 rounded-lg bg-neutral-800 text-white text-xs"
                />
                <button onClick={() => setBgGradient('')} className="px-2 py-1 rounded-lg bg-neutral-800 text-neutral-400 text-xs">
                  Clear
                </button>
              </div>
            )}
          </div>

          {bgImage && !bgTransparent && (
            <button onClick={() => setBgImage(null)} className="w-full py-2 rounded-lg bg-neutral-800 text-neutral-400 text-xs">
              Remove Background Image
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && selectedSlot !== null) handleAddPhoto(file, selectedSlot);
          e.target.value = '';
        }}
      />
      <input
        ref={bgFileRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleBgImage}
      />

      {showExport && <ExportPanel canvas={canvasRef.current} onClose={() => setShowExport(false)} />}
    </div>
  );
}
