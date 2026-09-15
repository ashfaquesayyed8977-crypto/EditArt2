import { Trash2 } from 'lucide-react';
import type { TextLayer } from '../../types';

interface TextPanelProps {
  selectedText: TextLayer | null;
  onUpdate: (id: string, updates: Partial<TextLayer>) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

const FONTS = [
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Mono', value: 'Courier New, monospace' },
  { label: 'Cursive', value: 'cursive' },
  { label: 'Impact', value: 'Impact, sans-serif' },
];

export default function TextPanel({ selectedText, onUpdate, onAdd, onDelete }: TextPanelProps) {
  if (!selectedText) {
    return (
      <div className="space-y-4">
        <button
          onClick={onAdd}
          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 transition-all text-sm font-semibold text-neutral-900"
        >
          Add Text
        </button>
        <p className="text-xs text-neutral-500 text-center">Tap text on canvas to edit it</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={selectedText.text}
        onChange={(e) => onUpdate(selectedText.id, { text: e.target.value })}
        placeholder="Enter text..."
        className="w-full px-3 py-2.5 rounded-xl bg-neutral-800 text-white text-sm border border-neutral-700 focus:border-amber-400 outline-none"
      />

      <div>
        <span className="text-xs text-neutral-400 mb-1 block">Font</span>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {FONTS.map((f) => (
            <button
              key={f.value}
              onClick={() => onUpdate(selectedText.id, { fontFamily: f.value })}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs transition-all active:scale-95 ${
                selectedText.fontFamily === f.value ? 'bg-amber-500/15 text-amber-400' : 'bg-neutral-800 text-neutral-400'
              }`}
              style={{ fontFamily: f.value }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-neutral-400">Font Size</span>
          <span className="text-xs text-neutral-500 tabular-nums">{selectedText.fontSize}px</span>
        </div>
        <input type="range" min={12} max={120} value={selectedText.fontSize} onChange={(e) => onUpdate(selectedText.id, { fontSize: Number(e.target.value) })} className="w-full" />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onUpdate(selectedText.id, { bold: !selectedText.bold })}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 ${selectedText.bold ? 'bg-amber-500/15 text-amber-400' : 'bg-neutral-800 text-neutral-400'}`}
        >
          B
        </button>
        <button
          onClick={() => onUpdate(selectedText.id, { italic: !selectedText.italic })}
          className={`flex-1 py-2 rounded-lg text-sm italic transition-all active:scale-95 ${selectedText.italic ? 'bg-amber-500/15 text-amber-400' : 'bg-neutral-800 text-neutral-400'}`}
        >
          I
        </button>
        <div className="flex-1 flex gap-1">
          {(['left', 'center', 'right'] as const).map((a) => (
            <button
              key={a}
              onClick={() => onUpdate(selectedText.id, { align: a })}
              className={`flex-1 py-2 rounded-lg text-xs transition-all active:scale-95 ${selectedText.align === a ? 'bg-amber-500/15 text-amber-400' : 'bg-neutral-800 text-neutral-400'}`}
            >
              {a === 'left' ? 'L' : a === 'center' ? 'C' : 'R'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">Text</span>
          <input type="color" value={selectedText.color} onChange={(e) => onUpdate(selectedText.id, { color: e.target.value })} className="w-8 h-8 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdate(selectedText.id, { bgEnabled: !selectedText.bgEnabled })}
            className={`px-2 py-1.5 rounded-lg text-xs transition-all ${selectedText.bgEnabled ? 'bg-amber-500/15 text-amber-400' : 'bg-neutral-800 text-neutral-400'}`}
          >
            BG
          </button>
          {selectedText.bgEnabled && (
            <input type="color" value={selectedText.bgColor} onChange={(e) => onUpdate(selectedText.id, { bgColor: e.target.value })} className="w-8 h-8 rounded-lg" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdate(selectedText.id, { shadow: !selectedText.shadow })}
            className={`px-2 py-1.5 rounded-lg text-xs transition-all ${selectedText.shadow ? 'bg-amber-500/15 text-amber-400' : 'bg-neutral-800 text-neutral-400'}`}
          >
            Shadow
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-neutral-400">Opacity</span>
          <span className="text-xs text-neutral-500 tabular-nums">{Math.round(selectedText.opacity * 100)}%</span>
        </div>
        <input type="range" min={0} max={100} value={selectedText.opacity * 100} onChange={(e) => onUpdate(selectedText.id, { opacity: Number(e.target.value) / 100 })} className="w-full" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-neutral-400">Rotation</span>
          <span className="text-xs text-neutral-500 tabular-nums">{selectedText.rotation}°</span>
        </div>
        <input type="range" min={-180} max={180} value={selectedText.rotation} onChange={(e) => onUpdate(selectedText.id, { rotation: Number(e.target.value) })} className="w-full" />
      </div>

      <button
        onClick={() => onDelete(selectedText.id)}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 active:scale-95 transition-all text-sm text-red-400"
      >
        <Trash2 className="w-4 h-4" /> Delete Text
      </button>
    </div>
  );
}
