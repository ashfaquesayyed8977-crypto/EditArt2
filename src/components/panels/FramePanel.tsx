import { useState } from 'react';
import { FRAME_CATEGORIES, FRAMES } from '../../frames';
import type { FrameConfig } from '../../types';

interface FramePanelProps {
  selectedFrame: FrameConfig;
  onSelect: (frame: FrameConfig) => void;
}

export default function FramePanel({ selectedFrame, onSelect }: FramePanelProps) {
  const [category, setCategory] = useState(FRAME_CATEGORIES[0]);

  const frames = FRAMES.filter((f) => f.category === category);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {FRAME_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${
              category === cat ? 'bg-amber-500/15 text-amber-400' : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {frames.map((frame) => (
          <button
            key={frame.id}
            onClick={() => onSelect(frame)}
            className={`aspect-square rounded-xl flex items-center justify-center transition-all active:scale-95 ${
              selectedFrame.id === frame.id ? 'ring-2 ring-amber-400' : ''
            }`}
            style={{
              backgroundColor: frame.id === 'none' ? '#1a1a1a' : frame.borderColor,
              borderRadius: frame.outerRadius || 0,
              padding: frame.borderWidth || 0,
            }}
          >
            <div
              className="w-full h-full rounded-lg bg-gradient-to-br from-neutral-600 to-neutral-800"
              style={{ borderRadius: frame.innerRadius || 4 }}
            />
          </button>
        ))}
      </div>

      <p className="text-xs text-neutral-500 text-center">{frames.length} frames in {category}</p>
    </div>
  );
}
