import { Point2D, CurvedWallData } from '../types';

/**
 * Generate points along a Bezier curve
 */
export function generateBezierPoints(
  start: Point2D,
  end: Point2D,
  controlPoints: Point2D[],
  segments: number = 32
): Point2D[] {
  const points: Point2D[] = [];
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = getBezierPoint(t, start, end, controlPoints);
    points.push(point);
  }
  
  return points;
}

/**
 * Get a point along a Bezier curve at time t
 */
function getBezierPoint(
  t: number,
  start: Point2D,
  end: Point2D,
  controlPoints: Point2D[]
): Point2D {
  const points = [start, ...controlPoints, end];
  let tmp = [...points];
  
  for (let i = points.length - 1; i > 0; i--) {
    for (let j = 0; j < i; j++) {
      tmp[j] = {
        x: tmp[j].x * (1 - t) + tmp[j + 1].x * t,
        y: tmp[j].y * (1 - t) + tmp[j + 1].y * t
      };
    }
  }
  
  return tmp[0];
}

/**
 * Generate points along a circular arc
 */
export function generateArcPoints(
  start: Point2D,
  end: Point2D,
  radius: number,
  segments: number = 32
): Point2D[] {
  const points: Point2D[] = [];
  const center = getArcCenter(start, end, radius);
  
  if (!center) return [start, end];
  
  const startAngle = Math.atan2(start.y - center.y, start.x - center.x);
  const endAngle = Math.atan2(end.y - center.y, end.x - center.x);
  let deltaAngle = endAngle - startAngle;
  
  // Ensure we take the shorter path around the circle
  if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
  if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = startAngle + deltaAngle * t;
    points.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle)
    });
  }
  
  return points;
}

/**
 * Calculate the center point of an arc given two points and a radius
 */
function getArcCenter(start: Point2D, end: Point2D, radius: number): Point2D | null {
  const midPoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2
  };
  
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance > 2 * radius) return null; // Arc impossible with this radius
  
  const h = Math.sqrt(radius * radius - (distance * distance) / 4);
  
  return {
    x: midPoint.x - h * dy / distance,
    y: midPoint.y + h * dx / distance
  };
}

/**
 * Generate points for a curved wall
 */
export function generateWallPoints(wall: CurvedWallData): Point2D[] {
  if (wall.radius) {
    return generateArcPoints(wall.start, wall.end, wall.radius, wall.segments);
  } else {
    return generateBezierPoints(wall.start, wall.end, wall.controlPoints, wall.segments);
  }
}
