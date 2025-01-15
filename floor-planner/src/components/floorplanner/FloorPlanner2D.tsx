// src/components/floorplanner/FloorPlanner2D.tsx

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { AppDispatch, RootState } from '../../store/store';
import { Point2D, WallData } from '../../types/types';
import { getDistance, wouldCompleteShape } from '../../utils/geometryUtils';
import { PIXELS_PER_FOOT, POINT_TOLERANCE } from '../../constants';
import {
  startWall,
  addWall,
  updateWallEnd,
  finalizeWall,
  cancelWall,
  addWallControlPoint,
  updateLastControlPoint,
} from '../../store/slices/floorPlannerSlice';
import { createRectangularRoom } from '../../store/slices/roomToolSlice';
import { drawWalls, drawInProgressWall, drawRoomPreview } from './drawing';

const FloorPlanner2D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const wallInProgress = useSelector((state: RootState) => state.floorPlanner.wallInProgress);
  const walls = useSelector((state: RootState) => state.floorPlanner.walls);
  const { angleSnapEnabled, angleSnapIncrement, selectedTool, showMeasurements } = useSelector((state: RootState) => {
    console.log('Redux state:', state);
    console.log('UI state:', state.ui);
    return state.ui;
  });
  const [isAltPressed, setIsAltPressed] = useState(false);
  const [roomStart, setRoomStart] = useState<Point2D | null>(null);
  const [mousePos, setMousePos] = useState<Point2D>({ x: 0, y: 0 });
  const [selectedPoint, setSelectedPoint] = useState<Point2D | null>(null);
  const [selectedWall, setSelectedWall] = useState<WallData | null>(null);

  // Drawing functions
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    console.log("Redrawing with measurements:", showMeasurements);

    // Get DPI scale
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas size in device pixels
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    
    // Set actual size in memory (scaled for DPI)
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    
    // Scale context for correct drawing
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // Draw existing walls with measurements (if enabled)
    drawWalls(ctx, walls, showMeasurements);

    // Draw wall in progress
    if (wallInProgress) {
      drawInProgressWall(ctx, wallInProgress, showMeasurements);
    }

    // Draw room preview if in room tool mode
    if (selectedTool === 'room' && roomStart && mousePos) {
      drawRoomPreview(ctx, roomStart, mousePos, showMeasurements);
    }
  }, [walls, wallInProgress, showMeasurements, selectedTool, roomStart, mousePos]);

  // Canvas setup effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      // Set display size (css pixels)
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      // Set actual size in memory (scaled for DPI)
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

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
    
    // Get the scale factor between canvas logical size and displayed size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Convert mouse coordinates to canvas coordinates
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

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
    console.log('Canvas clicked:', { 
      point, 
      selectedTool, 
      wallInProgress, 
      wallCount: walls.length,
      walls
    });

    if (selectedTool === 'wall') {
      console.log('Wall tool active');
      if (wallInProgress) {
        console.log('Wall in progress:', wallInProgress);
        if (isAltPressed) {
          console.log('Alt pressed, adding control point');
          dispatch(addWallControlPoint(point));
        } else {
          console.log('Creating wall section');
          // First snap to angle
          const snappedPoint = snapAngle(wallInProgress.start, point);
          console.log('Snapped point:', snappedPoint);
          
          // Then check if we're near any wall or endpoint
          const nearestPoint = findNearestWallPoint(snappedPoint, walls);
          const finalPoint = nearestPoint || snappedPoint;
          console.log('Final point:', finalPoint);
          
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
        console.log('Starting new wall at:', startPoint);
        dispatch(startWall(startPoint));
      }
    } else if (selectedTool === 'room') {
      console.log(`Selected tool: ${selectedTool} (Room tool)`);
      if (!roomStart) {
        // For the first click, try to snap to existing walls
        const nearestPoint = findNearestWallPoint(point, walls);
        setRoomStart(nearestPoint || point);
      } else {
        // For the second click, apply snapping
        const nearestPoint = findNearestWallPoint(point, walls);
        const endPoint = nearestPoint || point;
        
        // Create rectangular room using snapped coordinates
        const width = Math.abs(endPoint.x - roomStart.x);
        const depth = Math.abs(endPoint.y - roomStart.y);
        
        // Convert dimensions to feet for display
        const widthInFeet = width / PIXELS_PER_FOOT;
        const depthInFeet = depth / PIXELS_PER_FOOT;
        console.log(`Room dimensions: ${widthInFeet.toFixed(2)}' x ${depthInFeet.toFixed(2)}'`);
        
        void dispatch(createRectangularRoom({
          startX: Math.min(roomStart.x, endPoint.x),
          startY: Math.min(roomStart.y, endPoint.y),
          width,
          depth,
          thickness: 10,
          height: 280
        }));
        setRoomStart(null);
      }
    } else {
      console.log('No tool selected');
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
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onMouseMove={handleMouseMove}
        onClick={handleCanvasClick}
      />
    </div>
  );
};

export default FloorPlanner2D;
