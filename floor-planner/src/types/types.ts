export interface Point2D {
  x: number;
  y: number;
}

export interface WallData {
  id: string;
  start: Point2D;
  end: Point2D;
  controlPoints?: Point2D[];
  thickness: number;
  height: number;
}

export interface RoomData {
  id: string;
  points: Point2D[];  // Array of points defining the room's shape
  walls: string[];    // Array of wall IDs that make up the room
  name: string;       // Room name (e.g., "Living Room")
  area: number;       // Room area in square meters
}

export interface FixtureData {
  id: string;
  name: string;
  position: Point2D;
  width: number;
  depth: number;
  height: number;
}

export interface MaterialData {
  id: string;
  name: string;
  color: string;
}
