import Upscaler from 'upscaler';
import esrgan2x from '@upscalerjs/esrgan-medium/2x';

const upscaler = new Upscaler({
  model: esrgan2x,
});

function base64ToCanvas(dataUrl: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not create canvas context.'));
        return;
      }

      ctx.drawImage(img, 0, 0);

      resolve(canvas);
    };

    img.onerror = () => {
      reject(new Error('Could not decode the upscaled image.'));
    };

    img.src = dataUrl;
  });
}

export async function upscaleImage(
  image: HTMLImageElement | HTMLCanvasElement,
  signal?: AbortSignal
): Promise<HTMLCanvasElement> {
  try {
    if (signal?.aborted) {
      throw new DOMException(
        'Enhancement was cancelled.',
        'AbortError'
      );
    }

    /*
     * Patch processing reduces memory usage and prevents
     * very large images from blocking the browser as heavily.
     */
    const result = await upscaler.upscale(image, {
      output: 'base64',

      // Good starting point for mobile browsers.
      patchSize: 64,

      // Helps prevent visible seams between patches.
      padding: 4,

      // Allows the browser UI to remain more responsive.
      awaitNextFrame: true,

      signal,

      progress: (progress: number) => {
        console.log(
          `HD Ultra progress: ${Math.round(progress * 100)}%`
        );
      },
    });

    if (signal?.aborted) {
      throw new DOMException(
        'Enhancement was cancelled.',
        'AbortError'
      );
    }

    if (typeof result !== 'string' || !result.startsWith('data:')) {
      throw new Error(
        'HD Ultra returned an invalid image result.'
      );
    }

    return await base64ToCanvas(result);
  } catch (error) {
    console.error('HD Ultra Upscaler Error:', error);
    throw error;
  }
}
