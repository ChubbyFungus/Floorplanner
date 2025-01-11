// drawing.ts
import { WallData, Point2D } from "../../types";
import { pixelsToFeetAndInches } from "../../utils/geometryUtils";

const POINT_TOLERANCE = 1e-6;

// Helper function to draw wall measurement
function drawWallMeasurement(ctx: CanvasRenderingContext2D, wall: WallData, offset: number = 20, length?: number, walls: WallData[]) {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const actualLength = length || getInteriorWallLength(wall);
  const angle = Math.atan2(dy, dx);
  
  // Calculate wall direction unit vector
  const wallLength = Math.sqrt(dx * dx + dy * dy);
  const dirX = dx / wallLength;
  const dirY = dy / wallLength;
  
  // Adjust start and end points to account for wall thickness
  const halfThickness = wall.thickness / 2;
  const adjustedStart = {
    x: wall.start.x + dirX * halfThickness,
    y: wall.start.y + dirY * halfThickness
  };
  const adjustedEnd = {
    x: wall.end.x - dirX * halfThickness,
    y: wall.end.y - dirY * halfThickness
  };
  
  // Determine which side to show measurement based on wall position
  const measurementSide = getMeasurementSide(wall, walls);
  
  // Calculate measurement line positions with adjusted offset
  const offsetX = Math.sin(angle) * offset * measurementSide;
  const offsetY = -Math.cos(angle) * offset * measurementSide;
  
  const startOffsetX = adjustedStart.x + offsetX;
  const startOffsetY = adjustedStart.y + offsetY;
  const endOffsetX = adjustedEnd.x + offsetX;
  const endOffsetY = adjustedEnd.y + offsetY;
  
  // Draw extension lines
  ctx.beginPath();
  ctx.moveTo(adjustedStart.x, adjustedStart.y);
  ctx.lineTo(startOffsetX, startOffsetY);
  ctx.moveTo(adjustedEnd.x, adjustedEnd.y);
  ctx.lineTo(endOffsetX, endOffsetY);
  ctx.strokeStyle = '#666666';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  
  // Draw measurement line
  ctx.beginPath();
  ctx.moveTo(startOffsetX, startOffsetY);
  ctx.lineTo(endOffsetX, endOffsetY);
  ctx.stroke();
  
  // Draw arrows
  const arrowSize = 5;
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
  const measurement = pixelsToFeetAndInches(actualLength);
  
  ctx.save();
  ctx.translate(midX, midY);
  
  // Keep text upright
  let textAngle = angle;
  if (angle > Math.PI/2 || angle < -Math.PI/2) {
    textAngle += Math.PI;
  }
  ctx.rotate(textAngle);
  
  // Draw white background for text
  ctx.font = '10px Arial';
  const textMetrics = ctx.measureText(measurement);
  const padding = 2;
  
  ctx.fillStyle = 'white';
  ctx.fillRect(
    -textMetrics.width / 2 - padding,
    -6 - padding,
    textMetrics.width + 2 * padding,
    12 + 2 * padding
  );
  
  // Draw text
  ctx.fillStyle = '#666666';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(measurement, 0, 0);
  
  ctx.restore();
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

// Helper function to normalize measurements for parallel walls
function normalizeParallelMeasurements(walls: WallData[]): Map<string, number> {
  const measurements = new Map<string, number>();
  
  for (let i = 0; i < walls.length; i++) {
    for (let j = i + 1; j < walls.length; j++) {
      const wall1 = walls[i];
      const wall2 = walls[j];
      
      if (areWallsParallel(wall1, wall2)) {
        const dist = getParallelWallDistance(wall1, wall2);
        if (dist > 200) continue; // Skip if walls are too far apart
        
        const length1 = getInteriorWallLength(wall1);
        const length2 = getInteriorWallLength(wall2);
        
        // Use the average length for both walls
        const avgLength = (length1 + length2) / 2;
        const key1 = `${wall1.start.x},${wall1.start.y}-${wall1.end.x},${wall1.end.y}`;
        const key2 = `${wall2.start.x},${wall2.start.y}-${wall2.end.x},${wall2.end.y}`;
        
        measurements.set(key1, avgLength);
        measurements.set(key2, avgLength);
      }
    }
  }
  
  return measurements;
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

// Helper function to check if two points are equal within tolerance
function arePointsEqual(p1: Point2D, p2: Point2D): boolean {
  return Math.abs(p1.x - p2.x) < POINT_TOLERANCE && Math.abs(p1.y - p2.y) < POINT_TOLERANCE;
}

// Helper function to check if a wall is part of a room boundary
function isRoomBoundaryWall(wall: WallData, walls: WallData[]): boolean {
  // For now, consider any wall that has perpendicular connections at both ends as a boundary
  const connectedWalls = walls.filter(w => {
    if (w === wall) return false;
    
    // Check if wall connects at either end
    const connectsAtStart = arePointsEqual(w.start, wall.start) || arePointsEqual(w.end, wall.start);
    const connectsAtEnd = arePointsEqual(w.start, wall.end) || arePointsEqual(w.end, wall.end);
    
    if (!connectsAtStart && !connectsAtEnd) return false;
    
    // Check if it's roughly perpendicular
    const angle = getWallAngle(wall, w);
    return Math.abs(angle - Math.PI/2) < 0.1;
  });
  
  // Count perpendicular connections at each end
  const startConnections = connectedWalls.filter(w => 
    arePointsEqual(w.start, wall.start) || arePointsEqual(w.end, wall.start)
  ).length;
  
  const endConnections = connectedWalls.filter(w => 
    arePointsEqual(w.start, wall.end) || arePointsEqual(w.end, wall.end)
  ).length;
  
  // It's a boundary wall if it has at least one perpendicular connection
  return startConnections > 0 || endConnections > 0;
}

// Helper function to determine if a wall should show measurements
function shouldShowWallMeasurement(wall: WallData, walls: WallData[]): boolean {
  // For simple rectangles, always show measurements
  if (walls.length <= 4) return true;
  
  // For more complex layouts, use boundary detection
  if (isRoomBoundaryWall(wall, walls)) {
    const length = getDistance(wall.start, wall.end);
    if (length < 36) return false; // Skip very small walls (less than 3 feet)
    
    // Skip walls that are part of a larger aligned wall
    for (const otherWall of walls) {
      if (wall === otherWall) continue;
      
      // Check if walls are aligned (same line)
      const angle = getWallAngle(wall, otherWall);
      if (angle < 0.1 || Math.abs(angle - Math.PI) < 0.1) {
        // Check if walls are close to each other
        const dist = getParallelWallDistance(wall, otherWall);
        if (dist < wall.thickness * 2) {
          // Check if this wall is shorter
          const otherLength = getDistance(otherWall.start, otherWall.end);
          if (length < otherLength) return false;
        }
      }
    }
    
    return true;
  }
  
  return false; // Don't show measurements for non-boundary walls
}

// Helper function to check if a wall intersection should split the measurement
function shouldSplitAtIntersection(wall: WallData, intersection: Point2D, walls: WallData[]): boolean {
  // Find walls that connect at this intersection
  const connectingWalls = walls.filter(w => {
    if (w === wall) return false;
    return arePointsEqual(w.start, intersection) || arePointsEqual(w.end, intersection);
  });
  
  // Don't split if there's only one connecting wall
  if (connectingWalls.length === 1) {
    const connectingWall = connectingWalls[0];
    
    // Don't split if the connecting wall is small (like a doorway)
    const connectingLength = getDistance(connectingWall.start, connectingWall.end);
    if (connectingLength < 60) return false;
    
    // Don't split if the connecting wall is perpendicular
    const angle = getWallAngle(wall, connectingWall);
    if (Math.abs(angle - Math.PI/2) < 0.1) return false;
  }
  
  // Split only if there are multiple significant connecting walls
  return connectingWalls.length > 1 && 
         connectingWalls.some(w => getDistance(w.start, w.end) >= 60);
}

export function drawWalls(ctx: CanvasRenderingContext2D, walls: WallData[]) {
  // First normalize measurements for parallel walls
  const normalizedMeasurements = normalizeParallelMeasurements(walls);
  
  // Draw walls
  walls.forEach(wall => {
    // Draw the wall
    ctx.beginPath();
    ctx.moveTo(wall.start.x, wall.start.y);
    ctx.lineTo(wall.end.x, wall.end.y);
    ctx.lineWidth = wall.thickness;
    ctx.strokeStyle = '#000000';
    ctx.stroke();
    
    // Draw endpoints
    ctx.beginPath();
    ctx.arc(wall.start.x, wall.start.y, 3, 0, 2 * Math.PI);
    ctx.arc(wall.end.x, wall.end.y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = '#0000ff';
    ctx.fill();
    
    // Only show measurements for appropriate walls
    if (shouldShowWallMeasurement(wall, walls)) {
      const wallKey = `${wall.start.x},${wall.start.y}-${wall.end.x},${wall.end.y}`;
      const normalizedLength = normalizedMeasurements.get(wallKey);
      drawWallMeasurement(ctx, wall, 25, normalizedLength, walls);
    }
  });
  
  // Draw segment measurements only for walls that need them
  walls.forEach(wall => {
    if (!shouldShowWallMeasurement(wall, walls)) return;
    
    const intersections = findWallIntersections(wall, walls)
      .filter(intersection => shouldSplitAtIntersection(wall, intersection, walls));
    
    if (intersections.length > 0) {
      // Sort points along the wall from start to end
      const points = [wall.start, ...intersections, wall.end].sort((a, b) => {
        const distA = getDistance(wall.start, a);
        const distB = getDistance(wall.start, b);
        return distA - distB;
      });
      
      // Draw measurements for each segment
      for (let i = 0; i < points.length - 1; i++) {
        const segmentWall: WallData = {
          id: wall.id + '_segment_' + i,
          start: points[i],
          end: points[i + 1],
          thickness: wall.thickness,
          controlPoints: []
        };
        drawWallMeasurement(ctx, segmentWall, 25, undefined, walls);
      }
    }
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
  drawWallMeasurement(ctx, wall, 20, undefined, []);
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
        // Create a temporary wall object for each segment
        const segmentWall: WallData = {
          id: wall.id + '_segment_' + i,
          start: points[i],
          end: points[i + 1],
          thickness: wall.thickness,
          controlPoints: []
        };
        drawWallMeasurement(ctx, segmentWall, 25, undefined, walls);
      }
    }
  });
}
