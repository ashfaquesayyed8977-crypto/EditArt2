import { useState, useMemo } from 'react';
import { ArrowLeft, Search, Check, X, Palette, LayoutGrid } from 'lucide-react';
import { COLOR_ASSETS, DESIGN_ASSETS, ASSET_CATEGORIES, type DesignAsset } from '../assets';

interface ImageAssetsProps {
  onBack: () => void;
  onUseAsset: (dataUrl: string) => void;
}

type Tab = 'colors' | 'design';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = hex.replace('#', '');
  return {
    r: parseInt(m.substring(0, 2), 16),
    g: parseInt(m.substring(2, 4), 16),
    b: parseInt(m.substring(4, 6), 16),
  };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function createColorImage(hex: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}

function createGradientImage(source: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d')!;
  const tempEl = document.createElement('div');
  tempEl.style.background = source;
  tempEl.style.width = '1080px';
  tempEl.style.height = '1080px';
  document.body.appendChild(tempEl);
  const bg = window.getComputedStyle(tempEl).background;
  document.body.removeChild(tempEl);
  // Use CSS canvas approach: draw via fillRect with gradient
  // Parse the CSS gradient string into canvas gradient
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Fallback: if CSS shorthand doesn't work directly, create gradient manually
  // Check if the result is transparent (fallback needed)
  const imageData = ctx.getImageData(10, 10, 1, 1).data;
  if (imageData[3] === 0) {
    // Manual gradient parsing
    const linearMatch = source.match(/linear-gradient\(([^,]+),\s*(.+)\)/);
    const radialMatch = source.match(/radial-gradient\(([^,]+),\s*(.+)\)/);
    const conicMatch = source.match(/conic-gradient\(([^,]+),\s*(.+)\)/);

    if (linearMatch) {
      const angleMatch = linearMatch[1].match(/(\d+)deg/);
      const angle = angleMatch ? parseInt(angleMatch[1]) : 135;
      const rad = (angle - 90) * Math.PI / 180;
      const x1 = canvas.width / 2 - Math.cos(rad) * canvas.width / 2;
      const y1 = canvas.height / 2 - Math.sin(rad) * canvas.height / 2;
      const x2 = canvas.width / 2 + Math.cos(rad) * canvas.width / 2;
      const y2 = canvas.height / 2 + Math.sin(rad) * canvas.height / 2;
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      addColorStops(grad, linearMatch[2]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (radialMatch) {
      const grad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 2
      );
      addColorStops(grad, radialMatch[2]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (conicMatch) {
      // Conic not natively supported on canvas, approximate with radial
      const grad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 2
      );
      addColorStops(grad, conicMatch[2]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      // Solid color fallback
      ctx.fillStyle = source;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }
  return canvas.toDataURL('image/png');
}

function addColorStops(grad: CanvasGradient, stopsStr: string) {
  const stops = stopsStr.split(/,(?![^()]*\))/).map((s) => s.trim());
  stops.forEach((stop, i) => {
    const parts = stop.split(/\s+(?![^()]*\))/);
    const color = parts[0];
    const pos = parts[1] ? parseFloat(parts[1]) / 100 : i / (stops.length - 1);
    grad.addColorStop(Math.max(0, Math.min(1, pos)), color);
  });
}

function isImageSource(source: string): boolean {
  return source.startsWith('/') || source.startsWith('http') || source.startsWith('data:');
}

function createAssetImage(asset: DesignAsset): string {
  if (asset.type === 'frame') {
    return createColorImage(asset.source);
  }
  if (asset.type === 'shape') {
    return createColorImage('#1E1B4B');
  }
  if (isImageSource(asset.source)) {
    return asset.source;
  }
  if (asset.source.startsWith('#') || asset.source.startsWith('rgb') || asset.source.startsWith('linear') || asset.source.startsWith('radial') || asset.source.startsWith('conic')) {
    return createGradientImage(asset.source);
  }
  return createColorImage('#1E1B4B');
}

export default function ImageAssets({ onBack, onUseAsset }: ImageAssetsProps) {
  const [tab, setTab] = useState<Tab>('colors');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Backgrounds');
  const [previewAsset, setPreviewAsset] = useState<DesignAsset | null>(null);
  const [customHex, setCustomHex] = useState('#3B82F6');
  const [recentColors, setRecentColors] = useState<string[]>([]);

  const filteredAssets = useMemo(() => {
    if (search) {
      return DESIGN_ASSETS.filter((a) =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.tags.some((t) => t.includes(search.toLowerCase())) ||
        a.category.toLowerCase().includes(search.toLowerCase())
      );
    }
    return DESIGN_ASSETS.filter((a) => a.category === activeCategory);
  }, [search, activeCategory]);

  const filteredColors = useMemo(() => {
    if (!search) return COLOR_ASSETS;
    return COLOR_ASSETS.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  const handleUseColor = (hex: string) => {
    const dataUrl = createColorImage(hex);
    setRecentColors((prev) => [hex, ...prev.filter((c) => c !== hex)].slice(0, 8));
    onUseAsset(dataUrl);
  };

  const handleUseDesignAsset = (asset: DesignAsset) => {
    const dataUrl = createAssetImage(asset);
    onUseAsset(dataUrl);
  };

  const handlePreviewUse = () => {
    if (previewAsset) {
      handleUseDesignAsset(previewAsset);
      setPreviewAsset(null);
    }
  };

  const rgb = hexToRgb(customHex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 safe-top shrink-0">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-xl font-bold text-white">Image Assets</h1>
      </div>

      {/* Tabs */}
      <div className="px-4 pb-3 shrink-0">
        <div className="flex gap-2">
          <button
            onClick={() => { setTab('colors'); setSearch(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all active:scale-95 ${tab === 'colors' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-neutral-800 text-neutral-400'}`}
          >
            <Palette className="w-4 h-4" /> Colors
          </button>
          <button
            onClick={() => { setTab('design'); setSearch(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all active:scale-95 ${tab === 'design' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-neutral-800 text-neutral-400'}`}
          >
            <LayoutGrid className="w-4 h-4" /> Design Assets
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pb-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === 'colors' ? 'Search colors...' : 'Search assets...'}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-800 text-white text-sm border border-neutral-700 focus:border-amber-400 outline-none"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-10">
        {tab === 'colors' ? (
          <div className="space-y-5">
            {/* Recent colors */}
            {recentColors.length > 0 && (
              <div>
                <p className="text-xs text-neutral-500 mb-2 font-medium">Recently Used</p>
                <div className="flex gap-2 flex-wrap">
                  {recentColors.map((hex, i) => (
                    <button
                      key={i}
                      onClick={() => handleUseColor(hex)}
                      className="w-10 h-10 rounded-lg border border-neutral-700 active:scale-90 transition-all"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Custom color picker */}
            <div className="bg-neutral-800/50 rounded-xl p-4 space-y-3">
              <p className="text-xs text-neutral-400 font-medium">Custom Color</p>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={customHex}
                  onChange={(e) => setCustomHex(e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer"
                />
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-500 w-8">HEX</span>
                    <input
                      type="text"
                      value={customHex}
                      onChange={(e) => setCustomHex(e.target.value)}
                      className="flex-1 px-2 py-1 rounded bg-neutral-900 text-white text-xs border border-neutral-700 outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-500 w-8">RGB</span>
                    <input
                      type="text"
                      readOnly
                      value={`${rgb.r}, ${rgb.g}, ${rgb.b}`}
                      className="flex-1 px-2 py-1 rounded bg-neutral-900 text-white text-xs border border-neutral-700 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-500 w-8">HSL</span>
                    <input
                      type="text"
                      readOnly
                      value={`${hsl.h}°, ${hsl.s}%, ${hsl.l}%`}
                      className="flex-1 px-2 py-1 rounded bg-neutral-900 text-white text-xs border border-neutral-700 outline-none"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleUseColor(customHex)}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 transition-all text-sm font-semibold text-neutral-900"
              >
                Use This Color
              </button>
            </div>

            {/* Color palette */}
            {filteredColors.map((color) => (
              <div key={color.name}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full border border-neutral-700" style={{ backgroundColor: color.hex }} />
                  <p className="text-sm text-white font-medium">{color.name}</p>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {color.shades.map((shade, i) => (
                    <button
                      key={i}
                      onClick={() => handleUseColor(shade)}
                      className="aspect-square rounded-lg border border-neutral-700/50 active:scale-90 transition-all"
                      style={{ backgroundColor: shade }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Category tabs */}
            {!search && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {ASSET_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 ${activeCategory === cat ? 'bg-amber-500/15 text-amber-400' : 'bg-neutral-800 text-neutral-400'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Asset grid */}
            <div className="grid grid-cols-3 gap-3">
              {filteredAssets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => setPreviewAsset(asset)}
                  className="flex flex-col items-center gap-1.5 active:scale-95 transition-all"
                >
                  <div className="w-full aspect-square rounded-xl border border-neutral-700/50 active:scale-95 transition-all overflow-hidden bg-neutral-800">
                    {isImageSource(asset.thumbnail) ? (
                      <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full" style={{ background: asset.thumbnail }} />
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-400 text-center truncate w-full">{asset.name}</span>
                </button>
              ))}
            </div>

            {filteredAssets.length === 0 && (
              <div className="text-center py-12">
                <p className="text-neutral-500 text-sm">No assets found for "{search}"</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Asset preview modal */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-neutral-900 rounded-2xl overflow-hidden max-w-sm w-full">
            <div className="aspect-square w-full overflow-hidden bg-neutral-800">
              {isImageSource(previewAsset.thumbnail) ? (
                <img src={previewAsset.thumbnail} alt={previewAsset.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full" style={{ background: previewAsset.thumbnail }} />
              )}
            </div>            <div className="p-4">
              <p className="text-white font-semibold text-base mb-1">{previewAsset.name}</p>
              <p className="text-neutral-500 text-xs mb-4">{previewAsset.category} · {previewAsset.type}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setPreviewAsset(null)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all text-white text-sm font-medium"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button
                  onClick={handlePreviewUse}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 transition-all text-neutral-900 text-sm font-semibold"
                >
                  <Check className="w-4 h-4" /> Use Asset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
