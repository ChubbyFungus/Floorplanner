import { calculateWallIntersection, getWallLength, calculateWallAngle } from '../utils/geometryUtils';

describe('geometryUtils', () => {
  describe('calculateWallIntersection', () => {
    test('should find intersection of perpendicular walls', () => {
      const wall1 = { start: { x: 0, y: 0 }, end: { x: 10, y: 0 } };
      const wall2 = { start: { x: 5, y: -5 }, end: { x: 5, y: 5 } };
      expect(calculateWallIntersection(wall1, wall2)).toEqual({ x: 5, y: 0 });
    });

    test('should return null for parallel walls', () => {
      const wall1 = { start: { x: 0, y: 0 }, end: { x: 10, y: 0 } };
      const wall2 = { start: { x: 0, y: 2 }, end: { x: 10, y: 2 } };
      expect(calculateWallIntersection(wall1, wall2)).toBeNull();
    });

    test('should handle floating point precision', () => {
      const wall1 = { start: { x: 0.1, y: 0.2 }, end: { x: 10.3, y: 0.4 } };
      const wall2 = { start: { x: 5.5, y: -0.1 }, end: { x: 5.5, y: 0.5 } };
      const result = calculateWallIntersection(wall1, wall2);
      expect(result?.x).toBeCloseTo(5.5, 6);
      expect(result?.y).toBeCloseTo(0.3, 6);
    });
  });

  describe('getWallLength', () => {
    test('should calculate horizontal length', () => {
      const wall = { start: { x: 0, y: 0 }, end: { x: 10, y: 0 } };
      expect(getWallLength(wall)).toBeCloseTo(10, 6);
    });

    test('should calculate diagonal length', () => {
      const wall = { start: { x: 0, y: 0 }, end: { x: 3, y: 4 } };
      expect(getWallLength(wall)).toBeCloseTo(5, 6);
    });
  });

  describe('calculateWallAngle', () => {
    test('should calculate right angle', () => {
      const wall1 = { start: { x: 0, y: 0 }, end: { x: 10, y: 0 } };
      const wall2 = { start: { x: 10, y: 0 }, end: { x: 10, y: 10 } };
      expect(calculateWallAngle(wall1, wall2)).toBeCloseTo(90, 6);
    });

    test('should handle acute angles', () => {
      const wall1 = { start: { x: 0, y: 0 }, end: { x: 10, y: 0 } };
      const wall2 = { start: { x: 10, y: 0 }, end: { x: 15, y: 5 } };
      expect(calculateWallAngle(wall1, wall2)).toBeCloseTo(45, 6);
    });
  });
});
