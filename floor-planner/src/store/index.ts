// src/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import floorPlannerReducer from "./slices/floorPlannerSlice";
import projectManagerReducer from "./slices/projectManagerSlice";
import uiReducer from "./slices/uiSlice";
import roomToolReducer from "./slices/roomToolSlice";
import { loadState, saveState } from "../services/autoSaveService";

const preloadedState = loadState();

// Define store state type before store creation
type StoreState = {
  floorPlanner: ReturnType<typeof floorPlannerReducer>;
  projectManager: ReturnType<typeof projectManagerReducer>;
  ui: ReturnType<typeof uiReducer>;
  roomTool: ReturnType<typeof roomToolReducer>;
};

export const store = configureStore({
  reducer: {
    floorPlanner: floorPlannerReducer,
    projectManager: projectManagerReducer,
    ui: uiReducer,
    roomTool: roomToolReducer
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    serializableCheck: false
  }),
  preloadedState
});

store.subscribe(() => {
  saveState(store.getState());
});

export type RootState = StoreState;
export type AppDispatch = typeof store.dispatch;
