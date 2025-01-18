import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UiState {
  showGrid: boolean;
  snapToGrid: boolean;
  angleSnapEnabled: boolean;
  angleSnapIncrement: number;
  selectedTool: 'wall' | 'room' | 'select' | null;
  showMeasurements: boolean;
  errorMessage: string | null;
  gridSize: number;
}

const initialState: UiState = {
  showGrid: true,
  snapToGrid: true,
  angleSnapEnabled: true,
  angleSnapIncrement: 45,
  selectedTool: null,
  showMeasurements: true,
  errorMessage: null,
  gridSize: 20
};

export const uiSlice = createSlice({
  name: 'ui',
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
    setAngleSnapIncrement: (state, action: PayloadAction<number>) => {
      state.angleSnapIncrement = action.payload;
    },
    setSelectedTool: (state, action: PayloadAction<'wall' | 'room' | 'select' | null>) => {
      state.selectedTool = action.payload;
    },
    toggleMeasurements: (state) => {
      state.showMeasurements = !state.showMeasurements;
    },
    setErrorMessage: (state, action: PayloadAction<string | null>) => {
      state.errorMessage = action.payload;
    },
    setGridSize: (state, action: PayloadAction<number>) => {
      state.gridSize = action.payload;
    }
  }
});

export const {
  toggleGrid,
  toggleSnapToGrid,
  toggleAngleSnap,
  setAngleSnapIncrement,
  setSelectedTool,
  toggleMeasurements,
  setErrorMessage,
  setGridSize
} = uiSlice.actions;

export default uiSlice.reducer;
