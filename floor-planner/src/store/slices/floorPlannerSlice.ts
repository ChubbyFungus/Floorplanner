import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { WallData, FixtureData, FloorPlannerState, Point2D } from "../../types";
import { v4 as uuidv4 } from "uuid";

// Ensure your FloorPlannerState is defined in src/types/index.ts, for example:
// export interface FloorPlannerState {
//   walls: WallData[];
//   fixtures: FixtureData[];
//   materials: MaterialData[];
//   dimensions: {
//     totalArea: number;
//     totalVolume: number;
//   };
//   lastSavedAt: string | null;
//   wallInProgress: WallData | null;
// }

const initialState: FloorPlannerState = {
  walls: [],
  fixtures: [],
  materials: [],
  dimensions: {
    totalArea: 0,
    totalVolume: 0
  },
  lastSavedAt: null,
  wallInProgress: null
};

export const floorPlannerSlice = createSlice({
  name: "floorPlanner",
  initialState,
  reducers: {
    // --------------------------------
    // 1) Wall Creation
    // --------------------------------
    startWall: (state, action: PayloadAction<{ x: number; y: number }>) => {
      console.log('Starting wall at:', action.payload);
      state.wallInProgress = {
        id: uuidv4(),
        start: action.payload,
        end: action.payload,
        controlPoints: [],
        thickness: 10,
        height: 280
      };
      console.log('Wall in progress:', state.wallInProgress);
    },
    addWallControlPoint: (state, action: PayloadAction<{ x: number; y: number }>) => {
      if (state.wallInProgress) {
        if (!state.wallInProgress.controlPoints) {
          state.wallInProgress.controlPoints = [];
        }
        state.wallInProgress.controlPoints.push(action.payload);
      }
    },
    updateWallEnd: (state, action: PayloadAction<{ x: number; y: number }>) => {
      if (state.wallInProgress) {
        state.wallInProgress.end = {
          x: action.payload.x,
          y: action.payload.y
        };
      }
    },
    finalizeWall: (state) => {
      console.log('Finalizing wall:', state.wallInProgress);
      if (state.wallInProgress) {
        state.walls.push(state.wallInProgress);
        state.wallInProgress = null;
      }
      console.log('Updated walls:', state.walls);
    },
    cancelWall: (state) => {
      state.wallInProgress = null;
    },

    // --------------------------------
    // 2) The newly added "updateLastControlPoint" for Alt-based curves
    // --------------------------------
    updateLastControlPoint: (state, action: PayloadAction<{ x: number; y: number }>) => {
      if (
        state.wallInProgress &&
        state.wallInProgress.controlPoints &&
        state.wallInProgress.controlPoints.length > 0
      ) {
        const lastIndex = state.wallInProgress.controlPoints.length - 1;
        state.wallInProgress.controlPoints[lastIndex] = action.payload;
      }
    },

    // --------------------------------
    // 3) Additional wall management (add/update/remove)
    // --------------------------------
    addWall: (state, action: PayloadAction<WallData>) => {
      state.walls.push(action.payload);
    },
    updateWall: (state, action: PayloadAction<WallData>) => {
      const index = state.walls.findIndex((w) => w.id === action.payload.id);
      if (index > -1) {
        state.walls[index] = action.payload;
      }
    },
    removeWall: (state, action: PayloadAction<string>) => {
      state.walls = state.walls.filter((w) => w.id !== action.payload);
    },

    // --------------------------------
    // 4) Fixture management
    // --------------------------------
    addFixture: (state, action: PayloadAction<FixtureData>) => {
      state.fixtures.push(action.payload);
    },
    updateFixture: (state, action: PayloadAction<FixtureData>) => {
      const index = state.fixtures.findIndex((f) => f.id === action.payload.id);
      if (index > -1) {
        state.fixtures[index] = action.payload;
      }
    },
    removeFixture: (state, action: PayloadAction<string>) => {
      state.fixtures = state.fixtures.filter((f) => f.id !== action.payload);
    },

    // --------------------------------
    // 5) Materials & Dimensions
    // --------------------------------
    setMaterials: (state, action) => {
      state.materials = action.payload;
    },
    setDimensions: (state, action) => {
      state.dimensions = action.payload;
    },

    // --------------------------------
    // 6) Save / Timestamp
    // --------------------------------
    saveState: (state) => {
      state.lastSavedAt = new Date().toISOString();
    },

    // --------------------------------
    // 7) Clear Canvas and End Wall Drawing
    // --------------------------------
    clearCanvas: (state) => {
      state.walls = [];
      state.wallInProgress = null;
    },
    endWallDrawing: (state) => {
      if (state.wallInProgress) {
        // Add the wall in progress to walls array before ending
        state.walls.push(state.wallInProgress);
      }
      state.wallInProgress = null;
    },

    // --------------------------------
    // 8) Wall Splitting
    // --------------------------------
    splitWall: (state, action: PayloadAction<{
      wallId: string,
      splitPoint: Point2D
    }>) => {
      const { wallId, splitPoint } = action.payload;
      const wallIndex = state.walls.findIndex(w => w.id === wallId);

      if (wallIndex === -1) return;

      const originalWall = state.walls[wallIndex];

      // Create two new walls from split point
      const wall1: WallData = {
        id: crypto.randomUUID(),
        start: originalWall.start,
        end: splitPoint,
        thickness: originalWall.thickness,
        height: originalWall.height
      };

      const wall2: WallData = {
        id: crypto.randomUUID(),
        start: splitPoint,
        end: originalWall.end,
        thickness: originalWall.thickness,
        height: originalWall.height
      };

      // Replace original wall with split walls
      state.walls.splice(wallIndex, 1, wall1, wall2);
    }
  }
});

// Export all actions, including the new "updateLastControlPoint"
export const {
  startWall,
  addWallControlPoint,
  updateWallEnd,
  finalizeWall,
  cancelWall,
  updateLastControlPoint, // <--- Newly added
  addWall,
  updateWall,
  removeWall,
  addFixture,
  updateFixture,
  removeFixture,
  setMaterials,
  setDimensions,
  saveState,
  clearCanvas,
  endWallDrawing,
  splitWall,
} = floorPlannerSlice.actions;

export default floorPlannerSlice.reducer;