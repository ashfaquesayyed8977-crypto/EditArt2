import { useState, useRef, useCallback, useEffect } from 'react';
import {
  ArrowLeft,
  Upload,
  Wand2,
  Download,
  Share2,
  RefreshCw,
  Sparkles,
  Zap,
  AlertCircle,
  Check,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import {
  enhanceImage,
  EnhanceError,
  type EnhanceResult,
} from '../aiEnhancer';
import { fileToDataURL, loadImage, canvasToBlob, downloadBlob } from '../canvasUtils';

type Stage = 'select' | 'preview' | 'processing' | 'result' | 'error';

interface Props {
  onBack: () => void;
}

export default function AIEnhancer({ onBack }: Props) {
  const [stage, setStage] = useState<Stage>('select');
  const [originalUrl, setOriginalUrl] = useState('');
  const [originalBlob, setOriginalBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState('');
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [sliderPos, setSliderPos] = useState(50);
  const [intensity, setIntensity] = useState(100);
  const [activeMode, setActiveMode] = useState<'auto' | 'hd'>('auto');
  const [isDragging, setIsDragging] = useState(false);
  const [processingLabel, setProcessingLabel] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sliderAreaRef = useRef<HTMLDivElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataURL(file);
    setOriginalUrl(dataUrl);
    setOriginalBlob(file);
    setResultUrl('');
    setResultBlob(null);
    setStage('preview');
    e.target.value = '';
  };

  const runEnhance = async (mode: 'auto' | 'hd') => {
    if (!originalBlob) return;
    setStage('processing');
    setErrorMsg('');
    setActiveMode(mode);
    setProcessingLabel(mode === 'hd' ? 'Enhancing to 4K HD...' : 'Auto enhancing...');
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result: EnhanceResult = await enhanceImage(originalBlob, {
        mode,
        intensity,
        signal: controller.signal,
      });
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(result.url);
      setResultBlob(result.blob);
      setSliderPos(50);
      setStage('result');
    } catch (err) {
      if (err instanceof EnhanceError) {
        setErrorMsg(err.message);
      } else if (err instanceof DOMException && err.name === 'AbortError') {
        setErrorMsg('Enhancement was cancelled.');
      } else {
        setErrorMsg('An unexpected error occurred during enhancement.');
      }
      setStage('error');
    } finally {
      abortRef.current = null;
    }
  };

  const cancelProcessing = () => {
    abortRef.current?.abort();
  };

  const reset = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setOriginalUrl('');
    setOriginalBlob(null);
    setResultUrl('');
    setResultBlob(null);
    setErrorMsg('');
    setStage('select');
  };

  const tryAnother = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl('');
    setResultBlob(null);
    setErrorMsg('');
    setStage('select');
    setTimeout(() => fileRef.current?.click(), 100);
  };

  const handleSave = async () => {
    if (!resultBlob) return;
    downloadBlob(resultBlob, `enhanced-${Date.now()}.jpg`);
  };

  const handleShare = async () => {
    if (!resultBlob) return;
    try {
      const file = new File([resultBlob], 'enhanced.jpg', { type: 'image/jpeg' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Enhanced Photo' });
      } else {
        handleSave();
      }
    } catch {
      // User cancelled or share failed
    }
  };

  const updateSliderFromClientX = useCallback((clientX: number) => {
    const area = sliderAreaRef.current;
    if (!area) return;
    const rect = area.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, pct)));
  }, []);

  const handleSliderPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateSliderFromClientX(e.clientX);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleSliderPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updateSliderFromClientX(e.clientX);
  };

  const handleSliderPointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4 safe-top">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-800/80 hover:bg-neutral-800 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h1 className="text-lg font-bold text-white">AI Photo Enhancer</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-4 pb-6">
        {/* Select stage */}
        {stage === 'select' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-fade-in">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/20">
              <Wand2 className="w-12 h-12 text-white" strokeWidth={2} />
            </div>
            <div className="text-center max-w-xs">
              <h2 className="text-xl font-bold text-white mb-2">Universal Auto Enhance</h2>
              <p className="text-neutral-400 text-sm leading-relaxed">
                One-tap professional enhancement. White balance, exposure, contrast, color pop, dehaze, shadow lift, sharpening & denoise — all automatic, fully offline.
              </p>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
            >
              <Upload className="w-5 h-5" />
              Select Photo
            </button>
          </div>
        )}

        {/* Preview stage */}
        {stage === 'preview' && originalUrl && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="flex-1 flex items-center justify-center min-h-0 py-4">
              <div className="relative max-w-full max-h-full rounded-2xl overflow-hidden border border-neutral-700/50 shadow-xl">
                <img
                  src={originalUrl}
                  alt="Preview"
                  className="max-w-full max-h-[45vh] object-contain"
                />
              </div>
            </div>

            <div className="space-y-4">
              {/* Intensity slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white">Intensity</span>
                  <span className="text-sm text-amber-400 font-medium tabular-nums">{intensity}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full bg-neutral-800 appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => runEnhance('auto')}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
                >
                  <Wand2 className="w-5 h-5" />
                  Auto Enhance
                </button>
                <button
                  onClick={() => runEnhance('hd')}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-neutral-900/80 backdrop-blur border border-neutral-600/40 text-white font-semibold active:scale-95 transition-all shadow-lg shadow-black/30"
                >
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  HD Ultra
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Processing stage */}
        {stage === 'processing' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-fade-in">
            <div className="relative">
              <div className="w-28 h-28 rounded-full border-4 border-neutral-800 border-t-amber-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Wand2 className="w-10 h-10 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-white mb-1">
                {activeMode === 'hd' ? 'Enhancing to 4K HD' : 'Enhancing your photo'}
              </h2>
              <p className="text-neutral-400 text-sm">{processingLabel}</p>
            </div>
            <div className="w-64 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 animate-progress-bar" />
            </div>
            <button
              onClick={cancelProcessing}
              className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors mt-2"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Result stage */}
        {stage === 'result' && originalUrl && resultUrl && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="flex-1 flex items-center justify-center min-h-0 py-4">
              {/* Before/After comparison slider */}
              <div
                ref={sliderAreaRef}
                className="relative max-w-full max-h-full rounded-2xl overflow-hidden border border-neutral-700/50 shadow-xl select-none"
                style={{ touchAction: 'none' }}
              >
                {/* After (full) */}
                <img
                  src={resultUrl}
                  alt="Enhanced"
                  className="block max-w-full max-h-[45vh] object-contain pointer-events-none"
                  draggable={false}
                />
                {/* Before (clipped) */}
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ width: `${sliderPos}%` }}
                >
                  <img
                    src={originalUrl}
                    alt="Original"
                    className="block h-full object-contain"
                    style={{ width: `${sliderAreaRef.current?.clientWidth || 0}px` }}
                    draggable={false}
                  />
                </div>
                {/* Slider handle */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center">
                    <div className="flex items-center gap-0.5">
                      <ArrowLeft className="w-3 h-3 text-neutral-700" />
                      <ArrowLeft className="w-3 h-3 text-neutral-700 rotate-180" />
                    </div>
                  </div>
                </div>
                {/* Labels */}
                <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur text-white text-[10px] font-medium pointer-events-none">
                  Before
                </div>
                <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-amber-500/80 backdrop-blur text-white text-[10px] font-medium pointer-events-none">
                  After
                </div>
                {/* Slider interaction overlay */}
                <div
                  className="absolute inset-0"
                  onPointerDown={handleSliderPointerDown}
                  onPointerMove={handleSliderPointerMove}
                  onPointerUp={handleSliderPointerUp}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm text-neutral-400">
                <Check className="w-4 h-4 text-emerald-400" />
                Enhancement complete — drag slider to compare
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleSave}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium active:scale-95 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => runEnhance(activeMode === 'auto' ? 'hd' : 'auto')}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 font-medium active:scale-95 transition-all"
                >
                  {activeMode === 'auto' ? <Sparkles className="w-4 h-4 text-amber-400" /> : <Wand2 className="w-4 h-4 text-amber-400" />}
                  {activeMode === 'auto' ? 'HD Ultra' : 'Standard'}
                </button>
                <button
                  onClick={tryAnother}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 font-medium active:scale-95 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  New Photo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error stage */}
        {stage === 'error' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-red-500/15 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <div className="text-center max-w-xs">
              <h2 className="text-lg font-bold text-white mb-2">Enhancement Failed</h2>
              <p className="text-neutral-400 text-sm leading-relaxed">{errorMsg}</p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {originalUrl && (
                <button
                  onClick={() => setStage('preview')}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium active:scale-95 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  Try Again
                </button>
              )}
              <button
                onClick={reset}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 font-medium active:scale-95 transition-all"
              >
                <ImageIcon className="w-4 h-4" />
                Select New Photo
              </button>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
