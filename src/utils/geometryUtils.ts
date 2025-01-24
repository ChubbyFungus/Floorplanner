// Types for geometry calculations
export interface Point2D {
    x: number;
    y: number;
}

export type WallData = {
    start: Point2D;
    end: Point2D;
    controlPoints?: Point2D[];
};

/**
 * Converts a curved wall into a series of straight line segments
 * @param wall The wall to subdivide
 * @param segments Number of segments to divide the curve into (default: 10)
 * @returns Array of points representing the subdivided wall
 */
export function subdivideWall(wall: WallData, segments: number = 10): Point2D[] {
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

// Unit conversion constants
export const INCHES_TO_FEET = 1 / 12;
export const SQUARE_INCHES_TO_SQUARE_FEET = 1 / 144;  // 12 * 12
export const DEFAULT_SCALE_PX_PER_INCH = 2.5;

/**
 * Converts pixels to inches based on the given scale
 * @param pixels Number of pixels
 * @param pixelsPerInch Scale factor (default: 2.5 pixels per inch)
 * @returns Length in inches
 */
export function pixelsToInches(pixels: number, pixelsPerInch: number = DEFAULT_SCALE_PX_PER_INCH): number {
    return pixels / pixelsPerInch;
}

/**
 * Converts square pixels to square feet
 * @param squarePixels Area in square pixels
 * @param pixelsPerInch Scale factor (default: 2.5 pixels per inch)
 * @returns Area in square feet
 */
export function squarePixelsToSquareFeet(squarePixels: number, pixelsPerInch: number = DEFAULT_SCALE_PX_PER_INCH): number {
    const squareInches = Math.pow(pixelsToInches(Math.sqrt(squarePixels), pixelsPerInch), 2);
    return squareInches * SQUARE_INCHES_TO_SQUARE_FEET;
}

/**
 * Converts square inches to square feet
 * @param squareInches Area in square inches
 * @returns Area in square feet
 */
export function squareInchesToSquareFeet(squareInches: number): number {
    return squareInches * SQUARE_INCHES_TO_SQUARE_FEET;
}

/**
 * Calculates room area in square feet from a polygon of points
 * @param points Array of points forming the room polygon
 * @param isInPixels Whether the input points are in pixels (true) or inches (false)
 * @param pixelsPerInch Scale factor when input is in pixels (default: 2.5 pixels per inch)
 * @returns Area in square feet
 */
export function calculateRoomAreaInSquareFeet(
    points: Point2D[], 
    isInPixels: boolean = true,
    pixelsPerInch: number = DEFAULT_SCALE_PX_PER_INCH
): number {
    const area = calculatePolygonArea(points);
    
    if (isInPixels) {
        return squarePixelsToSquareFeet(area, pixelsPerInch);
    } else {
        return squareInchesToSquareFeet(area);
    }
}

/**
 * Finds closed loops of walls that connect end-to-end
 * @param walls Array of wall data
 * @returns Array of wall arrays, each representing a closed loop
 */
export function findClosedLoops(walls: WallData[]): WallData[][] {
    const loops: WallData[][] = [];
    const usedWalls = new Set<WallData>();

    for (const startWall of walls) {
        if (usedWalls.has(startWall)) continue;

        const currentLoop: WallData[] = [];
        let currentWall = startWall;
        let currentPoint = currentWall.end;

        while (true) {
            currentLoop.push(currentWall);
            usedWalls.add(currentWall);

            // Find next wall that starts at current wall's endpoint
            const nextWall = walls.find(w => 
                !usedWalls.has(w) && 
                Math.abs(w.start.x - currentPoint.x) < 0.001 && 
                Math.abs(w.start.y - currentPoint.y) < 0.001
            );

            if (!nextWall || nextWall === startWall) break;

            currentWall = nextWall;
            currentPoint = currentWall.end;
        }

        if (currentLoop.length > 2) {
            loops.push(currentLoop);
        }
    }

    return loops;
}

/**
 * Converts walls to a polygon of line segments, subdividing curved walls
 * @param walls Array of walls to convert
 * @returns Array of 2D points forming the polygon
 */
export function subdivideWallsToPolygon(walls: WallData[]): Point2D[] {
    const points: Point2D[] = [];

    for (const wall of walls) {
        if (!wall.controlPoints || wall.controlPoints.length === 0) {
            points.push(wall.start);
        } else {
            // Subdivide curved wall into segments
            const segments = 10; // Number of segments per curve
            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                const point = getBezierPoint(t, wall.start, wall.controlPoints[0], wall.end);
                if (i < segments) { // Don't add end point except for last wall
                    points.push(point);
                }
            }
        }
    }

    return points;
}

/**
 * Calculates area of a polygon using earcut triangulation
 * @param polygonPoints Array of polygon points
 * @returns Area in square units
 */
export function earcutArea(polygonPoints: Point2D[]): number {
    // Flatten points to [x0, y0, x1, y1, ...]
    const flatPoints = flattenPoints(polygonPoints);
    
    // For now, using shoelace formula. Will be replaced with earcut when we add the library
    let area = 0;
    const n = polygonPoints.length;

    for (let i = 0; i < n - 1; i++) {
        area += polygonPoints[i].x * polygonPoints[i + 1].y - 
                polygonPoints[i + 1].x * polygonPoints[i].y;
    }
    area += polygonPoints[n - 1].x * polygonPoints[0].y - 
            polygonPoints[0].x * polygonPoints[n - 1].y;

    return Math.abs(area) / 2;
}

/**
 * Updates room area calculations
 * @param walls Array of all walls
 * @returns Total area in square feet
 */
export function updateRoomArea(walls: WallData[]): number {
    // 1) Find loops (rooms)
    const loops = findClosedLoops(walls);
    
    let totalSqInches = 0;
    
    for (const loop of loops) {
        // 2) Subdivide curved walls -> polygon of line segments
        const polygonPoints = subdivideWallsToPolygon(loop);
        
        // 3) Area in square inches
        const areaInSqInches = earcutArea(polygonPoints);
        
        totalSqInches += areaInSqInches;
    }
    
    // 4) Convert to sq ft
    return totalSqInches / 144;
}

// New geometry functions for wall calculations
export function calculateWallIntersection(wall1: WallData, wall2: WallData): Point2D | null {
    const [x1, y1] = [wall1.start.x, wall1.start.y];
    const [x2, y2] = [wall1.end.x, wall1.end.y];
    const [x3, y3] = [wall2.start.x, wall2.start.y];
    const [x4, y4] = [wall2.end.x, wall2.end.y];

    const denominator = (y4 - y3)*(x2 - x1) - (x4 - x3)*(y2 - y1);
    if (denominator === 0) return null;

    const ua = ((x4 - x3)*(y1 - y3) - (y4 - y3)*(x1 - x3)) / denominator;
    const ub = ((x2 - x1)*(y1 - y3) - (y2 - y1)*(x1 - x3)) / denominator;

    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) return null;

    return {
        x: x1 + ua*(x2 - x1),
        y: y1 + ua*(y2 - y1)
    };
}

export function getWallLength(wall: WallData): number {
    return Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
}

export function calculateWallAngle(wall1: WallData, wall2: WallData): number {
    const vec1 = [wall1.end.x - wall1.start.x, wall1.end.y - wall1.start.y];
    const vec2 = [wall2.end.x - wall2.start.x, wall2.end.y - wall2.start.y];
    
    const dot = vec1[0]*vec2[0] + vec1[1]*vec2[1];
    const mag1 = Math.hypot(vec1[0], vec1[1]);
    const mag2 = Math.hypot(vec2[0], vec2[1]);
    
    if (mag1 === 0 || mag2 === 0) return 0;
    return (Math.acos(dot / (mag1 * mag2)) * 180) / Math.PI;
}
