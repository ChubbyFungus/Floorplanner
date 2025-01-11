// Types for geometry calculations
export interface Point2D {
    x: number;
    y: number;
}

export interface Wall {
    start: Point2D;
    end: Point2D;
    controlPoints?: Point2D[];  // Optional control points for curved walls
}

/**
 * Converts a curved wall into a series of straight line segments
 * @param wall The wall to subdivide
 * @param segments Number of segments to divide the curve into (default: 10)
 * @returns Array of points representing the subdivided wall
 */
export function subdivideWall(wall: Wall, segments: number = 10): Point2D[] {
    // If wall has no control points, return just the start and end points
    if (!wall.controlPoints || wall.controlPoints.length === 0) {
        return [wall.start, wall.end];
    }

    const points: Point2D[] = [];
    
    // Add start point
    points.push(wall.start);
    
    // For each segment, calculate a point along the curve
    for (let i = 1; i < segments; i++) {
        const t = i / segments;
        const point = getBezierPoint(t, wall.start, wall.controlPoints[0], wall.end);
        points.push(point);
    }
    
    // Add end point
    points.push(wall.end);
    
    return points;
}

/**
 * Calculate a point along a quadratic bezier curve
 * @param t Parameter between 0 and 1
 * @param start Start point
 * @param control Control point
 * @param end End point
 * @returns Point along the curve
 */
function getBezierPoint(t: number, start: Point2D, control: Point2D, end: Point2D): Point2D {
    const x = Math.pow(1 - t, 2) * start.x + 
              2 * (1 - t) * t * control.x + 
              Math.pow(t, 2) * end.x;
              
    const y = Math.pow(1 - t, 2) * start.y + 
              2 * (1 - t) * t * control.y + 
              Math.pow(t, 2) * end.y;
              
    return { x, y };
}
