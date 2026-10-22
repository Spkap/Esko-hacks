import type { z } from 'zod';
import type { regionSchema } from './types';
export type Region = z.infer<typeof regionSchema>;
/** Rotate normalized top-left coordinates clockwise with the rendered page. */
export function rotateRegion(r: Region, rotation: number): Region {
  switch (((rotation % 360) + 360) % 360) {
    case 90:
      return { x: 1 - r.y - r.height, y: r.x, width: r.height, height: r.width };
    case 180:
      return { x: 1 - r.x - r.width, y: 1 - r.y - r.height, width: r.width, height: r.height };
    case 270:
      return { x: r.y, y: 1 - r.x - r.width, width: r.height, height: r.width };
    default:
      return r;
  }
}
