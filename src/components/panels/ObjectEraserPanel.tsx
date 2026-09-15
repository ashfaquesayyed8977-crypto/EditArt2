import { Undo2, Redo2, Trash2, Check, X } from 'lucide-react';

interface ObjectEraserPanelProps {
  brushSize: number;
  onBrushSize: (v: number) => void;
  onApply: () => void;
  onReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
}

export default function ObjectEraserPanel({
  brushSize, onBrushSize, onApply, onReset, onUndo, onRedo, onClear, canUndo, canRedo, hasSelection,
}: ObjectEraserPanelProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-neutral-400">
        Paint over the object you want to remove, then tap Apply. The area will be filled using surrounding pixels.
      </p>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-neutral-400">Brush Size</span>
          <span className="text-xs text-neutral-500 tabular-nums">{brushSize}px</span>
        </div>
        <input type="range" min={10} max={120} value={brushSize} onChange={(e) => onBrushSize(Number(e.target.value))} className="w-full" />
      </div>

      <div className="flex gap-2">
        <button onClick={onUndo} disabled={!canUndo} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all text-sm text-white disabled:opacity-30">
          <Undo2 className="w-4 h-4" /> Undo
        </button>
        <button onClick={onRedo} disabled={!canRedo} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all text-sm text-white disabled:opacity-30">
          <Redo2 className="w-4 h-4" /> Redo
        </button>
        <button onClick={onClear} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all text-sm text-white">
          <X className="w-4 h-4" /> Clear
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onApply}
          disabled={!hasSelection}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 transition-all text-sm font-semibold text-neutral-900 disabled:opacity-30"
        >
          <Check className="w-4 h-4" /> Apply Removal
        </button>
        <button
          onClick={onReset}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all text-sm text-white"
        >
          <Trash2 className="w-4 h-4" /> Reset
        </button>
      </div>
    </div>
  );
}
