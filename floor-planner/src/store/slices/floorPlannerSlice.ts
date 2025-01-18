import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { WallData, FixtureData, MaterialData, StraightWallData } from "../../types";
import { v4 as uuidv4 } from "uuid";

export interface FloorPlannerState {
  walls: WallData[];
  fixtures: FixtureData[];
  materials: MaterialData[];

  // Simple dimension tracking
  dimensions: {
    totalArea: number;
    totalVolume: number;
  };

  selectedWallId: string | null;
  wallInProgress: WallData | null;

  // For wall editing - placeholders for move/resize
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
    startWall: (state, action: PayloadAction<StraightWallData>) => {
      state.wallInProgress = { ...action.payload };
    },
    updateWallEnd: (state, action: PayloadAction<WallData>) => {
      if (state.wallInProgress?.id === action.payload.id) {
        state.wallInProgress = { ...action.payload };
      } else {
        const idx = state.walls.findIndex(w => w.id === action.payload.id);
        if (idx !== -1) {
          state.walls[idx] = { ...action.payload };
        }
      }
    },
    finishWall: (state) => {
      if (state.wallInProgress) {
        state.walls.push(state.wallInProgress);
        state.wallInProgress = null;
      }
    },
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
      state.walls = state.walls.filter(w => w.id !== action.payload);
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
    // Minimal dimension updates
    setDimensions: (state, action: PayloadAction<{ totalArea: number; totalVolume: number }>) => {
      state.dimensions = action.payload;
    },
    // Fixture management
    addFixture: (state, action: PayloadAction<FixtureData>) => {
      state.fixtures.push(action.payload);
    },
    updateFixture: (state, action: PayloadAction<FixtureData>) => {
      const idx = state.fixtures.findIndex(f => f.id === action.payload.id);
      if (idx !== -1) {
        state.fixtures[idx] = action.payload;
      }
    },
    // Material management
    addMaterial: (state, action: PayloadAction<MaterialData>) => {
      state.materials.push(action.payload);
    },
    // Clear all
    clearCanvas: (state) => {
      state.walls = [];
      state.fixtures = [];
      state.selectedWallId = null;
      state.wallInProgress = null;
      state.dimensions = { totalArea: 0, totalVolume: 0 };
      state.isWallEditing = false;
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
  clearCanvas
} = floorPlannerSlice.actions;

export default floorPlannerSlice.reducer;