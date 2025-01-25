import React from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import FloorPlanner3D from '../../floor-planner/src/components/floorplanner/FloorPlanner3D';

// Mock Canvas component to avoid WebGL rendering
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-canvas">{children}</div>
  )
}));

describe('threeDRender', () => {
  it('renders FloorPlanner3D without crashing', () => {
    const { getByTestId } = render(<FloorPlanner3D />);
    expect(getByTestId('mock-canvas')).toBeInTheDocument();
  });
});
