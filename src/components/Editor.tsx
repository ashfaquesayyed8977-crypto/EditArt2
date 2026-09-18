import { useState, useRef, useCallback, useEffect } from 'react';
import type {
  Adjustments,
  FilterId,
  TextLayer,
  StickerLayer,
  Stroke,
  FrameConfig,
  ToolId,
  PhotoLayer,
  ShapeLayer,
  DrawStroke,
  BorderConfig,
  EffectState,
  ShapeType,
} from '../types';
import { defaultAdjustments } from '../types';
import { getFilterAdjustments } from '../filters';
import { FRAMES } from '../frames';
import { loadImage, fileToDataURL } from '../canvasUtils';
import { getCanvasPos, eraseStroke, healStroke } from '../brushUtils';
import TopBar from './TopBar';
import BottomToolbar from './BottomToolbar';
import EditorCanvas, { type EditorCanvasHandle } from './EditorCanvas';
import AdjustPanel from './panels/AdjustPanel';
import FilterPanel from './panels/FilterPanel';
import RepairPanel from './panels/RepairPanel';
import BackgroundEraser from './BackgroundEraser';
import CropEditor, { type CropResult } from './CropEditor';
import TextPanel from './panels/TextPanel';
import DrawPanel from './panels/DrawPanel';
import StickerPanel from './panels/StickerPanel';
import FramePanel from './panels/FramePanel';
import ExportPanel from './panels/ExportPanel';
import EffectPanel from './panels/EffectPanel';
import ShapePanel from './panels/ShapePanel';
import BorderPanel from './panels/BorderPanel';
import BrushPanel from './panels/BrushPanel';
import ObjectEraserPanel from './panels/ObjectEraserPanel';
import DrawingPanel from './panels/DrawingPanel';
import PhotoPanel from './panels/PhotoPanel';
import { ChevronLeft, Trash2, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, FlipHorizontal, FlipVertical } from 'lucide-react';

interface EditorProps {
  imageSrc: string;
  onBack: () => void;
}

interface HistoryState {
  adjustments: Adjustments;
  filterId: FilterId;
  filterIntensity: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  skewX: number;
  skewY: number;
  crop: { x: number; y: number; w: number; h: number } | null;
  textLayers: TextLayer[];
  stickerLayers: StickerLayer[];
  strokes: Stroke[];
  frameId: string;
  repairDataUrl: string | null;
  bgEraseDataUrl: string | null;
  photoLayersData: { id: string; dataUrl: string; x: number; y: number; scale: number; rotation: number; opacity: number; flipH: boolean; flipV: boolean }[];
  shapeLayers: ShapeLayer[];
  drawStrokes: DrawStroke[];
  border: BorderConfig;
  effect: EffectState;
  objectEraserDataUrl: string | null;
}

const DEFAULT_FRAME = FRAMES[0];
const DEFAULT_BORDER: BorderConfig = { width: 0, color: '#ffffff', opacity: 1, radius: 0, style: 'solid', mode: 'inside' };
const DEFAULT_EFFECT: EffectState = { type: 'none', intensity: 0 };

export default function Editor({ imageSrc, onBack }: EditorProps) {
  const [currentImageSrc, setCurrentImageSrc] = useState(imageSrc);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [adjustments, setAdjustments] = useState<Adjustments>(defaultAdjustments);
  const [filterId, setFilterId] = useState<FilterId>('original');
  const [filterIntensity, setFilterIntensity] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [skewX, setSkewX] = useState(0);
  const [skewY, setSkewY] = useState(0);
  const [skewMode, setSkewMode] = useState<'horizontal' | 'vertical'>('horizontal');
  const [crop, setCrop] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [stickerLayers, setStickerLayers] = useState<StickerLayer[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [frame, setFrame] = useState<FrameConfig>(DEFAULT_FRAME);
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [thumbnail, setThumbnail] = useState('');

  // Background Eraser Overlay State
  const [showFullBgEraser, setShowFullBgEraser] = useState(false);

  // New layer state
  const [photoLayers, setPhotoLayers] = useState<PhotoLayer[]>([]);
  const [shapeLayers, setShapeLayers] = useState<ShapeLayer[]>([]);
  const [drawStrokes, setDrawStrokes] = useState<DrawStroke[]>([]);
  const [border, setBorder] = useState<BorderConfig>(DEFAULT_BORDER);
  const [effect, setEffect] = useState<EffectState>(DEFAULT_EFFECT);

  // Repair state
  const [repairBrushSize, setRepairBrushSize] = useState(25);
  const [repairHardness, setRepairHardness] = useState(50);
  const [repairZoom, setRepairZoom] = useState(1);
  const repairCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const repairDisplayRef = useRef<HTMLCanvasElement | null>(null);
  const repairDrawingRef = useRef(false);
  const [repairUndoStack, setRepairUndoStack] = useState<ImageData[]>([]);
  const [repairRedoStack, setRepairRedoStack] = useState<ImageData[]>([]);
  const [repairVersion, setRepairVersion] = useState(0);

  // Draw state (old)
  const [drawTool, setDrawTool] = useState<'brush' | 'pencil' | 'eraser'>('brush');
  const [drawColor, setDrawColor] = useState('#ff4757');
  const [drawSize, setDrawSize] = useState(8);
  const [drawOpacity, setDrawOpacity] = useState(100);
  const currentStrokeRef = useRef<Stroke | null>(null);

  // Brush state
  const [brushSize, setBrushSize] = useState(30);
  const [brushHardness, setBrushHardness] = useState(50);
  const [brushOpacity, setBrushOpacity] = useState(80);
  const [brushColor, setBrushColor] = useState('#ff4757');
  const [brushTool, setBrushTool] = useState<'soft' | 'hard' | 'eraser' | 'blur' | 'pixelate'>('soft');
  const brushCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const brushDrawingRef = useRef(false);
  const [brushUndoStack, setBrushUndoStack] = useState<ImageData[]>([]);
  const [brushRedoStack, setBrushRedoStack] = useState<ImageData[]>([]);
  const [brushVersion, setBrushVersion] = useState(0);

  // Drawing state (new)
  const [drawingTool, setDrawingTool] = useState<'pen' | 'pencil' | 'marker' | 'neon' | 'highlighter' | 'eraser'>('pen');
  const [drawingColor, setDrawingColor] = useState('#ff4757');
  const [drawingSize, setDrawingSize] = useState(8);
  const [drawingOpacity, setDrawingOpacity] = useState(100);
  const [drawingHardness, setDrawingHardness] = useState(80);
  const currentDrawStrokeRef = useRef<DrawStroke | null>(null);
  const [drawRedoStack, setDrawRedoStack] = useState<DrawStroke[]>([]);

  // Object eraser state
  const [objEraserBrushSize, setObjEraserBrushSize] = useState(40);
  const objEraserCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const objEraserMaskRef = useRef<HTMLCanvasElement | null>(null);
  const objEraserDrawingRef = useRef(false);
  const [objEraserUndoStack, setObjEraserUndoStack] = useState<ImageData[]>([]);
  const [objEraserRedoStack, setObjEraserRedoStack] = useState<ImageData[]>([]);
  const [objEraserVersion, setObjEraserVersion] = useState(0);
  const [objEraserHasSelection, setObjEraserHasSelection] = useState(false);
  const [objEraserResult, setObjEraserResult] = useState<HTMLCanvasElement | null>(null);
  const objEraserDisplayRef = useRef<HTMLCanvasElement | null>(null);
  const objEraserMaskDisplayRef = useRef<HTMLCanvasElement | null>(null);
  const [objEraserZoom, setObjEraserZoom] = useState(1);
  const [objEraserOffset, setObjEraserOffset] = useState({ x: 0, y: 0 });
  const [objEraserMaskUndoStack, setObjEraserMaskUndoStack] = useState<ImageData[]>([]);
  const [objEraserMaskRedoStack, setObjEraserMaskRedoStack] = useState<ImageData[]>([]);
  const objEraserPointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const objEraserGestureRef = useRef<{
    startDist: number;
    startZoom: number;
    startMid: { x: number; y: number };
    startOffset: { x: number; y: number };
    baseLeft: number;
    baseTop: number;
  } | null>(null);

  // Photo layer file input
  const photoFileRef = useRef<HTMLInputElement>(null);

  // History
  const [undoStack, setUndoStack] = useState<HistoryState[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryState[]>([]);

  const canvasRef = useRef<EditorCanvasHandle>(null);

  // Load image
  useEffect(() => {
    loadImage(currentImageSrc).then((img) => {
      setImage(img);
      const tc = document.createElement('canvas');
      tc.width = 64;
      tc.height = 64;
      const tctx = tc.getContext('2d')!;
      const ratio = Math.max(tc.width / img.naturalWidth, tc.height / img.naturalHeight);
      const w = img.naturalWidth * ratio;
      const h = img.naturalHeight * ratio;
      tctx.drawImage(img, (tc.width - w) / 2, (tc.height - h) / 2, w, h);
      setThumbnail(tc.toDataURL('image/jpeg', 0.7));
    });
  }, [currentImageSrc]);

  const getEffectiveAdjustments = useCallback((): Adjustments => {
    const filterAdj = getFilterAdjustments(filterId, filterIntensity);
    const result = { ...adjustments };
    for (const [key, val] of Object.entries(filterAdj)) {
      result[key as keyof Adjustments] = (result[key as keyof Adjustments] || 0) + val;
    }
    return result;
  }, [adjustments, filterId, filterIntensity]);

  // History snapshot
  const pushHistory = useCallback(() => {
    const photoData = photoLayers.map((p) => ({
      id: p.id,
      dataUrl: p.image.src,
      x: p.x, y: p.y, scale: p.scale, rotation: p.rotation, opacity: p.opacity, flipH: p.flipH, flipV: p.flipV,
    }));
    const state: HistoryState = {
      adjustments: { ...adjustments },
      filterId, filterIntensity, rotation, flipH, flipV, skewX, skewY,
      crop: crop ? { ...crop } : null,
      textLayers: [...textLayers],
      stickerLayers: [...stickerLayers],
      strokes: [...strokes],
      frameId: frame.id,
      repairDataUrl: repairCanvasRef.current?.toDataURL() || null,
      bgEraseDataUrl: null,
      photoLayersData: photoData,
      shapeLayers: [...shapeLayers],
      drawStrokes: [...drawStrokes],
      border: { ...border },
      effect: { ...effect },
      objectEraserDataUrl: objEraserCanvasRef.current?.toDataURL() || null,
    };
    setUndoStack((prev) => [...prev.slice(-19), state]);
    setRedoStack([]);
  }, [adjustments, filterId, filterIntensity, rotation, flipH, flipV, skewX, skewY, crop, textLayers, stickerLayers, strokes, frame, photoLayers, shapeLayers, drawStrokes, border, effect]);

  const restoreState = useCallback((state: HistoryState) => {
    setAdjustments(state.adjustments);
    setFilterId(state.filterId);
    setFilterIntensity(state.filterIntensity);
    setRotation(state.rotation);
    setFlipH(state.flipH);
    setFlipV(state.flipV);
    setSkewX(state.skewX || 0);
    setSkewY(state.skewY || 0);
    setCrop(state.crop);
    setTextLayers(state.textLayers);
    setStickerLayers(state.stickerLayers);
    setStrokes(state.strokes);
    const f = FRAMES.find((fr) => fr.id === state.frameId);
    if (f) setFrame(f);
    setShapeLayers(state.shapeLayers);
    setDrawStrokes(state.drawStrokes);
    setBorder(state.border);
    setEffect(state.effect);

    if (state.photoLayersData.length > 0) {
      Promise.all(state.photoLayersData.map(async (pd) => {
        const img = await loadImage(pd.dataUrl);
        return { id: pd.id, image: img, x: pd.x, y: pd.y, scale: pd.scale, rotation: pd.rotation, opacity: pd.opacity, flipH: pd.flipH, flipV: pd.flipV } as PhotoLayer;
      })).then(setPhotoLayers);
    } else {
      setPhotoLayers([]);
    }

    if (state.repairDataUrl && repairCanvasRef.current) {
      loadImage(state.repairDataUrl).then((img) => {
        const ctx = repairCanvasRef.current!.getContext('2d')!;
        ctx.clearRect(0, 0, repairCanvasRef.current!.width, repairCanvasRef.current!.height);
        ctx.drawImage(img, 0, 0);
      });
    }

    if (state.objectEraserDataUrl && objEraserCanvasRef.current) {
      loadImage(state.objectEraserDataUrl).then((img) => {
        const ctx = objEraserCanvasRef.current!.getContext('2d')!;
        ctx.clearRect(0, 0, objEraserCanvasRef.current!.width, objEraserCanvasRef.current!.height);
        ctx.drawImage(img, 0, 0);
      });
    }
  }, []);

  const undo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const state = prev[prev.length - 1];
      const currentState: HistoryState = {
        adjustments: { ...adjustments }, filterId, filterIntensity, rotation, flipH, flipV, skewX, skewY,
        crop: crop ? { ...crop } : null, textLayers: [...textLayers], stickerLayers: [...stickerLayers],
        strokes: [...strokes], frameId: frame.id,
        repairDataUrl: repairCanvasRef.current?.toDataURL() || null,
        bgEraseDataUrl: null,
        photoLayersData: [], shapeLayers: [...shapeLayers], drawStrokes: [...drawStrokes],
        border: { ...border }, effect: { ...effect },
        objectEraserDataUrl: objEraserCanvasRef.current?.toDataURL() || null,
      };
      setRedoStack((r) => [...r, currentState]);
      restoreState(state);
      return prev.slice(0, -1);
    });
  }, [adjustments, filterId, filterIntensity, rotation, flipH, flipV, skewX, skewY, crop, textLayers, stickerLayers, strokes, frame, shapeLayers, drawStrokes, border, effect, restoreState]);

  const redo = useCallback(() => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const state = prev[prev.length - 1];
      setUndoStack((u) => [...u, state]);
      restoreState(state);
      return prev.slice(0, -1);
    });
  }, [restoreState]);

  const initRepairCanvas = useCallback(() => {
    if (!image || repairCanvasRef.current) return;
    const canvas = document.createElement('canvas');
    const maxDim = 2048;
    let w = image.naturalWidth, h = image.naturalHeight;
    if (w > maxDim || h > maxDim) {
      const ratio = Math.min(maxDim / w, maxDim / h);
      w = Math.round(w * ratio); h = Math.round(h * ratio);
    }
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d')!.drawImage(image, 0, 0, w, h);
    repairCanvasRef.current = canvas;
  }, [image]);

  const initBrushCanvas = useCallback(() => {
    if (!image || brushCanvasRef.current) return;
    const canvas = document.createElement('canvas');
    const maxDim = 2048;
    let w = image.naturalWidth, h = image.naturalHeight;
    if (w > maxDim || h > maxDim) {
      const ratio = Math.min(maxDim / w, maxDim / h);
      w = Math.round(w * ratio); h = Math.round(h * ratio);
    }
    canvas.width = w; canvas.height = h;
    brushCanvasRef.current = canvas;
  }, [image]);

  const initObjEraserCanvas = useCallback(() => {
    if (!image || objEraserCanvasRef.current) return;
    const canvas = document.createElement('canvas');
    const maxDim = 2048;
    let w = image.naturalWidth, h = image.naturalHeight;
    if (w > maxDim || h > maxDim) {
      const ratio = Math.min(maxDim / w, maxDim / h);
      w = Math.round(w * ratio); h = Math.round(h * ratio);
    }
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d')!.drawImage(image, 0, 0, w, h);
    objEraserCanvasRef.current = canvas;

    const mask = document.createElement('canvas');
    mask.width = w; mask.height = h;
    objEraserMaskRef.current = mask;
    setObjEraserHasSelection(false);
    setObjEraserResult(null);
  }, [image]);

  const handleToolSelect = (tool: ToolId) => {
    if (tool === 'background') {
      setShowFullBgEraser(true);
      return;
    }

    if (activeTool === tool) {
      setActiveTool(null);
      return;
    }
    setActiveTool(tool);
    setSelectedLayerId(null);

    if (tool === 'repair') initRepairCanvas();
    if (tool === 'brush') initBrushCanvas();
    if (tool === 'objectEraser') {
      initObjEraserCanvas();
      setObjEraserZoom(1);
      setObjEraserOffset({ x: 0, y: 0 });
    }
  };

  // Repair handlers
  const handleRepairPointerDown = (e: React.PointerEvent) => {
    if (!repairCanvasRef.current || activeTool !== 'repair') return;
    const canvas = repairCanvasRef.current;
    const pos = getCanvasPos(e, canvas);
    pushHistory();
    repairDrawingRef.current = true;
    const ctx = canvas.getContext('2d')!;
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setRepairUndoStack((prev) => [...prev.slice(-9), snapshot]);
    healStroke(ctx, canvas, pos, repairBrushSize, repairHardness);
    setRepairVersion((v) => v + 1);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleRepairPointerMove = (e: React.PointerEvent) => {
    if (!repairDrawingRef.current || !repairCanvasRef.current) return;
    const canvas = repairCanvasRef.current;
    const pos = getCanvasPos(e, canvas);
    const ctx = canvas.getContext('2d')!;
    const lastPos = (canvas as any)._lastRepairPos || pos;
    const dist = Math.hypot(pos.x - lastPos.x, pos.y - lastPos.y);
    const steps = Math.max(1, Math.ceil(dist / (repairBrushSize * 0.5)));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const px = lastPos.x + (pos.x - lastPos.x) * t;
      const py = lastPos.y + (pos.y - lastPos.y) * t;
      healStroke(ctx, canvas, { x: px, y: py }, repairBrushSize, repairHardness);
    }
    (canvas as any)._lastRepairPos = pos;
    setRepairVersion((v) => v + 1);
  };

  const handleRepairPointerUp = () => {
    repairDrawingRef.current = false;
    if (repairCanvasRef.current) (repairCanvasRef.current as any)._lastRepairPos = null;
  };

  const repairUndo = () => {
    setRepairUndoStack((prev) => {
      if (prev.length === 0 || !repairCanvasRef.current) return prev;
      const ctx = repairCanvasRef.current.getContext('2d')!;
      const current = ctx.getImageData(0, 0, repairCanvasRef.current.width, repairCanvasRef.current.height);
      setRepairRedoStack((r) => [...r, current]);
      ctx.putImageData(prev[prev.length - 1], 0, 0);
      setRepairVersion((v) => v + 1);
      return prev.slice(0, -1);
    });
  };

  const repairRedo = () => {
    setRepairRedoStack((prev) => {
      if (prev.length === 0 || !repairCanvasRef.current) return prev;
      const ctx = repairCanvasRef.current.getContext('2d')!;
      const current = ctx.getImageData(0, 0, repairCanvasRef.current.width, repairCanvasRef.current.height);
      setRepairUndoStack((u) => [...u, current]);
      ctx.putImageData(prev[prev.length - 1], 0, 0);
      setRepairVersion((v) => v + 1);
      return prev.slice(0, -1);
    });
  };

  const repairReset = () => {
    if (!repairCanvasRef.current || !image) return;
    pushHistory();
    const ctx = repairCanvasRef.current.getContext('2d')!;
    const snapshot = ctx.getImageData(0, 0, repairCanvasRef.current.width, repairCanvasRef.current.height);
    setRepairUndoStack((prev) => [...prev.slice(-9), snapshot]);
    ctx.clearRect(0, 0, repairCanvasRef.current.width, repairCanvasRef.current.height);
    ctx.drawImage(image, 0, 0, repairCanvasRef.current.width, repairCanvasRef.current.height);
    setRepairRedoStack([]);
    setRepairVersion((v) => v + 1);
  };

  // Draw handlers
  const handleDrawStart = (pos: { x: number; y: number }) => {
    pushHistory();
    currentStrokeRef.current = { points: [pos], color: drawColor, size: drawSize, opacity: drawOpacity / 100, tool: drawTool };
  };

  const handleDrawMove = (pos: { x: number; y: number }) => {
    if (!currentStrokeRef.current) return;
    currentStrokeRef.current.points.push(pos);
    setStrokes((prev) => {
      const last = prev[prev.length - 1];
      if (last === currentStrokeRef.current) return prev;
      return [...prev, currentStrokeRef.current!];
    });
  };

  const handleDrawEnd = () => { currentStrokeRef.current = null; };
  const drawUndo = () => { pushHistory(); setStrokes((prev) => prev.slice(0, -1)); };
  const drawClear = () => { pushHistory(); setStrokes([]); };

  // Drawing handlers (new)
  const handleDrawingStart = (pos: { x: number; y: number }) => {
    pushHistory();
    currentDrawStrokeRef.current = {
      id: `draw-${Date.now()}`,
      points: [pos], color: drawingColor, size: drawingSize,
      opacity: drawingOpacity / 100, tool: drawingTool,
    };
  };

  const handleDrawingMove = (pos: { x: number; y: number }) => {
    if (!currentDrawStrokeRef.current) return;
    currentDrawStrokeRef.current.points.push(pos);
    setDrawStrokes((prev) => {
      const last = prev[prev.length - 1];
      if (last === currentDrawStrokeRef.current) return prev;
      return [...prev, currentDrawStrokeRef.current!];
    });
  };

  const handleDrawingEnd = () => { currentDrawStrokeRef.current = null; };

  const drawingUndo = () => {
    setDrawRedoStack((r) => [...r, drawStrokes[drawStrokes.length - 1]]);
    pushHistory();
    setDrawStrokes((prev) => prev.slice(0, -1));
  };

  const drawingRedo = () => {
    setDrawRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const stroke = prev[prev.length - 1];
      setDrawStrokes((s) => [...s, stroke]);
      return prev.slice(0, -1);
    });
  };

  const drawingClear = () => { pushHistory(); setDrawStrokes([]); setDrawRedoStack([]); };

  // Brush handlers
  const handleBrushPointerDown = (e: React.PointerEvent) => {
    if (!brushCanvasRef.current || activeTool !== 'brush') return;
    const canvas = brushCanvasRef.current;
    const pos = getCanvasPos(e, canvas);
    pushHistory();
    brushDrawingRef.current = true;
    const ctx = canvas.getContext('2d')!;
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setBrushUndoStack((prev) => [...prev.slice(-9), snapshot]);
    applyBrush(ctx, pos, pos, canvas);
    setBrushVersion((v) => v + 1);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleBrushPointerMove = (e: React.PointerEvent) => {
    if (!brushDrawingRef.current || !brushCanvasRef.current) return;
    const canvas = brushCanvasRef.current;
    const pos = getCanvasPos(e, canvas);
    const ctx = canvas.getContext('2d')!;
    const lastPos = (canvas as any)._lastBrushPos || pos;
    applyBrush(ctx, lastPos, pos, canvas);
    (canvas as any)._lastBrushPos = pos;
    setBrushVersion((v) => v + 1);
  };

  const handleBrushPointerUp = () => {
    brushDrawingRef.current = false;
    if (brushCanvasRef.current) (brushCanvasRef.current as any)._lastBrushPos = null;
  };

  const applyBrush = (ctx: CanvasRenderingContext2D, from: { x: number; y: number }, to: { x: number; y: number }, canvas: HTMLCanvasElement) => {
    if (brushTool === 'eraser') {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = brushOpacity / 100;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.restore();
    } else if (brushTool === 'blur') {
      const r = brushSize;
      ctx.save();
      ctx.filter = `blur(${brushSize / 4}px)`;
      const sx = Math.max(0, to.x - r);
      const sy = Math.max(0, to.y - r);
      const sw = Math.min(canvas.width - sx, r * 2);
      const sh = Math.min(canvas.height - sy, r * 2);
      const tc = document.createElement('canvas');
      tc.width = sw; tc.height = sh;
      const tctx = tc.getContext('2d')!;
      tctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
      ctx.filter = 'none';
      ctx.globalAlpha = brushOpacity / 100;
      ctx.drawImage(tc, 0, 0, sw, sh, sx, sy, sw, sh);
      ctx.restore();
    } else if (brushTool === 'pixelate') {
      const r = brushSize;
      ctx.save();
      ctx.beginPath();
      ctx.arc(to.x, to.y, r, 0, Math.PI * 2);
      ctx.clip();
      const pixSize = Math.max(4, Math.round(brushSize / 4));
      const sx = Math.max(0, to.x - r);
      const sy = Math.max(0, to.y - r);
      const sw = Math.min(canvas.width - sx, r * 2);
      const sh = Math.min(canvas.height - sy, r * 2);
      const tc = document.createElement('canvas');
      tc.width = Math.ceil(sw / pixSize);
      tc.height = Math.ceil(sh / pixSize);
      const tctx = tc.getContext('2d')!;
      tctx.imageSmoothingEnabled = false;
      tctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, tc.width, tc.height);
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = brushOpacity / 100;
      ctx.drawImage(tc, 0, 0, tc.width, tc.height, sx, sy, sw, sh);
      ctx.imageSmoothingEnabled = true;
      ctx.restore();
    } else {
      ctx.save();
      ctx.globalAlpha = brushOpacity / 100;
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (brushTool === 'soft') {
        ctx.globalAlpha = (brushOpacity / 100) * (brushHardness / 100) * 0.5;
        ctx.shadowColor = brushColor;
        ctx.shadowBlur = brushSize * (1 - brushHardness / 100);
      }
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.restore();
    }
  };

  const brushUndo = () => {
    setBrushUndoStack((prev) => {
      if (prev.length === 0 || !brushCanvasRef.current) return prev;
      const ctx = brushCanvasRef.current.getContext('2d')!;
      const current = ctx.getImageData(0, 0, brushCanvasRef.current.width, brushCanvasRef.current.height);
      setBrushRedoStack((r) => [...r, current]);
      ctx.putImageData(prev[prev.length - 1], 0, 0);
      setBrushVersion((v) => v + 1);
      return prev.slice(0, -1);
    });
  };

  const brushRedo = () => {
    setBrushRedoStack((prev) => {
      if (prev.length === 0 || !brushCanvasRef.current) return prev;
      const ctx = brushCanvasRef.current.getContext('2d')!;
      const current = ctx.getImageData(0, 0, brushCanvasRef.current.width, brushCanvasRef.current.height);
      setBrushUndoStack((u) => [...u, current]);
      ctx.putImageData(prev[prev.length - 1], 0, 0);
      setBrushVersion((v) => v + 1);
      return prev.slice(0, -1);
    });
  };

  const brushClear = () => {
    if (!brushCanvasRef.current) return;
    pushHistory();
    const ctx = brushCanvasRef.current.getContext('2d')!;
    const snapshot = ctx.getImageData(0, 0, brushCanvasRef.current.width, brushCanvasRef.current.height);
    setBrushUndoStack((prev) => [...prev.slice(-9), snapshot]);
    ctx.clearRect(0, 0, brushCanvasRef.current.width, brushCanvasRef.current.height);
    setBrushVersion((v) => v + 1);
  };

  // Object eraser handlers
  const paintObjEraserAt = (pos: { x: number; y: number }, lastPos: { x: number; y: number } | null) => {
    if (!objEraserMaskRef.current) return;
    const maskCtx = objEraserMaskRef.current.getContext('2d')!;
    maskCtx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    maskCtx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    maskCtx.lineWidth = objEraserBrushSize * 2;
    maskCtx.lineCap = 'round';
    maskCtx.lineJoin = 'round';
    if (lastPos) {
      maskCtx.beginPath();
      maskCtx.moveTo(lastPos.x, lastPos.y);
      maskCtx.lineTo(pos.x, pos.y);
      maskCtx.stroke();
    }
    maskCtx.beginPath();
    maskCtx.arc(pos.x, pos.y, objEraserBrushSize, 0, Math.PI * 2);
    maskCtx.fill();

    if (objEraserMaskDisplayRef.current && objEraserMaskDisplayRef.current.width > 0) {
      const dCtx = objEraserMaskDisplayRef.current.getContext('2d')!;
      dCtx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      dCtx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      dCtx.lineWidth = objEraserBrushSize * 2;
      dCtx.lineCap = 'round';
      dCtx.lineJoin = 'round';
      if (lastPos) {
        dCtx.beginPath();
        dCtx.moveTo(lastPos.x, lastPos.y);
        dCtx.lineTo(pos.x, pos.y);
        dCtx.stroke();
      }
      dCtx.beginPath();
      dCtx.arc(pos.x, pos.y, objEraserBrushSize, 0, Math.PI * 2);
      dCtx.fill();
    }
  };

  const handleObjEraserPointerDown = (e: React.PointerEvent) => {
    if (!objEraserCanvasRef.current || !objEraserMaskRef.current) return;
    const canvas = e.currentTarget as HTMLCanvasElement;
    objEraserPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (objEraserPointersRef.current.size === 1) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const pos = { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };

      const maskCtx = objEraserMaskRef.current.getContext('2d')!;
      const snapshot = maskCtx.getImageData(0, 0, objEraserMaskRef.current.width, objEraserMaskRef.current.height);
      setObjEraserMaskUndoStack((prev) => [...prev.slice(-9), snapshot]);
      setObjEraserMaskRedoStack([]);

      objEraserDrawingRef.current = true;
      (objEraserMaskRef.current as any)._lastPos = null;
      paintObjEraserAt(pos, null);
      setObjEraserHasSelection(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } else if (objEraserPointersRef.current.size === 2) {
      objEraserDrawingRef.current = false;
      const pointers = Array.from(objEraserPointersRef.current.values());
      const dist = Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y);
      const mid = { x: (pointers[0].x + pointers[1].x) / 2, y: (pointers[0].y + pointers[1].y) / 2 };
      const rect = canvas.getBoundingClientRect();
      objEraserGestureRef.current = {
        startDist: dist,
        startZoom: objEraserZoom,
        startMid: mid,
        startOffset: { ...objEraserOffset },
        baseLeft: rect.left - objEraserOffset.x,
        baseTop: rect.top - objEraserOffset.y,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handleObjEraserPointerMove = (e: React.PointerEvent) => {
    if (!objEraserPointersRef.current.has(e.pointerId)) return;
    objEraserPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (objEraserPointersRef.current.size >= 2 && objEraserGestureRef.current) {
      const pointers = Array.from(objEraserPointersRef.current.values());
      const dist = Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y);
      const mid = { x: (pointers[0].x + pointers[1].x) / 2, y: (pointers[0].y + pointers[1].y) / 2 };
      const g = objEraserGestureRef.current;

      const ratio = dist / g.startDist;
      const newZoom = Math.max(0.5, Math.min(8, g.startZoom * ratio));
      const zoomRatio = newZoom / g.startZoom;

      const newOffsetX = (g.startMid.x - g.baseLeft) * (1 - zoomRatio) + g.startOffset.x * zoomRatio + (mid.x - g.startMid.x);
      const newOffsetY = (g.startMid.y - g.baseTop) * (1 - zoomRatio) + g.startOffset.y * zoomRatio + (mid.y - g.startMid.y);

      setObjEraserZoom(newZoom);
      setObjEraserOffset({ x: newOffsetX, y: newOffsetY });
    } else if (objEraserDrawingRef.current && objEraserPointersRef.current.size === 1) {
      const canvas = e.currentTarget as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const pos = { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
      const lastPos = (objEraserMaskRef.current as any)._lastPos || null;
      paintObjEraserAt(pos, lastPos);
      (objEraserMaskRef.current as any)._lastPos = pos;
    }
  };

  const handleObjEraserPointerUp = (e: React.PointerEvent) => {
    objEraserPointersRef.current.delete(e.pointerId);

    if (objEraserPointersRef.current.size < 2) {
      objEraserGestureRef.current = null;
    }
    if (objEraserPointersRef.current.size === 0) {
      objEraserDrawingRef.current = false;
      if (objEraserMaskRef.current) (objEraserMaskRef.current as any)._lastPos = null;
    }
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
  };

  const objEraserClear = () => {
    if (!objEraserMaskRef.current) return;
    const ctx = objEraserMaskRef.current.getContext('2d')!;
    const snapshot = ctx.getImageData(0, 0, objEraserMaskRef.current.width, objEraserMaskRef.current.height);
    setObjEraserMaskUndoStack((prev) => [...prev.slice(-9), snapshot]);
    setObjEraserMaskRedoStack([]);
    ctx.clearRect(0, 0, objEraserMaskRef.current.width, objEraserMaskRef.current.height);
    if (objEraserMaskDisplayRef.current) {
      const dCtx = objEraserMaskDisplayRef.current.getContext('2d')!;
      dCtx.clearRect(0, 0, objEraserMaskDisplayRef.current.width, objEraserMaskDisplayRef.current.height);
    }
    setObjEraserHasSelection(false);
    setObjEraserVersion((v) => v + 1);
  };

  const objEraserReset = () => {
    if (!image || !objEraserCanvasRef.current) return;
    pushHistory();
    const ctx = objEraserCanvasRef.current.getContext('2d')!;
    const snapshot = ctx.getImageData(0, 0, objEraserCanvasRef.current.width, objEraserCanvasRef.current.height);
    setObjEraserUndoStack((prev) => [...prev.slice(-9), snapshot]);
    ctx.clearRect(0, 0, objEraserCanvasRef.current.width, objEraserCanvasRef.current.height);
    ctx.drawImage(image, 0, 0, objEraserCanvasRef.current.width, objEraserCanvasRef.current.height);
    objEraserClear();
    setObjEraserResult(null);
    setObjEraserZoom(1);
    setObjEraserOffset({ x: 0, y: 0 });
    setObjEraserVersion((v) => v + 1);
  };

  const objEraserApply = useCallback(() => {
    if (!objEraserCanvasRef.current || !objEraserMaskRef.current || !image) return;
    pushHistory();
    const canvas = objEraserCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const maskCanvas = objEraserMaskRef.current;
    const maskCtx = maskCanvas.getContext('2d')!;

    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setObjEraserUndoStack((prev) => [...prev.slice(-9), snapshot]);

    const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const mData = maskData.data;

    const sampleRadius = Math.max(5, objEraserBrushSize);
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const idx = (y * canvas.width + x) * 4;
        if (mData[idx + 3] > 50) {
          let r = 0, g = 0, b = 0, count = 0;
          for (let dy = -sampleRadius; dy <= sampleRadius; dy += 2) {
            for (let dx = -sampleRadius; dx <= sampleRadius; dx += 2) {
              const nx = x + dx, ny = y + dy;
              if (nx < 0 || nx >= canvas.width || ny < 0 || ny >= canvas.height) continue;
              const nidx = (ny * canvas.width + nx) * 4;
              if (mData[nidx + 3] < 50) {
                r += data[nidx]; g += data[nidx + 1]; b += data[nidx + 2];
                count++;
              }
            }
          }
          if (count > 0) {
            data[idx] = r / count;
            data[idx + 1] = g / count;
            data[idx + 2] = b / count;
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    objEraserClear();
    setObjEraserResult(canvas);
    setObjEraserVersion((v) => v + 1);
  }, [image, objEraserBrushSize, pushHistory]);

  const objEraserUndo = () => {
    setObjEraserMaskUndoStack((prev) => {
      if (prev.length === 0 || !objEraserMaskRef.current) return prev;
      const ctx = objEraserMaskRef.current.getContext('2d')!;
      const current = ctx.getImageData(0, 0, objEraserMaskRef.current.width, objEraserMaskRef.current.height);
      setObjEraserMaskRedoStack((r) => [...r, current]);
      ctx.putImageData(prev[prev.length - 1], 0, 0);
      setObjEraserVersion((v) => v + 1);
      const data = prev[prev.length - 1].data;
      let hasContent = false;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) { hasContent = true; break; }
      }
      setObjEraserHasSelection(hasContent);
      return prev.slice(0, -1);
    });
  };

  const objEraserRedo = () => {
    setObjEraserMaskRedoStack((prev) => {
      if (prev.length === 0 || !objEraserMaskRef.current) return prev;
      const ctx = objEraserMaskRef.current.getContext('2d')!;
      const current = ctx.getImageData(0, 0, objEraserMaskRef.current.width, objEraserMaskRef.current.height);
      setObjEraserMaskUndoStack((u) => [...u, current]);
      ctx.putImageData(prev[prev.length - 1], 0, 0);
      setObjEraserVersion((v) => v + 1);
      const data = prev[prev.length - 1].data;
      let hasContent = false;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) { hasContent = true; break; }
      }
      setObjEraserHasSelection(hasContent);
      return prev.slice(0, -1);
    });
  };

  // Text handlers
  const addText = () => {
    pushHistory();
    const maxDim = 2048;
    let imgW = image ? image.naturalWidth : 800;
    let imgH = image ? image.naturalHeight : 600;
    if (imgW > maxDim || imgH > maxDim) {
      const ratio = Math.min(maxDim / imgW, maxDim / imgH);
      imgW = Math.round(imgW * ratio);
      imgH = Math.round(imgH * ratio);
    }
    const cw = crop ? Math.round(imgW * crop.w) : imgW;
    const ch = crop ? Math.round(imgH * crop.h) : imgH;
    const newText: TextLayer = {
      id: `text-${Date.now()}`, text: 'Tap to edit', x: cw / 2, y: ch / 2,
      fontSize: 48, fontFamily: 'Inter, sans-serif', bold: false, italic: false,
      color: '#ffffff', bgColor: '#000000', bgEnabled: false, align: 'center',
      opacity: 1, shadow: false, rotation: 0,
    };
    setTextLayers((prev) => [...prev, newText]);
    setSelectedLayerId(newText.id);
  };

  const updateText = (id: string, updates: Partial<TextLayer>) => {
    setTextLayers((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteText = (id: string) => {
    pushHistory();
    setTextLayers((prev) => prev.filter((t) => t.id !== id));
    setSelectedLayerId(null);
  };

  // Sticker handlers
  const addSticker = (emoji: string) => {
    pushHistory();
    const newSticker: StickerLayer = {
      id: `sticker-${Date.now()}`, emoji, x: 200, y: 200, size: 64, rotation: 0,
    };
    setStickerLayers((prev) => [...prev, newSticker]);
    setSelectedLayerId(newSticker.id);
  };

  const updateSticker = (id: string, updates: Partial<StickerLayer>) => {
    setStickerLayers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteSticker = (id: string) => {
    pushHistory();
    setStickerLayers((prev) => prev.filter((s) => s.id !== id));
    setSelectedLayerId(null);
  };

  // Photo layer handlers
  const addPhotoLayer = async (file: File) => {
    pushHistory();
    const dataUrl = await fileToDataURL(file);
    const img = await loadImage(dataUrl);
    const newPhoto: PhotoLayer = {
      id: `photo-${Date.now()}`, image: img, x: 300, y: 300, scale: 0.3, rotation: 0,
      opacity: 1, flipH: false, flipV: false,
    };
    setPhotoLayers((prev) => [...prev, newPhoto]);
    setSelectedLayerId(newPhoto.id);
  };

  const updatePhoto = (id: string, updates: Partial<PhotoLayer>) => {
    setPhotoLayers((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deletePhoto = (id: string) => {
    pushHistory();
    setPhotoLayers((prev) => prev.filter((p) => p.id !== id));
    setSelectedLayerId(null);
  };

  const duplicatePhoto = (id: string) => {
    pushHistory();
    setPhotoLayers((prev) => {
      const p = prev.find((ph) => ph.id === id);
      if (!p) return prev;
      const dup: PhotoLayer = { ...p, id: `photo-${Date.now()}`, x: p.x + 30, y: p.y + 30 };
      return [...prev, dup];
    });
  };

  const bringPhotoForward = (id: string) => {
    setPhotoLayers((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx < 0 || idx === prev.length - 1) return prev;
      const arr = [...prev];
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return arr;
    });
  };

  const sendPhotoBackward = (id: string) => {
    setPhotoLayers((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx <= 0) return prev;
      const arr = [...prev];
      [arr[idx], arr[idx - 1]] = [arr[idx - 1], arr[idx]];
      return arr;
    });
  };

  // Shape layer handlers
  const addShape = (shape: ShapeType) => {
    pushHistory();
    const newShape: ShapeLayer = {
      id: `shape-${Date.now()}`, shape, x: 300, y: 300, w: 150, h: 150, rotation: 0,
      fillColor: '#f5a524', borderColor: '#ffffff', borderWidth: 0, opacity: 1, radius: 0.15,
    };
    setShapeLayers((prev) => [...prev, newShape]);
    setSelectedLayerId(newShape.id);
  };

  const updateShape = (id: string, updates: Partial<ShapeLayer>) => {
    setShapeLayers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteShape = (id: string) => {
    pushHistory();
    setShapeLayers((prev) => prev.filter((s) => s.id !== id));
    setSelectedLayerId(null);
  };

  // Layer transformations
  const handleLayerMove = (id: string, x: number, y: number) => {
    setTextLayers((prev) => prev.map((t) => (t.id === id ? { ...t, x, y } : t)));
    setStickerLayers((prev) => prev.map((s) => (s.id === id ? { ...s, x, y } : s)));
    setPhotoLayers((prev) => prev.map((p) => (p.id === id ? { ...p, x, y } : p)));
    setShapeLayers((prev) => prev.map((s) => (s.id === id ? { ...s, x, y } : s)));
  };

  const handleLayerSelect = (type: 'text' | 'sticker' | 'photo' | 'shape' | null, id: string | null) => {
    setSelectedLayerId(id);
    if (type === 'text' && id) {
      setActiveTool('text');
    }
  };

  const handleLayerTransform = (id: string, updates: Record<string, number>) => {
    setTextLayers((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    setStickerLayers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    setPhotoLayers((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    setShapeLayers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const handleLayerGestureStart = () => {
    pushHistory();
  };

  const deleteSelectedLayer = () => {
    if (!selectedLayerId) return;
    pushHistory();
    setTextLayers((prev) => prev.filter((t) => t.id !== selectedLayerId));
    setStickerLayers((prev) => prev.filter((s) => s.id !== selectedLayerId));
    setPhotoLayers((prev) => prev.filter((p) => p.id !== selectedLayerId));
    setShapeLayers((prev) => prev.filter((s) => s.id !== selectedLayerId));
    setSelectedLayerId(null);
  };

  const moveLayer = (direction: 'forward' | 'backward' | 'front' | 'back') => {
    if (!selectedLayerId) return;
    pushHistory();
    const moveInArray = <T extends { id: string }>(arr: T[], setter: (v: T[]) => void) => {
      const idx = arr.findIndex((l) => l.id === selectedLayerId);
      if (idx < 0) return;
      const newArr = [...arr];
      const [item] = newArr.splice(idx, 1);
      if (direction === 'front') newArr.push(item);
      else if (direction === 'back') newArr.unshift(item);
      else if (direction === 'forward') newArr.splice(Math.min(idx + 1, newArr.length), 0, item);
      else newArr.splice(Math.max(idx - 1, 0), 0, item);
      setter(newArr);
    };
    moveInArray(textLayers, setTextLayers);
    moveInArray(stickerLayers, setStickerLayers);
    moveInArray(photoLayers, setPhotoLayers);
    moveInArray(shapeLayers, setShapeLayers);
  };

  const selectedText = textLayers.find((t) => t.id === selectedLayerId) || null;
  const selectedSticker = stickerLayers.find((s) => s.id === selectedLayerId) || null;
  const selectedPhoto = photoLayers.find((p) => p.id === selectedLayerId) || null;
  const selectedShape = shapeLayers.find((s) => s.id === selectedLayerId) || null;

  // Render repair display canvas
  useEffect(() => {
    if (activeTool !== 'repair' || !repairDisplayRef.current || !repairCanvasRef.current) return;
    const display = repairDisplayRef.current;
    const src = repairCanvasRef.current;
    display.width = src.width; display.height = src.height;
    const ctx = display.getContext('2d')!;
    ctx.clearRect(0, 0, display.width, display.height);
    ctx.drawImage(src, 0, 0);
  }, [activeTool, repairVersion]);

  // Render object eraser display canvas
  useEffect(() => {
    if (activeTool !== 'objectEraser' || !objEraserDisplayRef.current || !objEraserCanvasRef.current) return;
    const display = objEraserDisplayRef.current;
    const src = objEraserCanvasRef.current;
    if (display.width !== src.width) display.width = src.width;
    if (display.height !== src.height) display.height = src.height;
    const ctx = display.getContext('2d')!;
    ctx.clearRect(0, 0, display.width, display.height);
    ctx.drawImage(src, 0, 0);
  }, [activeTool, objEraserVersion]);

  // Render object eraser mask overlay
  useEffect(() => {
    if (activeTool !== 'objectEraser' || !objEraserMaskDisplayRef.current || !objEraserMaskRef.current) return;
    const display = objEraserMaskDisplayRef.current;
    const src = objEraserMaskRef.current;
    if (display.width !== src.width) display.width = src.width;
    if (display.height !== src.height) display.height = src.height;
    const ctx = display.getContext('2d')!;
    ctx.clearRect(0, 0, display.width, display.height);
    ctx.drawImage(src, 0, 0);
  }, [activeTool, objEraserVersion]);

  const effectiveAdjustments = getEffectiveAdjustments();
  const isDrawMode = activeTool === 'draw' || activeTool === 'drawing';

  const drawStartHandler = activeTool === 'drawing' ? handleDrawingStart : handleDrawStart;
  const drawMoveHandler = activeTool === 'drawing' ? handleDrawingMove : handleDrawMove;
  const drawEndHandler = activeTool === 'drawing' ? handleDrawingEnd : handleDrawEnd;
  const activeDrawTool = activeTool === 'drawing' ? 'brush' : drawTool;
  const activeDrawColor = activeTool === 'drawing' ? drawingColor : drawColor;
  const activeDrawSize = activeTool === 'drawing' ? drawingSize : drawSize;
  const activeDrawOpacity = activeTool === 'drawing' ? drawingOpacity : drawOpacity;

  return (
    <div className="h-[100dvh] flex flex-col bg-neutral-950">
      <TopBar
        onBack={onBack}
        onUndo={undo}
        onRedo={redo}
        onSave={() => setShowExport(true)}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onShowOriginal={() => setShowOriginal(true)}
        isShowingOriginal={showOriginal}
      />

      {showOriginal && (
        <div className="fixed inset-0 z-30" onPointerUp={() => setShowOriginal(false)} onPointerLeave={() => setShowOriginal(false)} />
      )}

      {/* Canvas area */}
      <div className="flex-1 flex flex-col relative overflow-hidden min-h-0">
        {activeTool === 'repair' && repairCanvasRef.current ? (
          <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-lg bg-sky-500/15 text-sky-400 text-xs font-medium animate-fade-in pointer-events-none">
              Paint over spots or blemishes to heal
            </div>
            <canvas
              ref={repairDisplayRef}
              onPointerDown={handleRepairPointerDown}
              onPointerMove={handleRepairPointerMove}
              onPointerUp={handleRepairPointerUp}
              className="max-w-full max-h-full object-contain touch-none rounded-lg"
              style={{ touchAction: 'none', transform: `scale(${repairZoom})`, transformOrigin: 'center' }}
            />
          </div>
        ) : activeTool === 'brush' && brushCanvasRef.current ? (
          <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
            <canvas
              ref={(el) => {
                brushCanvasRef.current = el;
                if (el) {
                  if (!el.width && image) {
                    const maxDim = 2048;
                    let w = image.naturalWidth, h = image.naturalHeight;
                    if (w > maxDim || h > maxDim) {
                      const ratio = Math.min(maxDim / w, maxDim / h);
                      w = Math.round(w * ratio); h = Math.round(h * ratio);
                    }
                    el.width = w; el.height = h;
                    const ctx = el.getContext('2d')!;
                    ctx.drawImage(image, 0, 0, w, h);
                  }
                }
              }}
              onPointerDown={handleBrushPointerDown}
              onPointerMove={handleBrushPointerMove}
              onPointerUp={handleBrushPointerUp}
              className="max-w-full max-h-full object-contain touch-none rounded-lg"
              style={{ touchAction: 'none' }}
            />
          </div>
        ) : activeTool === 'objectEraser' && objEraserCanvasRef.current ? (
          <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
            {objEraserHasSelection ? (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-400 text-xs font-medium animate-fade-in pointer-events-none">
                Paint over the object to remove, then tap Apply Removal
              </div>
            ) : (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-lg bg-sky-500/15 text-sky-400 text-xs font-medium animate-fade-in pointer-events-none">
                1 finger: paint | 2 fingers: zoom & pan
              </div>
            )}
            <div
              className="relative"
              style={{
                transform: `translate(${objEraserOffset.x}px, ${objEraserOffset.y}px) scale(${objEraserZoom})`,
                transformOrigin: '0 0',
                touchAction: 'none',
              }}
            >
              <canvas
                ref={objEraserDisplayRef}
                onPointerDown={handleObjEraserPointerDown}
                onPointerMove={handleObjEraserPointerMove}
                onPointerUp={handleObjEraserPointerUp}
                className="max-w-full max-h-full object-contain touch-none rounded-lg"
                style={{ touchAction: 'none' }}
              />
              {objEraserMaskRef.current && (
                <canvas
                  ref={objEraserMaskDisplayRef}
                  className="absolute inset-0 max-w-full max-h-full object-contain pointer-events-none rounded-lg"
                  style={{ touchAction: 'none' }}
                />
              )}
            </div>
          </div>
        ) : (
          <EditorCanvas
            ref={canvasRef}
            image={image}
            adjustments={effectiveAdjustments}
            rotation={rotation}
            flipH={flipH}
            flipV={flipV}
            skewX={skewX}
            skewY={skewY}
            crop={crop}
            textLayers={textLayers}
            stickerLayers={stickerLayers}
            strokes={strokes}
            frame={frame}
            showOriginal={showOriginal}
            overlayCanvas={repairCanvasRef.current || null}
            onCanvasReady={() => {}}
            onLayerSelect={handleLayerSelect}
            selectedLayerId={selectedLayerId}
            onLayerMove={handleLayerMove}
            onLayerTransform={handleLayerTransform}
            onLayerGestureStart={handleLayerGestureStart}
            drawMode={isDrawMode}
            onDrawStart={drawStartHandler}
            onDrawMove={drawMoveHandler}
            onDrawEnd={drawEndHandler}
            drawColor={activeDrawColor}
            drawSize={activeDrawSize}
            drawOpacity={activeDrawOpacity}
            drawTool={activeDrawTool}
            photoLayers={photoLayers}
            shapeLayers={shapeLayers}
            drawStrokes={drawStrokes}
            border={border}
            effect={effect}
            brushOverlayCanvas={activeTool === 'brush' ? brushCanvasRef.current : null}
            objectEraserCanvas={objEraserResult}
            objectEraserMask={activeTool === 'objectEraser' ? objEraserMaskRef.current : null}
            objectEraserMode={false}
          />
        )}
      </div>

      {/* Floating action bar for selected layer */}
      {selectedLayerId && !activeTool && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-neutral-800/95 backdrop-blur rounded-full px-2 py-1.5 shadow-lg border border-neutral-700 animate-fade-in">
          <button onClick={deleteSelectedLayer} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500/20 active:scale-90 transition-all" title="Delete">
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
          <div className="w-px h-5 bg-neutral-600" />
          <button onClick={() => moveLayer('back')} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-700 active:scale-90 transition-all" title="Send to Back">
            <ChevronsDown className="w-4 h-4 text-neutral-300" />
          </button>
          <button onClick={() => moveLayer('backward')} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-700 active:scale-90 transition-all" title="Send Backward">
            <ArrowDown className="w-4 h-4 text-neutral-300" />
          </button>
          <button onClick={() => moveLayer('forward')} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-700 active:scale-90 transition-all" title="Bring Forward">
            <ArrowUp className="w-4 h-4 text-neutral-300" />
          </button>
          <button onClick={() => moveLayer('front')} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-700 active:scale-90 transition-all" title="Bring to Front">
            <ChevronsUp className="w-4 h-4 text-neutral-300" />
          </button>
        </div>
      )}

      {/* Tool panel */}
      {activeTool && activeTool !== 'crop' && (
        <div className="bg-neutral-900/95 backdrop-blur border-t border-neutral-800 px-4 py-3 max-h-[40vh] overflow-y-auto no-scrollbar animate-slide-up safe-bottom shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => setActiveTool(null)} className="flex items-center gap-1 text-neutral-300 hover:text-white active:scale-95 transition-all">
              <ChevronLeft className="w-5 h-5" />
              <span className="text-xs font-medium">Back</span>
            </button>
            <h3 className="text-sm font-semibold text-white capitalize">{activeTool}</h3>
          </div>

          {activeTool === 'edit' && (
            <AdjustPanel
              adjustments={adjustments}
              onChange={(adj) => { pushHistory(); setAdjustments(adj); }}
              rotation={rotation} flipH={flipH} flipV={flipV}
              onRotation={(r) => { pushHistory(); setRotation(r); }}
              onFlipH={() => { pushHistory(); setFlipH(!flipH); }}
              onFlipV={() => { pushHistory(); setFlipV(!flipV); }}
              onReset={() => { pushHistory(); setAdjustments(defaultAdjustments); }}
            />
          )}

          {activeTool === 'adjust' && (
            <AdjustPanel
              adjustments={adjustments}
              onChange={(adj) => { pushHistory(); setAdjustments(adj); }}
              rotation={rotation} flipH={flipH} flipV={flipV}
              onRotation={(r) => { pushHistory(); setRotation(r); }}
              onFlipH={() => { pushHistory(); setFlipH(!flipH); }}
              onFlipV={() => { pushHistory(); setFlipV(!flipV); }}
              onReset={() => { pushHistory(); setAdjustments(defaultAdjustments); }}
            />
          )}

          {activeTool === 'filters' && (
            <FilterPanel
              activeFilter={filterId}
              intensity={filterIntensity}
              onFilterSelect={(id) => { pushHistory(); setFilterId(id); }}
              onIntensityChange={(v) => setFilterIntensity(v)}
              thumbnail={thumbnail}
            />
          )}

          {activeTool === 'effects' && (
            <EffectPanel
              activeEffect={effect.type}
              intensity={effect.intensity}
              onEffectSelect={(type) => { pushHistory(); setEffect({ ...effect, type }); }}
              onIntensityChange={(v) => setEffect({ ...effect, intensity: v })}
            />
          )}

          {activeTool === 'repair' && (
            <RepairPanel
              brushSize={repairBrushSize} hardness={repairHardness} zoom={repairZoom}
              onBrushSize={setRepairBrushSize} onHardness={setRepairHardness} onZoom={setRepairZoom}
              onUndo={repairUndo} onRedo={repairRedo} onReset={repairReset}
              canUndo={repairUndoStack.length > 0} canRedo={repairRedoStack.length > 0}
            />
          )}

          {activeTool === 'text' && (
            <TextPanel selectedText={selectedText} onUpdate={updateText} onAdd={addText} onDelete={deleteText} />
          )}

          {activeTool === 'draw' && (
            <DrawPanel
              tool={drawTool} color={drawColor} size={drawSize} opacity={drawOpacity}
              onTool={setDrawTool} onColor={setDrawColor} onSize={setDrawSize} onOpacity={setDrawOpacity}
              onUndo={drawUndo} onRedo={() => {}} onClear={drawClear}
              canUndo={strokes.length > 0} canRedo={false}
            />
          )}

          {activeTool === 'drawing' && (
            <DrawingPanel
              tool={drawingTool} color={drawingColor} size={drawingSize} opacity={drawingOpacity} hardness={drawingHardness}
              onTool={setDrawingTool} onColor={setDrawingColor} onSize={setDrawingSize}
              onOpacity={setDrawingOpacity} onHardness={setDrawingHardness}
              onUndo={drawingUndo} onRedo={drawingRedo} onClear={drawingClear}
              canUndo={drawStrokes.length > 0} canRedo={drawRedoStack.length > 0}
            />
          )}

          {activeTool === 'stickers' && (
            <StickerPanel onAdd={addSticker} onDelete={deleteSticker} selectedSticker={selectedSticker} onUpdate={updateSticker} />
          )}

          {activeTool === 'frames' && (
            <FramePanel selectedFrame={frame} onSelect={(f) => { pushHistory(); setFrame(f); }} />
          )}

          {activeTool === 'photo' && (
            <PhotoPanel
              selectedPhoto={selectedPhoto}
              onAdd={() => photoFileRef.current?.click()}
              onUpdate={updatePhoto}
              onDelete={deletePhoto}
              onDuplicate={duplicatePhoto}
              onBringForward={bringPhotoForward}
              onSendBackward={sendPhotoBackward}
            />
          )}

          {activeTool === 'shape' && (
            <ShapePanel
              selectedShape={selectedShape}
              onAdd={addShape}
              onUpdate={updateShape}
              onDelete={deleteShape}
            />
          )}

          {activeTool === 'border' && (
            <BorderPanel border={border} onChange={(b) => { pushHistory(); setBorder(b); }} />
          )}

          {activeTool === 'brush' && (
            <BrushPanel
              size={brushSize} hardness={brushHardness} opacity={brushOpacity} color={brushColor} tool={brushTool}
              onSize={setBrushSize} onHardness={setBrushHardness} onOpacity={setBrushOpacity} onColor={setBrushColor} onTool={setBrushTool}
              onUndo={brushUndo} onRedo={brushRedo} onClear={brushClear}
              canUndo={brushUndoStack.length > 0} canRedo={brushRedoStack.length > 0}
            />
          )}

          {activeTool === 'objectEraser' && (
            <ObjectEraserPanel
              brushSize={objEraserBrushSize}
              onBrushSize={setObjEraserBrushSize}
              onApply={objEraserApply}
              onReset={objEraserReset}
              onUndo={objEraserUndo}
              onRedo={objEraserRedo}
              onClear={objEraserClear}
              canUndo={objEraserMaskUndoStack.length > 0}
              canRedo={objEraserMaskRedoStack.length > 0}
              hasSelection={objEraserHasSelection}
            />
          )}

          {activeTool === 'flip' && (
            <div className="space-y-6 rounded-xl bg-[#121212] px-2 py-2">
              <div className="flex items-start justify-center gap-20">
                <button
                  onClick={() => setSkewMode('horizontal')}
                  className={`flex min-w-[92px] flex-col items-center gap-2 transition-all active:scale-95 ${skewMode === 'horizontal' ? 'text-[#00D1B2]' : 'text-white'}`}
                >
                  <FlipHorizontal className="h-8 w-8" strokeWidth={1.8} />
                  <span className="text-sm font-medium">Horizontal</span>
                </button>
                <button
                  onClick={() => setSkewMode('vertical')}
                  className={`flex min-w-[92px] flex-col items-center gap-2 transition-all active:scale-95 ${skewMode === 'vertical' ? 'text-[#00D1B2]' : 'text-white'}`}
                >
                  <FlipVertical className="h-8 w-8" strokeWidth={1.8} />
                  <span className="text-sm font-medium">Vertical</span>
                </button>
              </div>

              <div className="px-1 pb-1">
                <div className="relative h-12">
                  <input
                    type="range"
                    min={-30}
                    max={30}
                    step={1}
                    value={skewMode === 'horizontal' ? skewX : skewY}
                    aria-label={`${skewMode} skew angle`}
                    onPointerDown={() => pushHistory()}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (skewMode === 'horizontal') setSkewX(v);
                      else setSkewY(v);
                    }}
                    className="flip-rotation-range absolute inset-x-0 top-3 w-full"
                  />
                  <div
                    className="pointer-events-none absolute top-0 -translate-x-1/2 text-white transition-[left] duration-75"
                    style={{ left: `${(((skewMode === 'horizontal' ? skewX : skewY) + 30) / 60) * 100}%` }}
                  >
                    <div className="mx-auto h-0 w-0 border-x-[7px] border-t-[10px] border-x-transparent border-t-white" />
                    <div className="mx-auto mt-0.5 h-6 w-0.5 bg-white" />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-neutral-400">
                  <span>-30°</span>
                  <span>-15°</span>
                  <span className="text-white">0°</span>
                  <span>15°</span>
                  <span>30°</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTool === 'crop' && image && (
        <CropEditor
          image={image}
          currentCrop={crop}
          currentRotation={rotation}
          currentFlipH={flipH}
          currentFlipV={flipV}
          onDone={(result: CropResult, _dataUrl: string) => {
            pushHistory();
            setCrop(result.crop);
            setRotation(result.rotation);
            setFlipH(result.flipH);
            setFlipV(result.flipV);
            setActiveTool(null);
          }}
          onCancel={() => setActiveTool(null)}
        />
      )}

      {!activeTool && <BottomToolbar activeTool={activeTool} onToolSelect={handleToolSelect} />}

      {showExport && <ExportPanel canvas={canvasRef.current?.getCanvas() || null} onClose={() => setShowExport(false)} />}

      {/* Full Background Eraser Experience */}
      {showFullBgEraser && (
        <div className="fixed inset-0 z-50 bg-neutral-950">
          <BackgroundEraser onBack={() => setShowFullBgEraser(false)} />
        </div>
      )}

      <input ref={photoFileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={async (e) => {
        const file = e.target.files?.[0];
        if (file) await addPhotoLayer(file);
        e.target.value = '';
      }} />
    </div>
  );
}
