import { FixtureData, RoomData } from "../types";
/// <reference types="earcut" />
import { debugLogger } from "./debugLogger";

export interface Point2D {
  x: number;
  y: number;
}

export type WallData = {
  start: Point2D;
  end: Point2D;
  controlPoints?: Point2D[];
  height?: number;
  thickness?: number;
  material?: string;
  id: string;
};

import earcut from "earcut";

// Constants for unit conversion
export const PIXELS_PER_FOOT = 25;  // 25 pixels = 1 foot (reduced from 50 for more space)
export const PIXELS_PER_INCH = PIXELS_PER_FOOT / 12;  // pixels per inch

// Constants for geometry calculations
export const POINT_TOLERANCE = 30; // Increased for even easier snapping
export const LINE_SNAP_TOLERANCE = 20; // Tolerance for snapping to wall lines

interface CalcResult {
  totalArea: number;
  totalVolume: number;
}

export function calculateAreaAndVolume(
  walls: WallData[],
  fixtures: FixtureData[]
): CalcResult {
  console.log('\n=== Starting Area Calculation ===');
  const wallLoops = findAllLoops(walls);
  console.log(`Found ${wallLoops.length} room loops`);

  // Calculate area for each loop and track which rooms are inside others
  interface RoomInfo {
    area: number;
    containedBy: number[]; // indices of rooms that contain this room
  }
  const roomInfos: RoomInfo[] = [];

  wallLoops.forEach((loop, index) => {
    console.log(`\nAnalyzing Loop ${index}:`);
    const polygonPoints = subdivideWallsIntoPolygon(loop);
    const areaInPixels = polygonArea(polygonPoints);

    // Check which rooms contain this room
    const containedBy: number[] = [];
    for (let i = 0; i < index; i++) {
      if (!isLoopSeparate(wallLoops[i], loop)) {  // Check if loop[i] is inside current loop
        console.log(`Loop ${index} is contained within loop ${i}`);
        containedBy.push(i);
      }
    }

    roomInfos.push({
      area: areaInPixels,
      containedBy
    });

    console.log(`Loop ${index} area: ${areaInPixels} pixels² (${areaInPixels / (PIXELS_PER_FOOT * PIXELS_PER_FOOT)} sq ft)`);
    console.log(`Contained by rooms:`, containedBy);
  });

  // Calculate total area by only adding separate rooms
  let totalRawArea = 0;
  roomInfos.forEach((info, index) => {
    if (info.containedBy.length === 0) {
      // This is a separate room - add its area
      console.log(`Adding separate room ${index} area: ${info.area}`);
      totalRawArea += info.area;
    } else {
      console.log(`Skipping nested room ${index} area: ${info.area}`);
    }
  });

  console.log('\nFinal calculations:');
  console.log('Total raw area in pixels²:', totalRawArea);

  // Convert area to square feet
  const totalAreaInSqFeet = totalRawArea / (PIXELS_PER_FOOT * PIXELS_PER_FOOT);
  console.log('Total area in sq ft:', totalAreaInSqFeet);

  // Calculate average height for volume (in feet)
  const avgHeight =
    walls.reduce((acc, w) => acc + (w.height || 96), 0) / (walls.length || 1);

  const totalVolume = totalAreaInSqFeet * avgHeight;

  return {
    totalArea: totalAreaInSqFeet,
    totalVolume
  };
}

function findAllLoops(walls: WallData[]): WallData[][] {
  const unused = new Set(walls.map((w) => w.id));
  const loops: WallData[][] = [];

  const startMap = new Map<string, WallData[]>();
  const endMap = new Map<string, WallData[]>();

  // Build connection maps
  walls.forEach((w) => {
    const startKey = pointKey(w.start);
    const endKey = pointKey(w.end);

    if (!startMap.has(startKey)) startMap.set(startKey, []);
    startMap.get(startKey)!.push(w);

    if (!endMap.has(endKey)) endMap.set(endKey, []);
    endMap.get(endKey)!.push(w);
  });

  // Find loops
  while (unused.size > 0) {
    const seedWallId = unused.values().next().value;
    const seedWall = walls.find((w) => w.id === seedWallId)!;
    const currentLoop: WallData[] = [];
    currentLoop.push(seedWall);
    unused.delete(seedWallId);

    let currentEnd = seedWall.end;
    let loopStart = seedWall.start;

    while (true) {
      // Try to find a wall that connects to the current end point
      const nextWall = walls.find(w => 
        unused.has(w.id) && 
        (arePointsEqual(w.start, currentEnd) || arePointsEqual(w.end, currentEnd))
      );

      if (!nextWall) {
        // Check if we can close the loop
        if (arePointsEqual(currentEnd, loopStart)) {
          loops.push([...currentLoop]);
        }
        break;
      }

      // Add the wall to the loop
      if (arePointsEqual(nextWall.start, currentEnd)) {
        currentLoop.push(nextWall);
        currentEnd = nextWall.end;
      } else {
        // Wall needs to be reversed
        const reversed = reverseWall(nextWall);
        currentLoop.push(reversed);
        currentEnd = reversed.end;
      }
      unused.delete(nextWall.id);
    }
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
  const points: Point2D[] = [];

  // Log the raw wall dimensions
  wallLoop.forEach(wall => {
    const width = Math.abs(wall.end.x - wall.start.x);
    const height = Math.abs(wall.end.y - wall.start.y);
    const length = Math.sqrt(width * width + height * height);
    console.log(`Wall dimensions - pixels: ${length}, feet: ${length/PIXELS_PER_FOOT}`);
  });

  // First, ensure all walls are properly connected
  const connectedWalls = [...wallLoop];
  for (let i = 0; i < connectedWalls.length; i++) {
    const wall = connectedWalls[i];
    const nextWall = connectedWalls[(i + 1) % connectedWalls.length];

    // Check if walls need to be connected
    if (!arePointsEqual(wall.end, nextWall.start)) {
      const distance = getDistance(wall.end, nextWall.start);
      console.warn(`Gap between walls at index ${i}:`, {
        currentWallEnd: wall.end,
        nextWallStart: nextWall.start,
        distance
      });

      // If walls are close enough, connect them
      if (distance < 20) { // 20 pixels threshold
        nextWall.start = { ...wall.end };
      }
    }
  }

  // Now extract points from connected walls
  connectedWalls.forEach(wall => {
    points.push({ ...wall.start }); // Clone points to avoid reference issues
  });

  // Add the first point again to close the loop
  if (points.length > 0) {
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    // Only close the loop if the last point isn't already equal to the first
    if (!arePointsEqual(firstPoint, lastPoint)) {
      points.push({ ...firstPoint });
    }
  }

  return points;
}

function polygonArea(points: Point2D[]): number {
  if (points.length < 3) return 0;

  // Ensure points are ordered correctly (clockwise)
  const center = points.reduce((acc, p) => ({ 
    x: acc.x + p.x / points.length, 
    y: acc.y + p.y / points.length 
  }), { x: 0, y: 0 });

  const sortedPoints = [...points].sort((a, b) => {
    const angleA = Math.atan2(a.y - center.y, a.x - center.x);
    const angleB = Math.atan2(b.y - center.y, b.x - center.x);
    return angleA - angleB;
  });

  // Use shoelace formula with sorted points
  let area = 0;
  for (let i = 0; i < sortedPoints.length; i++) {
    const j = (i + 1) % sortedPoints.length;
    area += sortedPoints[i].x * sortedPoints[j].y;
    area -= sortedPoints[j].x * sortedPoints[i].y;
  }

  area = Math.abs(area / 2);
  console.log('Polygon area calculation:');
  console.log('Original points:', points);
  console.log('Sorted points:', sortedPoints);
  console.log('Raw area:', area);
  console.log('Area in sq ft:', area / (PIXELS_PER_FOOT * PIXELS_PER_FOOT));

  return area;
}

// Helper function to determine if one loop is separate from another
function isLoopSeparate(loop1: WallData[], loop2: WallData[]): boolean {
  console.log('\nChecking if loops are separate:');

  // Get points for both loops
  const points1 = subdivideWallsIntoPolygon(loop1);
  const points2 = subdivideWallsIntoPolygon(loop2);

  // First check if they share any walls
  const sharedWalls = findSharedWalls(loop1, loop2);
  console.log('Number of shared walls:', sharedWalls.length);

  // If they share walls, check if the non-shared points of loop2 are inside loop1
  if (sharedWalls.length > 0) {
    // Get points that aren't part of shared walls
    const nonSharedPoints2 = points2.filter(p2 => 
      !sharedWalls.some(wall => 
        arePointsEqual(p2, wall.start) || arePointsEqual(p2, wall.end)
      )
    );

    console.log('Non-shared points from loop2:', nonSharedPoints2.length);

    // If any non-shared point is outside loop1, then loop2 is separate
    const anyPointOutside = nonSharedPoints2.some(p => !isPointInPolygon(p, points1));
    console.log('Has points outside:', anyPointOutside);

    // If all points are inside, it's nested. If any are outside, it's separate
    return anyPointOutside;
  }

  // If no shared walls, use the original point-inside check
  let points1Inside = 0;
  let points2Inside = 0;

  for (const point of points1) {
    if (isPointInPolygon(point, points2)) {
      points1Inside++;
    }
  }

  for (const point of points2) {
    if (isPointInPolygon(point, points1)) {
      points2Inside++;
    }
  }

  console.log(`Points from loop1 inside loop2: ${points1Inside}/${points1.length}`);
  console.log(`Points from loop2 inside loop1: ${points2Inside}/${points2.length}`);

  // Loops are separate if less than 2 points from loop2 are inside loop1
  const isSeparate = points2Inside < 2;

  console.log('Loops are separate:', isSeparate);

  return isSeparate;
}

// Helper function to find walls that are shared between two loops
function findSharedWalls(loop1: WallData[], loop2: WallData[]): WallData[] {
  const sharedWalls: WallData[] = [];

  for (const wall1 of loop1) {
    for (const wall2 of loop2) {
      // Check if walls share both endpoints (in either direction)
      if ((arePointsEqual(wall1.start, wall2.start) && arePointsEqual(wall1.end, wall2.end)) ||
          (arePointsEqual(wall1.start, wall2.end) && arePointsEqual(wall1.end, wall2.start))) {
        sharedWalls.push(wall1);
        break;
      }
    }
  }

  return sharedWalls;
}

// Helper function to check if a point is inside a polygon
export function isPointInPolygon(point: Point2D, polygon: Point2D[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect = ((yi > point.y) !== (yj > point.y))
      && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function getDistance(p1: Point2D, p2: Point2D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

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

export function arePointsEqual(p1: Point2D, p2: Point2D, epsilon = 0.001): boolean {
  return Math.abs(p1.x - p2.x) < epsilon && Math.abs(p1.y - p2.y) < epsilon;
}

export function snapToGrid(point: Point2D, gridSize: number): Point2D {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize
  };
}

export function snapToPoint(point: Point2D, targetPoint: Point2D, snapDistance: number = 10): Point2D {
  const distance = getDistance(point, targetPoint);
  if (distance <= snapDistance) {
    return { ...targetPoint };
  }
  return point;
}

export function snapToWall(point: Point2D, walls: WallData[], snapDistance: number = 10): Point2D {
  let closestPoint = point;
  let minDistance = snapDistance;

  walls.forEach(wall => {
    // Check wall endpoints
    const distToStart = getDistance(point, wall.start);
    const distToEnd = getDistance(point, wall.end);

    if (distToStart < minDistance) {
      minDistance = distToStart;
      closestPoint = { ...wall.start };
    }
    if (distToEnd < minDistance) {
      minDistance = distToEnd;
      closestPoint = { ...wall.end };
    }
  });

  return closestPoint;
}
