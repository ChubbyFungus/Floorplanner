import { WallData } from "../types";
import { arePointsEqual } from "../utils/geometryUtils";
import { debugLogger } from "../utils/debugLogger";

/**
 * Checks if a wall would be a duplicate of any existing walls
 */
export function isDuplicateWall(wall: WallData, existingWalls: WallData[]): boolean {
  const { start, end } = wall;
  return existingWalls.some(
    (w: WallData) =>
      (arePointsEqual(w.start, start) && arePointsEqual(w.end, end)) ||
      (arePointsEqual(w.start, end) && arePointsEqual(w.end, start))
  );
}

/**
 * Validates a wall before adding it to the state
 */
export function validateWall(wall: WallData, existingWalls: WallData[]): boolean {
  debugLogger("Validating wall", { wall, existingWalls });
  
  // Check for duplicates
  if (isDuplicateWall(wall, existingWalls)) {
    debugLogger("Duplicate wall detected, skipping", { wall });
    return false;
  }

  return true;
}
