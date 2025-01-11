import { configureStore } from '@reduxjs/toolkit';
import floorPlannerReducer, { startWall, updateWallEnd, addWallControlPoint, finalizeWall, clearCanvas } from '../store/slices/floorPlannerSlice';
import uiReducer, { toggleGrid, toggleSnapToGrid, setSelectedTool } from '../store/slices/uiSlice';
import { RootState } from '../store';

describe('FloorPlanner Redux State', () => {
  let store = configureStore({
    reducer: {
      floorPlanner: floorPlannerReducer,
      ui: uiReducer,
    }
  });

  beforeEach(() => {
    store = configureStore({
      reducer: {
        floorPlanner: floorPlannerReducer,
        ui: uiReducer,
      }
    });
  });

  it('should handle wall creation and modification', () => {
    // Test wall creation
    store.dispatch(startWall({ x: 0, y: 0 }));
    expect(store.getState().floorPlanner.wallInProgress).toBeTruthy();
    
    // Test wall update
    store.dispatch(updateWallEnd({ x: 100, y: 100 }));
    const wall = store.getState().floorPlanner.wallInProgress;
    expect(wall.end).toEqual({ x: 100, y: 100 });
    
    // Test wall finalization
    store.dispatch(finalizeWall());
    expect(store.getState().floorPlanner.walls.length).toBe(1);
    expect(store.getState().floorPlanner.wallInProgress).toBeNull();
  });

  it('should handle curved walls', () => {
    // Start a wall
    store.dispatch(startWall({ x: 0, y: 0 }));
    
    // Add a control point
    store.dispatch(addWallControlPoint({ x: 50, y: 50 }));
    
    // Update wall end
    store.dispatch(updateWallEnd({ x: 100, y: 0 }));
    
    const wall = store.getState().floorPlanner.wallInProgress;
    expect(wall.controlPoints).toHaveLength(1);
    expect(wall.controlPoints[0]).toEqual({ x: 50, y: 50 });
  });

  it('should handle UI state changes', () => {
    // Test grid toggle
    store.dispatch(toggleGrid());
    expect(store.getState().ui.showGrid).toBe(false);
    
    // Test snap toggle
    store.dispatch(toggleSnapToGrid());
    expect(store.getState().ui.snapToGrid).toBe(false);
    
    // Test tool selection
    store.dispatch(setSelectedTool('wall'));
    expect(store.getState().ui.selectedTool).toBe('wall');
  });

  it('should handle canvas clearing', () => {
    // Add a wall first
    store.dispatch(startWall({ x: 0, y: 0 }));
    store.dispatch(updateWallEnd({ x: 100, y: 100 }));
    store.dispatch(finalizeWall());
    
    // Clear canvas
    store.dispatch(clearCanvas());
    expect(store.getState().floorPlanner.walls).toHaveLength(0);
    expect(store.getState().floorPlanner.wallInProgress).toBeNull();
  });
});
