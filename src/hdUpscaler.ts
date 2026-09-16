
import Upscaler from 'upscaler';
import esrgan2x from '@upscalerjs/esrgan-medium/2x';

const upscaler = new Upscaler({
  model: esrgan2x,
});

export async function upscaleImage(
  image: HTMLImageElement | HTMLCanvasElement
): Promise<HTMLCanvasElement> {
  const result = await upscaler.upscale(image);

  return result as HTMLCanvasElement;
}
