import { ArrowLeft, Undo2, Redo2, Download, Eye } from 'lucide-react';

interface TopBarProps {
  onBack: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onShowOriginal: () => void;
  isShowingOriginal: boolean;
}

export default function TopBar({
  onBack,
  onUndo,
  onRedo,
  onSave,
  canUndo,
  canRedo,
  onShowOriginal,
  isShowingOriginal,
}: TopBarProps) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 bg-neutral-900/95 backdrop-blur border-b border-neutral-800 safe-top">
      <button
        onClick={onBack}
        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-neutral-800 active:scale-95 transition-all"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
      </button>

      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-neutral-800 active:scale-95 transition-all disabled:opacity-30"
        >
          <Undo2 className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-neutral-800 active:scale-95 transition-all disabled:opacity-30"
        >
          <Redo2 className="w-5 h-5 text-white" />
        </button>
        <button
          onPointerDown={onShowOriginal}
          className={`w-10 h-10 flex items-center justify-center rounded-xl hover:bg-neutral-800 active:scale-95 transition-all ${isShowingOriginal ? 'bg-amber-500/20' : ''}`}
        >
          <Eye className={`w-5 h-5 ${isShowingOriginal ? 'text-amber-400' : 'text-white'}`} />
        </button>
      </div>

      <button
        onClick={onSave}
        className="flex items-center gap-1.5 px-4 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 transition-all font-semibold text-sm text-neutral-900"
      >
        <Download className="w-4 h-4" />
        Save
      </button>
    </div>
  );
}
