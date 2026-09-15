import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { StickerLayer } from '../../types';
import { STICKER_CATEGORIES } from '../../stickers';

interface StickerPanelProps {
  onAdd: (emoji: string) => void;
  onDelete: (id: string) => void;
  selectedSticker: StickerLayer | null;
  onUpdate: (id: string, updates: Partial<StickerLayer>) => void;
}

export default function StickerPanel({ onAdd, onDelete, selectedSticker, onUpdate }: StickerPanelProps) {
  const [activeCat, setActiveCat] = useState(STICKER_CATEGORIES[0].id);
  const cat = STICKER_CATEGORIES.find((c) => c.id === activeCat)!;

  return (
    <div className="space-y-4">
      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {STICKER_CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCat(c.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${
              activeCat === c.id ? 'bg-amber-500/15 text-amber-400' : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Sticker grid */}
      <div className="grid grid-cols-6 gap-1.5">
        {cat.stickers.map((emoji, i) => (
          <button
            key={`${emoji}-${i}`}
            onClick={() => onAdd(emoji)}
            className="aspect-square flex items-center justify-center rounded-lg bg-neutral-800 hover:bg-neutral-700 active:scale-90 transition-all text-2xl"
          >
            {emoji}
          </button>
        ))}
      </div>

      {selectedSticker && (
        <div className="pt-2 border-t border-neutral-800 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-neutral-400">Size</span>
              <span className="text-xs text-neutral-500 tabular-nums">{selectedSticker.size}px</span>
            </div>
            <input type="range" min={20} max={200} value={selectedSticker.size} onChange={(e) => onUpdate(selectedSticker.id, { size: Number(e.target.value) })} className="w-full" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-neutral-400">Rotation</span>
              <span className="text-xs text-neutral-500 tabular-nums">{selectedSticker.rotation}°</span>
            </div>
            <input type="range" min={-180} max={180} value={selectedSticker.rotation} onChange={(e) => onUpdate(selectedSticker.id, { rotation: Number(e.target.value) })} className="w-full" />
          </div>
          <button
            onClick={() => onDelete(selectedSticker.id)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 active:scale-95 transition-all text-sm text-red-400"
          >
            <Trash2 className="w-4 h-4" /> Delete Sticker
          </button>
        </div>
      )}
    </div>
  );
}
