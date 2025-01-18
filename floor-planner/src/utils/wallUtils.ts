import { v4 as uuidv4 } from 'uuid';
import { Point2D, WallData, CurvedWallData } from '../types';

/**
 * Create a curved wall between two points with control points
 */
export function createCurvedWall(
  start: Point2D,
  end: Point2D,
  controlPoints: Point2D[],
  height: number = 2.4,
  thickness: number = 0.2,
  segments: number = 32
): CurvedWallData {
  return {
    id: uuidv4(),
    type: 'curved',
    start,
    end,
    controlPoints,
    height,
    thickness,
    segments
  };
}

/**
 * Create an arc wall between two points with a given radius
 */
export function createArcWall(
  start: Point2D,
  end: Point2D,
  radius: number,
  height: number = 2.4,
  thickness: number = 0.2,
  segments: number = 32
): CurvedWallData {
  return {
    id: uuidv4(),
    type: 'curved',
    start,
    end,
    controlPoints: [], // Not used for arc walls
    radius,
    height,
    thickness,
    segments
  };
}

/**
 * Create a straight wall between two points
 */
export function createStraightWall(
  start: Point2D,
  end: Point2D,
  height: number = 2.4,
  thickness: number = 0.2
): WallData {
  return {
    id: uuidv4(),
    type: 'straight',
    start,
    end,
    height,
    thickness
  };
}
