export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D extends Point2D {
  z: number;
}

export interface Dimensions {
  width: number;
  height: number;
  depth: number;
}

export interface BaseWallData {
  id: string;
  start: Point2D;
  end: Point2D;
  height: number;
  thickness: number;
  materialId?: string;
  controlPoints?: Point2D[];
}

export interface CurvedWallData {
  id: string;
  type: "curved";
  start: Point2D;
  end: Point2D;
  controlPoints?: Point2D[];
  thickness: number;
  height: number;
  radius?: number;     
  segments?: number;   
}

export interface StraightWallData extends BaseWallData {
  type: 'straight';
}

export interface CurvedWallData extends BaseWallData {
  type: 'curved';
  controlPoint: Point2D;
}

export interface ArcWallData extends BaseWallData {
  type: 'arc';
  radius: number;
  startAngle: number;
  endAngle: number;
  center: Point2D;
}

export type WallData = StraightWallData | CurvedWallData | ArcWallData;

export interface RoomData {
  id: string;
  name: string;
  points: Point2D[];
  area: number;
  perimeter: number;
  height: number;
  materialId?: string;
  walls: string[];  // Array of wall IDs that make up the room
}

export interface FixtureData {
  id: string;
  name: string;
  type: string;
  position: Point2D;
  rotation: number;
  dimensions: Dimensions;
  materialId?: string;
}

export interface MaterialData {
  id: string;
  name: string;
  color: string;
  texture?: string;       // For basic textures
  diffuseMap?: string;    // URL to diffuse texture map
  normalMap?: string;     // URL to normal texture map
  opacity?: number;       // For transparent materials
}

export interface FloorPlannerState {
  walls: WallData[];
  fixtures: FixtureData[];
  materials: MaterialData[];
  selectedWallId: string | null;
  selectedFixtureId: string | null;
  isWallDrawingMode: boolean;
  isFixturePlacementMode: boolean;
  dimensions: {
    totalArea: number;
    totalVolume: number;
  };
  lastSavedAt: string | null;
  wallInProgress: WallData | null;
  showMeasurements: boolean;
  showAngles: boolean;
  snapToGrid: boolean;
  snapToWalls: boolean;
  gridVisible: boolean;
  gridSize: number;
  gridColor: string;
  showLabels: boolean;
  showDimensions: boolean;
  showGrid: boolean;
  showRooms: boolean;
  showWalls: boolean;
  showFixtures: boolean;
  showGuides: boolean;
  showSnapPoints: boolean;
  showSnapLines: boolean;
  showSnapAngles: boolean;
  showSnapGrid: boolean;
  showSnapWalls: boolean;
  showSnapRooms: boolean;
  showSnapFixtures: boolean;
  showSnapGuides: boolean;
  showSnapLabels: boolean;
  showSnapDimensions: boolean;
  showSnapAnglesGuides: boolean;
  statistics: {
    totalArea: number;
    totalPerimeter: number;
    totalVolume: number;
  };
}

export interface ProjectData {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
  createdAt: string;
}