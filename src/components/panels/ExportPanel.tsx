import { useState } from 'react';
import { X, Download } from 'lucide-react';
import { canvasToBlob, getQualityValue, getMimeType, downloadBlob } from '../../canvasUtils';

interface ExportPanelProps {
  canvas: HTMLCanvasElement | null;
  onClose: () => void;
}

export default function ExportPanel({ canvas, onClose }: ExportPanelProps) {
  const [format, setFormat] = useState<'jpg' | 'png' | 'webp'>('jpg');
  const [quality, setQuality] = useState<'standard' | 'high' | 'maximum'>('high');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!canvas) return;
    setExporting(true);
    try {
      const q = getQualityValue(quality);
      const type = getMimeType(format);
      const blob = await canvasToBlob(canvas, type, q);
      const filename = `photo-studio-${Date.now()}.${format}`;
      downloadBlob(blob, filename);
      onClose();
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60 animate-fade-in" onClick={onClose}>
      <div className="w-full bg-neutral-900 rounded-t-3xl p-5 animate-slide-up safe-bottom" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Export Photo</h2>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-neutral-800 active:scale-95 transition-all">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <span className="text-xs text-neutral-400 mb-1.5 block">Format</span>
            <div className="flex gap-2">
              {(['jpg', 'png', 'webp'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium uppercase transition-all active:scale-95 ${
                    format === f ? 'bg-amber-500/15 text-amber-400' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs text-neutral-400 mb-1.5 block">Quality</span>
            <div className="flex gap-2">
              {(['standard', 'high', 'maximum'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium capitalize transition-all active:scale-95 ${
                    quality === q ? 'bg-amber-500/15 text-amber-400' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 transition-all font-semibold text-sm text-neutral-900 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Save Photo'}
          </button>
        </div>
      </div>
    </div>
  );
}
