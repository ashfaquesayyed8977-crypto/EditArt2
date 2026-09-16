import Upscaler from 'upscaler';
import x2 from '@upscalerjs/esrgan-medium/2x';

const upscaler = new Upscaler({
  model: x2,
});

export async function upscaleImage(
  image: HTMLImageElement | HTMLCanvasElement
): Promise<HTMLCanvasElement> {
  const result = await upscaler.upscale(image);

  return result as HTMLCanvasElement;
}
