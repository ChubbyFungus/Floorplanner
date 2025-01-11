// drawing.ts
import { WallData, Point2D } from "../../types";
import { pixelsToFeetAndInches } from "../../utils/geometryUtils";

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
  const intersections: Point2D[] = [];
  
  // Check for intersections with other walls
  walls.forEach(otherWall => {
    if (wall !== otherWall) {
      const intersection = findIntersection(wall.start, wall.end, otherWall.start, otherWall.end);
      if (intersection) {
        intersections.push(intersection);
      }
    }
  });
  
  return intersections;
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
