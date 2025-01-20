import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import floorPlannerReducer from '../store/slices/floorPlannerSlice';
import roomToolReducer, {
  createRectangularRoom
} from '../store/slices/roomToolSlice';
import { RootState } from '../store/store';

interface TestState {
  floorPlanner: ReturnType<typeof floorPlannerReducer>;
  roomTool: ReturnType<typeof roomToolReducer>;
}

describe('roomToolSlice', () => {
  let store: ReturnType<typeof configureTestStore>;

  const configureTestStore = () => {
    return configureStore({
      reducer: {
        floorPlanner: floorPlannerReducer,
        roomTool: roomToolReducer
      }
    });
  };

  beforeEach(() => {
    store = configureTestStore();
  });

  it('createRectangularRoom does not create a room if smaller than 5x5', async () => {
    await store.dispatch(
      createRectangularRoom({
        start: { x: 100, y: 100 },
        end: { x: 102, y: 102 }
      })
    );
    const fpState = store.getState().floorPlanner;
    expect(fpState.walls.length).toBe(0);
  });

  it('createRectangularRoom dispatches four new walls', async () => {
    await store.dispatch(
      createRectangularRoom({
        start: { x: 100, y: 100 },
        end: { x: 200, y: 150 }
      })
    );
    const fpState = store.getState().floorPlanner;
    expect(fpState.walls.length).toBe(4);
  });
});