export type AssetType =
  | 'background'
  | 'pattern'
  | 'texture'
  | 'overlay'
  | 'frame'
  | 'sticker'
  | 'shape'
  | 'decorative'
  | 'color';

export interface DesignAsset {
  id: string;
  name: string;
  category: string;
  type: AssetType;
  thumbnail: string;
  source: string;
  tags: string[];
}

export interface ColorAsset {
  name: string;
  hex: string;
  shades: string[];
}

export const COLOR_ASSETS: ColorAsset[] = [
  { name: 'White', hex: '#FFFFFF', shades: ['#FFFFFF', '#F9FAFB', '#F3F4F6', '#E5E7EB', '#D1D5DB'] },
  { name: 'Black', hex: '#000000', shades: ['#000000', '#111827', '#1F2937', '#374151', '#4B5563'] },
  { name: 'Red', hex: '#EF4444', shades: ['#FEF2F2', '#FECACA', '#FCA5A5', '#F87171', '#EF4444', '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D'] },
  { name: 'Orange', hex: '#F97316', shades: ['#FFF7ED', '#FFEDD5', '#FED7AA', '#FDBA74', '#FB923C', '#F97316', '#EA580C', '#C2410C', '#9A3412'] },
  { name: 'Yellow', hex: '#EAB308', shades: ['#FEFCE8', '#FEF9C3', '#FEF08A', '#FDE047', '#FACC15', '#EAB308', '#CA8A04', '#A16207', '#854D0E'] },
  { name: 'Green', hex: '#22C55E', shades: ['#F0FDF4', '#DCFCE7', '#BBF7D0', '#86EFAC', '#4ADE80', '#22C55E', '#16A34A', '#15803D', '#166534'] },
  { name: 'Blue', hex: '#3B82F6', shades: ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF'] },
  { name: 'Purple', hex: '#A855F7', shades: ['#FAF5FF', '#F3E8FF', '#E9D5FF', '#D8B4FE', '#C084FC', '#A855F7', '#9333EA', '#7E22CE', '#6B21A8'] },
  { name: 'Pink', hex: '#EC4899', shades: ['#FDF2F8', '#FCE7F3', '#FBCFE8', '#F9A8D4', '#F472B6', '#EC4899', '#DB2777', '#BE185D', '#9D174D'] },
  { name: 'Brown', hex: '#92400E', shades: ['#FEF3C7', '#FDE68A', '#FCD34D', '#D97706', '#B45309', '#92400E', '#78350F', '#451A03'] },
  { name: 'Gray', hex: '#6B7280', shades: ['#F9FAFB', '#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF', '#6B7280', '#4B5563', '#374151', '#1F2937'] },
  { name: 'Beige', hex: '#E7D3B5', shades: ['#FAF6F0', '#F5EDE0', '#E7D3B5', '#D4BC8E', '#C4A878', '#B89968'] },
  { name: 'Cyan', hex: '#06B6D4', shades: ['#ECFEFF', '#CFFAFE', '#A5F3FC', '#67E8F9', '#22D3EE', '#06B6D4', '#0891B2', '#0E7490', '#155E75'] },
  { name: 'Teal', hex: '#14B8A6', shades: ['#F0FDFA', '#CCFBF1', '#99F6E4', '#5EEAD4', '#2DD4BF', '#14B8A6', '#0D9488', '#0F766E', '#115E59'] },
  { name: 'Navy', hex: '#1E3A8A', shades: ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6', '#2563EB', '#1E3A8A', '#172554'] },
  { name: 'Gold', hex: '#D4AF37', shades: ['#FFF9E6', '#F5E6B8', '#EAD17C', '#D4AF37', '#C19A2E', '#B8860B', '#9C7A0A'] },
  { name: 'Silver', hex: '#C0C0C0', shades: ['#F8F8F8', '#E8E8E8', '#D4D4D4', '#C0C0C0', '#A8A8A8', '#909090', '#787878'] },
];

function img(path: string): string {
  return `/assets/images/bundled/${path}`;
}

function thumb(path: string): string {
  return img(path);
}

export const DESIGN_ASSETS: DesignAsset[] = [
  // ── Backgrounds ──
  { id: 'bg-1', name: 'Studio White', category: 'Backgrounds', type: 'background', thumbnail: thumb('backgrounds/studio_white.jpg'), source: img('backgrounds/studio_white.jpg'), tags: ['background', 'studio', 'white', 'clean'] },
  { id: 'bg-2', name: 'Concrete Light', category: 'Backgrounds', type: 'background', thumbnail: thumb('backgrounds/concrete_light.jpg'), source: img('backgrounds/concrete_light.jpg'), tags: ['background', 'concrete', 'gray', 'texture'] },
  { id: 'bg-3', name: 'Concrete Beige', category: 'Backgrounds', type: 'background', thumbnail: thumb('backgrounds/concrete_beige.jpg'), source: img('backgrounds/concrete_beige.jpg'), tags: ['background', 'concrete', 'beige', 'warm'] },
  { id: 'bg-4', name: 'Concrete Pink', category: 'Backgrounds', type: 'background', thumbnail: thumb('backgrounds/concrete_pink.jpg'), source: img('backgrounds/concrete_pink.jpg'), tags: ['background', 'concrete', 'pink', 'soft'] },
  { id: 'bg-5', name: 'Brick Red', category: 'Backgrounds', type: 'background', thumbnail: thumb('backgrounds/brick_red.jpg'), source: img('backgrounds/brick_red.jpg'), tags: ['background', 'brick', 'red', 'rustic'] },
  { id: 'bg-6', name: 'Brick Rustic', category: 'Backgrounds', type: 'background', thumbnail: thumb('backgrounds/brick_rustic.jpg'), source: img('backgrounds/brick_rustic.jpg'), tags: ['background', 'brick', 'rustic', 'warm'] },
  { id: 'bg-7', name: 'Wood Plank', category: 'Backgrounds', type: 'background', thumbnail: thumb('backgrounds/wood_plank.jpg'), source: img('backgrounds/wood_plank.jpg'), tags: ['background', 'wood', 'plank', 'natural'] },
  { id: 'bg-8', name: 'Wood Weathered', category: 'Backgrounds', type: 'background', thumbnail: thumb('backgrounds/wood_weathered.jpg'), source: img('backgrounds/wood_weathered.jpg'), tags: ['background', 'wood', 'weathered', 'rustic'] },
  { id: 'bg-9', name: 'Wood Rustic', category: 'Backgrounds', type: 'background', thumbnail: thumb('backgrounds/wood_rustic.jpg'), source: img('backgrounds/wood_rustic.jpg'), tags: ['background', 'wood', 'rustic', 'brown'] },
  { id: 'bg-10', name: 'Marble White', category: 'Backgrounds', type: 'background', thumbnail: thumb('backgrounds/marble_white.jpg'), source: img('backgrounds/marble_white.jpg'), tags: ['background', 'marble', 'white', 'elegant'] },
  { id: 'bg-11', name: 'Marble Cracked', category: 'Backgrounds', type: 'background', thumbnail: thumb('backgrounds/marble_cracked.jpg'), source: img('backgrounds/marble_cracked.jpg'), tags: ['background', 'marble', 'cracked', 'texture'] },
  { id: 'bg-12', name: 'Marble Natural', category: 'Backgrounds', type: 'background', thumbnail: thumb('backgrounds/marble_natural.jpg'), source: img('backgrounds/marble_natural.jpg'), tags: ['background', 'marble', 'stone', 'luxury'] },
  { id: 'bg-13', name: 'Plaster Curve', category: 'Backgrounds', type: 'background', thumbnail: thumb('backgrounds/plaster_curve.jpg'), source: img('backgrounds/plaster_curve.jpg'), tags: ['background', 'plaster', 'curve', 'minimal'] },
  { id: 'bg-14', name: 'Linen White', category: 'Backgrounds', type: 'background', thumbnail: thumb('backgrounds/linen_white.jpg'), source: img('backgrounds/linen_white.jpg'), tags: ['background', 'linen', 'white', 'fabric'] },
  { id: 'bg-15', name: 'Linen Black', category: 'Backgrounds', type: 'background', thumbnail: thumb('backgrounds/linen_black.jpg'), source: img('backgrounds/linen_black.jpg'), tags: ['background', 'linen', 'black', 'fabric'] },
  { id: 'bg-16', name: 'Paper Craft', category: 'Backgrounds', type: 'background', thumbnail: thumb('backgrounds/paper_craft.jpg'), source: img('backgrounds/paper_craft.jpg'), tags: ['background', 'paper', 'craft', 'brown'] },
  { id: 'bg-17', name: 'Paper Recycled', category: 'Backgrounds', type: 'background', thumbnail: thumb('backgrounds/paper_recycled.jpg'), source: img('backgrounds/paper_recycled.jpg'), tags: ['background', 'paper', 'recycled', 'natural'] },
  { id: 'bg-18', name: 'Paper Vintage', category: 'Backgrounds', type: 'background', thumbnail: thumb('backgrounds/paper_vintage.jpg'), source: img('backgrounds/paper_vintage.jpg'), tags: ['background', 'paper', 'vintage', 'warm'] },
  { id: 'bg-19', name: 'Fabric Pink', category: 'Backgrounds', type: 'background', thumbnail: thumb('backgrounds/fabric_pink.jpg'), source: img('backgrounds/fabric_pink.jpg'), tags: ['background', 'fabric', 'pink', 'soft'] },
  { id: 'bg-20', name: 'Studio Setup', category: 'Backgrounds', type: 'background', thumbnail: thumb('backgrounds/studio_setup.jpg'), source: img('backgrounds/studio_setup.jpg'), tags: ['background', 'studio', 'professional', 'setup'] },

  // ── Nature ──
  { id: 'na-1', name: 'Forest Path', category: 'Nature', type: 'background', thumbnail: thumb('nature/forest_path.png'), source: img('nature/forest_path.png'), tags: ['nature', 'forest', 'path', 'green'] },
  { id: 'na-2', name: 'Forest Trees', category: 'Nature', type: 'background', thumbnail: thumb('nature/forest_trees.png'), source: img('nature/forest_trees.png'), tags: ['nature', 'forest', 'trees', 'green'] },
  { id: 'na-3', name: 'Forest Pine', category: 'Nature', type: 'background', thumbnail: thumb('nature/forest_pine.jpg'), source: img('nature/forest_pine.jpg'), tags: ['nature', 'forest', 'pine', 'trees'] },
  { id: 'na-4', name: 'Forest Dense', category: 'Nature', type: 'background', thumbnail: thumb('nature/forest_dense.jpg'), source: img('nature/forest_dense.jpg'), tags: ['nature', 'forest', 'dense', 'lush'] },
  { id: 'na-5', name: 'Forest Mossy', category: 'Nature', type: 'background', thumbnail: thumb('nature/forest_mossy.jpg'), source: img('nature/forest_mossy.jpg'), tags: ['nature', 'forest', 'mossy', 'rocks'] },
  { id: 'na-6', name: 'Beach Sunset', category: 'Nature', type: 'background', thumbnail: thumb('nature/beach_sunset.jpg'), source: img('nature/beach_sunset.jpg'), tags: ['nature', 'beach', 'sunset', 'golden'] },
  { id: 'na-7', name: 'Beach Tropical', category: 'Nature', type: 'background', thumbnail: thumb('nature/beach_tropical.jpg'), source: img('nature/beach_tropical.jpg'), tags: ['nature', 'beach', 'tropical', 'palm'] },
  { id: 'na-8', name: 'Beach Palm', category: 'Nature', type: 'background', thumbnail: thumb('nature/beach_palm.jpg'), source: img('nature/beach_palm.jpg'), tags: ['nature', 'beach', 'palm', 'sunset'] },
  { id: 'na-9', name: 'Beach Driftwood', category: 'Nature', type: 'background', thumbnail: thumb('nature/beach_driftwood.jpg'), source: img('nature/beach_driftwood.jpg'), tags: ['nature', 'beach', 'driftwood', 'serene'] },
  { id: 'na-10', name: 'Beach Golden', category: 'Nature', type: 'background', thumbnail: thumb('nature/beach_golden.jpg'), source: img('nature/beach_golden.jpg'), tags: ['nature', 'beach', 'golden', 'ocean'] },
  { id: 'na-11', name: 'Mountain Snow', category: 'Nature', type: 'background', thumbnail: thumb('nature/mountain_snow.jpg'), source: img('nature/mountain_snow.jpg'), tags: ['nature', 'mountain', 'snow', 'peaks'] },
  { id: 'na-12', name: 'Mountain Rocky', category: 'Nature', type: 'background', thumbnail: thumb('nature/mountain_rocky.jpg'), source: img('nature/mountain_rocky.jpg'), tags: ['nature', 'mountain', 'rocky', 'dramatic'] },
  { id: 'na-13', name: 'Mountain Misty', category: 'Nature', type: 'background', thumbnail: thumb('nature/mountain_misty.jpg'), source: img('nature/mountain_misty.jpg'), tags: ['nature', 'mountain', 'misty', 'road'] },
  { id: 'na-14', name: 'Mountain Peaks', category: 'Nature', type: 'background', thumbnail: thumb('nature/mountain_peaks.jpg'), source: img('nature/mountain_peaks.jpg'), tags: ['nature', 'mountain', 'peaks', 'high'] },
  { id: 'na-15', name: 'Mountain Green', category: 'Nature', type: 'background', thumbnail: thumb('nature/mountain_green.jpg'), source: img('nature/mountain_green.jpg'), tags: ['nature', 'mountain', 'green', 'valley'] },
  { id: 'na-16', name: 'Sky Sunset', category: 'Nature', type: 'background', thumbnail: thumb('nature/sky_sunset.jpg'), source: img('nature/sky_sunset.jpg'), tags: ['nature', 'sky', 'sunset', 'dramatic'] },
  { id: 'na-17', name: 'Sky Orange', category: 'Nature', type: 'background', thumbnail: thumb('nature/sky_orange.jpg'), source: img('nature/sky_orange.jpg'), tags: ['nature', 'sky', 'orange', 'clouds'] },
  { id: 'na-18', name: 'Sky Twilight', category: 'Nature', type: 'background', thumbnail: thumb('nature/sky_twilight.jpg'), source: img('nature/sky_twilight.jpg'), tags: ['nature', 'sky', 'twilight', 'colorful'] },
  { id: 'na-19', name: 'Sky Purple', category: 'Nature', type: 'background', thumbnail: thumb('nature/sky_purple.jpg'), source: img('nature/sky_purple.jpg'), tags: ['nature', 'sky', 'purple', 'sunset'] },
  { id: 'na-20', name: 'Sky Clouds', category: 'Nature', type: 'background', thumbnail: thumb('nature/sky_clouds.jpg'), source: img('nature/sky_clouds.jpg'), tags: ['nature', 'sky', 'clouds', 'orange'] },
  { id: 'na-21', name: 'Water Abstract', category: 'Nature', type: 'background', thumbnail: thumb('nature/water_abstract.jpg'), source: img('nature/water_abstract.jpg'), tags: ['nature', 'water', 'abstract', 'blue'] },
  { id: 'na-22', name: 'Water Ripples', category: 'Nature', type: 'background', thumbnail: thumb('nature/water_ripples.jpg'), source: img('nature/water_ripples.jpg'), tags: ['nature', 'water', 'ripples', 'calm'] },
  { id: 'na-23', name: 'Ocean Waves', category: 'Nature', type: 'background', thumbnail: thumb('nature/ocean_waves.jpg'), source: img('nature/ocean_waves.jpg'), tags: ['nature', 'ocean', 'waves', 'serene'] },

  // ── Abstract ──
  { id: 'ab-1', name: 'Paint Vivid', category: 'Abstract', type: 'background', thumbnail: thumb('abstract/paint_vivid.jpg'), source: img('abstract/paint_vivid.jpg'), tags: ['abstract', 'paint', 'vivid', 'art'] },
  { id: 'ab-2', name: 'Paint Expressionist', category: 'Abstract', type: 'background', thumbnail: thumb('abstract/paint_expressionist.jpg'), source: img('abstract/paint_expressionist.jpg'), tags: ['abstract', 'paint', 'expressionist', 'bold'] },
  { id: 'ab-3', name: 'Paint Acrylic', category: 'Abstract', type: 'background', thumbnail: thumb('abstract/paint_acrylic.jpg'), source: img('abstract/paint_acrylic.jpg'), tags: ['abstract', 'paint', 'acrylic', 'colorful'] },
  { id: 'ab-4', name: 'Paint Colorful', category: 'Abstract', type: 'background', thumbnail: thumb('abstract/paint_colorful.jpg'), source: img('abstract/paint_colorful.jpg'), tags: ['abstract', 'paint', 'colorful', 'strokes'] },
  { id: 'ab-5', name: 'Paint Energetic', category: 'Abstract', type: 'background', thumbnail: thumb('abstract/paint_energetic.jpg'), source: img('abstract/paint_energetic.jpg'), tags: ['abstract', 'paint', 'energetic', 'vibrant'] },
  { id: 'ab-6', name: 'Gradient Multi', category: 'Abstract', type: 'background', thumbnail: thumb('abstract/gradient_multi.jpg'), source: img('abstract/gradient_multi.jpg'), tags: ['abstract', 'gradient', 'multicolor', 'smooth'] },
  { id: 'ab-7', name: 'Gradient Pastel', category: 'Abstract', type: 'background', thumbnail: thumb('abstract/gradient_pastel.jpg'), source: img('abstract/gradient_pastel.jpg'), tags: ['abstract', 'gradient', 'pastel', 'soft'] },
  { id: 'ab-8', name: 'Gradient Vibrant', category: 'Abstract', type: 'background', thumbnail: thumb('abstract/gradient_vibrant.jpg'), source: img('abstract/gradient_vibrant.jpg'), tags: ['abstract', 'gradient', 'vibrant', 'bold'] },
  { id: 'ab-9', name: 'Gradient Blend', category: 'Abstract', type: 'background', thumbnail: thumb('abstract/gradient_blend.jpg'), source: img('abstract/gradient_blend.jpg'), tags: ['abstract', 'gradient', 'blend', 'pastel'] },
  { id: 'ab-10', name: 'Gradient Colorful', category: 'Abstract', type: 'background', thumbnail: thumb('abstract/gradient_colorful.jpg'), source: img('abstract/gradient_colorful.jpg'), tags: ['abstract', 'gradient', 'colorful', 'modern'] },
  { id: 'ab-11', name: 'Geo Blue Green', category: 'Abstract', type: 'background', thumbnail: thumb('abstract/geo_blue_green.jpg'), source: img('abstract/geo_blue_green.jpg'), tags: ['abstract', 'geometric', 'blue', 'green'] },
  { id: 'ab-12', name: 'Geo Straws', category: 'Abstract', type: 'background', thumbnail: thumb('abstract/geo_straws.jpg'), source: img('abstract/geo_straws.jpg'), tags: ['abstract', 'geometric', 'straws', 'colorful'] },
  { id: 'ab-13', name: 'Geo Shapes', category: 'Abstract', type: 'background', thumbnail: thumb('abstract/geo_shapes.png'), source: img('abstract/geo_shapes.png'), tags: ['abstract', 'geometric', 'shapes', 'teal'] },
  { id: 'ab-14', name: 'Gold Waves', category: 'Abstract', type: 'background', thumbnail: thumb('abstract/gold_waves.jpg'), source: img('abstract/gold_waves.jpg'), tags: ['abstract', 'gold', 'waves', 'luxury'] },
  { id: 'ab-15', name: 'Gold Foil', category: 'Abstract', type: 'background', thumbnail: thumb('abstract/gold_foil.jpg'), source: img('abstract/gold_foil.jpg'), tags: ['abstract', 'gold', 'foil', 'shiny'] },
  { id: 'ab-16', name: 'Gold Crinkled', category: 'Abstract', type: 'background', thumbnail: thumb('abstract/gold_crinkled.jpg'), source: img('abstract/gold_crinkled.jpg'), tags: ['abstract', 'gold', 'crinkled', 'metallic'] },

  // ── Textures / Patterns ──
  { id: 'te-1', name: 'Fabric Green', category: 'Textures', type: 'texture', thumbnail: thumb('patterns/fabric_green.jpg'), source: img('patterns/fabric_green.jpg'), tags: ['texture', 'fabric', 'green', 'weave'] },
  { id: 'te-2', name: 'Fabric Dark Weave', category: 'Textures', type: 'texture', thumbnail: thumb('patterns/fabric_dark_weave.jpg'), source: img('patterns/fabric_dark_weave.jpg'), tags: ['texture', 'fabric', 'dark', 'weave'] },
  { id: 'te-3', name: 'Fabric Yellow', category: 'Textures', type: 'texture', thumbnail: thumb('patterns/fabric_yellow.jpg'), source: img('patterns/fabric_yellow.jpg'), tags: ['texture', 'fabric', 'yellow', 'soft'] },
  { id: 'te-4', name: 'Fabric Stack', category: 'Textures', type: 'texture', thumbnail: thumb('patterns/fabric_stack.jpg'), source: img('patterns/fabric_stack.jpg'), tags: ['texture', 'fabric', 'stack', 'colorful'] },
  { id: 'te-5', name: 'Fabric Colorful', category: 'Textures', type: 'texture', thumbnail: thumb('patterns/fabric_colorful.jpg'), source: img('patterns/fabric_colorful.jpg'), tags: ['texture', 'fabric', 'colorful', 'pattern'] },
  { id: 'te-6', name: 'Leather Brown', category: 'Textures', type: 'texture', thumbnail: thumb('patterns/leather_brown.jpg'), source: img('patterns/leather_brown.jpg'), tags: ['texture', 'leather', 'brown', 'luxury'] },
  { id: 'te-7', name: 'Leather Rolls', category: 'Textures', type: 'texture', thumbnail: thumb('patterns/leather_rolls.png'), source: img('patterns/leather_rolls.png'), tags: ['texture', 'leather', 'rolls', 'rich'] },
  { id: 'te-8', name: 'Leather Collection', category: 'Textures', type: 'texture', thumbnail: thumb('patterns/leather_collection.jpg'), source: img('patterns/leather_collection.jpg'), tags: ['texture', 'leather', 'collection', 'patterns'] },
  { id: 'te-9', name: 'Denim Stack', category: 'Textures', type: 'texture', thumbnail: thumb('patterns/denim_stack.jpg'), source: img('patterns/denim_stack.jpg'), tags: ['texture', 'denim', 'blue', 'jeans'] },
  { id: 'te-10', name: 'Denim Texture', category: 'Textures', type: 'texture', thumbnail: thumb('patterns/denim_texture.jpg'), source: img('patterns/denim_texture.jpg'), tags: ['texture', 'denim', 'fabric', 'blue'] },
  { id: 'te-11', name: 'Denim Macro', category: 'Textures', type: 'texture', thumbnail: thumb('patterns/denim_macro.jpg'), source: img('patterns/denim_macro.jpg'), tags: ['texture', 'denim', 'macro', 'stitching'] },

  // ── Aesthetic / Light Effects ──
  { id: 'le-1', name: 'Bokeh City', category: 'Light Effects', type: 'overlay', thumbnail: thumb('aesthetic/bokeh_city.jpg'), source: img('aesthetic/bokeh_city.jpg'), tags: ['light', 'bokeh', 'city', 'night'] },
  { id: 'le-2', name: 'Bokeh Urban', category: 'Light Effects', type: 'overlay', thumbnail: thumb('aesthetic/bokeh_urban.jpg'), source: img('aesthetic/bokeh_urban.jpg'), tags: ['light', 'bokeh', 'urban', 'blur'] },
  { id: 'le-3', name: 'Bokeh Neon', category: 'Light Effects', type: 'overlay', thumbnail: thumb('aesthetic/bokeh_neon.jpg'), source: img('aesthetic/bokeh_neon.jpg'), tags: ['light', 'bokeh', 'neon', 'rain'] },
  { id: 'le-4', name: 'Bokeh Lights', category: 'Light Effects', type: 'overlay', thumbnail: thumb('aesthetic/bokeh_lights.jpg'), source: img('aesthetic/bokeh_lights.jpg'), tags: ['light', 'bokeh', 'lights', 'glow'] },
  { id: 'le-5', name: 'Bokeh Abstract', category: 'Light Effects', type: 'overlay', thumbnail: thumb('aesthetic/bokeh_abstract.jpg'), source: img('aesthetic/bokeh_abstract.jpg'), tags: ['light', 'bokeh', 'abstract', 'night'] },
  { id: 'le-6', name: 'Galaxy Milky Way', category: 'Light Effects', type: 'overlay', thumbnail: thumb('aesthetic/galaxy_milkyway.jpg'), source: img('aesthetic/galaxy_milkyway.jpg'), tags: ['light', 'galaxy', 'stars', 'space'] },
  { id: 'le-7', name: 'Galaxy Stars', category: 'Light Effects', type: 'overlay', thumbnail: thumb('aesthetic/galaxy_stars.jpg'), source: img('aesthetic/galaxy_stars.jpg'), tags: ['light', 'galaxy', 'stars', 'night'] },
  { id: 'le-8', name: 'Galaxy Cosmic', category: 'Light Effects', type: 'overlay', thumbnail: thumb('aesthetic/galaxy_cosmic.jpg'), source: img('aesthetic/galaxy_cosmic.jpg'), tags: ['light', 'galaxy', 'cosmic', 'space'] },

  // ── Celebration ──
  { id: 'ce-1', name: 'Confetti Falling', category: 'Celebration', type: 'overlay', thumbnail: thumb('aesthetic/confetti_falling.jpg'), source: img('aesthetic/confetti_falling.jpg'), tags: ['celebration', 'confetti', 'colorful', 'party'] },
  { id: 'ce-2', name: 'Confetti Glass', category: 'Celebration', type: 'overlay', thumbnail: thumb('aesthetic/confetti_glass.jpg'), source: img('aesthetic/confetti_glass.jpg'), tags: ['celebration', 'confetti', 'glass', 'festive'] },
  { id: 'ce-3', name: 'Confetti Scatter', category: 'Celebration', type: 'overlay', thumbnail: thumb('aesthetic/confetti_scatter.jpg'), source: img('aesthetic/confetti_scatter.jpg'), tags: ['celebration', 'confetti', 'scatter', 'white'] },
  { id: 'ce-4', name: 'Fireworks Burst', category: 'Celebration', type: 'overlay', thumbnail: thumb('aesthetic/fireworks_burst.jpg'), source: img('aesthetic/fireworks_burst.jpg'), tags: ['celebration', 'fireworks', 'burst', 'night'] },
  { id: 'ce-5', name: 'Fireworks Night', category: 'Celebration', type: 'overlay', thumbnail: thumb('aesthetic/fireworks_night.jpg'), source: img('aesthetic/fireworks_night.jpg'), tags: ['celebration', 'fireworks', 'night', 'festive'] },
  { id: 'ce-6', name: 'Fireworks Colorful', category: 'Celebration', type: 'overlay', thumbnail: thumb('aesthetic/fireworks_colorful.jpg'), source: img('aesthetic/fireworks_colorful.jpg'), tags: ['celebration', 'fireworks', 'colorful', 'sky'] },

  // ── Moody / Dark ──
  { id: 'mo-1', name: 'Moody Leaves', category: 'Moody', type: 'background', thumbnail: thumb('aesthetic/moody_leaves.jpg'), source: img('aesthetic/moody_leaves.jpg'), tags: ['moody', 'dark', 'leaves', 'nature'] },
  { id: 'mo-2', name: 'Moody Droplets', category: 'Moody', type: 'background', thumbnail: thumb('aesthetic/moody_droplets.jpg'), source: img('aesthetic/moody_droplets.jpg'), tags: ['moody', 'dark', 'droplets', 'abstract'] },
  { id: 'mo-3', name: 'Moody Roses', category: 'Moody', type: 'background', thumbnail: thumb('aesthetic/moody_roses.jpg'), source: img('aesthetic/moody_roses.jpg'), tags: ['moody', 'dark', 'roses', 'floral'] },
  { id: 'mo-4', name: 'Moody Foliage', category: 'Moody', type: 'background', thumbnail: thumb('aesthetic/moody_foliage.jpg'), source: img('aesthetic/moody_foliage.jpg'), tags: ['moody', 'dark', 'foliage', 'green'] },
  { id: 'mo-5', name: 'Moody City', category: 'Moody', type: 'background', thumbnail: thumb('aesthetic/moody_city.jpg'), source: img('aesthetic/moody_city.jpg'), tags: ['moody', 'dark', 'city', 'dusk'] },
  { id: 'mo-6', name: 'Petals Arrange', category: 'Moody', type: 'background', thumbnail: thumb('aesthetic/petals_arrange.jpg'), source: img('aesthetic/petals_arrange.jpg'), tags: ['moody', 'petals', 'flowers', 'artistic'] },
  { id: 'mo-7', name: 'Petals Violet', category: 'Moody', type: 'background', thumbnail: thumb('aesthetic/petals_violet.jpg'), source: img('aesthetic/petals_violet.jpg'), tags: ['moody', 'petals', 'violet', 'dramatic'] },
  { id: 'mo-8', name: 'Petals Tulip', category: 'Moody', type: 'background', thumbnail: thumb('aesthetic/petals_tulip.jpg'), source: img('aesthetic/petals_tulip.jpg'), tags: ['moody', 'petals', 'tulip', 'colorful'] },

  // ── Frames (solid colors generated via canvas) ──
  { id: 'fr-1', name: 'Classic White', category: 'Frames', type: 'frame', thumbnail: '#FFFFFF', source: '#FFFFFF', tags: ['frame', 'white', 'classic', 'border'] },
  { id: 'fr-2', name: 'Black Frame', category: 'Frames', type: 'frame', thumbnail: '#000000', source: '#000000', tags: ['frame', 'black', 'border', 'dark'] },
  { id: 'fr-3', name: 'Gold Frame', category: 'Frames', type: 'frame', thumbnail: '#D4AF37', source: '#D4AF37', tags: ['frame', 'gold', 'elegant', 'luxury'] },

  // ── Geometric (shape definitions, not images) ──
  { id: 'ge-1', name: 'Triangle', category: 'Geometric', type: 'shape', thumbnail: 'triangle', source: 'triangle', tags: ['geometric', 'triangle', 'shape'] },
  { id: 'ge-2', name: 'Hexagon', category: 'Geometric', type: 'shape', thumbnail: 'hexagon', source: 'hexagon', tags: ['geometric', 'hexagon', 'shape'] },
  { id: 'ge-3', name: 'Diamond', category: 'Geometric', type: 'shape', thumbnail: 'diamond', source: 'diamond', tags: ['geometric', 'diamond', 'shape'] },
];

export const ASSET_CATEGORIES = [
  'Backgrounds', 'Nature', 'Abstract', 'Textures',
  'Light Effects', 'Celebration', 'Moody', 'Frames', 'Geometric',
];
