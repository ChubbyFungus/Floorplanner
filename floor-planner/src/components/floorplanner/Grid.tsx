import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

interface GridProps {
  width: number;
  height: number;
}

export const Grid: React.FC<GridProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { snapToGrid: showGrid, snapGridSize: gridSize } = useSelector((state: RootState) => state.ui);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !showGrid) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set up grid style
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    // Draw vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw major grid lines (every 5 cells)
    ctx.strokeStyle = '#bdbdbd';
    ctx.lineWidth = 1;

    for (let x = 0; x <= width; x += gridSize * 5) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += gridSize * 5) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Add measurements on major grid lines
    ctx.fillStyle = '#757575';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // X-axis measurements (bottom)
    for (let x = 0; x <= width; x += gridSize * 5) {
      const meters = (x / gridSize).toFixed(1);
      ctx.fillText(`${meters}m`, x, height - 15);
    }

    // Y-axis measurements (left)
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = 0; y <= height; y += gridSize * 5) {
      const meters = (y / gridSize).toFixed(1);
      ctx.fillText(`${meters}m`, 25, y);
    }
  }, [width, height, showGrid, gridSize]);

  if (!showGrid) return null;

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 0
      }}
    />
  );
};

export default Grid;
