import { Undo2, Redo2, Trash2 } from 'lucide-react';

interface DrawingPanelProps {
  tool: 'pen' | 'pencil' | 'marker' | 'neon' | 'highlighter' | 'eraser';
  color: string;
  size: number;
  opacity: number;
  hardness: number;
  onTool: (t: 'pen' | 'pencil' | 'marker' | 'neon' | 'highlighter' | 'eraser') => void;
  onColor: (v: string) => void;
  onSize: (v: number) => void;
  onOpacity: (v: number) => void;
  onHardness: (v: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const DRAW_TOOLS: { id: 'pen' | 'pencil' | 'marker' | 'neon' | 'highlighter' | 'eraser'; label: string }[] = [
  { id: 'pen', label: 'Pen' },
  { id: 'pencil', label: 'Pencil' },
  { id: 'marker', label: 'Marker' },
  { id: 'neon', label: 'Neon' },
  { id: 'highlighter', label: 'Highlight' },
  { id: 'eraser', label: 'Eraser' },
];

export default function DrawingPanel({
  tool, color, size, opacity, hardness,
  onTool, onColor, onSize, onOpacity, onHardness,
  onUndo, onRedo, onClear, canUndo, canRedo,
}: DrawingPanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {DRAW_TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => onTool(t.id)}
            className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 ${
              tool === t.id ? 'bg-amber-500/15 text-amber-400' : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-neutral-400">Size</span>
          <span className="text-xs text-neutral-500 tabular-nums">{size}px</span>
        </div>
        <input type="range" min={1} max={80} value={size} onChange={(e) => onSize(Number(e.target.value))} className="w-full" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-neutral-400">Opacity</span>
          <span className="text-xs text-neutral-500 tabular-nums">{opacity}%</span>
        </div>
        <input type="range" min={0} max={100} value={opacity} onChange={(e) => onOpacity(Number(e.target.value))} className="w-full" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-neutral-400">Hardness</span>
          <span className="text-xs text-neutral-500 tabular-nums">{hardness}%</span>
        </div>
        <input type="range" min={0} max={100} value={hardness} onChange={(e) => onHardness(Number(e.target.value))} className="w-full" />
      </div>

      {tool !== 'eraser' && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">Color</span>
          <input type="color" value={color} onChange={(e) => onColor(e.target.value)} className="w-8 h-8 rounded-lg" />
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={onUndo} disabled={!canUndo} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all text-sm text-white disabled:opacity-30">
          <Undo2 className="w-4 h-4" /> Undo
        </button>
        <button onClick={onRedo} disabled={!canRedo} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all text-sm text-white disabled:opacity-30">
          <Redo2 className="w-4 h-4" /> Redo
        </button>
        <button onClick={onClear} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 active:scale-95 transition-all text-sm text-red-400">
          <Trash2 className="w-4 h-4" /> Clear
        </button>
      </div>
    </div>
  );
}
