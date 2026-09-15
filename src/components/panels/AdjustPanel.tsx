import { RotateCw, FlipHorizontal, FlipVertical, RotateCcw } from 'lucide-react';
import type { Adjustments } from '../../types';
import { defaultAdjustments } from '../../types';

interface AdjustPanelProps {
  adjustments: Adjustments;
  onChange: (adj: Adjustments) => void;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  onRotation: (r: number) => void;
  onFlipH: () => void;
  onFlipV: () => void;
  onReset: () => void;
}

const SLIDERS: { key: keyof Adjustments; label: string; min: number; max: number }[] = [
  { key: 'brightness', label: 'Brightness', min: -100, max: 100 },
  { key: 'contrast', label: 'Contrast', min: -100, max: 100 },
  { key: 'saturation', label: 'Saturation', min: -100, max: 100 },
  { key: 'exposure', label: 'Exposure', min: -100, max: 100 },
  { key: 'sharpness', label: 'Sharpness', min: 0, max: 100 },
  { key: 'blur', label: 'Blur', min: 0, max: 100 },
  { key: 'temperature', label: 'Temperature', min: -100, max: 100 },
  { key: 'tint', label: 'Tint', min: -100, max: 100 },
  { key: 'vignette', label: 'Vignette', min: 0, max: 100 },
  { key: 'grayscale', label: 'Grayscale', min: 0, max: 100 },
  { key: 'sepia', label: 'Sepia', min: 0, max: 100 },
];

export default function AdjustPanel({
  adjustments,
  onChange,
  rotation,
  flipH,
  flipV,
  onRotation,
  onFlipH,
  onFlipV,
  onReset,
}: AdjustPanelProps) {
  const isDefault = JSON.stringify(adjustments) === JSON.stringify(defaultAdjustments) && rotation === 0 && !flipH && !flipV;

  return (
    <div className="space-y-4">
      {/* Transform buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onRotation((rotation + 90) % 360)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all text-sm text-white"
        >
          <RotateCw className="w-4 h-4" /> Rotate
        </button>
        <button
          onClick={() => onRotation((rotation - 90 + 360) % 360)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all text-sm text-white"
        >
          <RotateCcw className="w-4 h-4" /> Left
        </button>
        <button
          onClick={onFlipH}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl active:scale-95 transition-all text-sm ${
            flipH ? 'bg-amber-500/15 text-amber-400' : 'bg-neutral-800 text-white hover:bg-neutral-700'
          }`}
        >
          <FlipHorizontal className="w-4 h-4" /> Flip H
        </button>
        <button
          onClick={onFlipV}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl active:scale-95 transition-all text-sm ${
            flipV ? 'bg-amber-500/15 text-amber-400' : 'bg-neutral-800 text-white hover:bg-neutral-700'
          }`}
        >
          <FlipVertical className="w-4 h-4" /> Flip V
        </button>
      </div>

      {/* Sliders */}
      <div className="space-y-3">
        {SLIDERS.map((s) => (
          <div key={s.key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-neutral-400">{s.label}</span>
              <span className="text-xs text-neutral-500 tabular-nums">
                {adjustments[s.key] > 0 ? '+' : ''}{adjustments[s.key]}
              </span>
            </div>
            <input
              type="range"
              min={s.min}
              max={s.max}
              value={adjustments[s.key]}
              onChange={(e) => onChange({ ...adjustments, [s.key]: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        ))}
      </div>

      <button
        onClick={onReset}
        disabled={isDefault}
        className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all text-sm text-white disabled:opacity-30"
      >
        Reset All
      </button>
    </div>
  );
}
