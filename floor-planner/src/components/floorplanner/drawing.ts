// drawing.ts
import { WallData, Point2D } from "../../types";
import { pixelsToFeetAndInches } from "../../utils/geometryUtils";

const POINT_TOLERANCE = 1e-6;

// Helper function to draw wall measurement
function drawWallMeasurement(ctx: CanvasRenderingContext2D, start: Point2D, end: Point2D, offset: number = 20) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  
  // Calculate measurement line positions
  const offsetX = -Math.sin(angle) * offset;
  const offsetY = Math.cos(angle) * offset;
  
  const startOffsetX = start.x + offsetX;
  const startOffsetY = start.y + offsetY;
  const endOffsetX = end.x + offsetX;
  const endOffsetY = end.y + offsetY;
  
  // Draw extension lines
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(startOffsetX, startOffsetY);
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(endOffsetX, endOffsetY);
  ctx.strokeStyle = '#666666';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Draw measurement line with arrows
  ctx.beginPath();
  ctx.moveTo(startOffsetX, startOffsetY);
  ctx.lineTo(endOffsetX, endOffsetY);
  ctx.stroke();
  
  // Draw arrows
  const arrowSize = 6;
  const arrowAngle = Math.PI / 6; // 30 degrees
  
  // Start arrow
  ctx.beginPath();
  ctx.moveTo(startOffsetX, startOffsetY);
  ctx.lineTo(
    startOffsetX + arrowSize * Math.cos(angle + Math.PI - arrowAngle),
    startOffsetY + arrowSize * Math.sin(angle + Math.PI - arrowAngle)
  );
  ctx.moveTo(startOffsetX, startOffsetY);
  ctx.lineTo(
    startOffsetX + arrowSize * Math.cos(angle + Math.PI + arrowAngle),
    startOffsetY + arrowSize * Math.sin(angle + Math.PI + arrowAngle)
  );
  ctx.stroke();
  
  // End arrow
  ctx.beginPath();
  ctx.moveTo(endOffsetX, endOffsetY);
  ctx.lineTo(
    endOffsetX + arrowSize * Math.cos(angle - arrowAngle),
    endOffsetY + arrowSize * Math.sin(angle - arrowAngle)
  );
  ctx.moveTo(endOffsetX, endOffsetY);
  ctx.lineTo(
    endOffsetX + arrowSize * Math.cos(angle + arrowAngle),
    endOffsetY + arrowSize * Math.sin(angle + arrowAngle)
  );
  ctx.stroke();
  
  // Draw measurement text
  const midX = (startOffsetX + endOffsetX) / 2;
  const midY = (startOffsetY + endOffsetY) / 2;
  const measurement = pixelsToFeetAndInches(length);
  
  ctx.save();
  ctx.translate(midX, midY);
  
  // Rotate text to match wall angle, but keep it readable
  let textAngle = angle;
  if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
    textAngle += Math.PI;
  }
  ctx.rotate(textAngle);
  
  // Draw white background for text
  ctx.font = '12px Arial';
  const textMetrics = ctx.measureText(measurement);
  const padding = 2;
  
  ctx.fillStyle = 'white';
  ctx.fillRect(
    -textMetrics.width / 2 - padding,
    -8 - padding,
    textMetrics.width + 2 * padding,
    16 + 2 * padding
  );
  
  // Draw text
  ctx.fillStyle = '#666666';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(measurement, 0, 0);
  
  ctx.restore();
}

// Helper function to find wall intersections
function findWallIntersections(wall: WallData, walls: WallData[]): Point2D[] {
  const intersections: Set<string> = new Set(); // Use Set to avoid duplicates
  
  for (const otherWall of walls) {
    if (wall === otherWall) continue;
    
    // Skip curved walls for now
    if (wall.controlPoints?.length || otherWall.controlPoints?.length) continue;
    
    // Only consider walls that are parallel or perpendicular
    const angle = getWallAngle(wall, otherWall);
    if (angle > 0.1 && Math.abs(angle - Math.PI/2) > 0.1) continue;
    
    // For parallel walls, only consider if they're directly across from each other
    if (areWallsParallel(wall, otherWall)) {
      const dist = getParallelWallDistance(wall, otherWall);
      // Skip if walls are too far apart (not likely to be part of same room)
      if (dist > 200) continue;
      
      // Only consider endpoints that are within the wall's span
      const wallSpan = getWallSpan(wall);
      const otherWallSpan = getWallSpan(otherWall);
      
      if (doSpansOverlap(wallSpan, otherWallSpan)) {
        const points = [otherWall.start, otherWall.end];
        for (const point of points) {
          const projection = projectPointOnWall(point, wall);
          if (projection) {
            intersections.add(JSON.stringify(projection));
          }
        }
      }
    } else {
      // For perpendicular walls, just check endpoints
      const points = [otherWall.start, otherWall.end];
      for (const point of points) {
        const { distance, nearestPoint } = getDistanceToLineSegment(point, wall.start, wall.end);
        if (distance <= POINT_TOLERANCE) {
          intersections.add(JSON.stringify(nearestPoint));
        }
      }
    }
  }
  
  return Array.from(intersections).map(str => JSON.parse(str));
}

// Check if two walls are parallel
function areWallsParallel(wall1: WallData, wall2: WallData): boolean {
  const dx1 = wall1.end.x - wall1.start.x;
  const dy1 = wall1.end.y - wall1.start.y;
  const dx2 = wall2.end.x - wall2.start.x;
  const dy2 = wall2.end.y - wall2.start.y;
  
  // Calculate angles and compare
  const angle1 = Math.atan2(dy1, dx1);
  const angle2 = Math.atan2(dy2, dx2);
  
  // Account for angles being the same or 180 degrees apart
  const angleDiff = Math.abs(angle1 - angle2);
  return angleDiff < 0.1 || Math.abs(angleDiff - Math.PI) < 0.1;
}

// Project a point onto a wall, return null if projection is outside wall segment
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
function getDistance(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Helper function to calculate distance from a point to a line segment
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

// Get the distance between parallel walls
function getParallelWallDistance(wall1: WallData, wall2: WallData): number {
  // Project start point of wall2 onto line of wall1
  const { distance } = getDistanceToLineSegment(wall2.start, wall1.start, wall1.end);
  return distance;
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

export function drawWalls(ctx: CanvasRenderingContext2D, walls: WallData[]) {
  // Draw walls
  walls.forEach(wall => {
    ctx.beginPath();
    ctx.moveTo(wall.start.x, wall.start.y);
    
    if (wall.controlPoints && wall.controlPoints.length > 0) {
      // Draw curved wall
      ctx.quadraticCurveTo(
        wall.controlPoints[0].x,
        wall.controlPoints[0].y,
        wall.end.x,
        wall.end.y
      );
    } else {
      // Draw straight wall
      ctx.lineTo(wall.end.x, wall.end.y);
    }
    
    ctx.lineWidth = wall.thickness;
    ctx.strokeStyle = '#000000';
    ctx.stroke();
    
    // Draw endpoints
    ctx.beginPath();
    ctx.arc(wall.start.x, wall.start.y, 3, 0, 2 * Math.PI);
    ctx.arc(wall.end.x, wall.end.y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = '#0000ff';
    ctx.fill();
    
    // Draw measurement with offset
    drawWallMeasurement(ctx, wall.start, wall.end);
  });
}

export function drawInProgressWall(ctx: CanvasRenderingContext2D, wall: WallData) {
  ctx.beginPath();
  ctx.moveTo(wall.start.x, wall.start.y);
  
  if (wall.controlPoints && wall.controlPoints.length > 0) {
    // Draw curved wall preview
    ctx.quadraticCurveTo(
      wall.controlPoints[0].x,
      wall.controlPoints[0].y,
      wall.end.x,
      wall.end.y
    );
  } else {
    // Draw straight wall preview
    ctx.lineTo(wall.end.x, wall.end.y);
  }
  
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = wall.thickness;
  ctx.strokeStyle = '#666666';
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Draw endpoints
  ctx.beginPath();
  ctx.arc(wall.start.x, wall.start.y, 3, 0, 2 * Math.PI);
  ctx.arc(wall.end.x, wall.end.y, 3, 0, 2 * Math.PI);
  ctx.fillStyle = '#0000ff';
  ctx.fill();
  
  // Draw measurement with offset
  drawWallMeasurement(ctx, wall.start, wall.end);
}

// Draw measurements for wall segments
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
        drawWallMeasurement(ctx, points[i], points[i + 1], 20);
      }
    }
  });
}
