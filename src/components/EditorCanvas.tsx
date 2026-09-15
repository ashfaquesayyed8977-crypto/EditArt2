import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import type { Adjustments, TextLayer, StickerLayer, Stroke, FrameConfig, PhotoLayer, ShapeLayer, DrawStroke, BorderConfig, EffectState } from '../types';
import { clipCanvasToShape } from '../shapeSystem';

export interface EditorCanvasHandle {
  getCanvas: () => HTMLCanvasElement | null;
  exportCanvas: () => HTMLCanvasElement | null;
}

interface EditorCanvasProps {
  image: HTMLImageElement | null;
  adjustments: Adjustments;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  skewX: number;
  skewY: number;
  crop: { x: number; y: number; w: number; h: number } | null;
  textLayers: TextLayer[];
  stickerLayers: StickerLayer[];
  strokes: Stroke[];
  frame: FrameConfig;
  showOriginal: boolean;
  overlayCanvas?: HTMLCanvasElement | null;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  onLayerSelect?: (type: 'text' | 'sticker' | 'photo' | 'shape' | null, id: string | null) => void;
  selectedLayerId?: string | null;
  onLayerMove?: (id: string, x: number, y: number) => void;
  onLayerTransform?: (id: string, updates: Record<string, number>) => void;
  onLayerGestureStart?: () => void;
  drawMode: boolean;
  onDrawStart?: (point: { x: number; y: number }) => void;
  onDrawMove?: (point: { x: number; y: number }) => void;
  onDrawEnd?: () => void;
  drawColor: string;
  drawSize: number;
  drawOpacity: number;
  drawTool: 'brush' | 'pencil' | 'eraser';
  photoLayers?: PhotoLayer[];
  shapeLayers?: ShapeLayer[];
  drawStrokes?: DrawStroke[];
  border?: BorderConfig;
  effect?: EffectState;
  brushOverlayCanvas?: HTMLCanvasElement | null;
  objectEraserCanvas?: HTMLCanvasElement | null;
  objectEraserMask?: HTMLCanvasElement | null;
  onObjectEraserPointerDown?: (pos: { x: number; y: number }) => void;
  onObjectEraserPointerMove?: (pos: { x: number; y: number }) => void;
  onObjectEraserPointerUp?: () => void;
  objectEraserMode?: boolean;
}

const EditorCanvas = forwardRef<EditorCanvasHandle, EditorCanvasProps>(function EditorCanvas(
  props,
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const layerStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDrawingRef = useRef(false);
  const objectEraserDrawingRef = useRef(false);
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const historyPushedRef = useRef(false);
  const gestureRef = useRef<{
    layerId: string;
    layerType: 'text' | 'sticker' | 'photo' | 'shape';
    initialDistance: number;
    initialAngle: number;
    initialRotation: number;
    initialScale: number;
    initialFontSize: number;
    initialSize: number;
    initialW: number;
    initialH: number;
  } | null>(null);
  const resizeRef = useRef<{
    layerId: string;
    initialDist: number;
    initialFontSize: number;
  } | null>(null);

  const getMaxDims = useCallback((img: HTMLImageElement) => {
    const maxDim = 2048;
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (w > maxDim || h > maxDim) {
      const ratio = Math.min(maxDim / w, maxDim / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }
    return { w, h };
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !props.image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { w: maxW, h: maxH } = getMaxDims(props.image);

    const crop = props.crop;
    const cw = crop ? Math.round(maxW * crop.w) : maxW;
    const ch = crop ? Math.round(maxH * crop.h) : maxH;
    const cx = crop ? Math.round(maxW * crop.x) : 0;
    const cy = crop ? Math.round(maxH * crop.y) : 0;

    const frame = props.frame;
    const fb = frame.id !== 'none' ? frame.borderWidth : 0;
    const fi = frame.inset || 0;
    const frameBorder = fb + fi;

    const border = props.border;
    const borderPad = border && border.width > 0 ? border.width : 0;

    const totalBorder = frameBorder + borderPad;
    const canvasW = cw + totalBorder * 2;
    const canvasH = ch + totalBorder * 2;

    canvas.width = canvasW;
    canvas.height = canvasH;

    ctx.clearRect(0, 0, canvasW, canvasH);

    // Draw frame background
    if (frame.id !== 'none') {
      ctx.fillStyle = frame.borderColor;
      if (frame.outerRadius > 0) {
        roundRect(ctx, 0, 0, canvasW, canvasH, frame.outerRadius);
        ctx.fill();
      } else {
        ctx.fillRect(0, 0, canvasW, canvasH);
      }
    }

    // Draw border
    if (border && border.width > 0) {
      ctx.save();
      ctx.globalAlpha = border.opacity;
      ctx.strokeStyle = border.color;
      ctx.lineWidth = border.width;
      if (border.style === 'dashed') ctx.setLineDash([border.width * 2, border.width]);
      const bx = frameBorder;
      const by = frameBorder;
      if (border.radius > 0) {
        roundRect(ctx, bx, by, cw, ch, border.radius);
        ctx.stroke();
      } else {
        ctx.strokeRect(bx, by, cw, ch);
      }
      ctx.restore();
    }

    // Draw image area
    ctx.save();
    if (frame.id !== 'none' && frame.innerRadius > 0) {
      roundRect(ctx, totalBorder, totalBorder, cw, ch, frame.innerRadius);
      ctx.clip();
    }

    if (props.showOriginal) {
      ctx.save();
      ctx.translate(totalBorder + cw / 2, totalBorder + ch / 2);
      ctx.rotate((props.rotation * Math.PI) / 180);
      const sx = Math.tan((props.skewX || 0) * Math.PI / 180);
      const sy = Math.tan((props.skewY || 0) * Math.PI / 180);
      ctx.transform(1, sy, sx, 1, 0, 0);
      ctx.scale(props.flipH ? -1 : 1, props.flipV ? -1 : 1);
      ctx.drawImage(props.image, cx, cy, cw, ch, -cw / 2, -ch / 2, cw, ch);
      ctx.restore();
    } else {
      // Draw with adjustments
      ctx.save();
      ctx.translate(totalBorder + cw / 2, totalBorder + ch / 2);
      ctx.rotate((props.rotation * Math.PI) / 180);
      const sx = Math.tan((props.skewX || 0) * Math.PI / 180);
      const sy = Math.tan((props.skewY || 0) * Math.PI / 180);
      ctx.transform(1, sy, sx, 1, 0, 0);
      ctx.scale(props.flipH ? -1 : 1, props.flipV ? -1 : 1);

      const filters: string[] = [];
      const brightness = 1 + props.adjustments.brightness / 100 + props.adjustments.exposure / 100;
      const contrast = 1 + props.adjustments.contrast / 100;
      const saturate = 1 + props.adjustments.saturation / 100;
      filters.push(`brightness(${brightness})`);
      filters.push(`contrast(${contrast})`);
      filters.push(`saturate(${saturate})`);
      if (props.adjustments.blur > 0) filters.push(`blur(${props.adjustments.blur / 10}px)`);
      if (props.adjustments.sepia > 0) filters.push(`sepia(${props.adjustments.sepia / 100})`);
      if (props.adjustments.grayscale > 0) filters.push(`grayscale(${props.adjustments.grayscale / 100})`);

      // Effects
      const eff = props.effect;
      if (eff && eff.type !== 'none' && eff.intensity > 0) {
        const i = eff.intensity / 100;
        switch (eff.type) {
          case 'blur': filters.push(`blur(${i * 20}px)`); break;
          case 'sharpen': filters.push(`contrast(${1 + i * 0.5})`); break;
          case 'fade': filters.push(`brightness(${1 + i * 0.3})`); break;
          case 'vintage': filters.push(`sepia(${i * 0.8})`); filters.push(`contrast(${1 - i * 0.2})`); break;
          case 'bw': filters.push(`grayscale(${i})`); break;
          case 'sepia': filters.push(`sepia(${i})`); break;
          case 'posterize': filters.push(`contrast(${1 + i * 1.5})`); break;
          case 'emboss': filters.push(`contrast(${1 + i})`); break;
          case 'edge': filters.push(`contrast(${1 + i * 2})`); filters.push(`invert(0)`); break;
          case 'glow': filters.push(`brightness(${1 + i * 0.5})`); filters.push(`contrast(${1 + i * 0.3})`); break;
          case 'bloom': filters.push(`brightness(${1 + i * 0.4})`); break;
          case 'duotone': filters.push(`grayscale(1)`); filters.push(`sepia(${i})`); break;
        }
      }

      ctx.filter = filters.join(' ');
      ctx.drawImage(props.image, cx, cy, cw, ch, -cw / 2, -ch / 2, cw, ch);
      ctx.filter = 'none';
      ctx.restore();

      // Temperature overlay
      if (props.adjustments.temperature !== 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        const t = props.adjustments.temperature;
        ctx.fillStyle = t > 0 ? `rgba(255, 140, 0, ${Math.abs(t) / 200})` : `rgba(0, 140, 255, ${Math.abs(t) / 200})`;
        ctx.fillRect(totalBorder, totalBorder, cw, ch);
        ctx.restore();
      }

      // Tint overlay
      if (props.adjustments.tint !== 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = props.adjustments.tint > 0 ? `rgba(120, 0, 200, ${Math.abs(props.adjustments.tint) / 200})` : `rgba(0, 200, 120, ${Math.abs(props.adjustments.tint) / 200})`;
        ctx.fillRect(totalBorder, totalBorder, cw, ch);
        ctx.restore();
      }

      // Vignette
      if (props.adjustments.vignette > 0) {
        ctx.save();
        const vx = totalBorder + cw / 2;
        const vy = totalBorder + ch / 2;
        const innerR = Math.min(cw, ch) * 0.3;
        const outerR = Math.max(cw, ch) * 0.75;
        const grad = ctx.createRadialGradient(vx, vy, innerR, vx, vy, outerR);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, `rgba(0,0,0,${props.adjustments.vignette / 100})`);
        ctx.fillStyle = grad;
        ctx.fillRect(totalBorder, totalBorder, cw, ch);
        ctx.restore();
      }

      // Effect overlays (noise, grain, pixelate, glitch)
      const eff2 = props.effect;
      if (eff2 && eff2.type !== 'none' && eff2.intensity > 0) {
        const i = eff2.intensity / 100;
        if (eff2.type === 'noise' || eff2.type === 'grain') {
          ctx.save();
          ctx.globalAlpha = i * 0.4;
          for (let n = 0; n < cw * ch * 0.01 * i; n++) {
            const nx = totalBorder + Math.random() * cw;
            const ny = totalBorder + Math.random() * ch;
            ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
            ctx.fillRect(nx, ny, 1, 1);
          }
          ctx.restore();
        }
        if (eff2.type === 'vignette') {
          ctx.save();
          const vx = totalBorder + cw / 2;
          const vy = totalBorder + ch / 2;
          const innerR = Math.min(cw, ch) * 0.2;
          const outerR = Math.max(cw, ch) * 0.8;
          const grad = ctx.createRadialGradient(vx, vy, innerR, vx, vy, outerR);
          grad.addColorStop(0, 'rgba(0,0,0,0)');
          grad.addColorStop(1, `rgba(0,0,0,${i})`);
          ctx.fillStyle = grad;
          ctx.fillRect(totalBorder, totalBorder, cw, ch);
          ctx.restore();
        }
        if (eff2.type === 'glitch') {
          ctx.save();
          ctx.globalAlpha = i * 0.5;
          for (let g = 0; g < 5; g++) {
            const gy = totalBorder + Math.random() * ch;
            const gh = Math.random() * 20 + 5;
            const gx = totalBorder + (Math.random() - 0.5) * 20 * i;
            ctx.drawImage(canvas, totalBorder, gy, cw, gh, gx, gy, cw, gh);
          }
          ctx.restore();
        }
        if (eff2.type === 'pixelate') {
          ctx.save();
          const pixSize = Math.max(2, Math.round(i * 20));
          const tc = document.createElement('canvas');
          tc.width = Math.ceil(cw / pixSize);
          tc.height = Math.ceil(ch / pixSize);
          const tctx = tc.getContext('2d')!;
          tctx.drawImage(canvas, totalBorder, totalBorder, cw, ch, 0, 0, tc.width, tc.height);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(tc, 0, 0, tc.width, tc.height, totalBorder, totalBorder, cw, ch);
          ctx.imageSmoothingEnabled = true;
          ctx.restore();
        }
      }

      // Sharpness
      if (props.adjustments.sharpness > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = props.adjustments.sharpness / 200;
        ctx.save();
        ctx.translate(totalBorder + cw / 2, totalBorder + ch / 2);
        ctx.rotate((props.rotation * Math.PI) / 180);
        ctx.scale(props.flipH ? -1 : 1, props.flipV ? -1 : 1);
        ctx.drawImage(props.image, cx, cy, cw, ch, -cw / 2, -ch / 2, cw, ch);
        ctx.restore();
        ctx.restore();
      }

      // Draw old strokes
      if (props.strokes.length > 0) {
        ctx.save();
        ctx.translate(totalBorder, totalBorder);
        for (const stroke of props.strokes) {
          if (stroke.points.length === 0) continue;
          ctx.save();
          if (stroke.tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.globalAlpha = 1;
          } else {
            ctx.globalAlpha = stroke.opacity;
          }
          ctx.strokeStyle = stroke.color;
          ctx.lineWidth = stroke.size;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
          }
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }

      // Draw new draw strokes
      if (props.drawStrokes && props.drawStrokes.length > 0) {
        ctx.save();
        ctx.translate(totalBorder, totalBorder);
        for (const stroke of props.drawStrokes) {
          if (stroke.points.length === 0) continue;
          ctx.save();
          if (stroke.tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.globalAlpha = 1;
          } else {
            ctx.globalAlpha = stroke.opacity;
            if (stroke.tool === 'neon') {
              ctx.shadowColor = stroke.color;
              ctx.shadowBlur = stroke.size * 2;
            }
            if (stroke.tool === 'marker' || stroke.tool === 'highlighter') {
              ctx.globalAlpha = stroke.opacity * 0.5;
            }
          }
          ctx.strokeStyle = stroke.color;
          ctx.lineWidth = stroke.size;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
          }
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }

      // Draw brush overlay canvas
      if (props.brushOverlayCanvas) {
        ctx.drawImage(props.brushOverlayCanvas, totalBorder, totalBorder, cw, ch);
      }

      // Draw object eraser mask overlay
      if (props.objectEraserMask) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.drawImage(props.objectEraserMask, totalBorder, totalBorder, cw, ch);
        ctx.restore();
      }

      // Draw object eraser result
      if (props.objectEraserCanvas) {
        ctx.drawImage(props.objectEraserCanvas, totalBorder, totalBorder, cw, ch);
      }

      // Draw overlay canvas (repair/erase results)
      if (props.overlayCanvas) {
        ctx.drawImage(props.overlayCanvas, totalBorder, totalBorder, cw, ch);
      }

      // Draw photo layers
      if (props.photoLayers) {
        for (const photo of props.photoLayers) {
          ctx.save();
          ctx.translate(totalBorder + photo.x, totalBorder + photo.y);
          ctx.rotate((photo.rotation * Math.PI) / 180);
          ctx.scale(photo.scale * (photo.flipH ? -1 : 1), photo.scale * (photo.flipV ? -1 : 1));
          ctx.globalAlpha = photo.opacity;
          const pw = photo.image.naturalWidth;
          const ph = photo.image.naturalHeight;
          ctx.drawImage(photo.image, -pw / 2, -ph / 2, pw, ph);
          ctx.restore();
        }
      }

      // Draw shape layers
      if (props.shapeLayers) {
        for (const shape of props.shapeLayers) {
          ctx.save();
          ctx.translate(totalBorder + shape.x, totalBorder + shape.y);
          ctx.rotate((shape.rotation * Math.PI) / 180);
          ctx.globalAlpha = shape.opacity;
          // Draw fill
          ctx.fillStyle = shape.fillColor;
          ctx.save();
          clipCanvasToShape(ctx, shape.shape, -shape.w / 2, -shape.h / 2, shape.w, shape.h, shape.radius);
          ctx.fill();
          ctx.restore();
          // Draw border
          if (shape.borderWidth > 0) {
            ctx.strokeStyle = shape.borderColor;
            ctx.lineWidth = shape.borderWidth;
            ctx.save();
            clipCanvasToShape(ctx, shape.shape, -shape.w / 2, -shape.h / 2, shape.w, shape.h, shape.radius);
            ctx.stroke();
            ctx.restore();
          }
          ctx.restore();
        }
      }

      // Draw text layers
      for (const text of props.textLayers) {
        ctx.save();
        ctx.translate(totalBorder + text.x, totalBorder + text.y);
        ctx.rotate((text.rotation * Math.PI) / 180);
        ctx.globalAlpha = text.opacity;
        ctx.font = `${text.italic ? 'italic ' : ''}${text.bold ? 'bold ' : ''}${text.fontSize}px ${text.fontFamily}`;
        ctx.textAlign = text.align;
        ctx.textBaseline = 'middle';
        if (text.shadow) {
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = 6;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
        }
        if (text.bgEnabled) {
          const metrics = ctx.measureText(text.text);
          const tw = metrics.width;
          const th = text.fontSize * 1.3;
          const tx = text.align === 'center' ? -tw / 2 : text.align === 'right' ? -tw : 0;
          ctx.fillStyle = text.bgColor;
          ctx.fillRect(tx - 6, -th / 2, tw + 12, th);
        }
        ctx.fillStyle = text.color;
        ctx.fillText(text.text, 0, 0);
        ctx.restore();
      }

      // Draw sticker layers
      for (const sticker of props.stickerLayers) {
        ctx.save();
        ctx.translate(totalBorder + sticker.x, totalBorder + sticker.y);
        ctx.rotate((sticker.rotation * Math.PI) / 180);
        ctx.font = `${sticker.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sticker.emoji, 0, 0);
        ctx.restore();
      }

      // Selection indicator with bounding box and corner handles
      if (props.selectedLayerId) {
        const selText = props.textLayers.find((l) => l.id === props.selectedLayerId);
        const selSticker = props.stickerLayers.find((l) => l.id === props.selectedLayerId);
        const selPhoto = props.photoLayers?.find((l) => l.id === props.selectedLayerId);
        const selShape = props.shapeLayers?.find((l) => l.id === props.selectedLayerId);

        let sx = 0, sy = 0, sw = 100, sh = 100, srot = 0;
        if (selText) {
          sx = selText.x; sy = selText.y; srot = selText.rotation;
          ctx.save();
          ctx.font = `${selText.italic ? 'italic ' : ''}${selText.bold ? 'bold ' : ''}${selText.fontSize}px ${selText.fontFamily}`;
          sw = Math.max(ctx.measureText(selText.text).width, selText.fontSize);
          ctx.restore();
          sh = selText.fontSize * 1.4;
        } else if (selSticker) {
          sx = selSticker.x; sy = selSticker.y; srot = selSticker.rotation;
          sw = selSticker.size * 1.2; sh = selSticker.size * 1.2;
        } else if (selPhoto) {
          sx = selPhoto.x; sy = selPhoto.y; srot = selPhoto.rotation;
          sw = selPhoto.image.naturalWidth * selPhoto.scale;
          sh = selPhoto.image.naturalHeight * selPhoto.scale;
        } else if (selShape) {
          sx = selShape.x; sy = selShape.y; srot = selShape.rotation;
          sw = selShape.w; sh = selShape.h;
        }

        const pad = 8;
        ctx.save();
        ctx.translate(totalBorder + sx, totalBorder + sy);
        ctx.rotate((srot * Math.PI) / 180);
        ctx.strokeStyle = '#f5a524';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.strokeRect(-sw / 2 - pad, -sh / 2 - pad, sw + pad * 2, sh + pad * 2);
        ctx.setLineDash([]);
        ctx.fillStyle = '#f5a524';
        const corners = [
          [-sw / 2 - pad, -sh / 2 - pad],
          [sw / 2 + pad, -sh / 2 - pad],
          [sw / 2 + pad, sh / 2 + pad],
          [-sw / 2 - pad, sh / 2 + pad],
        ];
        for (const [cx, cy] of corners) {
          ctx.beginPath();
          ctx.arc(cx, cy, 6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    ctx.restore();
  }, [props, getMaxDims]);

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    exportCanvas: () => canvasRef.current,
  }));

  useEffect(() => {
    render();
  }, [render]);

  useEffect(() => {
    if (canvasRef.current && props.onCanvasReady) {
      props.onCanvasReady(canvasRef.current);
    }
  }, [props.onCanvasReady]);

  const getCanvasPos = (e: React.PointerEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const getLayerBounds = (id: string): { w: number; h: number } => {
    const text = props.textLayers.find((l) => l.id === id);
    if (text) {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.font = `${text.italic ? 'italic ' : ''}${text.bold ? 'bold ' : ''}${text.fontSize}px ${text.fontFamily}`;
        const w = ctx.measureText(text.text).width;
        ctx.restore();
        return { w: Math.max(w, text.fontSize), h: text.fontSize * 1.4 };
      }
      return { w: text.fontSize * 4, h: text.fontSize * 1.4 };
    }
    const sticker = props.stickerLayers.find((l) => l.id === id);
    if (sticker) return { w: sticker.size * 1.2, h: sticker.size * 1.2 };
    const photo = props.photoLayers?.find((l) => l.id === id);
    if (photo) return { w: photo.image.naturalWidth * photo.scale, h: photo.image.naturalHeight * photo.scale };
    const shape = props.shapeLayers?.find((l) => l.id === id);
    if (shape) return { w: shape.w, h: shape.h };
    return { w: 100, h: 100 };
  };

  const hitTestLayer = (localX: number, localY: number, id: string): boolean => {
    const layer =
      props.textLayers.find((l) => l.id === id) ||
      props.stickerLayers.find((l) => l.id === id) ||
      props.photoLayers?.find((l) => l.id === id) ||
      props.shapeLayers?.find((l) => l.id === id);
    if (!layer) return false;
    const bounds = getLayerBounds(id);
    const dx = localX - layer.x;
    const dy = localY - layer.y;
    const angle = (-layer.rotation * Math.PI) / 180;
    const rx = dx * Math.cos(angle) - dy * Math.sin(angle);
    const ry = dx * Math.sin(angle) + dy * Math.cos(angle);
    return Math.abs(rx) < bounds.w / 2 + 12 && Math.abs(ry) < bounds.h / 2 + 12;
  };

  const isNearTextHandle = (localX: number, localY: number): boolean => {
    if (!props.selectedLayerId) return false;
    const text = props.textLayers.find((l) => l.id === props.selectedLayerId);
    if (!text) return false;
    const bounds = getLayerBounds(text.id);
    const pad = 8;
    const hw = bounds.w / 2 + pad;
    const hh = bounds.h / 2 + pad;
    const cos = Math.cos((text.rotation * Math.PI) / 180);
    const sin = Math.sin((text.rotation * Math.PI) / 180);
    const corners = [
      { dx: -hw, dy: -hh },
      { dx: hw, dy: -hh },
      { dx: hw, dy: hh },
      { dx: -hw, dy: hh },
    ];
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const hitR = 28 * scale;
    for (const c of corners) {
      const cx = text.x + c.dx * cos - c.dy * sin;
      const cy = text.y + c.dx * sin + c.dy * cos;
      if (Math.hypot(localX - cx, localY - cy) < hitR) return true;
    }
    return false;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const pos = getCanvasPos(e);
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (props.objectEraserMode) {
      objectEraserDrawingRef.current = true;
      props.onObjectEraserPointerDown?.(pos);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    if (props.drawMode) {
      isDrawingRef.current = true;
      props.onDrawStart?.(pos);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    if (activePointers.current.size === 1) {
      const frame = props.frame;
      const fb = frame.id !== 'none' ? frame.borderWidth + (frame.inset || 0) : 0;
      const border = props.border;
      const borderPad = border && border.width > 0 ? border.width : 0;
      const totalBorder = fb + borderPad;
      const localX = pos.x - totalBorder;
      const localY = pos.y - totalBorder;

      // Check for text resize handle
      if (props.selectedLayerId) {
        const text = props.textLayers.find((l) => l.id === props.selectedLayerId);
        if (text && isNearTextHandle(localX, localY)) {
          resizeRef.current = {
            layerId: props.selectedLayerId,
            initialDist: Math.hypot(localX - text.x, localY - text.y),
            initialFontSize: text.fontSize,
          };
          if (!historyPushedRef.current) {
            props.onLayerGestureStart?.();
            historyPushedRef.current = true;
          }
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          return;
        }
      }

      const allIds = [
        ...(props.shapeLayers || []).map((l) => l.id).reverse(),
        ...(props.photoLayers || []).map((l) => l.id).reverse(),
        ...props.stickerLayers.map((l) => l.id).reverse(),
        ...props.textLayers.map((l) => l.id).reverse(),
      ];

      for (const id of allIds) {
        if (hitTestLayer(localX, localY, id)) {
          let type: 'text' | 'sticker' | 'photo' | 'shape' = 'text';
          if (props.shapeLayers?.find((l) => l.id === id)) type = 'shape';
          else if (props.photoLayers?.find((l) => l.id === id)) type = 'photo';
          else if (props.stickerLayers.find((l) => l.id === id)) type = 'sticker';

          const layer =
            props.textLayers.find((l) => l.id === id) ||
            props.stickerLayers.find((l) => l.id === id) ||
            props.photoLayers?.find((l) => l.id === id) ||
            props.shapeLayers?.find((l) => l.id === id);

          isDraggingRef.current = true;
          dragStartRef.current = { x: e.clientX, y: e.clientY };
          layerStartRef.current = { x: (layer as any).x, y: (layer as any).y };
          historyPushedRef.current = false;
          props.onLayerSelect?.(type, id);
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          return;
        }
      }
      props.onLayerSelect?.(null, null);
    } else if (activePointers.current.size === 2 && props.selectedLayerId) {
      isDraggingRef.current = false;
      resizeRef.current = null;
      const pointers = Array.from(activePointers.current.values());
      const dist = Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y);
      const angle = Math.atan2(pointers[1].y - pointers[0].y, pointers[1].x - pointers[0].x);

      const text = props.textLayers.find((l) => l.id === props.selectedLayerId);
      const sticker = props.stickerLayers.find((l) => l.id === props.selectedLayerId);
      const photo = props.photoLayers?.find((l) => l.id === props.selectedLayerId);
      const shape = props.shapeLayers?.find((l) => l.id === props.selectedLayerId);

      let layerType: 'text' | 'sticker' | 'photo' | 'shape' = 'text';
      let initialRotation = 0;
      let initialScale = 1;
      let initialFontSize = 32;
      let initialSize = 64;
      let initialW = 150;
      let initialH = 150;

      if (text) {
        layerType = 'text'; initialRotation = text.rotation; initialFontSize = text.fontSize;
      } else if (sticker) {
        layerType = 'sticker'; initialRotation = sticker.rotation; initialSize = sticker.size;
      } else if (photo) {
        layerType = 'photo'; initialRotation = photo.rotation; initialScale = photo.scale;
      } else if (shape) {
        layerType = 'shape'; initialRotation = shape.rotation; initialW = shape.w; initialH = shape.h;
      }

      if (!historyPushedRef.current) {
        props.onLayerGestureStart?.();
        historyPushedRef.current = true;
      }

      gestureRef.current = {
        layerId: props.selectedLayerId, layerType,
        initialDistance: dist, initialAngle: angle, initialRotation,
        initialScale, initialFontSize, initialSize, initialW, initialH,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activePointers.current.has(e.pointerId)) return;
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (props.objectEraserMode && objectEraserDrawingRef.current) {
      const pos = getCanvasPos(e);
      props.onObjectEraserPointerMove?.(pos);
      return;
    }

    if (props.drawMode && isDrawingRef.current) {
      const pos = getCanvasPos(e);
      props.onDrawMove?.(pos);
      return;
    }

    if (resizeRef.current && activePointers.current.size === 1) {
      const r = resizeRef.current;
      const text = props.textLayers.find((l) => l.id === r.layerId);
      if (!text) return;
      const frame = props.frame;
      const fb = frame.id !== 'none' ? frame.borderWidth + (frame.inset || 0) : 0;
      const border = props.border;
      const borderPad = border && border.width > 0 ? border.width : 0;
      const totalBorder = fb + borderPad;
      const pos2 = getCanvasPos(e);
      const lx = pos2.x - totalBorder;
      const ly = pos2.y - totalBorder;
      const dist = Math.hypot(lx - text.x, ly - text.y);
      if (r.initialDist > 0) {
        const ratio = dist / r.initialDist;
        const newFontSize = Math.max(8, Math.min(200, Math.round(r.initialFontSize * ratio)));
        props.onLayerTransform?.(r.layerId, { fontSize: newFontSize });
      }
      return;
    }

    if (gestureRef.current && activePointers.current.size >= 2) {
      const pointers = Array.from(activePointers.current.values());
      const dist = Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y);
      const angle = Math.atan2(pointers[1].y - pointers[0].y, pointers[1].x - pointers[0].x);
      const ratio = dist / gestureRef.current.initialDistance;
      const rotationDelta = ((angle - gestureRef.current.initialAngle) * 180) / Math.PI;
      const newRotation = gestureRef.current.initialRotation + rotationDelta;

      const updates: Record<string, number> = { rotation: newRotation };
      const g = gestureRef.current;
      if (g.layerType === 'photo') {
        updates.scale = Math.max(0.05, g.initialScale * ratio);
      } else if (g.layerType === 'text') {
        updates.fontSize = Math.max(8, Math.round(g.initialFontSize * ratio));
      } else if (g.layerType === 'sticker') {
        updates.size = Math.max(8, Math.round(g.initialSize * ratio));
      } else if (g.layerType === 'shape') {
        updates.w = Math.max(10, Math.round(g.initialW * ratio));
        updates.h = Math.max(10, Math.round(g.initialH * ratio));
      }
      props.onLayerTransform?.(g.layerId, updates);
    } else if (isDraggingRef.current && props.selectedLayerId) {
      if (!historyPushedRef.current) {
        props.onLayerGestureStart?.();
        historyPushedRef.current = true;
      }
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const newX = layerStartRef.current.x + dx * scaleX;
      const newY = layerStartRef.current.y + dy * scaleY;
      props.onLayerMove?.(props.selectedLayerId, newX, newY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId);

    if (resizeRef.current) {
      resizeRef.current = null;
      try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* noop */ }
      return;
    }

    if (props.objectEraserMode && objectEraserDrawingRef.current) {
      objectEraserDrawingRef.current = false;
      props.onObjectEraserPointerUp?.();
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      return;
    }

    if (props.drawMode && isDrawingRef.current) {
      isDrawingRef.current = false;
      props.onDrawEnd?.();
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      return;
    }

    if (activePointers.current.size < 2) {
      gestureRef.current = null;
    }
    if (activePointers.current.size === 0) {
      isDraggingRef.current = false;
    }
  };

  if (!props.image) return null;

  return (
    <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-hidden p-4">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="max-w-full max-h-full object-contain touch-none"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
});

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export default EditorCanvas;
