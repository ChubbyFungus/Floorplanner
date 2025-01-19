import { Point2D, WallData, FixtureData } from "../types";
import earcut from "earcut";

/**
 * Pixel-to-foot ratio used throughout the 2D drawing system.
 */
export const PIXELS_PER_FOOT = 25;
export const PIXELS_PER_INCH = PIXELS_PER_FOOT / 12;

export const POINT_TOLERANCE = 30;
export const LINE_SNAP_TOLERANCE = 20;

interface CalcResult {
  totalArea: number;
  totalVolume: number;
}

/**
 * computeArea
 * Approximates area from a set of walls by mapping out the shape and running a polygon area formula.
 */
export function computeArea(walls: WallData[]): number {
  if (walls.length === 0) return 0;
  const points = walls.map(wall => wall.start);
  return Math.abs(polygonArea(points));
}

/**
 * calculateAreaAndVolume
 * Provides a simplified approach for total floor area (in sq ft) and volume (using an average wall height).
 */
export function calculateAreaAndVolume(
  walls: WallData[],
  fixtures: FixtureData[]
): CalcResult {
  const totalRawArea = computeArea(walls);
  const totalAreaInSqFeet = totalRawArea / (PIXELS_PER_FOOT * PIXELS_PER_FOOT);

  // Average height from all walls
  const avgHeight = walls.reduce((acc, w) => acc + w.height, 0) / (walls.length || 1);
  const totalVolume = totalAreaInSqFeet * avgHeight;

  return {
    totalArea: totalAreaInSqFeet,
    totalVolume
  };
}

/**
 * polygonArea
 * Uses the shoelace formula to compute polygon area given an array of points.
 */
function polygonArea(points: Point2D[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return area / 2;
}

/**
 * isPointInsideWalls
 * Basic polygon test for whether a given point is in the shape formed by all walls' start points.
 */
export function isPointInsideWalls(point: Point2D, walls: WallData[]): boolean {
  if (walls.length === 0) return false;
  const points = walls.map(wall => wall.start);
  return isPointInPolygon(point, points);
}

function isPointInPolygon(point: Point2D, polygon: Point2D[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y))
      && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * getDistance
 * Returns Euclidean distance between two 2D points.
 */
export function getDistance(p1: Point2D, p2: Point2D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * pixelsToFeetAndInches
 * Converts a pixel distance to a string like "5'-3\"".
 */
export function pixelsToFeetAndInches(pixels: number): string {
  const feet = pixels / PIXELS_PER_FOOT;
  const roundedFeet = Math.floor(feet);
  const inches = Math.round((feet - roundedFeet) * 12);
  if (inches === 12) {
    return `${roundedFeet + 1}'-0"`;
  }
  if (inches === 0) {
    return `${roundedFeet}'-0"`;
  }
  return `${roundedFeet}'-${inches}"`;
}

/**
 * snapToGrid
 * Snaps a point to the nearest grid intersection based on grid size.
 */
export function snapToGrid(point: Point2D, gridSize: number): Point2D {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize
  };
}

/**
 * arePointsEqual
 * Checks if two points are equal within a small epsilon value.
 */
export function arePointsEqual(p1: Point2D, p2: Point2D, epsilon: number = 0.001): boolean {
  return Math.abs(p1.x - p2.x) < epsilon && Math.abs(p1.y - p2.y) < epsilon;
}