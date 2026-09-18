import { useState } from 'react';
import Home from './components/Home';
import Editor from './components/Editor';
import Collage from './components/Collage';
import AIEnhancer from './components/AIEnhancer';
import BackgroundEraser from './components/BackgroundEraser';
import PhotoSource from './components/PhotoSource';
import CameraCapture from './components/CameraCapture';
import ImageAssets from './components/ImageAssets';
import { fileToDataURL } from './canvasUtils';

type Mode =
  | 'home'
  | 'photo-source'
  | 'camera'
  | 'image-assets'
  | 'editor'
  | 'collage'
  | 'ai-enhancer'
  | 'bg-eraser';

function App() {
  const [mode, setMode] = useState<Mode>('home');
  const [imageSrc, setImageSrc] = useState('');

  const openEditor = (src: string) => {
    setImageSrc(src);
    setMode('editor');
  };

  const handlePickPhoto = async (file: File) => {
    const dataUrl = await fileToDataURL(file);
    openEditor(dataUrl);
  };

  return (
    <>
      {mode === 'home' && (
        <Home
          onEditPhoto={() => setMode('photo-source')}
          onOpenCollage={() => setMode('collage')}
          onOpenAIEnhancer={() => setMode('ai-enhancer')}
          onOpenBgEraser={() => setMode('bg-eraser')}
        />
      )}
      {mode === 'photo-source' && (
        <PhotoSource
          onBack={() => setMode('home')}
          onGallery={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/jpeg,image/jpg,image/png,image/webp';
            input.onchange = async (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) await handlePickPhoto(file);
            };
            input.click();
          }}
          onCamera={() => setMode('camera')}
          onImageAssets={() => setMode('image-assets')}
        />
      )}
      {mode === 'camera' && (
        <CameraCapture
          onBack={() => setMode('photo-source')}
          onCapture={(dataUrl) => openEditor(dataUrl)}
        />
      )}
      {mode === 'image-assets' && (
        <ImageAssets
          onBack={() => setMode('photo-source')}
          onUseAsset={(dataUrl) => openEditor(dataUrl)}
        />
      )}
      {mode === 'editor' && imageSrc && (
        <Editor imageSrc={imageSrc} onBack={() => setMode('home')} />
      )}
      {mode === 'collage' && <Collage onBack={() => setMode('home')} />}
      {mode === 'ai-enhancer' && <AIEnhancer onBack={() => setMode('home')} />}
      {mode === 'bg-eraser' && (
        <BackgroundEraser onBack={() => setMode('home')} />
      )}
    </>
  );
}

export default App;
