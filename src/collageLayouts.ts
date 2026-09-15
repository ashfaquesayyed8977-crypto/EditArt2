import type { CollageLayout } from './types';

export const COLLAGE_LAYOUTS: CollageLayout[] = [
  // 2 photos
  {
    id: '2-vert', name: '2 Vertical', count: 2,
    cells: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
  },
  {
    id: '2-horz', name: '2 Horizontal', count: 2,
    cells: [
      { x: 0, y: 0, w: 1, h: 0.5 },
      { x: 0, y: 0.5, w: 1, h: 0.5 },
    ],
  },
  // 3 photos
  {
    id: '3-top2bot1', name: '3 Photos', count: 3,
    cells: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 1, h: 0.5 },
    ],
  },
  {
    id: '3-left1right2', name: '3 Photos Alt', count: 3,
    cells: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  // 4 photos
  {
    id: '4-grid', name: '4 Grid', count: 4,
    cells: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  {
    id: '4-instagram', name: 'Instagram', count: 4,
    cells: [
      { x: 0, y: 0, w: 1, h: 0.34 },
      { x: 0, y: 0.34, w: 0.33, h: 0.33 },
      { x: 0.33, y: 0.34, w: 0.34, h: 0.33 },
      { x: 0.67, y: 0.34, w: 0.33, h: 0.33 },
    ],
  },
  // 5 photos
  {
    id: '5-grid', name: '5 Photos', count: 5,
    cells: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.33, h: 0.5 },
      { x: 0.33, y: 0.5, w: 0.34, h: 0.5 },
      { x: 0.67, y: 0.5, w: 0.33, h: 0.5 },
    ],
  },
  // 6 photos
  {
    id: '6-grid', name: '6 Grid', count: 6,
    cells: [
      { x: 0, y: 0, w: 0.33, h: 0.5 },
      { x: 0.33, y: 0, w: 0.34, h: 0.5 },
      { x: 0.67, y: 0, w: 0.33, h: 0.5 },
      { x: 0, y: 0.5, w: 0.33, h: 0.5 },
      { x: 0.33, y: 0.5, w: 0.34, h: 0.5 },
      { x: 0.67, y: 0.5, w: 0.33, h: 0.5 },
    ],
  },
  // 9 photos
  {
    id: '9-grid', name: '9 Grid', count: 9,
    cells: [
      { x: 0, y: 0, w: 0.33, h: 0.33 },
      { x: 0.33, y: 0, w: 0.34, h: 0.33 },
      { x: 0.67, y: 0, w: 0.33, h: 0.33 },
      { x: 0, y: 0.33, w: 0.33, h: 0.34 },
      { x: 0.33, y: 0.33, w: 0.34, h: 0.34 },
      { x: 0.67, y: 0.33, w: 0.33, h: 0.34 },
      { x: 0, y: 0.67, w: 0.33, h: 0.33 },
      { x: 0.33, y: 0.67, w: 0.34, h: 0.33 },
      { x: 0.67, y: 0.67, w: 0.33, h: 0.33 },
    ],
  },
  // Polaroid style (2 photos)
  {
    id: 'polaroid-2', name: 'Polaroid', count: 2,
    cells: [
      { x: 0.05, y: 0.05, w: 0.42, h: 0.9 },
      { x: 0.53, y: 0.05, w: 0.42, h: 0.9 },
    ],
  },
  // Film strip (3 photos)
  {
    id: 'film-3', name: 'Film Strip', count: 3,
    cells: [
      { x: 0, y: 0.1, w: 0.33, h: 0.8 },
      { x: 0.33, y: 0.1, w: 0.34, h: 0.8 },
      { x: 0.67, y: 0.1, w: 0.33, h: 0.8 },
    ],
  },
  // Heart style (4 photos)
  {
    id: 'heart-4', name: 'Heart', count: 4,
    cells: [
      { x: 0.15, y: 0, w: 0.3, h: 0.4 },
      { x: 0.55, y: 0, w: 0.3, h: 0.4 },
      { x: 0, y: 0.35, w: 0.5, h: 0.35 },
      { x: 0.5, y: 0.35, w: 0.5, h: 0.35 },
    ],
  },
  // Circle frame (1 photo, but listed for variety)
  {
    id: 'circle-1', name: 'Circle', count: 1,
    cells: [
      { x: 0.1, y: 0.1, w: 0.8, h: 0.8 },
    ],
  },
];

export function getLayoutsForCount(count: number): CollageLayout[] {
  return COLLAGE_LAYOUTS.filter((l) => l.count === count);
}
