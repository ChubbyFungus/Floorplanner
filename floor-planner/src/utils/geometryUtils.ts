import { WallData, FixtureData, Point2D } from "../types";
import earcut from "earcut";

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
          reverseWall(revMatch);
          currentLoop.push(revMatch);
          unused.delete(revMatch.id);
          currentEnd = revMatch.end;
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

function reverseWall(wall: WallData) {
  const tmp = wall.start;
  wall.start = wall.end;
  wall.end = tmp;
  if (wall.controlPoints && wall.controlPoints.length > 0) {
    wall.controlPoints.reverse();
  }
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

// Conversion constants (1 foot = 12 inches)
const PIXELS_PER_FOOT = 50; // Adjust this value to change the scale
const PIXELS_PER_INCH = PIXELS_PER_FOOT / 12;

export function pixelsToFeetAndInches(pixels: number): string {
  const totalInches = pixels / PIXELS_PER_INCH;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  
  if (feet === 0) {
    return `${inches}"`;
  } else if (inches === 0) {
    return `${feet}'`;
  } else {
    return `${feet}' ${inches}"`;
  }
}

export function feetAndInchesToPixels(feet: number, inches: number = 0): number {
  return (feet * PIXELS_PER_FOOT) + (inches * PIXELS_PER_INCH);
}

// Tolerance for considering points as equal (in pixels)
const POINT_TOLERANCE = 5;

// Check if two points are effectively the same within a tolerance
export function arePointsEqual(p1: Point2D, p2: Point2D): boolean {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy) <= POINT_TOLERANCE;
}

// Find walls that connect to a given point
export function findConnectedWalls(point: Point2D, walls: WallData[]): WallData[] {
  return walls.filter(wall => 
    arePointsEqual(wall.start, point) || arePointsEqual(wall.end, point)
  );
}

// Check if a point is connected to any existing wall endpoint
export function isConnectedToExistingWall(point: Point2D, walls: WallData[]): boolean {
  return walls.some(wall => 
    arePointsEqual(wall.start, point) || arePointsEqual(wall.end, point)
  );
}

// Check if the current wall would complete a shape
export function wouldCompleteShape(currentWall: WallData, existingWalls: WallData[]): boolean {
  // Need at least 2 existing walls to form a shape
  if (existingWalls.length < 2) return false;

  // Find walls connected to the current wall's end point
  const connectedToEnd = findConnectedWalls(currentWall.end, existingWalls);
  if (connectedToEnd.length === 0) return false;

  // Find walls connected to the current wall's start point
  const connectedToStart = findConnectedWalls(currentWall.start, existingWalls);
  if (connectedToStart.length === 0) return false;

  // Try to trace a path from end to start
  const visited = new Set<string>();
  
  function canTracePathToStart(currentPoint: Point2D, targetPoint: Point2D, depth: number = 0): boolean {
    // Prevent infinite recursion
    if (depth > existingWalls.length) return false;
    
    // Check if we've reached the target
    if (arePointsEqual(currentPoint, targetPoint)) return true;

    // Find all connected walls we haven't visited yet
    const connected = findConnectedWalls(currentPoint, existingWalls)
      .filter(wall => !visited.has(wall.id));

    // Try each connected wall
    for (const wall of connected) {
      visited.add(wall.id);
      
      // Try both endpoints of the wall
      const nextPoint = arePointsEqual(wall.start, currentPoint) ? wall.end : wall.start;
      if (canTracePathToStart(nextPoint, targetPoint, depth + 1)) {
        return true;
      }
    }

    return false;
  }

  // Try to find a path from the end point back to the start point
  return canTracePathToStart(currentWall.end, currentWall.start);
}
