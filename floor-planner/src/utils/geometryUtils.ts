import { FixtureData, RoomData } from "../types";
/// <reference types="earcut" />

export interface Point2D {
    x: number;
    y: number;
}

export type WallData = {
    start: Point2D;
    end: Point2D;
    controlPoints?: Point2D[];
    height?: number;
};
import earcut from "earcut";

/**
 * Pixel-to-foot ratio for 2D drawing.
 */
// Unit conversion constants
export const PIXELS_PER_FOOT = 25;
export const PIXELS_PER_INCH = PIXELS_PER_FOOT / 12;
export const INCHES_TO_FEET = 1 / 12;
export const SQUARE_INCHES_TO_SQUARE_FEET = 1 / 144;

export const POINT_TOLERANCE = 30;
export const LINE_SNAP_TOLERANCE = 20;

interface CalcResult {
  totalArea: number;
  totalVolume: number;
}

/**
 * computeArea
 * Takes an array of 2D points forming a polygon, uses earcut to find area in px².
 */
// Combined area calculation that handles both simple and complex polygons
export function calculatePolygonArea(points: Point2D[]): number {
  if (points.length < 3) return 0;

  const flatCoords: number[] = [];
  points.forEach((p) => {
    flatCoords.push(p.x, p.y);
  });

  const triangles = earcut(flatCoords);
  let area = 0;
  for (let i = 0; i < triangles.length; i += 3) {
    const i1 = triangles[i] * 2;
    const i2 = triangles[i + 1] * 2;
    const i3 = triangles[i + 2] * 2;

    const x1 = flatCoords[i1];
    const y1 = flatCoords[i1 + 1];
    const x2 = flatCoords[i2];
    const y2 = flatCoords[i2 + 1];
    const x3 = flatCoords[i3];
    const y3 = flatCoords[i3 + 1];

    area += Math.abs(triangleArea(x1, y1, x2, y2, x3, y3));
  }
  return area;
}

/**
 * triangleArea
 */
function triangleArea(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number
) {
  return (
    (x1 * (y2 - y3) +
      x2 * (y3 - y1) +
      x3 * (y1 - y2)) /
    2
  );
}

/**
 * isPointInPolygon
 * Standard ray-casting approach to see if point is inside polygon.
 */
function isPointInPolygon(pt: Point2D, polygon: Point2D[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect =
      (yi > pt.y !== yj > pt.y) &&
      pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * computeRoomArea
 * Direct polygon area via earcut.
 */
// Flattens points to [x0,y0,x1,y1,...] format
export function flattenPoints(points: Point2D[]): number[] {
    return points.reduce<number[]>((acc, point) => {
        acc.push(point.x, point.y);
        return acc;
    }, []);
}

function computeRoomArea(room: RoomData): number {
    return calculatePolygonArea(room.points);
}

// Enhanced unit conversion with dual input modes
export function calculateRoomAreaInSquareFeet(
    points: Point2D[], 
    isInPixels: boolean = true
): number {
    const area = calculatePolygonArea(points);
    
    if (isInPixels) {
        return (area / (PIXELS_PER_FOOT * PIXELS_PER_FOOT)) * SQUARE_INCHES_TO_SQUARE_FEET;
    }
    return area * SQUARE_INCHES_TO_SQUARE_FEET;
}

export function squareInchesToSquareFeet(squareInches: number): number {
    return squareInches * SQUARE_INCHES_TO_SQUARE_FEET;
}

/**
 * computeTotalAreaForRooms
 * Sums up each top-level room's area, subtracting nested children from the parent.
 * But does not double-subtract for multiple nestings.
 */
function computeTotalAreaForRooms(allRooms: RoomData[]): number {
  // Identify nesting by checking if all points of room B are inside room A => B is nested in A
  const nestingMap: Map<string, string[]> = new Map();

  // Initialize
  allRooms.forEach(r => nestingMap.set(r.id, []));

  for (let i = 0; i < allRooms.length; i++) {
    for (let j = 0; j < allRooms.length; j++) {
      if (i === j) continue;
      const parent = allRooms[i];
      const child = allRooms[j];

      // if every point of child is inside parent, child is nested
      const allInside = child.points.every(p => isPointInPolygon(p, parent.points));
      if (allInside) {
        nestingMap.get(parent.id)!.push(child.id);
      }
    }
  }

  // We'll create a function to compute net area for a room,
  // subtracting out any nested children (recursively).
  const visited = new Set<string>();

  function getNetArea(roomId: string): number {
    if (visited.has(roomId)) {
      return 0;
    }
    visited.add(roomId);

    const room = allRooms.find(r => r.id === roomId);
    if (!room) return 0;

    let area = computeRoomArea(room);
    const children = nestingMap.get(roomId) || [];
    children.forEach(childId => {
      area -= getNetArea(childId);
    });

    return Math.max(area, 0);
  }

  let total = 0;
  // Only sum rooms that are not fully inside another
  // i.e., top-level rooms
  for (const r of allRooms) {
    // check if it is inside any other
    let isNested = false;
    for (const candidate of allRooms) {
      if (candidate.id === r.id) continue;
      const allInside = r.points.every(p => isPointInPolygon(p, candidate.points));
      if (allInside) {
        isNested = true;
        break;
      }
    }
    if (!isNested) {
      total += getNetArea(r.id);
    }
  }

  return total;
}

/**
 * calculateAreaAndVolume
 */
export function calculateAreaAndVolume(
  walls: WallData[],
  fixtures: FixtureData[],
  rooms?: RoomData[]
): CalcResult {
  let totalAreaPx = 0;
  if (rooms && rooms.length > 0) {
    // Compute properly with nesting
    totalAreaPx = computeTotalAreaForRooms(rooms);
  } else {
    // Fallback: treat walls array as one polygon or 0
    // This is a very rough fallback
    if (walls.length < 3) {
      totalAreaPx = 0;
    } else {
      const polygonPoints = walls.map((w) => w.start);
      totalAreaPx = calculatePolygonArea(polygonPoints);
    }
  }

  const totalAreaSqFt = totalAreaPx / (PIXELS_PER_FOOT * PIXELS_PER_FOOT);

  // Average height from walls
  let avgHeight = 0;
  if (walls.length > 0) {
    avgHeight =
      walls.reduce((acc, w) => acc + (w.height || 96 /* 8ft default */), 0) / walls.length;
  }
  const totalVolume = totalAreaSqFt * (avgHeight / PIXELS_PER_FOOT);

  return {
    totalArea: totalAreaSqFt,
    totalVolume
  };
}

/**
 * isPointInsideWalls
 */
export function isPointInsideWalls(point: Point2D, walls: WallData[]): boolean {
  if (walls.length === 0) return false;
  const points = walls.map((wall) => wall.start);
  return isPointInPolygon(point, points);
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
 */
export function snapToGrid(point: Point2D, gridSize: number): Point2D {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize
  };
}

/**
 * arePointsEqual
 * Checks if two points are extremely close.
 */
export function arePointsEqual(
  p1: Point2D,
  p2: Point2D,
  epsilon = 0.001
): boolean {
  return Math.abs(p1.x - p2.x) < epsilon && Math.abs(p1.y - p2.y) < epsilon;
}
