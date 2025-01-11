import { Point2D, WallData, FixtureData } from "../types";
import earcut from "earcut";

// Constants for unit conversion
const PIXELS_PER_FOOT = 50;  // 50 pixels = 1 foot
const PIXELS_PER_INCH = PIXELS_PER_FOOT / 12;  // pixels per inch

// Constants for geometry calculations
export const POINT_TOLERANCE = 30; // Increased for even easier snapping
export const LINE_SNAP_TOLERANCE = 20; // Tolerance for snapping to wall lines

// Tolerance for considering points as equal (in pixels)
// const POINT_TOLERANCE = 10; // Increased tolerance to account for DPI scaling

interface CalcResult {
  totalArea: number;
  totalVolume: number;
}

export function calculateAreaAndVolume(
  walls: WallData[],
  fixtures: FixtureData[]
): CalcResult {
  const loops = findAllLoops(walls);
  let totalRawArea = 0;

  loops.forEach((loop) => {
    const polygonPoints = subdivideWallsIntoPolygon(loop);
    totalRawArea += polygonArea(polygonPoints);
  });

  // average height
  const avgHeight =
    walls.reduce((acc, w) => acc + w.height, 0) / (walls.length || 1);

  const totalVolume = totalRawArea * avgHeight;

  return {
    totalArea: totalRawArea,
    totalVolume
  };
}

function findAllLoops(walls: WallData[]): WallData[][] {
  const unused = new Set(walls.map((w) => w.id));
  const loops: WallData[][] = [];

  const startMap = new Map<string, WallData[]>();
  const endMap = new Map<string, WallData[]>();

  walls.forEach((w) => {
    const startKey = pointKey(w.start);
    const endKey = pointKey(w.end);

    if (!startMap.has(startKey)) startMap.set(startKey, []);
    startMap.get(startKey)!.push(w);

    if (!endMap.has(endKey)) endMap.set(endKey, []);
    endMap.get(endKey)!.push(w);
  });

  while (unused.size > 0) {
    const seedWallId = unused.values().next().value;
    const seedWall = walls.find((w) => w.id === seedWallId)!;
    const currentLoop: WallData[] = [];
    currentLoop.push(seedWall);
    unused.delete(seedWallId);

    let currentEnd = seedWall.end;

    while (true) {
      const match = (startMap.get(pointKey(currentEnd)) || []).find((w) =>
        unused.has(w.id)
      );
      if (!match) {
        // try flipping
        const revMatch = (endMap.get(pointKey(currentEnd)) || []).find((w) =>
          unused.has(w.id)
        );
        if (!revMatch) {
          break;
        } else {
          const reversedWall = reverseWall(revMatch);
          currentLoop.push(reversedWall);
          unused.delete(revMatch.id);
          currentEnd = reversedWall.end;
        }
      } else {
        currentLoop.push(match);
        unused.delete(match.id);
        currentEnd = match.end;
      }
      if (pointKey(currentEnd) === pointKey(seedWall.start)) {
        break;
      }
    }
    loops.push(currentLoop);
  }

  return loops;
}

function reverseWall(wall: WallData): WallData {
  return {
    ...wall,
    start: { ...wall.end },
    end: { ...wall.start },
    controlPoints: wall.controlPoints ? [...wall.controlPoints].reverse() : []
  };
}

function pointKey(pt: Point2D): string {
  return `${Math.round(pt.x * 1000) / 1000}_${Math.round(pt.y * 1000) / 1000}`;
}

function subdivideWallsIntoPolygon(wallLoop: WallData[]): Point2D[] {
  const polygon: Point2D[] = [];
  wallLoop.forEach((wall, idx) => {
    const subdivided = subdivideWall(wall);
    if (idx < wallLoop.length - 1) {
      subdivided.pop();
    }
    polygon.push(...subdivided);
  });
  return polygon;
}

function subdivideWall(wall: WallData): Point2D[] {
  if (!wall.controlPoints || wall.controlPoints.length === 0) {
    return [wall.start, wall.end];
  }
  const points: Point2D[] = [wall.start];
  wall.controlPoints.forEach((cp) => points.push(cp));
  points.push(wall.end);
  return points;
}

function polygonArea(points: Point2D[]): number {
  if (points.length < 3) return 0;
  const flattened: number[] = [];
  for (const p of points) {
    flattened.push(p.x, p.y);
  }
  const indices = earcut(flattened);
  let area = 0;
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i];
    const b = indices[i + 1];
    const c = indices[i + 2];
    area += triangleArea(flattened, a, b, c);
  }
  return area;
}

function triangleArea(arr: number[], i0: number, i1: number, i2: number): number {
  const x0 = arr[i0 * 2];
  const y0 = arr[i0 * 2 + 1];
  const x1 = arr[i1 * 2];
  const y1 = arr[i1 * 2 + 1];
  const x2 = arr[i2 * 2];
  const y2 = arr[i2 * 2 + 1];
  return Math.abs(
    x0 * (y1 - y2) +
      x1 * (y2 - y0) +
      x2 * (y0 - y1)
  ) / 2;
}

export function pixelsToFeetAndInches(pixels: number): string {
  const PIXELS_PER_FOOT = 20; // Adjust this value based on your scale
  
  const totalInches = (pixels / PIXELS_PER_FOOT) * 12;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  
  // Handle case where rounding inches results in 12
  if (inches === 12) {
    return `${feet + 1}'`;
  }
  
  // CAD style formatting:
  // - If inches is 0, just show feet with '
  // - Otherwise show feet and inches
  if (inches === 0) {
    return `${feet}'`;
  }
  return `${feet}'-${inches}"`;
}

export function feetAndInchesToPixels(feet: number, inches: number = 0): number {
  return (feet * PIXELS_PER_FOOT) + (inches * PIXELS_PER_INCH);
}

// Check if two points are effectively the same within a tolerance
export function arePointsEqual(p1: Point2D, p2: Point2D): boolean {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy) <= POINT_TOLERANCE;
}

// Get distance between two points
export function getDistance(p1: Point2D, p2: Point2D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Find all walls connected to a point, including walls that contain the point along their length
export function findAllConnectedWalls(point: Point2D, walls: WallData[]): WallData[] {
  return walls.filter(wall => {
    // Check endpoints
    if (arePointsEqual(wall.start, point) || arePointsEqual(wall.end, point)) {
      return true;
    }
    
    // Check if point lies on the wall
    if (!wall.controlPoints || wall.controlPoints.length === 0) {
      const { distance } = getDistanceToLineSegment(point, wall.start, wall.end);
      return distance <= POINT_TOLERANCE;
    }
    
    return false;
  });
}

// Check if the current wall would complete a shape
export function wouldCompleteShape(currentWall: WallData, existingWalls: WallData[]): boolean {
  // Need at least 2 existing walls to form a shape
  if (existingWalls.length < 2) return false;

  // Get all walls connected to start and end points
  const connectedToStart = findAllConnectedWalls(currentWall.start, existingWalls);
  const connectedToEnd = findAllConnectedWalls(currentWall.end, existingWalls);

  // If either point isn't connected to anything, can't form a shape
  if (connectedToStart.length === 0 || connectedToEnd.length === 0) return false;

  // Try to trace a path from end to start
  const visited = new Set<string>();
  
  function canTracePathToStart(currentPoint: Point2D, targetPoint: Point2D, depth: number = 0): boolean {
    // Prevent infinite recursion
    if (depth > existingWalls.length * 2) return false;
    
    // Found path back to start
    if (arePointsEqual(currentPoint, targetPoint)) return true;
    
    const pointId = pointKey(currentPoint);
    if (visited.has(pointId)) return false;
    visited.add(pointId);
    
    // Get all connected walls at this point
    const connectedWalls = findAllConnectedWalls(currentPoint, existingWalls);
    
    // For each connected wall, try both endpoints and points along the wall
    for (const wall of connectedWalls) {
      // Try wall endpoints
      const endpoints = [wall.start, wall.end];
      
      // Also try points where other walls intersect this wall
      const intersectionPoints = findWallIntersections(wall, existingWalls);
      const allPoints = [...endpoints, ...intersectionPoints];
      
      for (const nextPoint of allPoints) {
        if (!arePointsEqual(nextPoint, currentPoint) && !visited.has(pointKey(nextPoint))) {
          if (canTracePathToStart(nextPoint, targetPoint, depth + 1)) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  // Try to find a path from any connected end point back to start
  for (const wall of connectedToEnd) {
    const points = [wall.start, wall.end];
    const intersections = findWallIntersections(wall, existingWalls);
    const allPoints = [...points, ...intersections];
    
    for (const nextPoint of allPoints) {
      if (!arePointsEqual(nextPoint, currentWall.end)) {
        visited.clear();
        if (canTracePathToStart(nextPoint, currentWall.start, 0)) {
          return true;
        }
      }
    }
  }

  return false;
}

// Find points where a wall intersects with other walls
function findWallIntersections(wall: WallData, walls: WallData[]): Point2D[] {
  const intersections: Point2D[] = [];
  
  for (const otherWall of walls) {
    if (wall === otherWall) continue;
    
    // Skip curved walls for now
    if (wall.controlPoints?.length || otherWall.controlPoints?.length) continue;
    
    // Check if any point of otherWall lies on wall
    const points = [otherWall.start, otherWall.end];
    for (const point of points) {
      const { distance, nearestPoint } = getDistanceToLineSegment(point, wall.start, wall.end);
      if (distance <= POINT_TOLERANCE) {
        intersections.push(nearestPoint);
      }
    }
  }
  
  return intersections;
}

// Get distance between a point and a line segment
export function getDistanceToLineSegment(point: Point2D, start: Point2D, end: Point2D): { distance: number; nearestPoint: Point2D } {
  const A = point.x - start.x;
  const B = point.y - start.y;
  const C = end.x - start.x;
  const D = end.y - start.y;

  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;

  if (len_sq !== 0) {
    param = dot / len_sq;
  }

  let nearestPoint: Point2D;

  if (param < 0) {
    nearestPoint = start;
  } else if (param > 1) {
    nearestPoint = end;
  } else {
    nearestPoint = {
      x: start.x + param * C,
      y: start.y + param * D
    };
  }

  const dx = point.x - nearestPoint.x;
  const dy = point.y - nearestPoint.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return { distance, nearestPoint };
}

// Find nearest point on any wall
export function findNearestWallPoint(point: Point2D, walls: WallData[]): Point2D | null {
  let nearestPoint: Point2D | null = null;
  let minDistance = Infinity;

  // First check endpoints
  for (const wall of walls) {
    const distToStart = getDistance(point, wall.start);
    const distToEnd = getDistance(point, wall.end);

    if (distToStart < minDistance && distToStart <= POINT_TOLERANCE) {
      minDistance = distToStart;
      nearestPoint = wall.start;
    }
    if (distToEnd < minDistance && distToEnd <= POINT_TOLERANCE) {
      minDistance = distToEnd;
      nearestPoint = wall.end;
    }

    // Then check the wall line itself
    if (!wall.controlPoints || wall.controlPoints.length === 0) {
      const { distance, nearestPoint: linePoint } = getDistanceToLineSegment(point, wall.start, wall.end);
      if (distance < minDistance && distance <= LINE_SNAP_TOLERANCE) {
        minDistance = distance;
        nearestPoint = linePoint;
      }
    }
  }

  return nearestPoint;
}
