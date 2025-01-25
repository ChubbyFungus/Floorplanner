import { createSlice, PayloadAction, Reducer, Slice, SliceCaseReducers } from "@reduxjs/toolkit";
import { WallData, FixtureData, MaterialData, StraightWallData } from "../../types";
import { validateWall } from "../../services/floorPlannerLogic";
import { arePointsEqual } from "../../utils/geometryUtils";

/**
 * FloorPlannerState
 * Manages walls, fixtures, materials, dimension info, etc.
 */
export interface FloorPlannerState {
  walls: WallData[];
  fixtures: FixtureData[]; // Note: door/window are stored as fixtures with a "type" property
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
    startWall: (state, action: PayloadAction<StraightWallData>) => {
      state.wallInProgress = { ...action.payload };
    },
    updateWallEnd: (state, action: PayloadAction<WallData>) => {
      if (state.wallInProgress && state.wallInProgress.id === action.payload.id) {
        state.wallInProgress = { ...action.payload };
      }
    },
    finishWall: (state) => {
      if (state.wallInProgress && validateWall(state.wallInProgress, state.walls)) {
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
    deselectWall: (state, _action: PayloadAction<{}>) => {
      state.selectedWallId = null;
    },
    deleteWall: (state, action: PayloadAction<string>) => {
      state.walls = state.walls.filter((w) => w.id !== action.payload);
      if (state.selectedWallId === action.payload) {
        state.selectedWallId = null;
      }
    },
    startWallEditing: (state, _action: PayloadAction<{}>) => {
      state.isWallEditing = true;
    },
    finishWallEditing: (state, _action: PayloadAction<{}>) => {
      state.isWallEditing = false;
    },
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
      const index = state.fixtures.findIndex((f) => f.id === action.payload.id);
      if (index !== -1) {
        state.fixtures[index] = action.payload;
      }
    },
    addMaterial: (state, action: PayloadAction<MaterialData>) => {
      state.materials.push(action.payload);
    },
    clearCanvas: (state) => {
      state.walls = [];
      state.fixtures = [];
      state.materials = [];
      state.selectedWallId = null;
      state.wallInProgress = null;
      state.isWallEditing = false;
    },
    updateWall: (state, action: PayloadAction<WallData>) => {
      const index = state.walls.findIndex((w) => w.id === action.payload.id);
      if (index !== -1) {
        state.walls[index] = action.payload;
      }
    },
    addWall: (state, action: PayloadAction<WallData>) => {
      state.walls.push(action.payload);
    },
    addWalls: (state, action: PayloadAction<WallData[]>) => {
      state.walls.push(...action.payload);
    },
    splitWall: (
      state,
      action: PayloadAction<{ originalWallId: string; newWalls: WallData[] }>
    ) => {
      state.walls = state.walls.filter((w) => w.id !== action.payload.originalWallId);
      state.walls.push(...action.payload.newWalls);
      if (state.selectedWallId === action.payload.originalWallId) {
        state.selectedWallId = null;
      }
    },
    // NEW ACTIONS for Doors and Windows (treated as fixtures):
    addDoor: (state, action: PayloadAction<Omit<FixtureData, 'type'>>) => {
      state.fixtures.push({
        ...action.payload,
        type: 'door' as const
      });
    },
    addWindow: (state, action: PayloadAction<Omit<FixtureData, 'type'>>) => {
      state.fixtures.push({
        ...action.payload,
        type: 'window' as const
      });
    }
  }
}) as Slice<FloorPlannerState, SliceCaseReducers<FloorPlannerState>>;

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
  splitWall,
  addDoor,
  addWindow
} = floorPlannerSlice.actions;

export const wallEditingActions = {
  startWallEditing,
  finishWallEditing
};

export default floorPlannerSlice.reducer as Reducer<FloorPlannerState>;