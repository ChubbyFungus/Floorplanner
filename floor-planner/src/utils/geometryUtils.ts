import { Point2D, WallData, FixtureData } from "../types";
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

// Export the area computation function
export function computeArea(walls: WallData[]): number {
  if (walls.length === 0) return 0;
  const points = walls.map(wall => wall.start);
  return Math.abs(polygonArea(points));
}

// Export the point inside walls check function
export function isPointInsideWalls(point: Point2D, walls: WallData[]): boolean {
  if (walls.length === 0) return false;
  const points = walls.map(wall => wall.start);
  return isPointInPolygon(point, points);
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
    walls.reduce((acc, w) => acc + w.height, 0) / (walls.length || 1);

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
  const points: Point2D[] = [];
  
  // Log the raw wall dimensions
  wallLoop.forEach(wall => {
    const width = Math.abs(wall.end.x - wall.start.x);
    const height = Math.abs(wall.end.y - wall.start.y);
    const length = Math.sqrt(width * width + height * height);
    console.log(`Wall dimensions - pixels: ${length}, feet: ${length/PIXELS_PER_FOOT}`);
  });
  
  // Ensure walls are connected in sequence
  for (let i = 0; i < wallLoop.length; i++) {
    const wall = wallLoop[i];
    const nextWall = wallLoop[(i + 1) % wallLoop.length];
    
    if (!arePointsEqual(wall.end, nextWall.start)) {
      console.warn(`Gap between walls at index ${i}:`, {
        currentWallEnd: wall.end,
        nextWallStart: nextWall.start
      });
    }
    
    points.push(wall.start);
  }
  
  // Add the first point again to close the loop
  if (points.length > 0) {
    points.push(points[0]);
  }
  
  return points;
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

function triangleArea(arr: number[], i0: number, i1: number, i2: number): number {
  const x0 = arr[i0 * 2];
  const y0 = arr[i0 * 2 + 1];
  const x1 = arr[i1 * 2];
  const y1 = arr[i1 * 2 + 1];
  const x2 = arr[i2 * 2];
  const y2 = arr[i2 * 2 + 1];

  // Using the shoelace formula for triangle area
  const area = Math.abs(
    x0 * (y1 - y2) +
    x1 * (y2 - y0) +
    x2 * (y0 - y1)
  ) / 2;

  console.log('Triangle points:', { x0, y0, x1, y1, x2, y2 });
  console.log('Triangle area:', area);
  return area;
}

export function pixelsToFeetAndInches(pixels: number): string {
  const feet = pixels / PIXELS_PER_FOOT;
  const roundedFeet = Math.floor(feet);
  const inches = Math.round((feet - roundedFeet) * 12);
  
  // Handle case where inches rounds to 12
  if (inches === 12) {
    return `${roundedFeet + 1}'-0"`;
  }
  
  // Only show inches if there are any
  if (inches === 0) {
    return `${roundedFeet}'-0"`;
  }
  
  return `${roundedFeet}'-${inches}"`;
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
export function findWallIntersections(wall: WallData, walls: WallData[]): Point2D[] {
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

export function getDistanceFromPointToLineSegment(point: Point2D, lineStart: Point2D, lineEnd: Point2D): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;

  return Math.sqrt(dx * dx + dy * dy);
}

// Get distance from point to line
export function getDistanceFromPointToLine(point: Point2D, start: Point2D, end: Point2D): number {
  const { distance } = getDistanceToLineSegment(point, start, end);
  return distance;
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

// Get distance between parallel walls
export function getParallelWallDistance(wall1: WallData, wall2: WallData): number {
  const angle1 = Math.atan2(wall1.end.y - wall1.start.y, wall1.end.x - wall1.start.x);
  const angle2 = Math.atan2(wall2.end.y - wall2.start.y, wall2.end.x - wall2.start.x);
  
  // Check if walls are parallel (angles are same or differ by PI)
  if (Math.abs(angle1 - angle2) < 0.1 || Math.abs(Math.abs(angle1 - angle2) - Math.PI) < 0.1) {
    const dx = wall2.start.x - wall1.start.x;
    const dy = wall2.start.y - wall1.start.y;
    return Math.abs(dx * Math.sin(angle1) - dy * Math.cos(angle1));
  }
  return Infinity;
}

// Check if a wall is part of room boundary
export function isRoomBoundaryWall(wall: WallData, walls: WallData[]): boolean {
  const connectedWalls = findAllConnectedWalls(wall.start, walls)
    .concat(findAllConnectedWalls(wall.end, walls))
    .filter(w => w !== wall);
    
  // A wall is a boundary if it has connecting walls at both ends
  const hasStartConnection = connectedWalls.some(w => 
    arePointsEqual(w.start, wall.start) || 
    arePointsEqual(w.end, wall.start)
  );
  const hasEndConnection = connectedWalls.some(w => 
    arePointsEqual(w.start, wall.end) || 
    arePointsEqual(w.end, wall.end)
  );
  
  return hasStartConnection && hasEndConnection;
}

// Normalize measurements for parallel walls to show the same length
export function normalizeParallelMeasurements(walls: WallData[]): Map<string, number> {
  const measurements = new Map<string, number>();
  const processedWalls = new Set<WallData>();
  
  walls.forEach(wall => {
    if (processedWalls.has(wall)) return;
    
    // Find parallel walls
    const parallelWalls = walls.filter(w => 
      w !== wall && getParallelWallDistance(wall, w) < wall.thickness * 2
    );
    
    if (parallelWalls.length > 0) {
      // Use the longest length for all parallel walls
      const lengths = [wall, ...parallelWalls].map(w => getDistance(w.start, w.end));
      const maxLength = Math.max(...lengths);
      
      // Store normalized length for each wall
      [wall, ...parallelWalls].forEach(w => {
        const key = `${w.start.x},${w.start.y}-${w.end.x},${w.end.y}`;
        measurements.set(key, maxLength);
        processedWalls.add(w);
      });
    } else {
      const key = `${wall.start.x},${wall.start.y}-${wall.end.x},${wall.end.y}`;
      measurements.set(key, getDistance(wall.start, wall.end));
      processedWalls.add(wall);
    }
  });
  
  return measurements;
}

// Check if a wall measurement should be shown
export function shouldShowWallMeasurement(wall: WallData, walls: WallData[]): boolean {
  const length = getDistance(wall.start, wall.end);
  
  // Don't show measurements for walls shorter than 1 pixel (effectively 0)
  if (length < 1) return false;
  
  // Always show measurements for boundary walls
  if (isRoomBoundaryWall(wall, walls)) {
    // For boundary walls, check if it's a corner measurement (0')
    const connectedWalls = findAllConnectedWalls(wall.start, walls)
      .concat(findAllConnectedWalls(wall.end, walls))
      .filter(w => w.id !== wall.id);
      
    // If this is a corner measurement (has perpendicular walls at both ends), don't show it
    if (connectedWalls.length >= 2 && 
        connectedWalls.every(w => Math.abs(getWallAngle(wall, w) - Math.PI/2) < 0.1)) {
      return false;
    }
  }
  
  // For interior walls, only show if they're not too close to parallel walls
  const parallelWalls = walls.filter(w => 
    w !== wall && getParallelWallDistance(wall, w) < wall.thickness * 4
  );
  
  return parallelWalls.length === 0;
}

// Helper function to check if a point is connected to an existing wall
export function isConnectedToExistingWall(point: Point2D, walls: WallData[]): boolean {
  return walls.some(wall => 
    arePointsEqual(wall.start, point) || 
    arePointsEqual(wall.end, point)
  );
}

// Helper function to get the angle between two walls
function getWallAngle(wall1: WallData, wall2: WallData): number {
  const angle1 = Math.atan2(wall1.end.y - wall1.start.y, wall1.end.x - wall1.start.x);
  const angle2 = Math.atan2(wall2.end.y - wall2.start.y, wall2.end.x - wall2.start.x);
  return Math.abs(angle1 - angle2);
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

// Add utility function for curve creation
export const createCurvedWall = (
  wall: WallData,
  controlPoint: Point2D
): WallData => {
  return {
    ...wall,
    controlPoints: [controlPoint],
    type: 'curved'
  };
};

// Add grid snapping utilities
export const snapToGrid = (point: Point2D, gridSize: number): Point2D => {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize
  };
};

export const snapPointToNearestGridIntersection = (
  point: Point2D,
  gridSize: number,
  tolerance: number
): Point2D => {
  const nearestGridPoint = snapToGrid(point, gridSize);
  const distance = getDistance(point, nearestGridPoint);
  
  return distance <= tolerance ? nearestGridPoint : point;
};

// Add wall snapping utilities
export const calculateDistance = (p1: Point2D, p2: Point2D): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const pointToLineDistance = (point: Point2D, start: Point2D, end: Point2D): number => {
  const L2 = Math.pow(calculateDistance(start, end), 2);
  if (L2 === 0) return calculateDistance(point, start);
  
  const t = Math.max(0, Math.min(1, (
    (point.x - start.x) * (end.x - start.x) +
    (point.y - start.y) * (end.y - start.y)
  ) / L2));
  
  const projection = {
    x: start.x + t * (end.x - start.x),
    y: start.y + t * (end.y - start.y)
  };
  
  return calculateDistance(point, projection);
};

export const findNearestPointOnWall = (point: Point2D, wall: WallData): Point2D => {
  const L2 = Math.pow(calculateDistance(wall.start, wall.end), 2);
  if (L2 === 0) return wall.start;
  
  const t = Math.max(0, Math.min(1, (
    (point.x - wall.start.x) * (wall.end.x - wall.start.x) +
    (point.y - wall.start.y) * (wall.end.y - wall.start.y)
  ) / L2));
  
  return {
    x: wall.start.x + t * (wall.end.x - wall.start.x),
    y: wall.start.y + t * (wall.end.y - wall.start.y)
  };
};

export const findNearestWallEndpoint = (point: Point2D, walls: WallData[], tolerance: number): Point2D | null => {
  let nearestPoint = null;
  let minDistance = tolerance;

  walls.forEach(wall => {
    [wall.start, wall.end].forEach(endpoint => {
      const distance = calculateDistance(point, endpoint);
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = endpoint;
      }
    });
  });

  return nearestPoint;
};

export const snapPointToNearestWall = (point: Point2D, walls: WallData[], tolerance: number): Point2D | null => {
  // First check endpoints
  const nearestEndpoint = findNearestWallEndpoint(point, walls, tolerance);
  if (nearestEndpoint) return nearestEndpoint;

  // Then check wall lines
  let nearestPoint = null;
  let minDistance = tolerance;

  walls.forEach(wall => {
    const nearestOnWall = findNearestPointOnWall(point, wall);
    const distance = calculateDistance(point, nearestOnWall);
    if (distance < minDistance) {
      minDistance = distance;
      nearestPoint = nearestOnWall;
    }
  });

  return nearestPoint;
};

export const snapWallEndpoints = (wall: WallData, walls: WallData[], tolerance: number): WallData => {
  const otherWalls = walls.filter(w => w.id !== wall.id);
  const snappedStart = snapPointToNearestWall(wall.start, otherWalls, tolerance);
  const snappedEnd = snapPointToNearestWall(wall.end, otherWalls, tolerance);

  return {
    ...wall,
    start: snappedStart || wall.start,
    end: snappedEnd || wall.end
  };
};
