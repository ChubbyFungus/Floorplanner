import { configureStore, Middleware, Action, ThunkAction } from "@reduxjs/toolkit";
import undoable, { StateWithHistory } from "redux-undo";
import floorPlannerReducer, { FloorPlannerState } from "./slices/floorPlannerSlice";
import uiReducer, { UiState } from "./slices/uiSlice";
import roomSlice from "./slices/roomSlice";
import projectManagerReducer from "./slices/projectManagerSlice";
import roomToolReducer from "./slices/roomToolSlice";

export interface RootState {
  floorPlanner: StateWithHistory<FloorPlannerState>;
  ui: UiState;
  room: ReturnType<typeof roomSlice>;
  projectManager: ReturnType<typeof projectManagerReducer>;
  roomTool: ReturnType<typeof roomToolReducer>;
}

const loggingMiddleware: Middleware<{}, RootState> = (store) => (next) => (action) => {
  // optional logging
  const result = next(action);
  return result;
};

// Extended trackable actions
const trackableActions = [
  "floorPlanner/startWall",
  "floorPlanner/finishWall",
  "floorPlanner/deleteWall",
  "floorPlanner/addFixture",
  "floorPlanner/clearCanvas",
  "roomTool/createRectangularRoom/fulfilled",
  // Add the new door/window actions:
  "floorPlanner/addDoor",
  "floorPlanner/addWindow"
] as const;

export const store = configureStore({
  reducer: {
    floorPlanner: undoable(floorPlannerReducer, {
      limit: 100,
      filter: (action): boolean => {
        if (typeof action.type === "string") {
          return trackableActions.includes(action.type as typeof trackableActions[number]);
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
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST']
      }
    }).concat(loggingMiddleware)
});

export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;