import { WallData } from "../types";

/**
 * getMinMaxPoints
 * ---------------
 * Given an array of WallData, finds the minimum and maximum X/Y values
 * across all wall endpoints (including control points for curved walls).
 *
 * Returns an object with { minX, minY, maxX, maxY } for further calculations.
 */
export function getMinMaxPoints(walls: WallData[]) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  walls.forEach((wall) => {
    // Include start, end, and any control points
    const points = [wall.start, wall.end, ...(wall.controlPoints || [])];
    points.forEach((p) => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });
  });

  // If no walls, default to 0 so we don't return Infinity
  if (walls.length === 0) {
    minX = 0;
    maxX = 0;
    minY = 0;
    maxY = 0;
  }

  return { minX, minY, maxX, maxY };
}