import type { BorderConfig } from '../../types';

interface BorderPanelProps {
  border: BorderConfig;
  onChange: (border: BorderConfig) => void;
}

const PRESETS: { label: string; config: Partial<BorderConfig> }[] = [
  { label: 'None', config: { width: 0, color: '#ffffff', radius: 0 } },
  { label: 'Thin White', config: { width: 4, color: '#ffffff', radius: 0 } },
  { label: 'Thick White', config: { width: 16, color: '#ffffff', radius: 0 } },
  { label: 'Rounded', config: { width: 8, color: '#ffffff', radius: 24 } },
  { label: 'Black', config: { width: 8, color: '#000000', radius: 0 } },
  { label: 'Dashed', config: { width: 4, color: '#ffffff', radius: 0, style: 'dashed' } },
];

export default function BorderPanel({ border, onChange }: BorderPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => onChange({ ...border, ...p.config })}
            className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium bg-neutral-800 text-neutral-400 hover:bg-neutral-700 active:scale-95 transition-all"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-neutral-400">Width</span>
          <span className="text-xs text-neutral-500 tabular-nums">{border.width}px</span>
        </div>
        <input type="range" min={0} max={50} value={border.width} onChange={(e) => onChange({ ...border, width: Number(e.target.value) })} className="w-full" />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">Color</span>
          <input type="color" value={border.color} onChange={(e) => onChange({ ...border, color: e.target.value })} className="w-8 h-8 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">Opacity</span>
          <input type="range" min={0} max={100} value={border.opacity * 100} onChange={(e) => onChange({ ...border, opacity: Number(e.target.value) / 100 })} className="flex-1" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-neutral-400">Corner Radius</span>
          <span className="text-xs text-neutral-500 tabular-nums">{border.radius}px</span>
        </div>
        <input type="range" min={0} max={60} value={border.radius} onChange={(e) => onChange({ ...border, radius: Number(e.target.value) })} className="w-full" />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onChange({ ...border, style: 'solid' })}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 ${border.style === 'solid' ? 'bg-amber-500/15 text-amber-400' : 'bg-neutral-800 text-neutral-400'}`}
        >
          Solid
        </button>
        <button
          onClick={() => onChange({ ...border, style: 'dashed' })}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 ${border.style === 'dashed' ? 'bg-amber-500/15 text-amber-400' : 'bg-neutral-800 text-neutral-400'}`}
        >
          Dashed
        </button>
        <button
          onClick={() => onChange({ ...border, mode: 'inside' })}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 ${border.mode === 'inside' ? 'bg-amber-500/15 text-amber-400' : 'bg-neutral-800 text-neutral-400'}`}
        >
          Inside
        </button>
        <button
          onClick={() => onChange({ ...border, mode: 'outside' })}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 ${border.mode === 'outside' ? 'bg-amber-500/15 text-amber-400' : 'bg-neutral-800 text-neutral-400'}`}
        >
          Outside
        </button>
      </div>
    </div>
  );
}
