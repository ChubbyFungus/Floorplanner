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
  findWallIntersections
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

export function drawWalls(ctx: CanvasRenderingContext2D, walls: WallData[]) {
  console.log("\nDrawing walls:", walls.map(w => w.id));
  
  // First normalize measurements for parallel walls
  const normalizedMeasurements = normalizeParallelMeasurements(walls);
  
  // Calculate total area
  const { totalArea } = calculateAreaAndVolume(walls, []);
  
  // First draw all walls
  walls.forEach((wall) => {
    ctx.save();
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 10;  // Thick walls
    ctx.lineCap = "square";  // Square ends for walls
    
    ctx.beginPath();
    ctx.moveTo(wall.start.x, wall.start.y);
    
    if (wall.controlPoints && wall.controlPoints.length > 0) {
      const start = wall.start;
      const end = wall.end;
      const cp = wall.controlPoints[0];

      // Calculate midpoint and control point
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const normalX = -dy / dist;
      const normalY = dx / dist;

      // Calculate how far the control point is from the line
      const cpDist = (cp.x - start.x) * normalX + (cp.y - start.y) * normalY;
      
      // Use quadratic curve for smoother control
      const controlX = midX + normalX * cpDist;
      const controlY = midY + normalY * cpDist;
      
      ctx.quadraticCurveTo(controlX, controlY, end.x, end.y);
    } else {
      ctx.lineTo(wall.end.x, wall.end.y);
    }
    ctx.stroke();
    ctx.restore();

    // Draw measurement for this wall
    const length = normalizedMeasurements.get(wall.id);
    if (length !== undefined) {
      const measurementOffset = shouldShowWallMeasurement(wall, walls) ? -25 : 25;
      drawWallMeasurement(ctx, wall, measurementOffset, length, walls);
    }
  });
  
  // Draw total area if we have a valid area
  if (totalArea > 0) {
    const areaText = `Area: ${Math.round(totalArea)} sq ft`;
    ctx.save();
    ctx.font = "14px Arial";
    ctx.fillStyle = "#000";
    ctx.fillText(areaText, 10, 20);
    ctx.restore();
  }
}

export function drawInProgressWall(ctx: CanvasRenderingContext2D, wall: WallData) {
  ctx.save();
  ctx.strokeStyle = "#333";  // Same color as regular walls
  ctx.lineWidth = 10;  // Same thickness as regular walls
  ctx.lineCap = "square";  // Same square caps as regular walls
  
  ctx.beginPath();
  ctx.moveTo(wall.start.x, wall.start.y);
  
  if (wall.controlPoints && wall.controlPoints.length > 0) {
    const start = wall.start;
    const end = wall.end;
    const cp = wall.controlPoints[0];

    // Calculate midpoint and control point
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const normalX = -dy / dist;
    const normalY = dx / dist;

    // Calculate how far the control point is from the line
    const cpDist = (cp.x - start.x) * normalX + (cp.y - start.y) * normalY;
    
    // Use quadratic curve for smoother control
    const controlX = midX + normalX * cpDist;
    const controlY = midY + normalY * cpDist;
    
    ctx.quadraticCurveTo(controlX, controlY, end.x, end.y);
  } else {
    ctx.lineTo(wall.end.x, wall.end.y);
  }
  ctx.stroke();

  // Draw measurement for in-progress wall
  const length = getDistance(wall.start, wall.end);
  const measurement = pixelsToFeetAndInches(length);
  
  // Position the text above the wall
  const midX = (wall.start.x + wall.end.x) / 2;
  const midY = (wall.start.y + wall.end.y) / 2;
  
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  
  // Draw white background
  const textMetrics = ctx.measureText(measurement);
  const padding = 2;
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.fillRect(
    midX - textMetrics.width / 2 - padding,
    midY - 40,
    textMetrics.width + padding * 2,
    16
  );
  
  // Draw the measurement text
  ctx.fillStyle = "#000"; // Use black for in-progress measurement
  ctx.fillText(measurement, midX, midY - 25);
  
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
