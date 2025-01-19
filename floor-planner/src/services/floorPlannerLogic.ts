import { WallData } from "../types";

      /**
       * finalizeWallCreation
       * Centralizes logic for adding a newly finished wall to the array of existing walls.
       * @param wallInProgress - The wall currently being drawn, about to be finalized
       * @param walls - The array of existing walls in the floor plan
       */
      export function finalizeWallCreation(wallInProgress: WallData, walls: WallData[]): void {
        // You could insert further validation or snapping logic here if needed.
        walls.push(wallInProgress);
      }