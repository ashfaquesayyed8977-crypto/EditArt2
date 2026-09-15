import type { CollageTemplate } from '../types';
import { shapeClipPath } from '../shapeSystem';

interface Props {
  template: CollageTemplate;
  isSelected: boolean;
  onClick: () => void;
}

export default function TemplateThumbnail({ template, isSelected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 w-16 h-16 rounded-xl border-2 transition-all active:scale-95 ${
        isSelected ? 'border-amber-400 bg-amber-500/10' : 'border-neutral-700 bg-neutral-800'
      }`}
    >
      <div className="relative w-full h-full p-1.5">
        <div className="relative w-full h-full rounded-md overflow-hidden bg-neutral-900">
          {template.slots.map((slot, i) => (
            <div
              key={i}
              className="absolute bg-neutral-500/70"
              style={{
                left: `${slot.x * 100}%`,
                top: `${slot.y * 100}%`,
                width: `${slot.w * 100}%`,
                height: `${slot.h * 100}%`,
                clipPath: shapeClipPath(slot.shape, slot.radius),
                transform: slot.rotation ? `rotate(${slot.rotation}deg)` : undefined,
                zIndex: slot.z ?? 1,
              }}
            />
          ))}
        </div>
      </div>
      <div className={`text-[8px] leading-tight mt-0.5 truncate ${isSelected ? 'text-amber-400' : 'text-neutral-500'}`}>
        {template.name}
      </div>
    </button>
  );
}
