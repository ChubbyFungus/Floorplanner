// src/setupTests.ts
/**
 * We stub out getContext("2d") and getContext("webgl") so that libraries
 * like Lottie or React Three Fiber won't crash on "not implemented" errors.
 * This is a minimal, fake canvas context approach that stops the test from failing.
 */

if (typeof HTMLCanvasElement !== 'undefined') {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;

  HTMLCanvasElement.prototype.getContext = function (
    type: string,
    ...args: any[]
  ) {
    // If requesting "2d", return a minimal mock object
    if (type === '2d') {
      return {
        fillStyle: '#000',
        strokeStyle: '#000',
        lineWidth: 1,
        fillRect: () => {},
        strokeRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        arc: () => {},
        closePath: () => {},
        fill: () => {},
        stroke: () => {},
        measureText: () => ({ width: 0 }),
        // ... add stubs for any other methods Lottie might call
      };
    }

    // If requesting "webgl" or "webgl2", return a minimal mock
    if (type === 'webgl' || type === 'webgl2') {
      return {
        // minimal mock for Three.js
        getExtension: () => null,
        activeTexture: () => {},
        bindTexture: () => {},
        texImage2D: () => {},
        // ... more stubs if needed
      };
    }

    // fallback for other context types (like "2d", "bitmaprenderer", etc.)
    return originalGetContext.apply(this, [type, ...args]);
  };
}