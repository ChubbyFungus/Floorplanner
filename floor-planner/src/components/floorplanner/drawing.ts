// drawing.ts
import { WallData, Point2D } from "../../types";
import { 
  pixelsToFeetAndInches,
  calculateAreaAndVolume,
  POINT_TOLERANCE,
  shouldShowWallMeasurement,
  getDistance,
  getParallelWallDistance,
  isRoomBoundaryWall,
  normalizeParallelMeasurements,
  findWallIntersections,
  PIXELS_PER_FOOT
} from "../../utils/geometryUtils";

// Helper function to draw wall measurement
function drawWallMeasurement(ctx: CanvasRenderingContext2D, wall: WallData, offset: number, length?: number, walls?: WallData[]) {
  const actualLength = length || getDistance(wall.start, wall.end);
  const measurement = pixelsToFeetAndInches(actualLength);
  
  // Position the text above or below the wall
  const midX = (wall.start.x + wall.end.x) / 2;
  const midY = (wall.start.y + wall.end.y) / 2;
  
  // Calculate angle for rotating text
  const angle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
  let textAngle = angle;
  if (Math.abs(angle) > Math.PI / 2) {
    textAngle = angle - Math.PI;
  }
  
  ctx.save();
  
  // Move to the midpoint
  ctx.translate(midX, midY);
  ctx.rotate(textAngle);
  
  // Draw text
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  
  // Draw white background for better visibility
  const textMetrics = ctx.measureText(measurement);
  const padding = 2;
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.fillRect(
    -textMetrics.width / 2 - padding,
    offset - 6,
    textMetrics.width + padding * 2,
    12
  );
  
  // Draw the measurement text
  ctx.fillStyle = "#000";
  ctx.fillText(measurement, 0, offset);
  
  ctx.restore();
}

// Debug logging
function logWallInfo(prefix: string, wall: WallData) {
  console.log(`${prefix} - id: ${wall.id}, start: (${wall.start.x}, ${wall.start.y}), end: (${wall.end.x}, ${wall.end.y})`);
}

// Helper function to determine measurement side for a wall
function getMeasurementSide(wall: WallData, walls: WallData[]): number {
  // For room boundary walls, place measurement on outside
  if (isRoomBoundaryWall(wall, walls)) {
    // Calculate center of room
    let centerX = 0;
    let centerY = 0;
    let count = 0;
    
    walls.forEach(w => {
      if (isRoomBoundaryWall(w, walls)) {
        centerX += (w.start.x + w.end.x) / 2;
        centerY += (w.start.y + w.end.y) / 2;
        count++;
      }
    });
    
    centerX /= count;
    centerY /= count;
    
    // Get wall midpoint
    const midX = (wall.start.x + wall.end.x) / 2;
    const midY = (wall.start.y + wall.end.y) / 2;
    
    // Vector from center to wall midpoint
    const dx = midX - centerX;
    const dy = midY - centerY;
    
    // Wall direction vector
    const wallDx = wall.end.x - wall.start.x;
    const wallDy = wall.end.y - wall.start.y;
    
    // Cross product to determine which side is outside
    return Math.sign(dx * wallDy - dy * wallDx);
  }
  
  // For other walls, use default side based on angle
  const angle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
  return (angle > -Math.PI/2 && angle < Math.PI/2) ? -1 : 1;
}

// Calculate interior wall length (excluding wall thickness)
function getInteriorWallLength(wall: WallData): number {
  const totalLength = getDistance(wall.start, wall.end);
  return Math.max(0, totalLength - wall.thickness);
}

// Helper function to project a point onto a wall, return null if projection is outside wall segment
function projectPointOnWall(point: Point2D, wall: WallData): Point2D | null {
  const { nearestPoint } = getDistanceToLineSegment(point, wall.start, wall.end);
  
  // Check if projection point is on the wall segment
  const distToStart = getDistance(nearestPoint, wall.start);
  const distToEnd = getDistance(nearestPoint, wall.end);
  const wallLength = getDistance(wall.start, wall.end);
  
  if (distToStart <= wallLength && distToEnd <= wallLength) {
    return nearestPoint;
  }
  
  return null;
}

// Helper function to find intersection between two lines
function findIntersection(p1: Point2D, p2: Point2D, p3: Point2D, p4: Point2D): Point2D | null {
  const denominator = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
  
  if (denominator === 0) {
    return null; // Lines are parallel
  }
  
  const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denominator;
  const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / denominator;
  
  if (t > 0 && t < 1 && u > 0 && u < 1) {
    return {
      x: p1.x + t * (p2.x - p1.x),
      y: p1.y + t * (p2.y - p1.y)
    };
  } else {
    return null; // Intersection is outside line segments
  }
}

// Helper function to calculate distance between two points
function getDistanceToLineSegment(point: Point2D, lineStart: Point2D, lineEnd: Point2D): { distance: number; nearestPoint: Point2D } {
  const lineLength = getDistance(lineStart, lineEnd);
  if (lineLength === 0) {
    return { distance: getDistance(point, lineStart), nearestPoint: lineStart };
  }
  
  const t = Math.max(0, Math.min(1, ((point.x - lineStart.x) * (lineEnd.x - lineStart.x) + (point.y - lineStart.y) * (lineEnd.y - lineStart.y)) / (lineLength * lineLength)));
  const nearestPoint = {
    x: lineStart.x + t * (lineEnd.x - lineStart.x),
    y: lineStart.y + t * (lineEnd.y - lineStart.y)
  };
  return { distance: getDistance(point, nearestPoint), nearestPoint };
}

// Get angle between two walls (0 for parallel, PI/2 for perpendicular)
function getWallAngle(wall1: WallData, wall2: WallData): number {
  const dx1 = wall1.end.x - wall1.start.x;
  const dy1 = wall1.end.y - wall1.start.y;
  const dx2 = wall2.end.x - wall2.start.x;
  const dy2 = wall2.end.y - wall2.start.y;
  
  const angle1 = Math.atan2(dy1, dx1);
  const angle2 = Math.atan2(dy2, dx2);
  
  let diff = Math.abs(angle1 - angle2);
  if (diff > Math.PI) diff = 2 * Math.PI - diff;
  return diff;
}

// Get the span of a wall (min/max coordinates in direction of wall)
function getWallSpan(wall: WallData): { min: number; max: number } {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  
  // Get the primary direction (x or y) based on wall angle
  if (Math.abs(dx) > Math.abs(dy)) {
    return {
      min: Math.min(wall.start.x, wall.end.x),
      max: Math.max(wall.start.x, wall.end.x)
    };
  } else {
    return {
      min: Math.min(wall.start.y, wall.end.y),
      max: Math.max(wall.start.y, wall.end.y)
    };
  }
}

// Check if two spans overlap
function doSpansOverlap(span1: { min: number; max: number }, span2: { min: number; max: number }): boolean {
  return !(span1.max < span2.min || span2.max < span1.min);
}

// Helper function to check if two points are equal within tolerance
function arePointsEqual(p1: Point2D, p2: Point2D): boolean {
  return Math.abs(p1.x - p2.x) < POINT_TOLERANCE && Math.abs(p1.y - p2.y) < POINT_TOLERANCE;
}

// Helper function to find aligned walls that form a continuous boundary
function findAlignedBoundaryWalls(wall: WallData, walls: WallData[]): WallData[] {
  console.log("\nFinding aligned walls for:", wall.id);
  
  // First pass: find all walls that are aligned (same angle)
  const angle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
  console.log("Wall angle:", angle);
  
  const potentialAligned = walls.filter(w => {
    if (w === wall) return false;
    
    const otherAngle = Math.atan2(w.end.y - w.start.y, w.end.x - w.start.x);
    const aligned = Math.abs(angle - otherAngle) < 0.1 || Math.abs(Math.abs(angle - otherAngle) - Math.PI) < 0.1;
    if (aligned) {
      console.log("Found aligned wall:", w.id);
    }
    return aligned;
  });
  
  // Sort walls by their position along the main axis
  const isHorizontal = Math.abs(angle) < Math.PI/4 || Math.abs(angle) > 3*Math.PI/4;
  console.log("Is horizontal:", isHorizontal);
  
  const sortedWalls = [wall, ...potentialAligned].sort((a, b) => {
    if (isHorizontal) {
      return Math.min(a.start.x, a.end.x) - Math.min(b.start.x, b.end.x);
    } else {
      return Math.min(a.start.y, a.end.y) - Math.min(b.start.y, b.end.y);
    }
  });
  
  console.log("Sorted walls:", sortedWalls.map(w => w.id));
  
  // Find continuous segments
  let currentSegment = [sortedWalls[0]];
  const allSegments = [currentSegment];
  
  for (let i = 1; i < sortedWalls.length; i++) {
    const currentWall = sortedWalls[i];
    const prevWall = sortedWalls[i-1];
    
    // Check if walls are connected or very close
    const gap = isHorizontal ? 
      Math.abs(Math.max(prevWall.start.x, prevWall.end.x) - Math.min(currentWall.start.x, currentWall.end.x)) :
      Math.abs(Math.max(prevWall.start.y, prevWall.end.y) - Math.min(currentWall.start.y, currentWall.end.y));
    
    console.log(`Gap between ${prevWall.id} and ${currentWall.id}:`, gap);
    
    if (gap <= wall.thickness * 2) {
      currentSegment.push(currentWall);
      console.log(`Added ${currentWall.id} to current segment`);
    } else {
      currentSegment = [currentWall];
      allSegments.push(currentSegment);
      console.log(`Started new segment with ${currentWall.id}`);
    }
  }
  
  // Find the segment containing our wall
  const targetSegment = allSegments.find(segment => segment.includes(wall));
  console.log("Final segment walls:", targetSegment.map(w => w.id));
  
  return targetSegment || [wall];
}

function isParallel(wall1: WallData, wall2: WallData): boolean {
  const dx1 = wall1.end.x - wall1.start.x;
  const dy1 = wall1.end.y - wall1.start.y;
  const dx2 = wall2.end.x - wall2.start.x;
  const dy2 = wall2.end.y - wall2.start.y;
  
  const angle1 = Math.atan2(dy1, dx1);
  const angle2 = Math.atan2(dy2, dx2);
  
  // Consider walls parallel if their angles are within 1 degree
  return Math.abs(angle1 - angle2) < Math.PI / 180 || 
         Math.abs(angle1 - angle2) > Math.PI * 179 / 180;
}

function getWallLength(wall: WallData): number {
  return getDistance(wall.start, wall.end);
}

function findParallelWalls(walls: WallData[]): Map<string, WallData[]> {
  const parallelGroups = new Map<string, WallData[]>();
  
  walls.forEach((wall1) => {
    if (!Array.from(parallelGroups.values()).flat().includes(wall1)) {
      const group = walls.filter(wall2 => 
        wall1 !== wall2 && 
        isParallel(wall1, wall2) && 
        Math.abs(getWallLength(wall1) - getWallLength(wall2)) < 1
      );
      
      if (group.length > 0) {
        const key = `${getWallLength(wall1).toFixed(1)}`;
        parallelGroups.set(key, [wall1, ...group]);
      } else {
        const key = `${getWallLength(wall1).toFixed(1)}_${wall1.id}`;
        parallelGroups.set(key, [wall1]);
      }
    }
  });
  
  return parallelGroups;
}

function isHorizontal(wall: WallData): boolean {
  const dy = Math.abs(wall.end.y - wall.start.y);
  return dy < 1; // Consider wall horizontal if vertical difference is less than 1 pixel
}

function isVertical(wall: WallData): boolean {
  const dx = Math.abs(wall.end.x - wall.start.x);
  return dx < 1; // Consider wall vertical if horizontal difference is less than 1 pixel
}

function getWallsAtHeight(walls: WallData[], y: number, tolerance: number = 1): WallData[] {
  return walls.filter(wall => 
    Math.abs(wall.start.y - y) < tolerance || 
    Math.abs(wall.end.y - y) < tolerance
  );
}

function getWallsAtX(walls: WallData[], x: number, tolerance: number = 1): WallData[] {
  return walls.filter(wall => 
    Math.abs(wall.start.x - x) < tolerance || 
    Math.abs(wall.end.x - x) < tolerance
  );
}

function findUniqueWallGroups(walls: WallData[]): WallData[][] {
  const groups: WallData[][] = [];
  const processedWalls = new Set<string>();

  walls.forEach(wall1 => {
    if (!processedWalls.has(wall1.id)) {
      const isWall1Horizontal = isHorizontal(wall1);
      const wall1Length = getWallLength(wall1);
      const group = walls.filter(wall2 => {
        if (processedWalls.has(wall2.id)) return false;
        
        const isWall2Horizontal = isHorizontal(wall2);
        const wall2Length = getWallLength(wall2);
        
        // Group walls if they:
        // 1. Have the same orientation (both horizontal or both vertical)
        // 2. Have the same length (within 1 pixel)
        // 3. Are at the same height (for horizontal) or x-position (for vertical)
        return (
          isWall1Horizontal === isWall2Horizontal &&
          Math.abs(wall1Length - wall2Length) < 1 &&
          (isWall1Horizontal 
            ? Math.abs(wall1.start.y - wall2.start.y) < 1
            : Math.abs(wall1.start.x - wall2.start.x) < 1)
        );
      });

      group.forEach(w => processedWalls.add(w.id));
      if (group.length > 0) {
        groups.push([wall1, ...group]);
      }
    }
  });

  return groups;
}

function findUniqueWallLengths(walls: WallData[]): Map<number, WallData> {
  const lengthMap = new Map<number, WallData>();
  
  walls.forEach(wall => {
    const length = Math.round(getWallLength(wall));
    if (!lengthMap.has(length)) {
      lengthMap.set(length, wall);
    }
  });
  
  return lengthMap;
}

function isOuterWall(wall: WallData, walls: WallData[]): boolean {
  // Get the midpoint of the wall
  const midX = (wall.start.x + wall.end.x) / 2;
  const midY = (wall.start.y + wall.end.y) / 2;
  
  // Check if this is a vertical wall
  const isVertical = Math.abs(wall.start.x - wall.end.x) < 1;
  
  if (isVertical) {
    // For vertical walls, check if there are any walls to the left or right
    const hasWallLeft = walls.some(w => {
      const otherMidX = (w.start.x + w.end.x) / 2;
      return w !== wall && otherMidX < midX && Math.abs(w.start.y - midY) < 1;
    });
    
    const hasWallRight = walls.some(w => {
      const otherMidX = (w.start.x + w.end.x) / 2;
      return w !== wall && otherMidX > midX && Math.abs(w.start.y - midY) < 1;
    });
    
    return !hasWallLeft || !hasWallRight;
  } else {
    // For horizontal walls, check if there are any walls above or below
    const hasWallAbove = walls.some(w => {
      const otherMidY = (w.start.y + w.end.y) / 2;
      return w !== wall && otherMidY < midY && Math.abs(w.start.x - midX) < 1;
    });
    
    const hasWallBelow = walls.some(w => {
      const otherMidY = (w.start.y + w.end.y) / 2;
      return w !== wall && otherMidY > midY && Math.abs(w.start.x - midX) < 1;
    });
    
    return !hasWallAbove || !hasWallBelow;
  }
}

function findBottomAndLeftWalls(walls: WallData[]): { bottomWall?: WallData, leftWall?: WallData } {
  let bottomWall: WallData | undefined;
  let leftWall: WallData | undefined;
  let maxY = -Infinity;
  let minX = Infinity;

  // Debug wall count and positions
  console.log("\n=== Wall Analysis ===");
  console.log(`Total walls: ${walls.length}`);
  
  walls.forEach((wall, index) => {
    const midY = (wall.start.y + wall.end.y) / 2;
    const midX = (wall.start.x + wall.end.x) / 2;
    const isVertical = Math.abs(wall.start.x - wall.end.x) < 1;
    const length = Math.round(getWallLength(wall));

    console.log("\nWall", index + 1, ":", {
      orientation: isVertical ? "vertical" : "horizontal",
      length: `${length}'`,
      position: {
        midX: Math.round(midX),
        midY: Math.round(midY)
      }
    });

    if (!isVertical && midY > maxY) {
      maxY = midY;
      bottomWall = wall;
      console.log("-> Selected as bottom wall (Y:", Math.round(midY), ")");
    }

    if (isVertical && midX < minX) {
      minX = midX;
      leftWall = wall;
      console.log("-> Selected as left wall (X:", Math.round(midX), ")");
    }
  });

  return { bottomWall, leftWall };
}

// Draw walls with measurements
export function drawWalls(
  ctx: CanvasRenderingContext2D, 
  walls: WallData[],
  showMeasurements: boolean = false
) {
  console.log("\n=== Drawing Walls ===");
  console.log(`Drawing ${walls.length} walls`);
  console.log("Wall data:", walls);

  // Draw all walls first
  walls.forEach((wall, index) => {
    console.log(`Drawing wall ${index}:`, {
      start: wall.start,
      end: wall.end,
      hasControlPoints: !!wall.controlPoints?.length
    });

    ctx.save();
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 10;
    ctx.lineCap = "square";
    
    ctx.beginPath();
    ctx.moveTo(wall.start.x, wall.start.y);
    
    if (wall.controlPoints && wall.controlPoints.length > 0) {
      const start = wall.start;
      const end = wall.end;
      const cp = wall.controlPoints[0];

      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      
      // Calculate control point for curved wall
      const cpX = midX + cp.x * dy;
      const cpY = midY - cp.y * dx;
      
      ctx.quadraticCurveTo(cpX, cpY, end.x, end.y);
    } else {
      ctx.lineTo(wall.end.x, wall.end.y);
    }
    
    ctx.stroke();
    ctx.restore();
  });

  // Draw measurements if enabled
  if (showMeasurements) {
    // Only draw top/left measurements for completed walls
    drawWallMeasurements(ctx, walls, true);
  }
}

// Helper functions for wall measurements
function drawWallMeasurements(ctx: CanvasRenderingContext2D, walls: WallData[], showMeasurements: boolean) {
  if (!showMeasurements) return;
  
  console.log('\n=== Wall Analysis ===');
  console.log('Total walls:', walls.length);
  
  // Find the leftmost vertical wall and topmost horizontal wall
  let topWall: WallData | null = null;
  let leftWall: WallData | null = null;
  let minY = Infinity;
  let minX = Infinity;

  walls.forEach((wall, index) => {
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const angle = Math.atan2(dy, dx);
    const orientation = Math.abs(angle) < Math.PI / 4 || Math.abs(angle) > (3 * Math.PI) / 4 ? 'horizontal' : 'vertical';
    
    // For horizontal walls, use the minimum Y
    const y = Math.min(wall.start.y, wall.end.y);
    // For vertical walls, use the minimum X
    const x = Math.min(wall.start.x, wall.end.x);
    // Get wall length
    const length = getWallLength(wall);
    const lengthInFeet = (length / PIXELS_PER_FOOT).toFixed(2);

    console.log(`\nWall ${index + 1}:`, { 
      orientation, 
      length: lengthInFeet + "'", 
      position: { x, y },
      angle: (angle * 180 / Math.PI).toFixed(1) + '°',
      start: wall.start,
      end: wall.end
    });

    // Check if this is a horizontal wall (nearly 0° or 180°)
    const isHorizontal = Math.abs(Math.abs(angle) - Math.PI) < Math.PI / 4 || Math.abs(angle) < Math.PI / 4;
    // Check if this is a vertical wall (nearly 90° or 270°)
    const isVertical = Math.abs(Math.abs(angle) - Math.PI/2) < Math.PI / 4;

    console.log(`Wall ${index + 1} analysis:`, {
      isHorizontal,
      isVertical,
      angle: (angle * 180 / Math.PI).toFixed(1) + '°'
    });

    if (isHorizontal) {
      if (y < minY || (y === minY && x < (topWall?.start.x ?? Infinity))) {
        console.log('-> Selected as top wall (Y:', y, ')');
        topWall = wall;
        minY = y;
      }
    } else if (isVertical) {
      if (x < minX || (x === minX && y < (leftWall?.start.y ?? Infinity))) {
        console.log('-> Selected as left wall (X:', x, ')');
        leftWall = wall;
        minX = x;
      }
    }
  });

  // Draw measurements for top and left walls only
  if (topWall) {
    const length = getWallLength(topWall);
    const lengthInFeet = (length / PIXELS_PER_FOOT).toFixed(2);
    drawTopWallMeasurement(ctx, topWall, lengthInFeet);
  }

  if (leftWall) {
    const length = getWallLength(leftWall);
    const lengthInFeet = (length / PIXELS_PER_FOOT).toFixed(2);
    drawLeftWallMeasurement(ctx, leftWall, lengthInFeet);
  }
}

function drawTopWallMeasurement(ctx: CanvasRenderingContext2D, wall: WallData, lengthInFeet: string) {
  console.log('Drawing top wall measurement:', { start: wall.start, end: wall.end, length: lengthInFeet });
  
  const midX = (wall.start.x + wall.end.x) / 2;
  const y = Math.min(wall.start.y, wall.end.y) - 25;

  ctx.save();
  ctx.font = '14px Arial';
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.fillText(`${lengthInFeet}'`, midX, y);
  ctx.restore();
}

function drawLeftWallMeasurement(ctx: CanvasRenderingContext2D, wall: WallData, lengthInFeet: string) {
  console.log('Drawing left wall measurement:', { start: wall.start, end: wall.end, length: lengthInFeet });
  
  const x = Math.min(wall.start.x, wall.end.x) - 25;
  const midY = (wall.start.y + wall.end.y) / 2;

  ctx.save();
  ctx.font = '14px Arial';
  ctx.fillStyle = '#000';
  ctx.textAlign = 'right';
  ctx.translate(x, midY);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(`${lengthInFeet}'`, 0, 0);
  ctx.restore();
}

// Helper function to get the combined wall length and endpoints
function getCombinedWallInfo(walls: WallData[]): { start: Point2D; end: Point2D; length: number } {
  if (walls.length === 0) return null;
  if (walls.length === 1) return {
    start: walls[0].start,
    end: walls[0].end,
    length: getDistance(walls[0].start, walls[0].end)
  };
  
  // Find the extreme points
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  walls.forEach(wall => {
    minX = Math.min(minX, wall.start.x, wall.end.x);
    minY = Math.min(minY, wall.start.y, wall.end.y);
    maxX = Math.max(maxX, wall.start.x, wall.end.x);
    maxY = Math.max(maxY, wall.start.y, wall.end.y);
  });
  
  // Get the primary direction of the walls
  const firstWall = walls[0];
  const angle = Math.atan2(firstWall.end.y - firstWall.start.y, firstWall.end.x - firstWall.start.x);
  const isHorizontal = Math.abs(angle) < Math.PI/4 || Math.abs(angle) > 3*Math.PI/4;
  
  // Use the first wall's position in the secondary axis
  const start = isHorizontal ? 
    { x: minX, y: firstWall.start.y } :
    { x: firstWall.start.x, y: minY };
  
  const end = isHorizontal ? 
    { x: maxX, y: firstWall.end.y } :
    { x: firstWall.end.x, y: maxY };
  
  return {
    start,
    end,
    length: getDistance(start, end)
  };
}

// Helper function to check if two points are close
function pointsAreClose(p1: Point2D, p2: Point2D): boolean {
  return Math.abs(p1.x - p2.x) < 10 && Math.abs(p1.y - p2.y) < 10;
}

// Helper function to get the angle between two walls
function getAngleBetweenWalls(wall1: WallData, wall2: WallData): number {
  const dx1 = wall1.end.x - wall1.start.x;
  const dy1 = wall1.end.y - wall1.start.y;
  const dx2 = wall2.end.x - wall2.start.x;
  const dy2 = wall2.end.y - wall2.start.y;
  
  const angle1 = Math.atan2(dy1, dx1);
  const angle2 = Math.atan2(dy2, dx2);
  
  let diff = Math.abs(angle1 - angle2);
  if (diff > Math.PI) diff = 2 * Math.PI - diff;
  return diff;
}

export function drawWallSegmentMeasurements(ctx: CanvasRenderingContext2D, walls: WallData[]) {
  walls.forEach(wall => {
    // Find all intersection points on this wall
    const intersections = findWallIntersections(wall, walls);
    if (intersections.length > 0) {
      // Sort points along the wall from start to end
      const points = [wall.start, ...intersections, wall.end].sort((a, b) => {
        const distA = getDistance(wall.start, a);
        const distB = getDistance(wall.start, b);
        return distA - distB;
      });
      
      // Draw measurements for each segment
      for (let i = 0; i < points.length - 1; i++) {
        const segmentLength = getDistance(points[i], points[i + 1]);
        
        // Skip segments shorter than 1 pixel (effectively 0)
        if (segmentLength < 1) continue;
        
        // Create a temporary wall object for each segment
        const segmentWall: WallData = {
          id: wall.id + '_segment_' + i,
          start: points[i],
          end: points[i + 1],
          thickness: wall.thickness,
          controlPoints: [],
          height: wall.height
        };
        drawWallMeasurement(ctx, segmentWall, 25, undefined, walls);
      }
    }
  });
}

// Draw in-progress wall with measurement
export function drawInProgressWall(
  ctx: CanvasRenderingContext2D, 
  wall: WallData,
  showMeasurements: boolean = true
) {
  ctx.save();
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 10;
  ctx.lineCap = "square";
  
  ctx.beginPath();
  ctx.moveTo(wall.start.x, wall.start.y);
  
  if (wall.controlPoints && wall.controlPoints.length > 0) {
    const start = wall.start;
    const end = wall.end;
    const cp = wall.controlPoints[0];
    
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    
    const cpX = midX + cp.x * dy;
    const cpY = midY - cp.y * dx;
    
    ctx.quadraticCurveTo(cpX, cpY, end.x, end.y);
  } else {
    ctx.lineTo(wall.end.x, wall.end.y);
  }
  
  ctx.stroke();
  
  // Always show measurement for in-progress wall
  if (showMeasurements) {
    const length = getDistance(wall.start, wall.end);
    drawWallMeasurement(ctx, wall, -25, length);
  }
  
  ctx.restore();
}

// Draw room preview with measurements
export function drawRoomPreview(
  ctx: CanvasRenderingContext2D, 
  start: Point2D, 
  end: Point2D,
  showMeasurements: boolean = true
) {
  ctx.save();
  
  // Draw preview rectangle
  ctx.strokeStyle = "#4a90e2";
  ctx.lineWidth = 10;
  ctx.lineCap = "square";
  
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.lineTo(start.x, end.y);
  ctx.lineTo(start.x, start.y);
  ctx.stroke();
  
  // Show measurements for preview
  if (showMeasurements) {
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);
    
    // Create temporary wall objects for measurements
    const topWall: WallData = {
      id: 'preview_top',
      start: { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y) },
      end: { x: Math.max(start.x, end.x), y: Math.min(start.y, end.y) },
      thickness: 10,
      controlPoints: [],
      height: 10
    };
    
    const leftWall: WallData = {
      id: 'preview_left',
      start: { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y) },
      end: { x: Math.min(start.x, end.x), y: Math.max(start.y, end.y) },
      thickness: 10,
      controlPoints: [],
      height: 10
    };
    
    // Draw measurements for preview walls
    drawTopWallMeasurement(ctx, topWall, (width / PIXELS_PER_FOOT).toFixed(2));
    drawLeftWallMeasurement(ctx, leftWall, (height / PIXELS_PER_FOOT).toFixed(2));
  }
  
  ctx.restore();
}
