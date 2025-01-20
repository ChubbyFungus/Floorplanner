import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UiState {
  showGrid: boolean;
  snapToGrid: boolean;
  snapGridSize: number;
  angleSnapEnabled: boolean; // still used internally
  angleSnapIncrement: number;
  showRoomLabels: boolean;
  showTooltips: boolean;

  selectedTool: "wall" | "room" | "select" | null;
  errorMessage: string | null;
  showMeasurements: boolean;

  // New fields
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
    setSelectedTool: (
      state,
      action: PayloadAction<"wall" | "room" | "select" | null>
    ) => {
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
    // New toggles
    toggleTapeMeasure: (state) => {
      state.tapeMeasureActive = !state.tapeMeasureActive;
    },
    toggleAiTips: (state) => {
      state.aiTipsOpen = !state.aiTipsOpen;
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
  toggleAiTips
} = uiSlice.actions;

export default uiSlice.reducer;