import { Point2D, FixtureData } from "./index";

export interface StraightWallData {
  id: string;
  type: "straight";
  start: Point2D;
  end: Point2D;
  controlPoints?: Point2D[];
  thickness: number;
  height: number;
}

export interface CurvedWallData {
  id: string;
  type: "curved";
  start: Point2D;
  end: Point2D;
  controlPoints?: Point2D[];
  thickness: number;
  height: number;
}

export type WallData = StraightWallData | CurvedWallData;

/**
 * RoomData
 * --------
 * If you don't need `perimeter` or `height`, either remove them
 * or mark them optional so they aren’t strictly required.
 */
export interface RoomData {
  id: string;
  points: Point2D[]; // Array of points defining the room's shape
  walls: string[];   // Array of wall IDs making up the room
  name: string;      // e.g., "Living Room"
  area: number;      // Room area in square meters

  // Mark these optional if they're not always computed:
  perimeter?: number;
  height?: number;
}

export interface MaterialData {
  id: string;
  name: string;
  color: string;
  diffuseMap?: string;
  normalMap?: string;
}