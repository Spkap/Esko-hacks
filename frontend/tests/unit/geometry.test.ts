import { describe, it, expect } from 'vitest';
import { rotateRegion } from '../../src/domain/geometry';
import { regionSchema } from '../../src/domain/types';
describe('normalized artwork regions', () => {
  const r = { x: 0.1, y: 0.2, width: 0.3, height: 0.4 };
  it('transforms all quarter turns', () => {
    expect(rotateRegion(r, 0)).toEqual(r);
    const q = rotateRegion(r, 90);
    expect(q.x).toBeCloseTo(0.4);
    expect(q.y).toBeCloseTo(0.1);
    expect(q.width).toBe(0.4);
    expect(q.height).toBe(0.3);
    const h = rotateRegion(r, 180);
    expect(h.x).toBeCloseTo(0.6);
    expect(h.y).toBeCloseTo(0.4);
    const t = rotateRegion(r, 270);
    expect(t.x).toBeCloseTo(0.2);
    expect(t.y).toBeCloseTo(0.6);
    expect(rotateRegion(r, 360)).toEqual(r);
  });
  it('rejects out-of-page evidence', () => {
    expect(regionSchema.safeParse({ x: 0.9, y: 0.2, width: 0.2, height: 0.2 }).success).toBe(false);
  });
});
