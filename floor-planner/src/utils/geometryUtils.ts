import { Point2D, WallData, FixtureData, RoomData } from "../types";
import earcut from "earcut";

/**
 * Pixel-to-foot ratio for 2D drawing.
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
 * Takes an array of 2D points forming a polygon, uses earcut to find area.
 * If we need to handle holes, we'd separate outer ring vs. holes in earcut.
 */
function computeArea(points: Point2D[]): number {
  if (points.length < 3) return 0;

  // Flatten the points
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
 * Helper for computeArea
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
 * identifyNestedRooms
 * Checks if one room is fully inside another by testing its points.
 */
function identifyNestedRooms(rooms: RoomData[]): Map<string, string[]> {
  // Map of parentRoomId -> array of childRoomIds
  const nestingMap = new Map<string, string[]>();

  for (let i = 0; i < rooms.length; i++) {
    for (let j = 0; j < rooms.length; j++) {
      if (i === j) continue;
      // If all points of room j are inside room i, then j is nested in i
      if (isRoomInside(rooms[j], rooms[i])) {
        if (!nestingMap.has(rooms[i].id)) {
          nestingMap.set(rooms[i].id, []);
        }
        nestingMap.get(rooms[i].id)!.push(rooms[j].id);
      }
    }
  }

  return nestingMap;
}

/**
 * isRoomInside
 * Returns true if all points of child are inside parent's polygon.
 */
function isRoomInside(child: RoomData, parent: RoomData): boolean {
  return child.points.every((cp) => isPointInPolygon(cp, parent.points));
}

/**
 * isPointInPolygon
 * Standard ray-casting approach to see if point is inside polygon.
 */
function isPointInPolygon(pt: Point2D, polygon: Point2D[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y;
    const xj = polygon[j].x,
      yj = polygon[j].y;
    const intersect =
      yi > pt.y !== yj > pt.y &&
      pt.x <
        ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * computeRoomArea
 * Uses earcut to compute the area of a single RoomData polygon.
 */
function computeRoomArea(room: RoomData): number {
  return computeArea(room.points);
}

/**
 * computeTotalAreaWithNesting
 * - If a room is nested in another, we exclude it from the overall total.
 * - For a room that has nested children, we subtract those child areas from its own area (only for that parent's label).
 */
function computeTotalAreaWithNesting(allRooms: RoomData[]): number {
  if (allRooms.length === 0) return 0;

  const nesting = identifyNestedRooms(allRooms);
  const nestedRoomIds = new Set<string>();

  // Mark nested rooms
  nesting.forEach((children, parentId) => {
    children.forEach((childId) => {
      nestedRoomIds.add(childId);
    });
  });

  // Sum up only top-level rooms
  let total = 0;
  for (const room of allRooms) {
    if (!nestedRoomIds.has(room.id)) {
      total += computeRoomArea(room);
    }
  }

  return total;
}

/**
 * calculateAreaAndVolume
 * - Exclude nested rooms from total area.
 * - If walls exist, we take average height to get a rough volume.
 */
export function calculateAreaAndVolume(
  walls: WallData[],
  fixtures: FixtureData[],
  rooms?: RoomData[]
): CalcResult {
  // Old approach: total area from walls alone (not as accurate).
  // We'll also account for rooms now if provided.

  let totalAreaInPx = 0;
  if (rooms && rooms.length > 0) {
    totalAreaInPx = computeTotalAreaWithNesting(rooms);
  } else {
    // Fallback: compute area from walls if no rooms are defined
    // (Naive method: treat all walls as one polygon.)
    // This is not recommended for complex polygons.
    // For backward compatibility:
    const polygonPoints = walls.map((w) => w.start);
    totalAreaInPx = computeArea(polygonPoints);
  }

  const totalAreaSqFt = totalAreaInPx / (PIXELS_PER_FOOT * PIXELS_PER_FOOT);

  // Average height from walls
  let avgHeight = 0;
  if (walls.length > 0) {
    avgHeight =
      walls.reduce((acc, w) => acc + w.height, 0) / walls.length;
  }

  const totalVolume = totalAreaSqFt * avgHeight;

  return {
    totalArea: totalAreaSqFt,
    totalVolume
  };
}

/**
 * isPointInsideWalls
 * Basic polygon test for a shape formed by walls' start points.
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
 * Converts a pixel distance to a "5'-3"" style string.
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