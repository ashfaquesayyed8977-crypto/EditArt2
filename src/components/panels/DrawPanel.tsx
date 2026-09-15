import { Undo2, Redo2, Trash2 } from 'lucide-react';
import type { Stroke } from '../../types';

interface DrawPanelProps {
  tool: 'brush' | 'pencil' | 'eraser';
  color: string;
  size: number;
  opacity: number;
  onTool: (t: 'brush' | 'pencil' | 'eraser') => void;
  onColor: (c: string) => void;
  onSize: (s: number) => void;
  onOpacity: (o: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const COLORS = ['#ffffff', '#000000', '#ff4757', '#ffa502', '#2ed573', '#1e90ff', '#a55eea', '#ff6b81', '#feca57', '#48dbfb'];

export default function DrawPanel(props: DrawPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['brush', 'pencil', 'eraser'] as const).map((t) => (
          <button
            key={t}
            onClick={() => props.onTool(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium capitalize transition-all active:scale-95 ${
              props.tool === t ? 'bg-amber-500/15 text-amber-400' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {props.tool !== 'eraser' && (
        <div>
          <span className="text-xs text-neutral-400 mb-1.5 block">Color</span>
          <div className="flex items-center gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => props.onColor(c)}
                className={`w-8 h-8 rounded-lg transition-all active:scale-90 ${props.color === c ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-neutral-900' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
            <input type="color" value={props.color} onChange={(e) => props.onColor(e.target.value)} className="w-8 h-8 rounded-lg" />
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-neutral-400">Brush Size</span>
          <span className="text-xs text-neutral-500 tabular-nums">{props.size}px</span>
        </div>
        <input type="range" min={1} max={50} value={props.size} onChange={(e) => props.onSize(Number(e.target.value))} className="w-full" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-neutral-400">Opacity</span>
          <span className="text-xs text-neutral-500 tabular-nums">{props.opacity}%</span>
        </div>
        <input type="range" min={1} max={100} value={props.opacity} onChange={(e) => props.onOpacity(Number(e.target.value))} className="w-full" />
      </div>

      <div className="flex items-center gap-2">
        <button onClick={props.onUndo} disabled={!props.canUndo} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all text-sm text-white disabled:opacity-30">
          <Undo2 className="w-4 h-4" /> Undo
        </button>
        <button onClick={props.onRedo} disabled={!props.canRedo} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all text-sm text-white disabled:opacity-30">
          <Redo2 className="w-4 h-4" /> Redo
        </button>
      </div>

      <button onClick={props.onClear} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all text-sm text-white">
        <Trash2 className="w-4 h-4" /> Clear All
      </button>
    </div>
  );
}

export type { Stroke };
