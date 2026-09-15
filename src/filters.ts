import type { FilterPreset } from './types';

export const FILTER_PRESETS: FilterPreset[] = [
  { id: 'original', name: 'Original', adjustments: {} },
  {
    id: 'vintage',
    name: 'Vintage',
    adjustments: { sepia: 35, contrast: 10, saturation: -10, temperature: 8, vignette: 25 },
  },
  { id: 'bw', name: 'B&W', adjustments: { grayscale: 100, contrast: 15 } },
  { id: 'sepia', name: 'Sepia', adjustments: { sepia: 80, contrast: 5 } },
  { id: 'warm', name: 'Warm', adjustments: { temperature: 25, saturation: 10 } },
  { id: 'cool', name: 'Cool', adjustments: { temperature: -25, tint: -5 } },
  { id: 'bright', name: 'Bright', adjustments: { brightness: 15, exposure: 10, saturation: 8 } },
  {
    id: 'dramatic',
    name: 'Dramatic',
    adjustments: { contrast: 30, saturation: 15, vignette: 35, temperature: -5 },
  },
  { id: 'fade', name: 'Fade', adjustments: { contrast: -15, brightness: 8, saturation: -20 } },
  {
    id: 'retro',
    name: 'Retro',
    adjustments: { sepia: 20, temperature: 15, saturation: -15, contrast: 8, vignette: 15 },
  },
];

export function getFilterAdjustments(filterId: string, intensity: number): Record<string, number> {
  const preset = FILTER_PRESETS.find((f) => f.id === filterId);
  if (!preset || preset.id === 'original') return {};
  const result: Record<string, number> = {};
  for (const [key, val] of Object.entries(preset.adjustments)) {
    result[key] = (val as number) * (intensity / 100);
  }
  return result;
}
