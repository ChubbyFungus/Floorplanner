import { configureStore } from '@reduxjs/toolkit';
import floorPlannerReducer from './slices/floorPlannerSlice';
import uiReducer from './slices/uiSlice';
import roomToolReducer from './slices/roomToolSlice';

export const store = configureStore({
  reducer: {
    floorPlanner: floorPlannerReducer,
    ui: uiReducer,
    roomTool: roomToolReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
