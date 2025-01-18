import { configureStore } from "@reduxjs/toolkit";
import undoable, { StateWithHistory } from "redux-undo";
import floorPlannerReducer, { FloorPlannerState } from "./slices/floorPlannerSlice";
import uiReducer, { UiState } from "./slices/uiSlice";
import roomSlice from "./slices/roomSlice";
import projectManagerReducer from "./slices/projectManagerSlice";

export interface RootState {
  floorPlanner: StateWithHistory<FloorPlannerState>;
  ui: UiState;
  room: ReturnType<typeof roomSlice>;
  projectManager: ReturnType<typeof projectManagerReducer>;
}

export const store = configureStore({
  reducer: {
    floorPlanner: undoable(floorPlannerReducer, {
      limit: 100,
      filter: (action) => {
        // Keep it simple: track only certain actions in undo/redo
        const trackable = [
          "floorPlanner/startWall",
          "floorPlanner/updateWallEnd",
          "floorPlanner/finishWall",
          "floorPlanner/deleteWall",
          "floorPlanner/addFixture",
          "floorPlanner/updateFixture",
          "floorPlanner/clearCanvas"
        ];
        return trackable.includes(action.type);
      }
    }),
    ui: uiReducer,
    room: roomSlice,
    projectManager: projectManagerReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

// For typed usage in components
export type AppDispatch = typeof store.dispatch;