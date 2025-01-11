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
  
  // Calculate measurement text position
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  
  // Offset perpendicular to the wall
  const offsetX = -Math.sin(angle) * offset;
  const offsetY = Math.cos(angle) * offset;
  
  const textX = midX + offsetX;
  const textY = midY + offsetY;
  
  // Draw measurement text
  ctx.save();
  ctx.translate(textX, textY);
  
  // Rotate text to match wall angle, but keep it readable
  let textAngle = angle;
  if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
    textAngle += Math.PI;
  }
  ctx.rotate(textAngle);
  
  // Draw white background for text
  const measurement = pixelsToFeetAndInches(length);
  ctx.font = '12px Arial';
  const textMetrics = ctx.measureText(measurement);
  const padding = 4;
  
  ctx.fillStyle = 'white';
  ctx.fillRect(
    -textMetrics.width / 2 - padding,
    -8 - padding,
    textMetrics.width + padding * 2,
    16 + padding * 2
  );
  
  // Draw text
  ctx.fillStyle = '#000000';
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
    
    // Check if any point of otherWall lies on wall
    const points = [otherWall.start, otherWall.end];
    for (const point of points) {
      const { distance, nearestPoint } = getDistanceToLineSegment(point, wall.start, wall.end);
      if (distance <= POINT_TOLERANCE) {
        // Add point as JSON string to ensure unique points
        intersections.add(JSON.stringify(nearestPoint));
      }
    }
    
    // Check if any point of wall lies on otherWall
    const wallPoints = [wall.start, wall.end];
    for (const point of wallPoints) {
      const { distance, nearestPoint } = getDistanceToLineSegment(point, otherWall.start, otherWall.end);
      if (distance <= POINT_TOLERANCE) {
        intersections.add(JSON.stringify(nearestPoint));
      }
    }
    
    // Check for T-junctions and parallel wall segments
    if (areWallsParallel(wall, otherWall)) {
      // Project wall endpoints onto otherWall
      const wallProjections = [
        projectPointOnWall(wall.start, otherWall),
        projectPointOnWall(wall.end, otherWall)
      ];
      
      // Project otherWall endpoints onto wall
      const otherWallProjections = [
        projectPointOnWall(otherWall.start, wall),
        projectPointOnWall(otherWall.end, wall)
      ];
      
      // Add all valid projections
      [...wallProjections, ...otherWallProjections].forEach(proj => {
        if (proj) intersections.add(JSON.stringify(proj));
      });
    }
  }
  
  // Convert back to points
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
