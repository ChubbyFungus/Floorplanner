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

/**
 * Calculates the area of a polygon using the shoelace formula (Gauss's area formula)
 * Works best for simple, non-self-intersecting polygons
 * @param points Array of points forming the polygon
 * @returns Area of the polygon
 */
export function calculatePolygonArea(points: Point2D[]): number {
    if (points.length < 3) {
        return 0;
    }

    let area = 0;
    const n = points.length;

    // Implementation of the shoelace formula:
    // Area = 1/2 |∑(x[i]y[i+1] - x[i+1]y[i])|
    for (let i = 0; i < n - 1; i++) {
        area += points[i].x * points[i + 1].y - points[i + 1].x * points[i].y;
    }

    // Add the last term (between last and first point)
    area += points[n - 1].x * points[0].y - points[0].x * points[n - 1].y;

    // Take the absolute value and divide by 2
    return Math.abs(area) / 2;
}

/**
 * Flattens an array of 2D points into a single array of numbers [x0, y0, x1, y1, ...]
 * @param points Array of Point2D objects
 * @returns Flattened array of numbers
 */
export function flattenPoints(points: Point2D[]): number[] {
    return points.reduce<number[]>((flat, point) => {
        flat.push(point.x, point.y);
        return flat;
    }, []);
}
