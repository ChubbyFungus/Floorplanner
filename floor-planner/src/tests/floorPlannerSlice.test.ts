import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import undoable, { StateWithHistory } from 'redux-undo';
import floorPlannerReducer, {
  FloorPlannerState,
  startWall,
  finishWall,
  updateWallEnd,
  cancelWall,
  deleteWall,
  setDimensions
} from '../store/slices/floorPlannerSlice';
import { addWalls } from '../store/slices/floorPlannerSlice';

interface TestState {
  floorPlanner: StateWithHistory<FloorPlannerState>;
}

describe('floorPlannerSlice', () => {
  let store: ReturnType<typeof configureTestStore>;

  const configureTestStore = () => {
    return configureStore({
      reducer: {
        floorPlanner: undoable(floorPlannerReducer, {
          limit: 50,
          filter: () => true // track all actions for this test
        })
      }
    });
  };

  beforeEach(() => {
    store = configureTestStore();
  });

  it('starts a new wall', () => {
    store.dispatch(
      startWall({
        id: 'temp-wall',
        type: 'straight',
        start: { x: 10, y: 10 },
        end: { x: 10, y: 10 },
        thickness: 10,
        height: 100
      })
    );
    const state = store.getState().floorPlanner.present;
    expect(state.wallInProgress).not.toBeNull();
    expect(state.wallInProgress?.start).toEqual({ x: 10, y: 10 });
  });

  it('updates the in-progress wall endpoint', () => {
    store.dispatch(
      startWall({
        id: 'temp-wall',
        type: 'straight',
        start: { x: 0, y: 0 },
        end: { x: 0, y: 0 },
        thickness: 10,
        height: 100
      })
    );
    store.dispatch(
      updateWallEnd({
        id: 'temp-wall',
        type: 'straight',
        start: { x: 0, y: 0 },
        end: { x: 50, y: 50 },
        thickness: 10,
        height: 100
      })
    );
    const state = store.getState().floorPlanner.present;
    expect(state.wallInProgress?.end).toEqual({ x: 50, y: 50 });
  });

  it('finishes a wall and adds it to the store', () => {
    store.dispatch(
      startWall({
        id: 'temp-wall',
        type: 'straight',
        start: { x: 0, y: 0 },
        end: { x: 0, y: 0 },
        thickness: 10,
        height: 100
      })
    );
    store.dispatch(
      updateWallEnd({
        id: 'temp-wall',
        type: 'straight',
        start: { x: 0, y: 0 },
        end: { x: 100, y: 0 },
        thickness: 10,
        height: 100
      })
    );
    store.dispatch(finishWall());
    const state = store.getState().floorPlanner.present;
    expect(state.wallInProgress).toBeNull();
    expect(state.walls.length).toBe(1);
    expect(state.walls[0].end).toEqual({ x: 100, y: 0 });
  });

  it('cancels an in-progress wall', () => {
    store.dispatch(
      startWall({
        id: 'temp-wall',
        type: 'straight',
        start: { x: 10, y: 10 },
        end: { x: 10, y: 10 },
        thickness: 10,
        height: 100
      })
    );
    store.dispatch(cancelWall());
    const state = store.getState().floorPlanner.present;
    expect(state.wallInProgress).toBeNull();
  });

  it('deletes a wall', () => {
    store.dispatch(
      addWalls([
        {
          id: 'wall1',
          type: 'straight',
          start: { x: 0, y: 0 },
          end: { x: 100, y: 0 },
          thickness: 10,
          height: 100
        }
      ])
    );
    store.dispatch(deleteWall('wall1'));
    const state = store.getState().floorPlanner.present;
    expect(state.walls.length).toBe(0);
  });

  it('sets plan dimensions like total area and volume', () => {
    store.dispatch(setDimensions({ totalArea: 200, totalVolume: 500 }));
    const state = store.getState().floorPlanner.present;
    expect(state.dimensions.totalArea).toBe(200);
    expect(state.dimensions.totalVolume).toBe(500);
  });

  it('undo/redo works for actions', () => {
    store.dispatch(
      addWalls([
        {
          id: 'wall2',
          type: 'straight',
          start: { x: 10, y: 10 },
          end: { x: 20, y: 10 },
          thickness: 10,
          height: 100
        }
      ])
    );
    expect(store.getState().floorPlanner.present.walls.length).toBe(1);

    // Undo
    store.dispatch({ type: 'UNDO' });
    expect(store.getState().floorPlanner.present.walls.length).toBe(0);

    // Redo
    store.dispatch({ type: 'REDO' });
    expect(store.getState().floorPlanner.present.walls.length).toBe(1);
  });
});