import {
  Crop,
  Wand2,
  Sliders,
  Type,
  ImagePlus,
  Shapes,
  Sticker,
  Frame,
  Brush,
  Bandage,
  Eraser,
  Pencil,
  Aperture,
  FlipHorizontal,
} from 'lucide-react';
import type { ToolId } from '../types';

interface BottomToolbarProps {
  activeTool: ToolId | null;
  onToolSelect: (tool: ToolId) => void;
}

const TOOLS: { id: ToolId; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }[] = [
  { id: 'crop', label: 'Crop', icon: Crop },
  { id: 'flip', label: 'Flip', icon: FlipHorizontal },
  { id: 'effects', label: 'Effect', icon: Wand2 },
  { id: 'adjust', label: 'Adjust', icon: Sliders },
  { id: 'filters', label: 'Filter', icon: Aperture },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'photo', label: 'Photo', icon: ImagePlus },
  { id: 'shape', label: 'Shape', icon: Shapes },
  { id: 'stickers', label: 'Sticker', icon: Sticker },
  { id: 'border', label: 'Border', icon: Frame },
  { id: 'brush', label: 'Brush', icon: Brush },
  { id: 'repair', label: 'Retouch', icon: Bandage },
  { id: 'objectEraser', label: 'Object Eraser', icon: Eraser },
  { id: 'drawing', label: 'Drawing', icon: Pencil },
];

export default function BottomToolbar({ activeTool, onToolSelect }: BottomToolbarProps) {
  return (
    <div className="bg-black safe-bottom shrink-0">
      <div
        className="flex items-end gap-1 overflow-x-auto no-scrollbar px-3 pt-2.5 pb-1.5 scroll-smooth"
        style={{
          scrollSnapType: 'x proximity',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => onToolSelect(tool.id)}
              className="flex flex-col items-center justify-end gap-1 min-w-[68px] h-[60px] shrink-0 transition-colors duration-200 active:scale-95"
              style={{ scrollSnapAlign: 'start' }}
            >
              <Icon
                className={`w-[22px] h-[22px] transition-colors duration-200 ${isActive ? 'text-amber-400' : 'text-neutral-400'}`}
                strokeWidth={1.5}
              />
              <span
                className={`text-[10px] font-medium whitespace-nowrap tracking-tight transition-colors duration-200 ${isActive ? 'text-amber-400' : 'text-neutral-500'}`}
              >
                {tool.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
