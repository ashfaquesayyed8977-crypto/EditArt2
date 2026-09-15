import { useState } from 'react';
import { ZoomIn, ZoomOut, Undo2, Redo2, RotateCcw } from 'lucide-react';

interface RepairPanelProps {
  brushSize: number;
  hardness: number;
  zoom: number;
  onBrushSize: (v: number) => void;
  onHardness: (v: number) => void;
  onZoom: (v: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export default function RepairPanel({
  brushSize,
  hardness,
  zoom,
  onBrushSize,
  onHardness,
  onZoom,
  onUndo,
  onRedo,
  onReset,
  canUndo,
  canRedo,
}: RepairPanelProps) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-neutral-500 leading-relaxed">
        Tap a source point to sample, then paint over scratches or spots to clone nearby pixels.
      </p>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-neutral-400">Brush Size</span>
          <span className="text-xs text-neutral-500 tabular-nums">{brushSize}px</span>
        </div>
        <input type="range" min={5} max={80} value={brushSize} onChange={(e) => onBrushSize(Number(e.target.value))} className="w-full" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-neutral-400">Hardness</span>
          <span className="text-xs text-neutral-500 tabular-nums">{hardness}%</span>
        </div>
        <input type="range" min={0} max={100} value={hardness} onChange={(e) => onHardness(Number(e.target.value))} className="w-full" />
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => onZoom(Math.max(1, zoom - 0.5))} className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all">
          <ZoomOut className="w-4 h-4 text-white" />
        </button>
        <span className="text-xs text-neutral-400 flex-1 text-center">Zoom: {zoom.toFixed(1)}x</span>
        <button onClick={() => onZoom(Math.min(5, zoom + 0.5))} className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all">
          <ZoomIn className="w-4 h-4 text-white" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={onUndo} disabled={!canUndo} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all text-sm text-white disabled:opacity-30">
          <Undo2 className="w-4 h-4" /> Undo
        </button>
        <button onClick={onRedo} disabled={!canRedo} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all text-sm text-white disabled:opacity-30">
          <Redo2 className="w-4 h-4" /> Redo
        </button>
      </div>

      <button onClick={onReset} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all text-sm text-white">
        <RotateCcw className="w-4 h-4" /> Reset Repairs
      </button>
    </div>
  );
}
