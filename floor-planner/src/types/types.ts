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
  walls: WallData[];
  name?: string;
}
