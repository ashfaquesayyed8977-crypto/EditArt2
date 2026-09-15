import type { FrameConfig } from './types';

export const FRAME_CATEGORIES = [
  'Simple',
  'Classic',
  'Modern',
  'Polaroid',
  'Film',
  'Birthday',
  'Wedding',
  'Festival',
  'Love',
  'Kids',
];

export const FRAMES: FrameConfig[] = [
  // Simple
  { id: 'none', name: 'None', category: 'Simple', borderWidth: 0, borderColor: '#000000', innerRadius: 0, outerRadius: 0, inset: 0 },
  { id: 'simple-white', name: 'White', category: 'Simple', borderWidth: 12, borderColor: '#ffffff', innerRadius: 0, outerRadius: 0, inset: 0 },
  { id: 'simple-black', name: 'Black', category: 'Simple', borderWidth: 12, borderColor: '#1a1a1a', innerRadius: 0, outerRadius: 0, inset: 0 },
  { id: 'simple-gray', name: 'Gray', category: 'Simple', borderWidth: 10, borderColor: '#888888', innerRadius: 0, outerRadius: 0, inset: 0 },

  // Classic
  { id: 'classic-gold', name: 'Gold', category: 'Classic', borderWidth: 18, borderColor: '#d4af37', innerRadius: 0, outerRadius: 0, inset: 0 },
  { id: 'classic-wood', name: 'Wood', category: 'Classic', borderWidth: 22, borderColor: '#8b5e3c', innerRadius: 0, outerRadius: 0, inset: 0 },
  { id: 'classic-double', name: 'Double', category: 'Classic', borderWidth: 16, borderColor: '#2a2a2a', innerRadius: 0, outerRadius: 0, inset: 4 },
  { id: 'classic-ornate', name: 'Ornate', category: 'Classic', borderWidth: 28, borderColor: '#c0a050', innerRadius: 0, outerRadius: 0, inset: 6 },

  // Modern
  { id: 'modern-thin', name: 'Thin', category: 'Modern', borderWidth: 4, borderColor: '#e0e0e0', innerRadius: 8, outerRadius: 12, inset: 0 },
  { id: 'modern-rounded', name: 'Rounded', category: 'Modern', borderWidth: 8, borderColor: '#333333', innerRadius: 16, outerRadius: 20, inset: 0 },
  { id: 'modern-neon', name: 'Neon', category: 'Modern', borderWidth: 6, borderColor: '#00ff88', innerRadius: 12, outerRadius: 16, inset: 0 },
  { id: 'modern-gradient', name: 'Gradient', category: 'Modern', borderWidth: 14, borderColor: '#ff6b6b', innerRadius: 10, outerRadius: 14, inset: 0 },

  // Polaroid
  { id: 'polaroid-white', name: 'Polaroid', category: 'Polaroid', borderWidth: 14, borderColor: '#ffffff', innerRadius: 0, outerRadius: 0, inset: 0, label: 'bottom' },
  { id: 'polaroid-cream', name: 'Cream', category: 'Polaroid', borderWidth: 14, borderColor: '#fdf6e3', innerRadius: 0, outerRadius: 0, inset: 0, label: 'bottom' },
  { id: 'polaroid-dark', name: 'Dark', category: 'Polaroid', borderWidth: 14, borderColor: '#2a2a2a', innerRadius: 0, outerRadius: 0, inset: 0, label: 'bottom' },

  // Film
  { id: 'film-strip', name: 'Film Strip', category: 'Film', borderWidth: 10, borderColor: '#1a1a1a', innerRadius: 0, outerRadius: 0, inset: 0, label: 'film' },
  { id: 'film-vintage', name: 'Vintage Film', category: 'Film', borderWidth: 8, borderColor: '#3a2a1a', innerRadius: 0, outerRadius: 0, inset: 0, label: 'film' },

  // Birthday
  { id: 'birthday-confetti', name: 'Confetti', category: 'Birthday', borderWidth: 20, borderColor: '#ff6b9d', innerRadius: 0, outerRadius: 0, inset: 0 },
  { id: 'birthday-balloon', name: 'Balloon', category: 'Birthday', borderWidth: 18, borderColor: '#4ecdc4', innerRadius: 0, outerRadius: 0, inset: 0 },
  { id: 'birthday-cake', name: 'Cake', category: 'Birthday', borderWidth: 22, borderColor: '#ffd700', innerRadius: 0, outerRadius: 0, inset: 0 },

  // Wedding
  { id: 'wedding-lace', name: 'Lace', category: 'Wedding', borderWidth: 16, borderColor: '#f5f0e8', innerRadius: 0, outerRadius: 0, inset: 0 },
  { id: 'wedding-silver', name: 'Silver', category: 'Wedding', borderWidth: 20, borderColor: '#c0c0c0', innerRadius: 0, outerRadius: 0, inset: 0 },
  { id: 'wedding-rose', name: 'Rose Gold', category: 'Wedding', borderWidth: 18, borderColor: '#e0bfb8', innerRadius: 0, outerRadius: 0, inset: 0 },

  // Festival
  { id: 'festival-bright', name: 'Bright', category: 'Festival', borderWidth: 16, borderColor: '#ff4757', innerRadius: 0, outerRadius: 0, inset: 0 },
  { id: 'festival-rainbow', name: 'Rainbow', category: 'Festival', borderWidth: 20, borderColor: '#ffa502', innerRadius: 0, outerRadius: 0, inset: 0 },
  { id: 'festival-glow', name: 'Glow', category: 'Festival', borderWidth: 14, borderColor: '#7bed9f', innerRadius: 0, outerRadius: 0, inset: 0 },

  // Love
  { id: 'love-heart', name: 'Heart', category: 'Love', borderWidth: 18, borderColor: '#ff6b81', innerRadius: 0, outerRadius: 0, inset: 0 },
  { id: 'love-rose', name: 'Rose', category: 'Love', borderWidth: 16, borderColor: '#e84393', innerRadius: 0, outerRadius: 0, inset: 0 },
  { id: 'love-pink', name: 'Pink', category: 'Love', borderWidth: 14, borderColor: '#fd79a8', innerRadius: 0, outerRadius: 0, inset: 0 },

  // Kids
  { id: 'kids-blue', name: 'Blue', category: 'Kids', borderWidth: 16, borderColor: '#54a0ff', innerRadius: 8, outerRadius: 12, inset: 0 },
  { id: 'kids-green', name: 'Green', category: 'Kids', borderWidth: 16, borderColor: '#26de81', innerRadius: 8, outerRadius: 12, inset: 0 },
  { id: 'kids-orange', name: 'Orange', category: 'Kids', borderWidth: 18, borderColor: '#ff9f43', innerRadius: 10, outerRadius: 14, inset: 0 },
];
