import { WallData } from "../types";
import { arePointsEqual } from "../utils/geometryUtils";

/**
 * finalizeWallCreation
 * Centralizes logic for adding a newly finished wall to the array of existing walls.
 * Includes a duplicate check to avoid adding walls with the same start/end.
 */
export function finalizeWallCreation(
  wallInProgress: WallData,
  walls: WallData[]
): void {
  const { start, end } = wallInProgress;

  // Check if there's already a wall with the same start/end (or reversed).
  const duplicateWall = walls.find(
    (w) =>
      (arePointsEqual(w.start, start) && arePointsEqual(w.end, end)) ||
      (arePointsEqual(w.start, end) && arePointsEqual(w.end, start))
  );

  if (!duplicateWall) {
    walls.push(wallInProgress);
  }
}