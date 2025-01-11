// src/components/floorplanner/FloorPlanner2D.tsx

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import { Point2D } from "../../types";
import {
  startWall,
  updateWallEnd,
  addWallControlPoint,
  updateLastControlPoint,
  addWall,
  clearCanvas,
  cancelWall,
  finalizeWall
} from "../../store/slices/floorPlannerSlice";
import { createRectangularRoom } from "../../store/slices/roomToolSlice";
import { v4 as uuidv4 } from "uuid";
import { drawWalls, drawInProgressWall, drawWallSegmentMeasurements } from "./drawing";
import { 
  wouldCompleteShape, 
  isConnectedToExistingWall, 
  arePointsEqual, 
  getDistance, 
  findNearestWallPoint, 
  PIXELS_PER_FOOT, 
  getDistanceToLineSegment 
} from "../../utils/geometryUtils";

const POINT_TOLERANCE = 10;

export const FloorPlanner2D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const wallInProgress = useSelector((state: RootState) => state.floorPlanner.wallInProgress);
  const walls = useSelector((state: RootState) => state.floorPlanner.walls);
  const { angleSnapEnabled, angleSnapIncrement, selectedTool } = useSelector((state: RootState) => {
    console.log('Redux state:', state);
    console.log('UI state:', state.ui);
    return state.ui;
  });
  const [isAltPressed, setIsAltPressed] = useState(false);
  const [roomStart, setRoomStart] = useState<Point2D | null>(null);
  const [mousePos, setMousePos] = useState<Point2D>({ x: 0, y: 0 });

  // Drawing functions
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Get DPI scale
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.scale(1/dpr, 1/dpr);  // Unscale for drawing

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw existing walls
    drawWalls(ctx, walls);

    // Draw wall segment measurements
    drawWallSegmentMeasurements(ctx, walls);

    // Draw wall in progress
    if (wallInProgress) {
      drawInProgressWall(ctx, wallInProgress);

      // Draw dynamic measurements and angle
      ctx.font = '14px Arial';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'center';

      // Calculate distance
      const dx = mousePos.x - wallInProgress.start.x;
      const dy = mousePos.y - wallInProgress.start.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const midX = (wallInProgress.start.x + mousePos.x) / 2;
      const midY = (wallInProgress.start.y + mousePos.y) / 2;
      ctx.fillText(`${Math.round(distance)}px`, midX, midY - 10);

      // Calculate angle
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const normalizedAngle = ((angle % 360) + 360) % 360;
      ctx.fillText(`${Math.round(normalizedAngle)}°`, midX, midY + 20);
    }

    // Draw room preview
    if (roomStart && selectedTool === 'room') {
      ctx.strokeStyle = '#4a90e2';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(roomStart.x, roomStart.y);
      const width = mousePos.x - roomStart.x;
      const height = mousePos.y - roomStart.y;
      ctx.rect(roomStart.x, roomStart.y, width, height);
      ctx.stroke();

      // Draw room dimensions
      ctx.font = '14px Arial';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'center';
      ctx.setLineDash([]);

      // Width
      const midX = roomStart.x + width / 2;
      const midY = roomStart.y + height / 2;
      ctx.fillText(`${Math.abs(Math.round(width))}px`, midX, roomStart.y - 10);

      // Height
      ctx.save();
      ctx.translate(roomStart.x - 10, midY);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(`${Math.abs(Math.round(height))}px`, 0, 0);
      ctx.restore();
    }

    ctx.restore();
  }, [walls, wallInProgress, roomStart, selectedTool, mousePos]);

  // Canvas setup effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = parent.getBoundingClientRect();

      // Set display size (css pixels)
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      // Set actual size in memory (scaled for DPI)
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      // Scale all drawing operations by dpr
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      redraw();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [redraw]);

  // Helper function to snap angles
  const snapAngle = useCallback((start: Point2D, end: Point2D): Point2D => {
    if (!angleSnapEnabled) return end;

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = (angleRad * 180) / Math.PI;
    const snappedDeg = Math.round(angleDeg / angleSnapIncrement) * angleSnapIncrement;
    const r = Math.sqrt(dx * dx + dy * dy);
    const snappedRad = (snappedDeg * Math.PI) / 180;
    return {
      x: start.x + r * Math.cos(snappedRad),
      y: start.y + r * Math.sin(snappedRad)
    };
  }, [angleSnapEnabled, angleSnapIncrement]);

  const findNearestWallPoint = useCallback((point: Point2D, walls: any[]): Point2D | null => {
    let nearestPoint: Point2D | null = null;
    let minDistance = Infinity;

    for (const wall of walls) {
      const distToStart = getDistance(point, wall.start);
      const distToEnd = getDistance(point, wall.end);

      if (distToStart < minDistance && distToStart <= POINT_TOLERANCE) {
        minDistance = distToStart;
        nearestPoint = wall.start;
      }
      if (distToEnd < minDistance && distToEnd <= POINT_TOLERANCE) {
        minDistance = distToEnd;
        nearestPoint = wall.end;
      }

      // Check if point is on the wall
      const wallVector = { x: wall.end.x - wall.start.x, y: wall.end.y - wall.start.y };
      const pointVector = { x: point.x - wall.start.x, y: point.y - wall.start.y };
      const dotProduct = wallVector.x * pointVector.x + wallVector.y * pointVector.y;
      const wallLengthSquared = wallVector.x * wallVector.x + wallVector.y * wallVector.y;
      const projection = dotProduct / wallLengthSquared;
      if (projection >= 0 && projection <= 1) {
        const projectedPoint = {
          x: wall.start.x + projection * wallVector.x,
          y: wall.start.y + projection * wallVector.y
        };
        const distance = getDistance(point, projectedPoint);
        if (distance < minDistance && distance <= POINT_TOLERANCE) {
          minDistance = distance;
          nearestPoint = projectedPoint;
        }
      }
    }

    return nearestPoint;
  }, []);

  const getMousePosition = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Convert mouse coordinates to canvas coordinates
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);

    return { x, y };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const point = getMousePosition(e);
    
    if (selectedTool === 'wall' && wallInProgress) {
      // First snap to angle
      const snappedPoint = snapAngle(wallInProgress.start, point);
      
      // Then check if we're near any wall or endpoint
      const nearestPoint = findNearestWallPoint(snappedPoint, walls);
      const finalPoint = nearestPoint || snappedPoint;
      
      if (isAltPressed) {
        // When Alt is pressed, either update or add control point
        if (wallInProgress.controlPoints && wallInProgress.controlPoints.length > 0) {
          dispatch(updateLastControlPoint(finalPoint));
        } else {
          dispatch(addWallControlPoint(finalPoint));
        }
      } else {
        // Normal wall end update with snapping
        dispatch(updateWallEnd(finalPoint));
      }
      
      // Draw snap indicator if we're snapping
      if (nearestPoint) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.beginPath();
          ctx.arc(nearestPoint.x, nearestPoint.y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = '#00ff00';
          ctx.fill();
          
          // Draw line to snap point
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(nearestPoint.x, nearestPoint.y);
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }
    
    setMousePos(point);
    redraw();
  }, [dispatch, wallInProgress, isAltPressed, snapAngle, selectedTool, getMousePosition, redraw, walls]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const point = getMousePosition(e);
    console.log('Canvas clicked:', { point, selectedTool, wallInProgress, wallCount: walls.length });

    if (selectedTool === 'wall') {
      console.log('Wall tool active');
      if (wallInProgress) {
        console.log('Wall in progress');
        if (isAltPressed) {
          console.log('Alt pressed, adding control point');
          dispatch(addWallControlPoint(point));
        } else {
          console.log('Creating wall section');
          // First snap to angle
          const snappedPoint = snapAngle(wallInProgress.start, point);
          
          // Then check if we're near any wall or endpoint
          const nearestPoint = findNearestWallPoint(snappedPoint, walls);
          const finalPoint = nearestPoint || snappedPoint;
          
          const newWall = {
            id: uuidv4(),
            start: wallInProgress.start,
            end: finalPoint,
            controlPoints: wallInProgress.controlPoints || [],
            thickness: 10,
            height: 280
          };

          console.log('New wall:', newWall);
          console.log('Existing walls:', walls);

          // Check if this wall would complete a shape
          if (wouldCompleteShape(newWall, walls)) {
            console.log('Completing shape');
            dispatch(addWall(newWall));
            dispatch(finalizeWall());
          } else {
            console.log('Starting new wall section');
            dispatch(addWall(newWall));
            dispatch(startWall(finalPoint));
          }
        }
      } else {
        // For the first click, also try to snap to existing walls
        const nearestPoint = findNearestWallPoint(point, walls);
        const startPoint = nearestPoint || point;
        dispatch(startWall(startPoint));
        console.log('Started new wall at:', startPoint);
      }
    } else if (selectedTool === 'room') {
      console.log(`Selected tool: ${selectedTool} (Room tool)`);
      if (!roomStart) {
        setRoomStart(point);
      } else {
        // Create rectangular room
        const width = Math.abs(point.x - roomStart.x);
        const depth = Math.abs(point.y - roomStart.y);
        
        // Convert dimensions to feet for display
        const widthInFeet = width / PIXELS_PER_FOOT;
        const depthInFeet = depth / PIXELS_PER_FOOT;
        console.log(`Room dimensions: ${widthInFeet.toFixed(2)}' x ${depthInFeet.toFixed(2)}'`);
        
        void dispatch(createRectangularRoom({
          startX: Math.min(roomStart.x, point.x),
          startY: Math.min(roomStart.y, point.y),
          width: width * 2, // Double the width to match expected dimensions
          depth: depth * 2, // Double the depth to match expected dimensions
          thickness: 10,
          height: 280
        }));
        setRoomStart(null);
      }
    }
  }, [dispatch, wallInProgress, isAltPressed, snapAngle, selectedTool, roomStart, getMousePosition, walls]);

  // Redraw whenever relevant state changes
  useEffect(() => {
    redraw();
  }, [redraw]);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dispatch(cancelWall());
      } else if (e.key === 'Alt') {
        setIsAltPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setIsAltPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [dispatch]);

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={() => dispatch(clearCanvas())}
        >
          Clear Canvas
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-full bg-white"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
      />
    </div>
  );
};
