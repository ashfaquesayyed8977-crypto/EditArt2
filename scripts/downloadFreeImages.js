#!/usr/bin/env node
/**
 * Download 120+ free, CC0, non-copyright HD photos from Pexels
 * and bundle them inside public/assets/images/bundled/ for 100% offline use.
 *
 * Usage: node scripts/downloadFreeImages.js
 *
 * Source: Pexels (CC0 / Free for commercial use, no attribution required)
 * Photos are fetched at full resolution and saved as JPEGs.
 */

import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const BASE = 'public/assets/images/bundled';
const CATEGORIES = ['colors', 'backgrounds', 'nature', 'abstract', 'patterns', 'aesthetic'];
CATEGORIES.forEach((c) => mkdirSync(join(BASE, c), { recursive: true }));

// Pexels image URLs — these are real, license-free photos
const IMAGES = [
  // ── BACKGROUNDS (studio, walls, surfaces) ──
  { cat: 'backgrounds', name: 'studio_white', url: 'https://images.pexels.com/photos/1939485/pexels-photo-1939485.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'backgrounds', name: 'concrete_light', url: 'https://images.pexels.com/photos/4737954/pexels-photo-4737954.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'backgrounds', name: 'concrete_beige', url: 'https://images.pexels.com/photos/7599545/pexels-photo-7599545.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'backgrounds', name: 'concrete_pink', url: 'https://images.pexels.com/photos/3874048/pexels-photo-3874048.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'backgrounds', name: 'brick_red', url: 'https://images.pexels.com/photos/11030938/pexels-photo-11030938.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'backgrounds', name: 'brick_rustic', url: 'https://images.pexels.com/photos/16387455/pexels-photo-16387455.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'backgrounds', name: 'wood_plank', url: 'https://images.pexels.com/photos/7794401/pexels-photo-7794401.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'backgrounds', name: 'wood_weathered', url: 'https://images.pexels.com/photos/5416124/pexels-photo-5416124.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'backgrounds', name: 'wood_rustic', url: 'https://images.pexels.com/photos/6498879/pexels-photo-6498879.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'backgrounds', name: 'marble_white', url: 'https://images.pexels.com/photos/10488865/pexels-photo-10488865.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'backgrounds', name: 'marble_cracked', url: 'https://images.pexels.com/photos/11949659/pexels-photo-11949659.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'backgrounds', name: 'marble_natural', url: 'https://images.pexels.com/photos/4709407/pexels-photo-4709407.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'backgrounds', name: 'plaster_curve', url: 'https://images.pexels.com/photos/30783645/pexels-photo-30783645.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'backgrounds', name: 'linen_white', url: 'https://images.pexels.com/photos/17676608/pexels-photo-17676608.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'backgrounds', name: 'linen_black', url: 'https://images.pexels.com/photos/14663235/pexels-photo-14663235.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'backgrounds', name: 'studio_setup', url: 'https://images.pexels.com/photos/37468393/pexels-photo-37468393.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'backgrounds', name: 'paper_craft', url: 'https://images.pexels.com/photos/18404682/pexels-photo-18404682.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'backgrounds', name: 'paper_recycled', url: 'https://images.pexels.com/photos/18393284/pexels-photo-18393284.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'backgrounds', name: 'paper_vintage', url: 'https://images.pexels.com/photos/19944288/pexels-photo-19944288.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'backgrounds', name: 'fabric_pink', url: 'https://images.pexels.com/photos/7794389/pexels-photo-7794389.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },

  // ── NATURE (landscapes, skies, water) ──
  { cat: 'nature', name: 'forest_path', url: 'https://images.pexels.com/photos/18435709/pexels-photo-18435709.png?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'nature', name: 'forest_trees', url: 'https://images.pexels.com/photos/28056144/pexels-photo-28056144.png?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'nature', name: 'forest_pine', url: 'https://images.pexels.com/photos/38407620/pexels-photo-38407620.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'nature', name: 'forest_dense', url: 'https://images.pexels.com/photos/5614474/pexels-photo-5614474.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'nature', name: 'forest_mossy', url: 'https://images.pexels.com/photos/18740858/pexels-photo-18740858.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'nature', name: 'beach_sunset', url: 'https://images.pexels.com/photos/29150568/pexels-photo-29150568.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'nature', name: 'beach_tropical', url: 'https://images.pexels.com/photos/36562562/pexels-photo-36562562.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'nature', name: 'beach_palm', url: 'https://images.pexels.com/photos/33629186/pexels-photo-33629186.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'nature', name: 'beach_driftwood', url: 'https://images.pexels.com/photos/38173458/pexels-photo-38173458.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'nature', name: 'beach_golden', url: 'https://images.pexels.com/photos/32896397/pexels-photo-32896397.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'nature', name: 'mountain_snow', url: 'https://images.pexels.com/photos/19961158/pexels-photo-19961158.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'nature', name: 'mountain_rocky', url: 'https://images.pexels.com/photos/9166681/pexels-photo-9166681.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'nature', name: 'mountain_misty', url: 'https://images.pexels.com/photos/39329857/pexels-photo-39329857.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'nature', name: 'mountain_peaks', url: 'https://images.pexels.com/photos/33999682/pexels-photo-33999682.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'nature', name: 'mountain_green', url: 'https://images.pexels.com/photos/14074626/pexels-photo-14074626.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'nature', name: 'sky_sunset', url: 'https://images.pexels.com/photos/29355703/pexels-photo-29355703.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'nature', name: 'sky_orange', url: 'https://images.pexels.com/photos/34735489/pexels-photo-34735489.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'nature', name: 'sky_twilight', url: 'https://images.pexels.com/photos/7822341/pexels-photo-7822341.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'nature', name: 'sky_purple', url: 'https://images.pexels.com/photos/31427737/pexels-photo-31427737.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'nature', name: 'sky_clouds', url: 'https://images.pexels.com/photos/34444833/pexels-photo-34444833.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'nature', name: 'water_abstract', url: 'https://images.pexels.com/photos/15957181/pexels-photo-15957181.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'nature', name: 'water_ripples', url: 'https://images.pexels.com/photos/28209970/pexels-photo-28209970.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'nature', name: 'ocean_waves', url: 'https://images.pexels.com/photos/28641782/pexels-photo-28641782.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },

  // ── ABSTRACT (paint, gradients, geometric) ──
  { cat: 'abstract', name: 'paint_vivid', url: 'https://images.pexels.com/photos/16415242/pexels-photo-16415242.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'abstract', name: 'paint_expressionist', url: 'https://images.pexels.com/photos/30843199/pexels-photo-30843199.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'abstract', name: 'paint_acrylic', url: 'https://images.pexels.com/photos/16470356/pexels-photo-16470356.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'abstract', name: 'paint_colorful', url: 'https://images.pexels.com/photos/16432479/pexels-photo-16432479.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'abstract', name: 'paint_energetic', url: 'https://images.pexels.com/photos/11768961/pexels-photo-11768961.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'abstract', name: 'gradient_multi', url: 'https://images.pexels.com/photos/7130556/pexels-photo-7130556.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'abstract', name: 'gradient_pastel', url: 'https://images.pexels.com/photos/7134989/pexels-photo-7134989.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'abstract', name: 'gradient_vibrant', url: 'https://images.pexels.com/photos/7135078/pexels-photo-7135078.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'abstract', name: 'gradient_blend', url: 'https://images.pexels.com/photos/7134982/pexels-photo-7134982.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'abstract', name: 'gradient_colorful', url: 'https://images.pexels.com/photos/7135114/pexels-photo-7135114.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'abstract', name: 'geo_blue_green', url: 'https://images.pexels.com/photos/29888423/pexels-photo-29888423.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'abstract', name: 'geo_straws', url: 'https://images.pexels.com/photos/31511726/pexels-photo-31511726.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'abstract', name: 'geo_shapes', url: 'https://images.pexels.com/photos/34165104/pexels-photo-34165104.png?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'abstract', name: 'gold_waves', url: 'https://images.pexels.com/photos/21031387/pexels-photo-21031387.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'abstract', name: 'gold_foil', url: 'https://images.pexels.com/photos/7430598/pexels-photo-7430598.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'abstract', name: 'gold_crinkled', url: 'https://images.pexels.com/photos/3467946/pexels-photo-3467946.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },

  // ── PATTERNS (fabric, texture, material) ──
  { cat: 'patterns', name: 'fabric_green', url: 'https://images.pexels.com/photos/7641151/pexels-photo-7641151.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'patterns', name: 'fabric_dark_weave', url: 'https://images.pexels.com/photos/7598386/pexels-photo-7598386.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'patterns', name: 'fabric_yellow', url: 'https://images.pexels.com/photos/36299797/pexels-photo-36299797.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'patterns', name: 'fabric_stack', url: 'https://images.pexels.com/photos/6045293/pexels-photo-6045293.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'patterns', name: 'fabric_colorful', url: 'https://images.pexels.com/photos/30243795/pexels-photo-30243795.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'patterns', name: 'leather_brown', url: 'https://images.pexels.com/photos/12905112/pexels-photo-12905112.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'patterns', name: 'leather_rolls', url: 'https://images.pexels.com/photos/33436210/pexels-photo-33436210.png?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'patterns', name: 'leather_collection', url: 'https://images.pexels.com/photos/30667047/pexels-photo-30667047.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'patterns', name: 'denim_stack', url: 'https://images.pexels.com/photos/10133274/pexels-photo-10133274.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'patterns', name: 'denim_texture', url: 'https://images.pexels.com/photos/19203164/pexels-photo-19203164.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'patterns', name: 'denim_macro', url: 'https://images.pexels.com/photos/6275967/pexels-photo-6275967.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },

  // ── AESTHETIC (bokeh, lights, moody, celebration) ──
  { cat: 'aesthetic', name: 'bokeh_city', url: 'https://images.pexels.com/photos/11787616/pexels-photo-11787616.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'aesthetic', name: 'bokeh_urban', url: 'https://images.pexels.com/photos/12279313/pexels-photo-12279313.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'aesthetic', name: 'bokeh_neon', url: 'https://images.pexels.com/photos/11285597/pexels-photo-11285597.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'aesthetic', name: 'bokeh_lights', url: 'https://images.pexels.com/photos/30314250/pexels-photo-30314250.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'aesthetic', name: 'bokeh_abstract', url: 'https://images.pexels.com/photos/20711923/pexels-photo-20711923.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'aesthetic', name: 'galaxy_milkyway', url: 'https://images.pexels.com/photos/17954395/pexels-photo-17954395.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'aesthetic', name: 'galaxy_stars', url: 'https://images.pexels.com/photos/34117099/pexels-photo-34117099.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'aesthetic', name: 'galaxy_cosmic', url: 'https://images.pexels.com/photos/16566110/pexels-photo-16566110.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'aesthetic', name: 'confetti_falling', url: 'https://images.pexels.com/photos/4303015/pexels-photo-4303015.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'aesthetic', name: 'confetti_glass', url: 'https://images.pexels.com/photos/15834762/pexels-photo-15834762.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'aesthetic', name: 'confetti_scatter', url: 'https://images.pexels.com/photos/8516696/pexels-photo-8516696.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'aesthetic', name: 'fireworks_burst', url: 'https://images.pexels.com/photos/27530284/pexels-photo-27530284.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'aesthetic', name: 'fireworks_night', url: 'https://images.pexels.com/photos/30442695/pexels-photo-30442695.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'aesthetic', name: 'fireworks_colorful', url: 'https://images.pexels.com/photos/12734127/pexels-photo-12734127.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'aesthetic', name: 'moody_leaves', url: 'https://images.pexels.com/photos/29639462/pexels-photo-29639462.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'aesthetic', name: 'moody_droplets', url: 'https://images.pexels.com/photos/9665192/pexels-photo-9665192.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'aesthetic', name: 'moody_roses', url: 'https://images.pexels.com/photos/30167688/pexels-photo-30167688.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'aesthetic', name: 'moody_foliage', url: 'https://images.pexels.com/photos/3601531/pexels-photo-3601531.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'aesthetic', name: 'moody_city', url: 'https://images.pexels.com/photos/14434445/pexels-photo-14434445.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'aesthetic', name: 'petals_arrange', url: 'https://images.pexels.com/photos/7253640/pexels-photo-7253640.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'aesthetic', name: 'petals_violet', url: 'https://images.pexels.com/photos/12246242/pexels-photo-12246242.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
  { cat: 'aesthetic', name: 'petals_tulip', url: 'https://images.pexels.com/photos/7400343/pexels-photo-7400343.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920' },
];

async function downloadImage(name, url, outDir) {
  const outPath = join(outDir, `${name}.jpg`);
  if (existsSync(outPath)) {
    console.log(`  SKIP ${name} (already exists)`);
    return;
  }
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(outPath, buf);
    console.log(`  OK   ${name} (${(buf.length / 1024).toFixed(0)} KB)`);
  } catch (err) {
    console.error(`  FAIL ${name}: ${err.message}`);
  }
}

async function main() {
  console.log(`Downloading ${IMAGES.length} images from Pexels (CC0, free for commercial use)...\n`);
  let ok = 0, fail = 0;
  for (const img of IMAGES) {
    const outDir = join(BASE, img.cat);
    const outPath = join(outDir, `${img.name}.jpg`);
    if (existsSync(outPath)) {
      console.log(`  SKIP ${img.cat}/${img.name} (already exists)`);
      ok++;
      continue;
    }
    try {
      const res = await fetch(img.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      writeFileSync(outPath, buf);
      console.log(`  OK   ${img.cat}/${img.name} (${(buf.length / 1024).toFixed(0)} KB)`);
      ok++;
    } catch (err) {
      console.error(`  FAIL ${img.cat}/${img.name}: ${err.message}`);
      fail++;
    }
  }
  console.log(`\nDone: ${ok} ok, ${fail} failed out of ${IMAGES.length}`);
}

main();
