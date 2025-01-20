import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { WallData, FixtureData, MaterialData, StraightWallData } from "../../types";
import { finalizeWallCreation } from "../../services/floorPlannerLogic";
import { arePointsEqual } from "../../utils/geometryUtils";

/**
 * FloorPlannerState
 * Manages walls, fixtures, materials, dimension info, etc.
 */
export interface FloorPlannerState {
  walls: WallData[];
  fixtures: FixtureData[];
  materials: MaterialData[];

  dimensions: {
    totalArea: number;
    totalVolume: number;
  };

  selectedWallId: string | null;
  wallInProgress: WallData | null;

  isWallEditing: boolean;
  lastSavedAt: string | null;
}

const initialState: FloorPlannerState = {
  walls: [],
  fixtures: [],
  materials: [],
  dimensions: {
    totalArea: 0,
    totalVolume: 0
  },
  selectedWallId: null,
  wallInProgress: null,
  isWallEditing: false,
  lastSavedAt: null
};

export const floorPlannerSlice = createSlice({
  name: "floorPlanner",
  initialState,
  reducers: {
    /**
     * startWall
     * Begins tracking a new wall being drawn by the user.
     */
    startWall: (state, action: PayloadAction<StraightWallData>) => {
      state.wallInProgress = { ...action.payload };
    },

    /**
     * updateWallEnd
     * Updates the endpoint of a wall in progress or modifies an existing wall by ID.
     */
    updateWallEnd: (state, action: PayloadAction<WallData>) => {
      if (state.wallInProgress && state.wallInProgress.id === action.payload.id) {
        state.wallInProgress = { ...action.payload };
      } else {
        const idx = state.walls.findIndex((w) => w.id === action.payload.id);
        if (idx !== -1) {
          state.walls[idx] = { ...action.payload };
        }
      }
    },

    /**
     * finishWall
     * Finalizes the in-progress wall, delegating duplicate checks to floorPlannerLogic.
     */
    finishWall: (state) => {
      if (state.wallInProgress) {
        finalizeWallCreation(state.wallInProgress, state.walls);
        state.wallInProgress = null;
      }
    },

    /**
     * cancelWall
     * Cancels any in-progress wall drawing (called on ESC).
     */
    cancelWall: (state) => {
      state.wallInProgress = null;
    },

    selectWall: (state, action: PayloadAction<string>) => {
      state.selectedWallId = action.payload;
    },

    deselectWall: (state) => {
      state.selectedWallId = null;
    },

    deleteWall: (state, action: PayloadAction<string>) => {
      state.walls = state.walls.filter((w) => w.id !== action.payload);
      if (state.selectedWallId === action.payload) {
        state.selectedWallId = null;
      }
    },

    startWallEditing: (state) => {
      state.isWallEditing = true;
    },

    finishWallEditing: (state) => {
      state.isWallEditing = false;
    },

    /**
     * setDimensions
     * Saves computed area/volume data for the entire floor plan.
     */
    setDimensions: (
      state,
      action: PayloadAction<{ totalArea: number; totalVolume: number }>
    ) => {
      state.dimensions = action.payload;
    },

    addFixture: (state, action: PayloadAction<FixtureData>) => {
      state.fixtures.push(action.payload);
    },

    updateFixture: (state, action: PayloadAction<FixtureData>) => {
      const idx = state.fixtures.findIndex((f) => f.id === action.payload.id);
      if (idx !== -1) {
        state.fixtures[idx] = action.payload;
      }
    },

    addMaterial: (state, action: PayloadAction<MaterialData>) => {
      state.materials.push(action.payload);
    },

    /**
     * clearCanvas
     * Clears all floor plan data (walls, fixtures, etc.).
     */
    clearCanvas: (state) => {
      state.walls = [];
      state.fixtures = [];
      state.selectedWallId = null;
      state.wallInProgress = null;
      state.dimensions = { totalArea: 0, totalVolume: 0 };
      state.isWallEditing = false;
    },

    /**
     * updateWall
     * Replaces an entire wall's data by ID. Useful for editing thickness, height, etc.
     */
    updateWall: (state, action: PayloadAction<WallData>) => {
      const index = state.walls.findIndex((w) => w.id === action.payload.id);
      if (index !== -1) {
        state.walls[index] = { ...action.payload };
      }
    },

    /**
     * addWall
     * Appends a single new wall to the floor plan.
     */
    addWall: (state, action: PayloadAction<WallData>) => {
      finalizeWallCreation(action.payload, state.walls);
    },

    /**
     * addWalls
     * Appends multiple walls as one grouped action to allow single-step undo for e.g. rooms.
     */
    addWalls: (state, action: PayloadAction<WallData[]>) => {
      action.payload.forEach((wallData) => {
        finalizeWallCreation(wallData, state.walls);
      });
    },

    /**
     * splitWall
     * Removes the original wall, then adds new partial walls.
     */
    splitWall: (
      state,
      action: PayloadAction<{ originalWallId: string; newWalls: WallData[] }>
    ) => {
      state.walls = state.walls.filter(
        (w) => w.id !== action.payload.originalWallId
      );
      for (const newWall of action.payload.newWalls) {
        finalizeWallCreation(newWall, state.walls);
      }
    }
  }
});

export const {
  startWall,
  updateWallEnd,
  finishWall,
  cancelWall,
  selectWall,
  deselectWall,
  deleteWall,
  startWallEditing,
  finishWallEditing,
  setDimensions,
  addFixture,
  updateFixture,
  addMaterial,
  clearCanvas,
  updateWall,
  addWall,
  addWalls,
  splitWall
} = floorPlannerSlice.actions;

export default floorPlannerSlice.reducer;