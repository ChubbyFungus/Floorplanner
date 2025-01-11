
export interface Point2D {
    x: number;
    y: number;
  }
  
  /**
   * WallData
   * Single wall segment (start -> end) or curved (controlPoints).
   */
  export interface WallData {
    id: string;
    start: Point2D;
    end: Point2D;
    controlPoints?: Point2D[];
    thickness: number;
    height: number;
    materialId?: string;
  }
  
  /**
   * FixtureData
   * Cabinets, appliances, or any furniture piece.
   */
  export interface FixtureData {
    id: string;
    name: string;
    position: Point2D;
    width: number;
    depth: number;
    height: number;
    rotation?: number;
    materialId?: string;
  }
  
  /**
   * MaterialData
   * Diffuse + normal map, etc.
   */
  export interface MaterialData {
    id: string;
    name: string;
    diffuseMap?: string;
    normalMap?: string;
    color?: string;
  }
  
  /**
   * FloorPlannerState
   */
  export interface FloorPlannerState {
    walls: WallData[];
    fixtures: FixtureData[];
    materials: MaterialData[];
    dimensions: {
      totalArea: number;
      totalVolume: number;
    };
    lastSavedAt: string | null;
    wallInProgress: WallData | null;
  }
  
  /**
   * ProjectData
   */
  export interface ProjectData {
    id: string;
    name: string;
    description: string;
    updatedAt: string;
    createdAt: string;
  }
  