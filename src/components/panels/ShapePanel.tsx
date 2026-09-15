import { Trash2 } from 'lucide-react';
import type { ShapeLayer, ShapeType } from '../../types';

interface ShapePanelProps {
  selectedShape: ShapeLayer | null;
  onAdd: (shape: ShapeType) => void;
  onUpdate: (id: string, updates: Partial<ShapeLayer>) => void;
  onDelete: (id: string) => void;
}

const SHAPES: { id: ShapeType; label: string }[] = [
  { id: 'circle', label: 'Circle' },
  { id: 'rect', label: 'Square' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'triangle', label: 'Triangle' },
  { id: 'diamond', label: 'Diamond' },
  { id: 'star', label: 'Star' },
  { id: 'heart', label: 'Heart' },
  { id: 'hexagon', label: 'Hexagon' },
  { id: 'pentagon', label: 'Pentagon' },
  { id: 'octagon', label: 'Octagon' },
  { id: 'oval', label: 'Oval' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'speech', label: 'Speech' },
  { id: 'plus', label: 'Plus' },
  { id: 'cross', label: 'Cross' },
];

export default function ShapePanel({ selectedShape, onAdd, onUpdate, onDelete }: ShapePanelProps) {
  if (!selectedShape) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {SHAPES.map((s) => (
            <button
              key={s.id}
              onClick={() => onAdd(s.id)}
              className="aspect-square flex items-center justify-center rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-90 transition-all text-xs text-neutral-300"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-neutral-400">Width</span>
          <span className="text-xs text-neutral-500 tabular-nums">{Math.round(selectedShape.w)}</span>
        </div>
        <input type="range" min={20} max={500} value={selectedShape.w} onChange={(e) => onUpdate(selectedShape.id, { w: Number(e.target.value) })} className="w-full" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-neutral-400">Height</span>
          <span className="text-xs text-neutral-500 tabular-nums">{Math.round(selectedShape.h)}</span>
        </div>
        <input type="range" min={20} max={500} value={selectedShape.h} onChange={(e) => onUpdate(selectedShape.id, { h: Number(e.target.value) })} className="w-full" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-neutral-400">Rotation</span>
          <span className="text-xs text-neutral-500 tabular-nums">{selectedShape.rotation}°</span>
        </div>
        <input type="range" min={-180} max={180} value={selectedShape.rotation} onChange={(e) => onUpdate(selectedShape.id, { rotation: Number(e.target.value) })} className="w-full" />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">Fill</span>
          <input type="color" value={selectedShape.fillColor} onChange={(e) => onUpdate(selectedShape.id, { fillColor: e.target.value })} className="w-8 h-8 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">Border</span>
          <input type="color" value={selectedShape.borderColor} onChange={(e) => onUpdate(selectedShape.id, { borderColor: e.target.value })} className="w-8 h-8 rounded-lg" />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-neutral-400">Border Width</span>
          <span className="text-xs text-neutral-500 tabular-nums">{selectedShape.borderWidth}px</span>
        </div>
        <input type="range" min={0} max={20} value={selectedShape.borderWidth} onChange={(e) => onUpdate(selectedShape.id, { borderWidth: Number(e.target.value) })} className="w-full" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-neutral-400">Opacity</span>
          <span className="text-xs text-neutral-500 tabular-nums">{Math.round(selectedShape.opacity * 100)}%</span>
        </div>
        <input type="range" min={0} max={100} value={selectedShape.opacity * 100} onChange={(e) => onUpdate(selectedShape.id, { opacity: Number(e.target.value) / 100 })} className="w-full" />
      </div>
      <button
        onClick={() => onDelete(selectedShape.id)}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 active:scale-95 transition-all text-sm text-red-400"
      >
        <Trash2 className="w-4 h-4" /> Delete Shape
      </button>
    </div>
  );
}
