import { vi } from 'vitest';
import type { WebGLRenderer } from 'three';

// Mock ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(window as any).ResizeObserver = ResizeObserver;

/**
 * Remove vi.mock('three') so we don't create a second instance 
 * of ThreeJS in the tests. Now we rely on the real 'three' 
 * library for test environment or partial mocks if needed.
 */

// If you need a partial override, do something like:
// vi.mock('three', async (importOriginal) => {
//   const original = await importOriginal<typeof import('three')>();
//   // PARTIAL override or no override at all
//   return { ...original };
// });

// Setup canvas
const canvas = document.createElement('canvas');
canvas.id = 'three-canvas';
document.body.appendChild(canvas);