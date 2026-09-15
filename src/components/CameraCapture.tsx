import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, RefreshCw, Check, SwitchCamera, Zap, ZapOff, AlertCircle } from 'lucide-react';

interface CameraCaptureProps {
  onBack: () => void;
  onCapture: (dataUrl: string) => void;
}

export default function CameraCapture({ onBack, onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [flashOn, setFlashOn] = useState(false);
  const [error, setError] = useState('');
  const [captured, setCaptured] = useState<string | null>(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async (mode: 'user' | 'environment') => {
    stopStream();
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      // Check for torch support
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
      if (capabilities?.torch) setHasFlash(true);
      // Check for multiple cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setHasMultipleCameras(videoInputs.length > 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to access camera';
      if (msg.includes('Permission') || msg.includes('NotAllowed')) {
        setError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
        setError('No camera found on this device.');
      } else {
        setError('Could not access the camera: ' + msg);
      }
    }
  }, [stopStream]);

  useEffect(() => {
    startCamera(facingMode);
    return () => stopStream();
  }, [facingMode, startCamera, stopStream]);

  const handleSwitchCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const toggleFlash = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
    if (!capabilities?.torch) return;
    try {
      const newFlashOn = !flashOn;
      await track.applyConstraints({ advanced: [{ torch: newFlashOn } as MediaTrackConstraintSet] });
      setFlashOn(newFlashOn);
    } catch {
      setHasFlash(false);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d')!;
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCaptured(dataUrl);
    stopStream();
  };

  const handleRetake = () => {
    setCaptured(null);
    startCamera(facingMode);
  };

  const handleUsePhoto = () => {
    if (captured) onCapture(captured);
  };

  if (error) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-neutral-950">
        <div className="flex items-center gap-3 px-4 py-4 safe-top">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Camera</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
          <p className="text-white font-semibold text-lg mb-2">Camera Unavailable</p>
          <p className="text-neutral-400 text-sm max-w-xs">{error}</p>
          <button onClick={onBack} className="mt-6 px-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all text-white text-sm font-medium">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (captured) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-neutral-950">
        <div className="flex items-center gap-3 px-4 py-4 safe-top">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Preview</h1>
        </div>
        <div className="flex-1 flex items-center justify-center overflow-hidden px-4">
          <img src={captured} alt="Captured" className="max-w-full max-h-full object-contain rounded-xl" />
        </div>
        <div className="px-6 pb-10 safe-bottom">
          <div className="flex gap-3">
            <button
              onClick={handleRetake}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all text-white font-medium"
            >
              <RefreshCw className="w-5 h-5" /> Retake
            </button>
            <button
              onClick={handleUsePhoto}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 transition-all text-neutral-900 font-semibold"
            >
              <Check className="w-5 h-5" /> Use Photo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-black">
      <div className="flex items-center gap-3 px-4 py-4 safe-top absolute top-0 left-0 right-0 z-10">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-black/50 backdrop-blur hover:bg-black/70 active:scale-95 transition-all">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-xl font-bold text-white">Camera</h1>
      </div>

      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
        />
      </div>

      <div className="px-6 pb-10 safe-bottom pt-4 bg-black">
        <div className="flex items-center justify-center gap-8">
          {hasFlash ? (
            <button
              onClick={toggleFlash}
              className={`w-12 h-12 flex items-center justify-center rounded-full transition-all active:scale-90 ${flashOn ? 'bg-amber-500/20 text-amber-400' : 'bg-neutral-800 text-white'}`}
            >
              {flashOn ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
            </button>
          ) : (
            <div className="w-12 h-12" />
          )}

          <button
            onClick={handleCapture}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-all"
          >
            <div className="w-16 h-16 rounded-full bg-white active:scale-90 transition-all" />
          </button>

          {hasMultipleCameras ? (
            <button
              onClick={handleSwitchCamera}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-neutral-800 text-white active:scale-90 transition-all"
            >
              <SwitchCamera className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-12 h-12" />
          )}
        </div>
      </div>
    </div>
  );
}
