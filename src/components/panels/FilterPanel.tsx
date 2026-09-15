import { FILTER_PRESETS } from '../../filters';
import type { FilterId } from '../../types';

interface FilterPanelProps {
  activeFilter: FilterId;
  intensity: number;
  onFilterSelect: (id: FilterId) => void;
  onIntensityChange: (v: number) => void;
  thumbnail: string;
}

export default function FilterPanel({
  activeFilter,
  intensity,
  onFilterSelect,
  onIntensityChange,
  thumbnail,
}: FilterPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {FILTER_PRESETS.map((f) => (
          <button
            key={f.id}
            onClick={() => onFilterSelect(f.id)}
            className={`flex-shrink-0 flex flex-col items-center gap-1.5 ${activeFilter === f.id ? '' : ''}`}
          >
            <div
              className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                activeFilter === f.id ? 'border-amber-400 scale-105' : 'border-transparent'
              }`}
            >
              <img src={thumbnail} alt={f.name} className="w-full h-full object-cover" style={getFilterStyle(f.id)} />
            </div>
            <span className={`text-[10px] ${activeFilter === f.id ? 'text-amber-400 font-semibold' : 'text-neutral-400'}`}>
              {f.name}
            </span>
          </button>
        ))}
      </div>

      {activeFilter !== 'original' && (
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

function getFilterStyle(filterId: FilterId): React.CSSProperties {
  const preset = FILTER_PRESETS.find((f) => f.id === filterId);
  if (!preset) return {};
  const a = preset.adjustments;
  const filters: string[] = [];
  if (a.brightness) filters.push(`brightness(${1 + a.brightness / 100})`);
  if (a.contrast) filters.push(`contrast(${1 + a.contrast / 100})`);
  if (a.saturation) filters.push(`saturate(${1 + a.saturation / 100})`);
  if (a.sepia) filters.push(`sepia(${a.sepia / 100})`);
  if (a.grayscale) filters.push(`grayscale(${a.grayscale / 100})`);
  return { filter: filters.join(' ') };
}
