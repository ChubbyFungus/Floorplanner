import { calculatePolygonArea, type Point2D } from '@floor-planner/utils/geometryUtils';

describe('calculatePolygonArea', () => {
  it('calculates area of a square', () => {
    const square: Point2D[] = [
      {x: 0, y: 0},
      {x: 10, y: 0},
      {x: 10, y: 10},
      {x: 0, y: 10}
    ];
    expect(calculatePolygonArea(square)).toBe(100);
  });

  it('calculates area of a rectangle', () => {
    const rect: Point2D[] = [
      {x: 0, y: 0},
      {x: 20, y: 0},
      {x: 20, y: 5},
      {x: 0, y: 5}
    ];
    expect(calculatePolygonArea(rect)).toBe(100);
  });

  it('calculates area of a concave polygon', () => {
    const concave: Point2D[] = [
      {x: 0, y: 0},
      {x: 10, y: 0},
      {x: 10, y: 5},
      {x: 5, y: 5},
      {x: 5, y: 10},
      {x: 0, y: 10}
    ];
    expect(calculatePolygonArea(concave)).toBe(75);
  });

  it('handles triangles', () => {
    const triangle: Point2D[] = [
      {x: 0, y: 0},
      {x: 10, y: 0},
      {x: 5, y: 8.66}
    ];
    expect(calculatePolygonArea(triangle)).toBeCloseTo(43.3, 1);
  });

  it('returns zero for invalid polygons', () => {
    const line: Point2D[] = [
      {x: 0, y: 0},
      {x: 10, y: 0}
    ];
    expect(calculatePolygonArea(line)).toBe(0);
    
    const singlePoint: Point2D[] = [{x: 5, y: 5}];
    expect(calculatePolygonArea(singlePoint)).toBe(0);
  });
});
