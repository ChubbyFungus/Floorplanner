// src/store/store.ts
import { configureStore, Middleware } from "@reduxjs/toolkit";
import undoable, { StateWithHistory } from "redux-undo";
import floorPlannerReducer, { FloorPlannerState } from "./slices/floorPlannerSlice";
import uiReducer, { UiState } from "./slices/uiSlice";
import roomSlice from "./slices/roomSlice";
import projectManagerReducer from "./slices/projectManagerSlice";
import roomToolReducer from "./slices/roomToolSlice";

/**
 * RootState
 * ---------
 * Combines all slice states, including undo history for floorPlanner.
 */
export interface RootState {
  floorPlanner: StateWithHistory<FloorPlannerState>;
  ui: UiState;
  room: ReturnType<typeof roomSlice>;
  projectManager: ReturnType<typeof projectManagerReducer>;
  roomTool: ReturnType<typeof roomToolReducer>;
}

/**
 * loggingMiddleware
 * -----------------
 * Simple Redux middleware that logs actions and states.
 */
const loggingMiddleware: Middleware<{}, RootState> = (store) => (next) => (action) => {
  console.log("=== Redux Action ===");
  console.log(`[${new Date().toISOString()}] Action:`, action);
  console.log("Previous state:", store.getState());
  const result = next(action);
  console.log("Next state:", store.getState());
  console.log("==================");
  return result;
};

/**
 * trackableActions
 * ----------------
 * Only the "major" actions should be part of undo/redo history,
 * preventing each small movement from flooding the history.
 */
const trackableActions = [
  "floorPlanner/startWall",
  "floorPlanner/finishWall",
  "floorPlanner/deleteWall",
  "floorPlanner/addFixture",
  "floorPlanner/clearCanvas",
  // For room creation
  "roomTool/createRectangularRoom/fulfilled"
];

export const store = configureStore({
  reducer: {
    floorPlanner: undoable(floorPlannerReducer, {
      limit: 100,
      filter: (action) => {
        if (typeof action.type === "string") {
          return trackableActions.includes(action.type);
        }
        return false;
      }
    }),
    ui: uiReducer,
    room: roomSlice,
    projectManager: projectManagerReducer,
    roomTool: roomToolReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    }).concat(loggingMiddleware)
});

export type AppDispatch = typeof store.dispatch;