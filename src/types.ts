export interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  sharpness: number;
  blur: number;
  temperature: number;
  tint: number;
  vignette: number;
  grayscale: number;
  sepia: number;
}

export const defaultAdjustments: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  sharpness: 0,
  blur: 0,
  temperature: 0,
  tint: 0,
  vignette: 0,
  grayscale: 0,
  sepia: 0,
};

export type FilterId =
  | 'original'
  | 'vintage'
  | 'bw'
  | 'sepia'
  | 'warm'
  | 'cool'
  | 'bright'
  | 'dramatic'
  | 'fade'
  | 'retro';

export interface FilterPreset {
  id: FilterId;
  name: string;
  adjustments: Partial<Adjustments>;
}

export interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  color: string;
  bgColor: string;
  bgEnabled: boolean;
  align: 'left' | 'center' | 'right';
  opacity: number;
  shadow: boolean;
  rotation: number;
}

export interface StickerLayer {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

export interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  size: number;
  opacity: number;
  tool: 'brush' | 'pencil' | 'eraser';
}

export interface FrameConfig {
  id: string;
  name: string;
  category: string;
  borderWidth: number;
  borderColor: string;
  innerRadius: number;
  outerRadius: number;
  inset: number;
  label?: string;
}

export type ToolId =
  | 'edit'
  | 'filters'
  | 'effects'
  | 'adjust'
  | 'crop'
  | 'flip'
  | 'text'
  | 'photo'
  | 'shape'
  | 'stickers'
  | 'border'
  | 'brush'
  | 'repair'
  | 'background'
  | 'objectEraser'
  | 'drawing'
  | 'draw'
  | 'frames';

export type EditorMode = 'home' | 'editor' | 'collage';

// ── Editor Layer Types ──────────────────────────────────────

export interface PhotoLayer {
  id: string;
  image: HTMLImageElement;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  flipH: boolean;
  flipV: boolean;
}

export interface ShapeLayer {
  id: string;
  shape: ShapeType;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  fillColor: string;
  borderColor: string;
  borderWidth: number;
  opacity: number;
  radius?: number;
}

export interface DrawStroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  size: number;
  opacity: number;
  tool: 'pen' | 'pencil' | 'marker' | 'neon' | 'highlighter' | 'eraser';
}

export interface BorderConfig {
  width: number;
  color: string;
  opacity: number;
  radius: number;
  style: 'solid' | 'dashed';
  mode: 'inside' | 'outside';
}

export interface EffectState {
  type: string;
  intensity: number;
}

export interface CollageLayout {
  id: string;
  name: string;
  count: number;
  cells: { x: number; y: number; w: number; h: number }[];
}

export interface CollagePhoto {
  image: HTMLImageElement;
  offsetX: number;
  offsetY: number;
  scale: number;
  rotation: number;
}

export interface CollageConfig {
  layout: CollageLayout;
  borderThickness: number;
  borderColor: string;
  cornerRadius: number;
  spacing: number;
  bgColor: string;
  bgImage: HTMLImageElement | null;
}

// ── New Template Engine Types ──────────────────────────────

export type ShapeType =
  | 'rect'
  | 'rounded'
  | 'circle'
  | 'oval'
  | 'triangle'
  | 'diamond'
  | 'hexagon'
  | 'octagon'
  | 'pentagon'
  | 'star'
  | 'heart'
  | 'crescent'
  | 'cloud'
  | 'flower'
  | 'leaf'
  | 'butterfly'
  | 'sun'
  | 'moon'
  | 'speech'
  | 'plus'
  | 'cross';

export type TemplateCategory =
  | 'grid'
  | 'shapes'
  | 'geometric'
  | 'creative'
  | 'heart'
  | 'star'
  | 'polaroid'
  | 'magazine'
  | 'scrapbook'
  | 'mosaic';

export interface TemplateSlot {
  shape: ShapeType;
  /** Normalized 0..1 within the canvas */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Rotation in degrees */
  rotation?: number;
  /** Corner radius for rounded rect, 0..1 of min(w,h) */
  radius?: number;
  /** z-index ordering for overlapping slots */
  z?: number;
}

export type AspectRatio = '1:1' | '4:5' | '3:4' | '4:3' | '9:16' | '16:9';

export interface CollageTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  slotCount: number;
  aspectRatio: AspectRatio;
  slots: TemplateSlot[];
  /** Optional background color override for template-specific styles */
  bgStyle?: 'white' | 'dark' | 'transparent';
}
