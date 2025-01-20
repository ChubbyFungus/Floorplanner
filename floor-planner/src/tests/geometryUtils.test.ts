import { describe, it, expect } from 'vitest';
import {
  getDistance,
  snapToGrid,
  arePointsEqual,
  PIXELS_PER_FOOT
} from '../utils/geometryUtils';

describe('geometryUtils', () => {
  describe('getDistance', () => {
    it('calculates correct distance between two points', () => {
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 3, y: 4 };
      const dist = getDistance(p1, p2);
      expect(dist).toBe(5);
    });
  });

  describe('snapToGrid', () => {
    it('snaps a point to the nearest grid cell', () => {
      const point = { x: 23, y: 47 };
      const snapped = snapToGrid(point, 10);
      expect(snapped).toEqual({ x: 20, y: 50 });
    });
  });

  describe('arePointsEqual', () => {
    it('returns true for points within the default epsilon', () => {
      const p1 = { x: 10.0001, y: 19.9999 };
      const p2 = { x: 10, y: 20 };
      expect(arePointsEqual(p1, p2)).toBe(true);
    });

    it('returns false for points that are clearly different', () => {
      expect(arePointsEqual({ x: 0, y: 0 }, { x: 1, y: 0 })).toBe(false);
    });
  });

  describe('PIXELS_PER_FOOT constant', () => {
    it('is a positive number, used for scale conversion', () => {
      expect(PIXELS_PER_FOOT).toBeGreaterThan(0);
    });
  });
});