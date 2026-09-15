import { ArrowLeft, ImagePlus, Camera, LayoutGrid } from 'lucide-react';

interface PhotoSourceProps {
  onBack: () => void;
  onGallery: () => void;
  onCamera: () => void;
  onImageAssets: () => void;
}

export default function PhotoSource({ onBack, onGallery, onCamera, onImageAssets }: PhotoSourceProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      <div className="flex items-center gap-3 px-4 py-4 safe-top">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-xl font-bold text-white">Edit a Photo</h1>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 pb-10">
        <p className="text-neutral-400 text-center text-sm mb-8">Choose a source to start editing</p>

        <div className="space-y-4">
          {/* Gallery */}
          <button
            onClick={onGallery}
            className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 to-teal-600/15 border border-emerald-500/30 hover:from-emerald-500/20 hover:to-teal-600/20 active:scale-[0.98] transition-all"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ImagePlus className="w-7 h-7 text-white" />
            </div>
            <div className="text-left flex-1">
              <p className="text-white font-semibold text-lg">Gallery</p>
              <p className="text-emerald-400/70 text-xs mt-0.5">Select a photo from your device</p>
            </div>
          </button>

          {/* Camera */}
          <button
            onClick={onCamera}
            className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-sky-500/15 to-blue-600/15 border border-sky-500/30 hover:from-sky-500/20 hover:to-blue-600/20 active:scale-[0.98] transition-all"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Camera className="w-7 h-7 text-white" />
            </div>
            <div className="text-left flex-1">
              <p className="text-white font-semibold text-lg">Camera</p>
              <p className="text-sky-400/70 text-xs mt-0.5">Take a new photo with your camera</p>
            </div>
          </button>

          {/* Image Assets */}
          <button
            onClick={onImageAssets}
            className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 to-orange-600/15 border border-amber-500/30 hover:from-amber-500/20 hover:to-orange-600/20 active:scale-[0.98] transition-all"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <LayoutGrid className="w-7 h-7 text-white" />
            </div>
            <div className="text-left flex-1">
              <p className="text-white font-semibold text-lg">Image Assets</p>
              <p className="text-amber-400/70 text-xs mt-0.5">Colors, backgrounds, patterns & more</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
