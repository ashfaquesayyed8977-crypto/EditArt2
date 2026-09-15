/**
 * Flood-fill selection for the Magic tool.
 * Given a starting pixel, selects all connected pixels (4-neighbour)
 * whose colour is within `tolerance` of the start pixel.
 * Returns a boolean mask (Uint8Array, 1 = selected, 0 = not).
 */
export function floodFill(
  imageData: ImageData,
  startX: number,
  startY: number,
  tolerance: number
): Uint8Array {
  const { width, height, data } = imageData;
  const mask = new Uint8Array(width * height);
  const visited = new Uint8Array(width * height);

  const startIdx = (startY * width + startX) * 4;
  const sr = data[startIdx];
  const sg = data[startIdx + 1];
  const sb = data[startIdx + 2];
  const sa = data[startIdx + 3];

  const tolSq = tolerance * tolerance * 4; // sum of squared diffs across RGBA

  const stack: number[] = [startX, startY];

  while (stack.length > 0) {
    const y = stack.pop()!;
    const x = stack.pop()!;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    const flatIdx = y * width + x;
    if (visited[flatIdx]) continue;
    visited[flatIdx] = 1;

    const idx = flatIdx * 4;
    const dr = data[idx] - sr;
    const dg = data[idx + 1] - sg;
    const db = data[idx + 2] - sb;
    const da = data[idx + 3] - sa;
    const distSq = dr * dr + dg * dg + db * db + da * da;

    if (distSq <= tolSq) {
      mask[flatIdx] = 1;
      stack.push(x + 1, y);
      stack.push(x - 1, y);
      stack.push(x, y + 1);
      stack.push(x, y - 1);
    }
  }

  return mask;
}

/**
 * Apply a feather (simple blur) to a boolean mask to soften edges.
 * Uses a small 3x3 box blur on the mask values.
 */
export function featherMask(
  mask: Uint8Array,
  width: number,
  height: number,
  radius: number = 1
): Float32Array {
  // Convert to float 0..1
  const f32 = new Float32Array(width * height);
  for (let i = 0; i < mask.length; i++) f32[i] = mask[i];

  if (radius <= 0) return f32;

  const result = new Float32Array(width * height);
  const k = radius;
  const kSize = (2 * k + 1) * (2 * k + 1);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let dy = -k; dy <= k; dy++) {
        for (let dx = -k; dx <= k; dx++) {
          const px = Math.min(width - 1, Math.max(0, x + dx));
          const py = Math.min(height - 1, Math.max(0, y + dy));
          sum += f32[py * width + px];
        }
      }
      result[y * width + x] = sum / kSize;
    }
  }
  return result;
}
