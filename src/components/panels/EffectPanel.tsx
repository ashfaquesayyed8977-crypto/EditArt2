import { useState } from 'react';

interface EffectPanelProps {
  activeEffect: string;
  intensity: number;
  onEffectSelect: (type: string) => void;
  onIntensityChange: (v: number) => void;
}

const EFFECTS: { id: string; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'blur', label: 'Blur' },
  { id: 'motionBlur', label: 'Motion Blur' },
  { id: 'radialBlur', label: 'Radial Blur' },
  { id: 'vignette', label: 'Vignette' },
  { id: 'noise', label: 'Noise' },
  { id: 'grain', label: 'Grain' },
  { id: 'pixelate', label: 'Pixelate' },
  { id: 'glitch', label: 'Glitch' },
  { id: 'sharpen', label: 'Sharpen' },
  { id: 'glow', label: 'Glow' },
  { id: 'bloom', label: 'Bloom' },
  { id: 'fade', label: 'Fade' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'duotone', label: 'Duotone' },
  { id: 'bw', label: 'B&W' },
  { id: 'sepia', label: 'Sepia' },
  { id: 'posterize', label: 'Posterize' },
  { id: 'emboss', label: 'Emboss' },
  { id: 'edge', label: 'Edge' },
];

export default function EffectPanel({ activeEffect, intensity, onEffectSelect, onIntensityChange }: EffectPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {EFFECTS.map((eff) => (
          <button
            key={eff.id}
            onClick={() => onEffectSelect(eff.id)}
            className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 ${
              activeEffect === eff.id ? 'bg-amber-500/15 text-amber-400' : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {eff.label}
          </button>
        ))}
      </div>

      {activeEffect !== 'none' && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-neutral-400">Intensity</span>
            <span className="text-xs text-neutral-500 tabular-nums">{intensity}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={intensity}
            onChange={(e) => onIntensityChange(Number(e.target.value))}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
