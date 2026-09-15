import { ZoomIn, ZoomOut, Undo2, Redo2, Trash2, RotateCcw } from 'lucide-react';

interface BackgroundPanelProps {
  brushSize: number;
  hardness: number;
  zoom: number;
  tool: 'erase' | 'restore';
  onBrushSize: (v: number) => void;
  onHardness: (v: number) => void;
  onZoom: (v: number) => void;
  onTool: (t: 'erase' | 'restore') => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onReset: () => void;
  canUndo: boolean;
  canRedo: boolean;
  bgMode: 'transparent' | 'solid' | 'image';
  bgColor: string;
  onBgMode: (m: 'transparent' | 'solid' | 'image') => void;
  onBgColor: (c: string) => void;
  onBgImage: () => void;
}

export default function BackgroundPanel(props: BackgroundPanelProps) {
  return (
    <div className="space-y-4">
      {/* Tool toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => props.onTool('erase')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 ${
            props.tool === 'erase' ? 'bg-red-500/15 text-red-400' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
          }`}
        >
          Eraser
        </button>
        <button
          onClick={() => props.onTool('restore')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 ${
            props.tool === 'restore' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
          }`}
        >
          Restore
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-neutral-400">Brush Size</span>
          <span className="text-xs text-neutral-500 tabular-nums">{props.brushSize}px</span>
        </div>
        <input type="range" min={10} max={120} value={props.brushSize} onChange={(e) => props.onBrushSize(Number(e.target.value))} className="w-full" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-neutral-400">Brush Hardness</span>
          <span className="text-xs text-neutral-500 tabular-nums">{props.hardness}%</span>
        </div>
        <input type="range" min={0} max={100} value={props.hardness} onChange={(e) => props.onHardness(Number(e.target.value))} className="w-full" />
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => props.onZoom(Math.max(1, props.zoom - 0.5))} className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all">
          <ZoomOut className="w-4 h-4 text-white" />
        </button>
        <span className="text-xs text-neutral-400 flex-1 text-center">Zoom: {props.zoom.toFixed(1)}x</span>
        <button onClick={() => props.onZoom(Math.min(5, props.zoom + 0.5))} className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all">
          <ZoomIn className="w-4 h-4 text-white" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={props.onUndo} disabled={!props.canUndo} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all text-sm text-white disabled:opacity-30">
          <Undo2 className="w-4 h-4" /> Undo
        </button>
        <button onClick={props.onRedo} disabled={!props.canRedo} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all text-sm text-white disabled:opacity-30">
          <Redo2 className="w-4 h-4" /> Redo
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={props.onClear} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all text-sm text-white">
          <Trash2 className="w-4 h-4" /> Clear BG
        </button>
        <button onClick={props.onReset} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all text-sm text-white">
          <RotateCcw className="w-4 h-4" /> Restore All
        </button>
      </div>

      {/* Background replacement */}
      <div className="pt-2 border-t border-neutral-800 space-y-3">
        <p className="text-xs text-neutral-400 font-medium">Background</p>
        <div className="flex gap-2">
          {(['transparent', 'solid', 'image'] as const).map((m) => (
            <button
              key={m}
              onClick={() => props.onBgMode(m)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all active:scale-95 ${
                props.bgMode === m ? 'bg-amber-500/15 text-amber-400' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        {props.bgMode === 'solid' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">Color</span>
            <input type="color" value={props.bgColor} onChange={(e) => props.onBgColor(e.target.value)} className="w-10 h-8 rounded-lg" />
          </div>
        )}
        {props.bgMode === 'image' && (
          <button onClick={props.onBgImage} className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all text-sm text-white">
            Choose Image
          </button>
        )}
      </div>
    </div>
  );
}
