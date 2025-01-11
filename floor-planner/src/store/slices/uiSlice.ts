import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UiState {
  showGrid: boolean;
  snapToGrid: boolean;
  angleSnapEnabled: boolean;
  angleSnapIncrement: number;
  selectedTool: string | null;
  showMeasurements: boolean;
  errorMessage: string | null;
}

const initialState: UiState = {
  showGrid: true,
  snapToGrid: true,
  angleSnapEnabled: true,
  angleSnapIncrement: 15,
  selectedTool: 'wall',
  showMeasurements: true,
  errorMessage: null
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
    toggleAngleSnap: (state) => {
      state.angleSnapEnabled = !state.angleSnapEnabled;
    },
    toggleMeasurements: (state) => {
      state.showMeasurements = !state.showMeasurements;
    },
    setAngleSnapIncrement: (state, action: PayloadAction<number>) => {
      state.angleSnapIncrement = action.payload;
    },
    setSelectedTool: (state, action: PayloadAction<string | null>) => {
      console.log('Setting selected tool:', action.payload);
      state.selectedTool = action.payload;
    },
    setErrorMessage: (state, action: PayloadAction<string | null>) => {
      state.errorMessage = action.payload;
    }
  }
});

export const {
  toggleGrid,
  toggleSnapToGrid,
  toggleAngleSnap,
  toggleMeasurements,
  setAngleSnapIncrement,
  setSelectedTool,
  setErrorMessage
} = uiSlice.actions;

export default uiSlice.reducer;
