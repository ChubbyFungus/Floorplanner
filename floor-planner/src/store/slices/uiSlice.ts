import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type SelectedTool = "select" | "wall" | "room" | "door" | "window" | null;

export interface UiState {
  showGrid: boolean;
  snapToGrid: boolean;
  snapGridSize: number;
  angleSnapEnabled: boolean;
  angleSnapIncrement: number;
  showRoomLabels: boolean;
  showTooltips: boolean;
  selectedTool: SelectedTool;
  errorMessage: string | null;
  showMeasurements: boolean;
  snapToWalls: boolean;
  snapToFixtures: boolean;
  tapeMeasureActive: boolean;
  aiTipsOpen: boolean;
}

const initialState: UiState = {
  showGrid: true,
  snapToGrid: true,
  snapGridSize: 20,
  angleSnapEnabled: true,
  angleSnapIncrement: 45,
  showRoomLabels: true,
  showTooltips: false,
  selectedTool: "select",
  errorMessage: null,
  showMeasurements: false,
  snapToWalls: true,
  snapToFixtures: false,
  tapeMeasureActive: false,
  aiTipsOpen: false
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleGrid: (state) => {
      state.showGrid = !state.showGrid;
    },
    toggleSnapToGrid: (state) => {
      state.snapToGrid = !state.snapToGrid;
    },
    setSelectedTool: (state, action: PayloadAction<SelectedTool>) => {
      state.selectedTool = action.payload;
    },
    setErrorMessage: (state, action: PayloadAction<string | null>) => {
      state.errorMessage = action.payload;
    },
    toggleMeasurements: (state) => {
      state.showMeasurements = !state.showMeasurements;
    },
    toggleAngleSnap: (state) => {
      state.angleSnapEnabled = !state.angleSnapEnabled;
    },
    setAngleSnapIncrement: (state, action: PayloadAction<number>) => {
      state.angleSnapIncrement = action.payload;
    },
    setShowRoomLabels: (state, action: PayloadAction<boolean>) => {
      state.showRoomLabels = action.payload;
    },
    setShowTooltips: (state, action: PayloadAction<boolean>) => {
      state.showTooltips = action.payload;
    },
    toggleTapeMeasure: (state) => {
      state.tapeMeasureActive = !state.tapeMeasureActive;
    },
    toggleAiTips: (state) => {
      state.aiTipsOpen = !state.aiTipsOpen;
    },
    toggleSnapToWalls: (state) => {
      state.snapToWalls = !state.snapToWalls;
    },
    toggleSnapToFixtures: (state) => {
      state.snapToFixtures = !state.snapToFixtures;
    }
  }
});

export const {
  toggleGrid,
  toggleSnapToGrid,
  setSelectedTool,
  setErrorMessage,
  toggleMeasurements,
  toggleAngleSnap,
  setAngleSnapIncrement,
  setShowRoomLabels,
  setShowTooltips,
  toggleTapeMeasure,
  toggleAiTips,
  toggleSnapToWalls,
  toggleSnapToFixtures
} = uiSlice.actions;

export default uiSlice.reducer;
