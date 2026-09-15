import type { CollageTemplate, TemplateCategory, AspectRatio } from './types';

// ── Helper functions ────────────────────────────────────────

const r = (
  shape: CollageTemplate['slots'][number]['shape'],
  x: number, y: number, w: number, h: number,
  extra?: Partial<CollageTemplate['slots'][number]>
): CollageTemplate['slots'][number] => ({ shape, x, y, w, h, ...extra });

// ── Grid Templates ──────────────────────────────────────────

const gridTemplates: CollageTemplate[] = [
  {
    id: 'grid-1', name: '1 Photo', category: 'grid', slotCount: 1, aspectRatio: '1:1',
    slots: [r('rect', 0, 0, 1, 1)],
  },
  {
    id: 'grid-2v', name: '2 Vertical', category: 'grid', slotCount: 2, aspectRatio: '1:1',
    slots: [r('rect', 0, 0, 0.5, 1), r('rect', 0.5, 0, 0.5, 1)],
  },
  {
    id: 'grid-2h', name: '2 Horizontal', category: 'grid', slotCount: 2, aspectRatio: '1:1',
    slots: [r('rect', 0, 0, 1, 0.5), r('rect', 0, 0.5, 1, 0.5)],
  },
  {
    id: 'grid-3v', name: '3 Vertical', category: 'grid', slotCount: 3, aspectRatio: '1:1',
    slots: [r('rect', 0, 0, 0.333, 1), r('rect', 0.333, 0, 0.334, 1), r('rect', 0.667, 0, 0.333, 1)],
  },
  {
    id: 'grid-3h', name: '3 Horizontal', category: 'grid', slotCount: 3, aspectRatio: '1:1',
    slots: [r('rect', 0, 0, 1, 0.333), r('rect', 0, 0.333, 1, 0.334), r('rect', 0, 0.667, 1, 0.333)],
  },
  {
    id: 'grid-3mix', name: '3 Mixed', category: 'grid', slotCount: 3, aspectRatio: '1:1',
    slots: [r('rect', 0, 0, 0.5, 0.5), r('rect', 0.5, 0, 0.5, 0.5), r('rect', 0, 0.5, 1, 0.5)],
  },
  {
    id: 'grid-3mix2', name: '3 Mixed Alt', category: 'grid', slotCount: 3, aspectRatio: '1:1',
    slots: [r('rect', 0, 0, 0.5, 1), r('rect', 0.5, 0, 0.5, 0.5), r('rect', 0.5, 0.5, 0.5, 0.5)],
  },
  {
    id: 'grid-4', name: '4 Grid', category: 'grid', slotCount: 4, aspectRatio: '1:1',
    slots: [
      r('rect', 0, 0, 0.5, 0.5), r('rect', 0.5, 0, 0.5, 0.5),
      r('rect', 0, 0.5, 0.5, 0.5), r('rect', 0.5, 0.5, 0.5, 0.5),
    ],
  },
  {
    id: 'grid-5', name: '5 Grid', category: 'grid', slotCount: 5, aspectRatio: '1:1',
    slots: [
      r('rect', 0, 0, 0.5, 0.5), r('rect', 0.5, 0, 0.5, 0.5),
      r('rect', 0, 0.5, 0.333, 0.5), r('rect', 0.333, 0.5, 0.334, 0.5), r('rect', 0.667, 0.5, 0.333, 0.5),
    ],
  },
  {
    id: 'grid-6', name: '6 Grid', category: 'grid', slotCount: 6, aspectRatio: '1:1',
    slots: [
      r('rect', 0, 0, 0.333, 0.5), r('rect', 0.333, 0, 0.334, 0.5), r('rect', 0.667, 0, 0.333, 0.5),
      r('rect', 0, 0.5, 0.333, 0.5), r('rect', 0.333, 0.5, 0.334, 0.5), r('rect', 0.667, 0.5, 0.333, 0.5),
    ],
  },
  {
    id: 'grid-7', name: '7 Grid', category: 'grid', slotCount: 7, aspectRatio: '1:1',
    slots: [
      r('rect', 0, 0, 0.333, 0.333), r('rect', 0.333, 0, 0.334, 0.333), r('rect', 0.667, 0, 0.333, 0.333),
      r('rect', 0, 0.333, 0.25, 0.667), r('rect', 0.25, 0.333, 0.25, 0.667), r('rect', 0.5, 0.333, 0.25, 0.667), r('rect', 0.75, 0.333, 0.25, 0.667),
    ],
  },
  {
    id: 'grid-8', name: '8 Grid', category: 'grid', slotCount: 8, aspectRatio: '1:1',
    slots: [
      r('rect', 0, 0, 0.5, 0.333), r('rect', 0.5, 0, 0.5, 0.333),
      r('rect', 0, 0.333, 0.333, 0.333), r('rect', 0.333, 0.333, 0.334, 0.333), r('rect', 0.667, 0.333, 0.333, 0.333),
      r('rect', 0, 0.667, 0.5, 0.333), r('rect', 0.5, 0.667, 0.25, 0.333), r('rect', 0.75, 0.667, 0.25, 0.333),
    ],
  },
  {
    id: 'grid-9', name: '9 Grid', category: 'grid', slotCount: 9, aspectRatio: '1:1',
    slots: [
      r('rect', 0, 0, 0.333, 0.333), r('rect', 0.333, 0, 0.334, 0.333), r('rect', 0.667, 0, 0.333, 0.333),
      r('rect', 0, 0.333, 0.333, 0.334), r('rect', 0.333, 0.333, 0.334, 0.334), r('rect', 0.667, 0.333, 0.333, 0.334),
      r('rect', 0, 0.667, 0.333, 0.333), r('rect', 0.333, 0.667, 0.334, 0.333), r('rect', 0.667, 0.667, 0.333, 0.333),
    ],
  },
  {
    id: 'grid-10', name: '10 Grid', category: 'grid', slotCount: 10, aspectRatio: '1:1',
    slots: [
      r('rect', 0, 0, 0.2, 0.5), r('rect', 0.2, 0, 0.2, 0.5), r('rect', 0.4, 0, 0.2, 0.5), r('rect', 0.6, 0, 0.2, 0.5), r('rect', 0.8, 0, 0.2, 0.5),
      r('rect', 0, 0.5, 0.2, 0.5), r('rect', 0.2, 0.5, 0.2, 0.5), r('rect', 0.4, 0.5, 0.2, 0.5), r('rect', 0.6, 0.5, 0.2, 0.5), r('rect', 0.8, 0.5, 0.2, 0.5),
    ],
  },
  {
    id: 'grid-masonry', name: 'Masonry', category: 'grid', slotCount: 5, aspectRatio: '1:1',
    slots: [
      r('rect', 0, 0, 0.5, 0.6), r('rect', 0.5, 0, 0.5, 0.4),
      r('rect', 0.5, 0.4, 0.5, 0.35), r('rect', 0, 0.6, 0.3, 0.4), r('rect', 0.3, 0.6, 0.7, 0.4),
    ],
  },
  {
    id: 'grid-magazine', name: 'Magazine', category: 'grid', slotCount: 4, aspectRatio: '1:1',
    slots: [
      r('rect', 0, 0, 0.65, 0.55), r('rect', 0.65, 0, 0.35, 0.3),
      r('rect', 0.65, 0.3, 0.35, 0.25), r('rect', 0, 0.55, 1, 0.45),
    ],
  },
];

// ── Shape Templates (single shape) ──────────────────────────

const shapeTemplates: CollageTemplate[] = [
  { id: 'shape-circle', name: 'Circle', category: 'shapes', slotCount: 1, aspectRatio: '1:1', slots: [r('circle', 0.1, 0.1, 0.8, 0.8)] },
  { id: 'shape-oval', name: 'Oval', category: 'shapes', slotCount: 1, aspectRatio: '1:1', slots: [r('oval', 0.05, 0.2, 0.9, 0.6)] },
  { id: 'shape-square', name: 'Square', category: 'shapes', slotCount: 1, aspectRatio: '1:1', slots: [r('rect', 0.15, 0.15, 0.7, 0.7)] },
  { id: 'shape-rounded', name: 'Rounded', category: 'shapes', slotCount: 1, aspectRatio: '1:1', slots: [r('rounded', 0.1, 0.1, 0.8, 0.8, { radius: 0.15 })] },
  { id: 'shape-triangle', name: 'Triangle', category: 'shapes', slotCount: 1, aspectRatio: '1:1', slots: [r('triangle', 0.1, 0.1, 0.8, 0.8)] },
  { id: 'shape-diamond', name: 'Diamond', category: 'shapes', slotCount: 1, aspectRatio: '1:1', slots: [r('diamond', 0.1, 0.1, 0.8, 0.8)] },
  { id: 'shape-hexagon', name: 'Hexagon', category: 'shapes', slotCount: 1, aspectRatio: '1:1', slots: [r('hexagon', 0.1, 0.1, 0.8, 0.8)] },
  { id: 'shape-octagon', name: 'Octagon', category: 'shapes', slotCount: 1, aspectRatio: '1:1', slots: [r('octagon', 0.1, 0.1, 0.8, 0.8)] },
  { id: 'shape-pentagon', name: 'Pentagon', category: 'shapes', slotCount: 1, aspectRatio: '1:1', slots: [r('pentagon', 0.1, 0.1, 0.8, 0.8)] },
  { id: 'shape-star', name: 'Star', category: 'shapes', slotCount: 1, aspectRatio: '1:1', slots: [r('star', 0.1, 0.1, 0.8, 0.8)] },
  { id: 'shape-heart', name: 'Heart', category: 'shapes', slotCount: 1, aspectRatio: '1:1', slots: [r('heart', 0.1, 0.1, 0.8, 0.8)] },
  { id: 'shape-crescent', name: 'Crescent', category: 'shapes', slotCount: 1, aspectRatio: '1:1', slots: [r('crescent', 0.1, 0.1, 0.8, 0.8)] },
  { id: 'shape-cloud', name: 'Cloud', category: 'shapes', slotCount: 1, aspectRatio: '1:1', slots: [r('cloud', 0.05, 0.1, 0.9, 0.8)] },
  { id: 'shape-flower', name: 'Flower', category: 'shapes', slotCount: 1, aspectRatio: '1:1', slots: [r('flower', 0.1, 0.1, 0.8, 0.8)] },
  { id: 'shape-leaf', name: 'Leaf', category: 'shapes', slotCount: 1, aspectRatio: '1:1', slots: [r('leaf', 0.1, 0.1, 0.8, 0.8)] },
  { id: 'shape-butterfly', name: 'Butterfly', category: 'shapes', slotCount: 1, aspectRatio: '1:1', slots: [r('butterfly', 0.05, 0.1, 0.9, 0.8)] },
  { id: 'shape-sun', name: 'Sun', category: 'shapes', slotCount: 1, aspectRatio: '1:1', slots: [r('sun', 0.05, 0.05, 0.9, 0.9)] },
  { id: 'shape-moon', name: 'Moon', category: 'shapes', slotCount: 1, aspectRatio: '1:1', slots: [r('moon', 0.1, 0.1, 0.8, 0.8)] },
  { id: 'shape-speech', name: 'Speech', category: 'shapes', slotCount: 1, aspectRatio: '1:1', slots: [r('speech', 0.1, 0.1, 0.8, 0.8)] },
  { id: 'shape-plus', name: 'Plus', category: 'shapes', slotCount: 1, aspectRatio: '1:1', slots: [r('plus', 0.1, 0.1, 0.8, 0.8)] },
  { id: 'shape-cross', name: 'Cross', category: 'shapes', slotCount: 1, aspectRatio: '1:1', slots: [r('cross', 0.1, 0.1, 0.8, 0.8)] },
];

// ── Geometric Multi-Shape Templates ─────────────────────────

const geometricTemplates: CollageTemplate[] = [
  {
    id: 'geo-2c1r', name: '2 Circle + 1 Rect', category: 'geometric', slotCount: 3, aspectRatio: '1:1',
    slots: [r('circle', 0.05, 0.1, 0.4, 0.4), r('circle', 0.55, 0.1, 0.4, 0.4), r('rounded', 0.1, 0.55, 0.8, 0.35, { radius: 0.08 })],
  },
  {
    id: 'geo-3c2r', name: '3 Circle + 2 Rect', category: 'geometric', slotCount: 5, aspectRatio: '1:1',
    slots: [
      r('circle', 0.05, 0.05, 0.28, 0.28), r('circle', 0.36, 0.05, 0.28, 0.28), r('circle', 0.67, 0.05, 0.28, 0.28),
      r('rounded', 0.05, 0.4, 0.42, 0.55, { radius: 0.06 }), r('rounded', 0.53, 0.4, 0.42, 0.55, { radius: 0.06 }),
    ],
  },
  {
    id: 'geo-hexgrid', name: 'Hexagon Grid', category: 'geometric', slotCount: 3, aspectRatio: '1:1',
    slots: [r('hexagon', 0.05, 0.1, 0.4, 0.4), r('hexagon', 0.55, 0.1, 0.4, 0.4), r('hexagon', 0.3, 0.5, 0.4, 0.4)],
  },
  {
    id: 'geo-diamond-circle', name: 'Diamond + Circle', category: 'geometric', slotCount: 3, aspectRatio: '1:1',
    slots: [r('diamond', 0.25, 0.05, 0.5, 0.5), r('circle', 0.05, 0.55, 0.35, 0.35), r('circle', 0.6, 0.55, 0.35, 0.35)],
  },
  {
    id: 'geo-mixed', name: 'Mixed Shapes', category: 'geometric', slotCount: 4, aspectRatio: '1:1',
    slots: [r('circle', 0.05, 0.05, 0.4, 0.4), r('hexagon', 0.55, 0.05, 0.4, 0.4), r('star', 0.05, 0.5, 0.4, 0.45), r('rounded', 0.55, 0.5, 0.4, 0.45, { radius: 0.1 })],
  },
  {
    id: 'geo-overlap', name: 'Overlapping', category: 'geometric', slotCount: 3, aspectRatio: '1:1',
    slots: [
      r('circle', 0.05, 0.1, 0.5, 0.5, { z: 1 }), r('circle', 0.45, 0.1, 0.5, 0.5, { z: 2 }),
      r('rounded', 0.2, 0.45, 0.6, 0.45, { z: 3, radius: 0.08 }),
    ],
  },
];

// ── Heart Templates ─────────────────────────────────────────

const heartTemplates: CollageTemplate[] = [
  {
    id: 'heart-2', name: 'Heart Pair', category: 'heart', slotCount: 2, aspectRatio: '1:1',
    slots: [r('heart', 0.05, 0.1, 0.4, 0.4), r('heart', 0.55, 0.1, 0.4, 0.4)],
  },
  {
    id: 'heart-4', name: 'Heart Quad', category: 'heart', slotCount: 4, aspectRatio: '1:1',
    slots: [
      r('heart', 0.05, 0.05, 0.4, 0.4), r('heart', 0.55, 0.05, 0.4, 0.4),
      r('heart', 0.05, 0.5, 0.4, 0.4), r('heart', 0.55, 0.5, 0.4, 0.4),
    ],
  },
  {
    id: 'heart-circle', name: 'Heart + Circles', category: 'heart', slotCount: 3, aspectRatio: '1:1',
    slots: [r('heart', 0.25, 0.02, 0.5, 0.5), r('circle', 0.05, 0.55, 0.35, 0.35), r('circle', 0.6, 0.55, 0.35, 0.35)],
  },
  {
    id: 'heart-big', name: 'Big Heart', category: 'heart', slotCount: 1, aspectRatio: '1:1',
    slots: [r('heart', 0.05, 0.05, 0.9, 0.9)],
  },
];

// ── Star Templates ──────────────────────────────────────────

const starTemplates: CollageTemplate[] = [
  {
    id: 'star-2', name: 'Star Pair', category: 'star', slotCount: 2, aspectRatio: '1:1',
    slots: [r('star', 0.05, 0.1, 0.4, 0.4), r('star', 0.55, 0.1, 0.4, 0.4)],
  },
  {
    id: 'star-4', name: 'Star Quad', category: 'star', slotCount: 4, aspectRatio: '1:1',
    slots: [
      r('star', 0.05, 0.05, 0.4, 0.4), r('star', 0.55, 0.05, 0.4, 0.4),
      r('star', 0.05, 0.5, 0.4, 0.4), r('star', 0.55, 0.5, 0.4, 0.4),
    ],
  },
  {
    id: 'star-rect', name: 'Star + Rect', category: 'star', slotCount: 3, aspectRatio: '1:1',
    slots: [r('star', 0.25, 0.02, 0.5, 0.45), r('rounded', 0.05, 0.5, 0.4, 0.4, { radius: 0.08 }), r('rounded', 0.55, 0.5, 0.4, 0.4, { radius: 0.08 })],
  },
  {
    id: 'star-big', name: 'Big Star', category: 'star', slotCount: 1, aspectRatio: '1:1',
    slots: [r('star', 0.05, 0.05, 0.9, 0.9)],
  },
];

// ── Polaroid Templates ───────────────────────────────────────

const polaroidTemplates: CollageTemplate[] = [
  {
    id: 'polaroid-2', name: 'Polaroid 2', category: 'polaroid', slotCount: 2, aspectRatio: '1:1',
    slots: [r('rect', 0.05, 0.05, 0.42, 0.9), r('rect', 0.53, 0.05, 0.42, 0.9)],
  },
  {
    id: 'polaroid-3', name: 'Polaroid 3', category: 'polaroid', slotCount: 3, aspectRatio: '1:1',
    slots: [
      r('rect', 0.02, 0.05, 0.3, 0.85, { rotation: -5 }), r('rect', 0.35, 0.03, 0.3, 0.85, { rotation: 0 }),
      r('rect', 0.68, 0.05, 0.3, 0.85, { rotation: 5 }),
    ],
  },
  {
    id: 'polaroid-scatter', name: 'Polaroid Scatter', category: 'polaroid', slotCount: 4, aspectRatio: '1:1',
    slots: [
      r('rect', 0.02, 0.02, 0.35, 0.4, { rotation: -8 }),
      r('rect', 0.6, 0.05, 0.35, 0.4, { rotation: 6 }),
      r('rect', 0.05, 0.5, 0.35, 0.4, { rotation: 4 }),
      r('rect', 0.55, 0.52, 0.35, 0.4, { rotation: -3 }),
    ],
  },
  {
    id: 'polaroid-fan', name: 'Polaroid Fan', category: 'polaroid', slotCount: 3, aspectRatio: '1:1',
    slots: [
      r('rect', 0.1, 0.1, 0.3, 0.75, { rotation: -12 }),
      r('rect', 0.35, 0.05, 0.3, 0.8, { rotation: 0 }),
      r('rect', 0.6, 0.1, 0.3, 0.75, { rotation: 12 }),
    ],
  },
];

// ── Magazine Templates ──────────────────────────────────────

const magazineTemplates: CollageTemplate[] = [
  {
    id: 'mag-cover', name: 'Mag Cover', category: 'magazine', slotCount: 3, aspectRatio: '1:1',
    slots: [r('rect', 0, 0, 1, 0.6), r('rect', 0, 0.6, 0.5, 0.4), r('rect', 0.5, 0.6, 0.5, 0.4)],
  },
  {
    id: 'mag-spread', name: 'Mag Spread', category: 'magazine', slotCount: 4, aspectRatio: '1:1',
    slots: [
      r('rect', 0, 0, 0.55, 0.5), r('rect', 0.55, 0, 0.45, 0.3),
      r('rect', 0.55, 0.3, 0.45, 0.2), r('rect', 0, 0.5, 1, 0.5),
    ],
  },
  {
    id: 'mag-feature', name: 'Mag Feature', category: 'magazine', slotCount: 3, aspectRatio: '1:1',
    slots: [
      r('rounded', 0.05, 0.05, 0.55, 0.9, { radius: 0.04 }),
      r('rect', 0.65, 0.05, 0.3, 0.28), r('rect', 0.65, 0.37, 0.3, 0.28), r('rect', 0.65, 0.69, 0.3, 0.26),
    ].slice(0, 3) as CollageTemplate['slots'],
  },
  {
    id: 'mag-editorial', name: 'Editorial', category: 'magazine', slotCount: 5, aspectRatio: '1:1',
    slots: [
      r('rect', 0, 0, 0.5, 0.4), r('rect', 0.5, 0, 0.5, 0.4),
      r('rect', 0, 0.4, 0.3, 0.6), r('rect', 0.3, 0.4, 0.35, 0.6), r('rect', 0.65, 0.4, 0.35, 0.6),
    ],
  },
];

// ── Scrapbook Templates ─────────────────────────────────────

const scrapbookTemplates: CollageTemplate[] = [
  {
    id: 'scrap-1', name: 'Scrapbook', category: 'scrapbook', slotCount: 4, aspectRatio: '1:1',
    slots: [
      r('rounded', 0.03, 0.03, 0.4, 0.4, { rotation: -5, radius: 0.05 }),
      r('circle', 0.5, 0.05, 0.35, 0.35),
      r('rect', 0.05, 0.5, 0.4, 0.4, { rotation: 3 }),
      r('rounded', 0.55, 0.5, 0.4, 0.4, { rotation: -2, radius: 0.05 }),
    ],
  },
  {
    id: 'scrap-2', name: 'Scatter', category: 'scrapbook', slotCount: 5, aspectRatio: '1:1',
    slots: [
      r('rounded', 0.02, 0.02, 0.3, 0.3, { rotation: -10, radius: 0.08 }),
      r('circle', 0.4, 0.05, 0.25, 0.25),
      r('rect', 0.7, 0.02, 0.28, 0.3, { rotation: 8 }),
      r('rounded', 0.1, 0.4, 0.35, 0.35, { rotation: 5, radius: 0.05 }),
      r('circle', 0.55, 0.45, 0.35, 0.45),
    ],
  },
  {
    id: 'scrap-film', name: 'Film Strip', category: 'scrapbook', slotCount: 3, aspectRatio: '1:1',
    slots: [r('rect', 0, 0.1, 0.333, 0.8), r('rect', 0.333, 0.1, 0.334, 0.8), r('rect', 0.667, 0.1, 0.333, 0.8)],
  },
  {
    id: 'scrap-booth', name: 'Photo Booth', category: 'scrapbook', slotCount: 4, aspectRatio: '1:1',
    slots: [
      r('rect', 0.15, 0.02, 0.7, 0.22), r('rect', 0.15, 0.26, 0.7, 0.22),
      r('rect', 0.15, 0.5, 0.7, 0.22), r('rect', 0.15, 0.74, 0.7, 0.22),
    ],
  },
];

// ── Mosaic / Creative Templates ──────────────────────────────

const mosaicTemplates: CollageTemplate[] = [
  {
    id: 'mosaic-1', name: 'Photo Mosaic', category: 'mosaic', slotCount: 6, aspectRatio: '1:1',
    slots: [
      r('rect', 0, 0, 0.333, 0.333), r('rect', 0.333, 0, 0.334, 0.333), r('rect', 0.667, 0, 0.333, 0.333),
      r('rect', 0, 0.333, 0.333, 0.334), r('rect', 0.333, 0.333, 0.334, 0.334), r('rect', 0.667, 0.333, 0.333, 0.334),
    ],
  },
  {
    id: 'mosaic-circle', name: 'Circle Mosaic', category: 'mosaic', slotCount: 4, aspectRatio: '1:1',
    slots: [
      r('circle', 0.05, 0.05, 0.4, 0.4), r('circle', 0.55, 0.05, 0.4, 0.4),
      r('circle', 0.05, 0.55, 0.4, 0.4), r('circle', 0.55, 0.55, 0.4, 0.4),
    ],
  },
  {
    id: 'mosaic-hex', name: 'Hex Mosaic', category: 'mosaic', slotCount: 7, aspectRatio: '1:1',
    slots: [
      r('hexagon', 0.05, 0.02, 0.28, 0.28), r('hexagon', 0.36, 0.02, 0.28, 0.28), r('hexagon', 0.67, 0.02, 0.28, 0.28),
      r('hexagon', 0.2, 0.3, 0.28, 0.28), r('hexagon', 0.5, 0.3, 0.28, 0.28),
      r('hexagon', 0.05, 0.58, 0.28, 0.28), r('hexagon', 0.36, 0.58, 0.28, 0.28),
    ],
  },
  {
    id: 'mosaic-star', name: 'Star Mosaic', category: 'mosaic', slotCount: 5, aspectRatio: '1:1',
    slots: [
      r('star', 0.35, 0.05, 0.3, 0.3),
      r('star', 0.05, 0.35, 0.25, 0.25), r('star', 0.37, 0.37, 0.26, 0.26), r('star', 0.7, 0.35, 0.25, 0.25),
      r('star', 0.35, 0.68, 0.3, 0.3),
    ],
  },
];

// ── Creative Templates ───────────────────────────────────────

const creativeTemplates: CollageTemplate[] = [
  {
    id: 'creative-story', name: 'Story', category: 'creative', slotCount: 3, aspectRatio: '9:16',
    slots: [r('rect', 0, 0, 1, 0.5), r('rect', 0, 0.5, 0.5, 0.25), r('rect', 0.5, 0.5, 0.5, 0.25), r('rect', 0, 0.75, 1, 0.25)].slice(0, 3) as CollageTemplate['slots'],
  },
  {
    id: 'creative-ig', name: 'Instagram', category: 'creative', slotCount: 4, aspectRatio: '1:1',
    slots: [
      r('rect', 0, 0, 1, 0.34),
      r('rect', 0, 0.34, 0.333, 0.33), r('rect', 0.333, 0.34, 0.334, 0.33), r('rect', 0.667, 0.34, 0.333, 0.33),
    ],
  },
  {
    id: 'creative-poster', name: 'Poster', category: 'creative', slotCount: 3, aspectRatio: '9:16',
    slots: [r('rect', 0, 0, 1, 0.6), r('rect', 0, 0.6, 0.5, 0.4), r('rect', 0.5, 0.6, 0.5, 0.4)],
  },
  {
    id: 'creative-freeform', name: 'Freeform', category: 'creative', slotCount: 4, aspectRatio: '1:1',
    slots: [
      r('circle', 0.05, 0.05, 0.4, 0.4), r('rounded', 0.5, 0.02, 0.45, 0.35, { radius: 0.1, rotation: 5 }),
      r('rect', 0.1, 0.5, 0.35, 0.4, { rotation: -3 }), r('circle', 0.55, 0.5, 0.4, 0.4),
    ],
  },
];

// ── All Templates ────────────────────────────────────────────

export const ALL_TEMPLATES: CollageTemplate[] = [
  ...gridTemplates,
  ...shapeTemplates,
  ...geometricTemplates,
  ...heartTemplates,
  ...starTemplates,
  ...polaroidTemplates,
  ...magazineTemplates,
  ...scrapbookTemplates,
  ...mosaicTemplates,
  ...creativeTemplates,
];

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'grid', 'shapes', 'geometric', 'creative', 'heart', 'star', 'polaroid', 'magazine', 'scrapbook', 'mosaic',
];

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  grid: 'Grid',
  shapes: 'Shapes',
  geometric: 'Geometric',
  creative: 'Creative',
  heart: 'Heart',
  star: 'Star',
  polaroid: 'Polaroid',
  magazine: 'Magazine',
  scrapbook: 'Scrapbook',
  mosaic: 'Mosaic',
};

export function getTemplatesByCategory(category: TemplateCategory): CollageTemplate[] {
  return ALL_TEMPLATES.filter((t) => t.category === category);
}

export function getTemplateById(id: string): CollageTemplate | undefined {
  return ALL_TEMPLATES.find((t) => t.id === id);
}

export const ASPECT_RATIOS: { id: AspectRatio; label: string; w: number; h: number }[] = [
  { id: '1:1', label: '1:1', w: 1, h: 1 },
  { id: '4:5', label: '4:5', w: 4, h: 5 },
  { id: '3:4', label: '3:4', w: 3, h: 4 },
  { id: '4:3', label: '4:3', w: 4, h: 3 },
  { id: '9:16', label: '9:16', w: 9, h: 16 },
  { id: '16:9', label: '16:9', w: 16, h: 9 },
];

export function aspectRatioValue(ratio: AspectRatio): number {
  const found = ASPECT_RATIOS.find((a) => a.id === ratio);
  return found ? found.w / found.h : 1;
}
