export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D extends Point2D {
  z: number;
}

export interface WallData {
  id: string;
  start: Point2D;
  end: Point2D;
  height: number;
  thickness: number;
  color?: string;
  texture?: string;
  type?: string;
  controlPoints?: Point2D[];
}

export interface RoomData {
  id: string;
  name?: string;
  points: Point2D[];
  area?: number;
  color?: string;
  texture?: string;
}

export interface FixtureData {
  id: string;
  type: 'door' | 'window';
  position: Point2D;
  rotation?: number;
  width?: number;
  height?: number;
}

export interface MaterialData {
  id: string;
  name: string;
  type: 'wall' | 'floor' | 'ceiling';
  texture?: string;
  color?: string;
  properties?: {
    [key: string]: any;
  };
}

export type StraightWallData = Omit<WallData, 'curve'>;
