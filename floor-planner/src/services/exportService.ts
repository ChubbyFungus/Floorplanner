import { FloorPlannerState, ProjectData } from "../types";

export function exportDesignToJSON(floorPlannerState: FloorPlannerState): string {
  return JSON.stringify({
    walls: floorPlannerState.walls,
    fixtures: floorPlannerState.fixtures,
    materials: floorPlannerState.materials,
    dimensions: floorPlannerState.dimensions,
    lastSavedAt: floorPlannerState.lastSavedAt
  });
}

export function exportProjectToJSON(project: ProjectData, designJson: string): string {
  return JSON.stringify({
    ...project,
    design: JSON.parse(designJson)
  });
}
