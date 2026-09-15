import { Trash2, Copy, FlipHorizontal, FlipVertical, ArrowUp, ArrowDown } from 'lucide-react';
import type { PhotoLayer } from '../../types';

interface PhotoPanelProps {
  selectedPhoto: PhotoLayer | null;
  onAdd: () => void;
  onUpdate: (id: string, updates: Partial<PhotoLayer>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
}

export default function PhotoPanel({ selectedPhoto, onAdd, onUpdate, onDelete, onDuplicate, onBringForward, onSendBackward }: PhotoPanelProps) {
  if (!selectedPhoto) {
    return (
      <div className="space-y-4">
        <button
          onClick={onAdd}
          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 transition-all text-sm font-semibold text-neutral-900"
        >
          Add Photo Layer
        </button>
        <p className="text-xs text-neutral-500 text-center">Add another photo on top of your image</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-neutral-400">Scale</span>
          <span className="text-xs text-neutral-500 tabular-nums">{selectedPhoto.scale.toFixed(2)}x</span>
        </div>
        <input type="range" min={10} max={300} value={selectedPhoto.scale * 100} onChange={(e) => onUpdate(selectedPhoto.id, { scale: Number(e.target.value) / 100 })} className="w-full" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-neutral-400">Rotation</span>
          <span className="text-xs text-neutral-500 tabular-nums">{selectedPhoto.rotation}°</span>
        </div>
        <input type="range" min={-180} max={180} value={selectedPhoto.rotation} onChange={(e) => onUpdate(selectedPhoto.id, { rotation: Number(e.target.value) })} className="w-full" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-neutral-400">Opacity</span>
          <span className="text-xs text-neutral-500 tabular-nums">{Math.round(selectedPhoto.opacity * 100)}%</span>
        </div>
        <input type="range" min={0} max={100} value={selectedPhoto.opacity * 100} onChange={(e) => onUpdate(selectedPhoto.id, { opacity: Number(e.target.value) / 100 })} className="w-full" />
      </div>

      <div className="flex gap-2">
        <button onClick={() => onUpdate(selectedPhoto.id, { flipH: !selectedPhoto.flipH })} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs active:scale-95 transition-all ${selectedPhoto.flipH ? 'bg-amber-500/15 text-amber-400' : 'bg-neutral-800 text-neutral-400'}`}>
          <FlipHorizontal className="w-3.5 h-3.5" /> Flip H
        </button>
        <button onClick={() => onUpdate(selectedPhoto.id, { flipV: !selectedPhoto.flipV })} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs active:scale-95 transition-all ${selectedPhoto.flipV ? 'bg-amber-500/15 text-amber-400' : 'bg-neutral-800 text-neutral-400'}`}>
          <FlipVertical className="w-3.5 h-3.5" /> Flip V
        </button>
        <button onClick={() => onDuplicate(selectedPhoto.id)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-neutral-800 text-neutral-400 text-xs active:scale-95 transition-all">
          <Copy className="w-3.5 h-3.5" /> Dup
        </button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => onBringForward(selectedPhoto.id)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-neutral-800 text-neutral-400 text-xs active:scale-95 transition-all">
          <ArrowUp className="w-3.5 h-3.5" /> Forward
        </button>
        <button onClick={() => onSendBackward(selectedPhoto.id)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-neutral-800 text-neutral-400 text-xs active:scale-95 transition-all">
          <ArrowDown className="w-3.5 h-3.5" /> Back
        </button>
      </div>

      <button
        onClick={() => onDelete(selectedPhoto.id)}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 active:scale-95 transition-all text-sm text-red-400"
      >
        <Trash2 className="w-4 h-4" /> Delete Photo
      </button>

      <button onClick={onAdd} className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all text-sm text-white">
        Add Another Photo
      </button>
    </div>
  );
}
