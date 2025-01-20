import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import floorPlannerReducer from '../store/slices/floorPlannerSlice';
import FloorPlanner3D from '../components/floorplanner/FloorPlanner3D';

describe('threeDRender', () => {
  it('renders FloorPlanner3D without crashing', () => {
    const store = configureStore({
      reducer: {
        floorPlanner: floorPlannerReducer
      }
    });
    // We simply check if the component can mount without throwing an error
    const { container } = render(
      <Provider store={store}>
        <FloorPlanner3D />
      </Provider>
    );
    expect(container.querySelector('canvas')).not.toBeNull();
  });
});