import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UiState {
  // For grid snapping
  snapToGrid: boolean;
  snapGridSize: number;         // e.g., default 20px for minor grid
  angleSnapEnabled: boolean;
  angleSnapIncrement: number;   // e.g., 15 or 45 degrees

  // Labels/Annotations
  showRoomLabels: boolean;

  // Additional UI toggles
  showTooltips: boolean;        // Will help with future tooltips or tutorial overlays
}

const initialState: UiState = {
  snapToGrid: true,
  snapGridSize: 20,
  angleSnapEnabled: true,
  angleSnapIncrement: 45,
  showRoomLabels: true,
  showTooltips: false
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleGrid: (state) => {
      state.snapToGrid = !state.snapToGrid;
    },
    setGridSize: (state, action: PayloadAction<number>) => {
      state.snapGridSize = action.payload;
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
    }
  }
});

export const {
  toggleGrid,
  setGridSize,
  toggleAngleSnap,
  setAngleSnapIncrement,
  setShowRoomLabels,
  setShowTooltips
} = uiSlice.actions;

export default uiSlice.reducer;