import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/**
 * UiState
 * Includes snapping toggles, angle snap settings, plus any error or tool selection flags.
 */
export interface UiState {
  /** Whether the grid lines are displayed (Show Grid vs Hide Grid). */
  showGrid: boolean;

  /** Whether points snap to the grid when drawing walls (Enable Grid Snap vs Disable). */
  snapToGrid: boolean;
  snapGridSize: number;
  angleSnapEnabled: boolean;
  angleSnapIncrement: number;
  showRoomLabels: boolean;
  showTooltips: boolean;

  selectedTool: "wall" | "room" | "select" | null;
  errorMessage: string | null;
  showMeasurements: boolean;
}

const initialState: UiState = {
  showGrid: true,
  snapToGrid: true,
  snapGridSize: 20,
  angleSnapEnabled: true,
  angleSnapIncrement: 45,
  showRoomLabels: true,
  showTooltips: false,
  selectedTool: null,
  errorMessage: null,
  showMeasurements: false
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    /**
     * toggleGrid
     * Toggles the visual grid lines on/off (state.showGrid).
     */
    toggleGrid: (state) => {
      state.showGrid = !state.showGrid;
    },

    /**
     * toggleSnapToGrid
     * Toggles whether coordinates snap to grid intersections (state.snapToGrid).
     */
    toggleSnapToGrid: (state) => {
      state.snapToGrid = !state.snapToGrid;
    },

    /**
     * setSelectedTool
     * Switches the currently active tool, e.g. 'wall' or 'room'.
     */
    setSelectedTool: (state, action: PayloadAction<"wall" | "room" | "select" | null>) => {
      state.selectedTool = action.payload;
    },

    /**
     * setErrorMessage
     * Stores an error message for the UI to display, or null to clear it.
     */
    setErrorMessage: (state, action: PayloadAction<string | null>) => {
      state.errorMessage = action.payload;
    },

    /**
     * toggleMeasurements
     * Toggles whether measurements are displayed in the 2D view.
     */
    toggleMeasurements: (state) => {
      state.showMeasurements = !state.showMeasurements;
    },

    /**
     * toggleAngleSnap
     * Toggles angle-based snapping for walls.
     */
    toggleAngleSnap: (state) => {
      state.angleSnapEnabled = !state.angleSnapEnabled;
    },

    /**
     * setAngleSnapIncrement
     * Adjusts the number of degrees used for angle snapping.
     */
    setAngleSnapIncrement: (state, action: PayloadAction<number>) => {
      state.angleSnapIncrement = action.payload;
    },

    /**
     * setShowRoomLabels
     * Toggles or sets the display of room labels in the 2D view.
     */
    setShowRoomLabels: (state, action: PayloadAction<boolean>) => {
      state.showRoomLabels = action.payload;
    },

    /**
     * setShowTooltips
     * Toggles or sets the display of tooltips/hints in the UI.
     */
    setShowTooltips: (state, action: PayloadAction<boolean>) => {
      state.showTooltips = action.payload;
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
  setShowTooltips
} = uiSlice.actions;

export default uiSlice.reducer;