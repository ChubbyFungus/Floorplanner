import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import undoable from 'redux-undo';
import floorPlannerReducer from '../store/slices/floorPlannerSlice';
import FloorPlanner3D from '../components/floorplanner/FloorPlanner3D';

/**
 * threeDRender.test.tsx
 * ---------------------
 * Fixes the "Cannot read properties of undefined" by ensuring the test store's shape
 * matches what FloorPlanner3D expects: { floorPlanner: undoable(floorPlannerReducer) }.
 */
describe('threeDRender', () => {
  it('renders FloorPlanner3D without crashing', () => {
    const store = configureStore({
      reducer: {
        // If your production store is "undoable(floorPlannerReducer)", do that here too
        floorPlanner: undoable(floorPlannerReducer)
      }
    });

    // Just check if it mounts
    const { container } = render(
      <Provider store={store}>
        <FloorPlanner3D />
      </Provider>
    );
    // We expect a <canvas> from @react-three/fiber
    const canvasEl = container.querySelector('canvas');
    expect(canvasEl).not.toBeNull();
  });
});