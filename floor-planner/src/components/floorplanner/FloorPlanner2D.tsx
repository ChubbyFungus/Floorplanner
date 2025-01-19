import React, { useRef, useEffect, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../store/store";
import {
  startWall,
  updateWallEnd,
  finishWall
} from "../../store/slices/floorPlannerSlice";
import { createRectangularRoom } from "../../store/slices/roomToolSlice";
import {
  snapToGrid,
  getDistance
} from "../../utils/geometryUtils";
import { drawWalls, drawInProgressWall } from "./drawing";
import { WallData, Point2D } from "../../types";
import {
  generateAngleGuides,
  findNearestSnapAngle,
  snapPointToAngle
} from "../../utils/angleUtils";
import Grid from "./Grid";
import { setSelectedTool } from "../../store/slices/uiSlice";

interface FloorPlanner2DProps {
  onWallSelect?: (wall: WallData) => void;

  showMeasurements?: boolean;
  angleSnapEnabled?: boolean;
  angleSnapIncrement?: number;
  showGrid?: boolean;
}

/**
 * FloorPlanner2D
 * -------------
 * Renders the 2D canvas for drawing/selection. 
 * - Closes the wall if the end is near the start (forming a closed shape).
 * - Cancels or finishes drawing on Escape or shape closure.
 */
const FloorPlanner2D: React.FC<FloorPlanner2DProps> = ({
  onWallSelect,
  showMeasurements = false,
  angleSnapEnabled = true,
  angleSnapIncrement = 45,
  showGrid = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const [roomClickStart, setRoomClickStart] = useState<Point2D | null>(null);
  const [roomPreviewEnd, setRoomPreviewEnd] = useState<Point2D | null>(null);

  const uiState = useSelector((state: RootState) => state.ui);
  const selectedTool = uiState.selectedTool;
  const { snapToGrid: snapEnabled, snapGridSize } = uiState;

  const floorPlan = useSelector((state: RootState) => state.floorPlanner.present);
  const { walls, wallInProgress } = floorPlan;

  /**
   * handleMouseMove
   * - If "wall" tool is active, update the in-progress wall end with snapping.
   * - If "room" tool, show a preview rectangle.
   */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;

      if (snapEnabled) {
        const snapped = snapToGrid({ x, y }, snapGridSize);
        x = snapped.x;
        y = snapped.y;
      }

      if (angleSnapEnabled && wallInProgress && selectedTool === "wall") {
        const dx = x - wallInProgress.start.x;
        const dy = y - wallInProgress.start.y;
        const currentAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
        const nearest = findNearestSnapAngle(currentAngle, walls);

        if (
          nearest &&
          Math.abs(nearest.angle - currentAngle) <= angleSnapIncrement
        ) {
          const snappedPoint = snapPointToAngle(
            wallInProgress.start,
            { x, y },
            nearest.angle
          );
          x = snappedPoint.x;
          y = snappedPoint.y;
        }
      }

      if (selectedTool === "wall" && wallInProgress) {
        dispatch(
          updateWallEnd({
            ...wallInProgress,
            end: { x, y }
          })
        );
      }

      if (selectedTool === "room" && roomClickStart) {
        setRoomPreviewEnd({ x, y });
      }
    },
    [
      dispatch,
      wallInProgress,
      snapEnabled,
      snapGridSize,
      selectedTool,
      roomClickStart,
      angleSnapEnabled,
      angleSnapIncrement,
      walls
    ]
  );

  /**
   * handleClick
   * - "room": two-click rectangle creation
   * - "wall": continuous wall drawing
   * - "select": checks for a clicked wall
   */
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;

      if (snapEnabled) {
        const snapped = snapToGrid({ x, y }, snapGridSize);
        x = snapped.x;
        y = snapped.y;
      }

      if (selectedTool === "room") {
        // ROOM TOOL
        if (!roomClickStart) {
          setRoomClickStart({ x, y });
          setRoomPreviewEnd({ x, y });
        } else {
          dispatch(createRectangularRoom({ start: roomClickStart, end: { x, y } }));
          setRoomClickStart(null);
          setRoomPreviewEnd(null);

          // Return to select tool
          dispatch(setSelectedTool("select"));
        }
        return;
      }

      if (selectedTool === "wall") {
        if (!wallInProgress) {
          // Start a new wall
          dispatch(
            startWall({
              id: "temp-wall",
              type: "straight",
              start: { x, y },
              end: { x, y },
              thickness: 10,
              height: 100
            })
          );
        } else {
          // If the user closes the shape (end near start), finalize and return to select
          const distanceFromStart = getDistance(wallInProgress.start, { x, y });
          if (distanceFromStart < 10) {
            // That means they've clicked near the start -> close shape
            dispatch(finishWall());
            dispatch(setSelectedTool("select"));
          } else {
            // Finish the current segment
            dispatch(
              updateWallEnd({
                ...wallInProgress,
                end: { x, y }
              })
            );
            dispatch(finishWall());

            // Immediately start a new wall from that point
            dispatch(
              startWall({
                id: "temp-wall",
                type: "straight",
                start: { x, y },
                end: { x, y },
                thickness: 10,
                height: 100
              })
            );
          }
        }
        return;
      }

      // SELECT TOOL: find nearest wall
      if (selectedTool === "select") {
        const clickPoint: Point2D = { x, y };
        let nearestWall: WallData | null = null;
        let nearestDistance = Infinity;

        walls.forEach((wall) => {
          const dist = distanceToSegment(clickPoint, wall.start, wall.end);
          if (dist < nearestDistance) {
            nearestDistance = dist;
            nearestWall = wall;
          }
        });

        const THRESHOLD = 10;
        if (nearestWall && nearestDistance <= THRESHOLD) {
          onWallSelect?.(nearestWall);
        }
      }
    },
    [
      dispatch,
      wallInProgress,
      snapEnabled,
      snapGridSize,
      selectedTool,
      roomClickStart,
      onWallSelect,
      walls
    ]
  );

  /**
   * distanceToSegment
   * Helper to compute the distance from a point to a line segment.
   */
  const distanceToSegment = (p: Point2D, p1: Point2D, p2: Point2D): number => {
    const A = p.x - p1.x;
    const B = p.y - p1.y;
    const C = p2.x - p1.x;
    const D = p2.y - p1.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;
    if (param < 0) {
      xx = p1.x;
      yy = p1.y;
    } else if (param > 1) {
      xx = p2.x;
      yy = p2.y;
    } else {
      xx = p1.x + param * C;
      yy = p1.y + param * D;
    }

    const dx = p.x - xx;
    const dy = p.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  /**
   * redraw
   * Clears and re-renders walls + in-progress shapes.
   */
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawWalls(ctx, walls, showMeasurements);

    if (selectedTool === "wall" && wallInProgress) {
      let angleGuides = undefined;
      if (angleSnapEnabled) {
        const dx = wallInProgress.end.x - wallInProgress.start.x;
        const dy = wallInProgress.end.y - wallInProgress.start.y;
        const currentAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
        angleGuides = generateAngleGuides(wallInProgress.start, wallInProgress.end, currentAngle, walls);
      }
      drawInProgressWall(ctx, wallInProgress, showMeasurements, angleGuides);
    }

    if (selectedTool === "room" && roomClickStart && roomPreviewEnd) {
      const startX = roomClickStart.x;
      const startY = roomClickStart.y;
      const endX = roomPreviewEnd.x;
      const endY = roomPreviewEnd.y;

      ctx.save();
      ctx.setLineDash([5, 3]);
      ctx.strokeStyle = "#888";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(
        Math.min(startX, endX),
        Math.min(startY, endY),
        Math.abs(endX - startX),
        Math.abs(endY - startY)
      );
      ctx.stroke();
      ctx.restore();
    }
  }, [
    walls,
    wallInProgress,
    selectedTool,
    roomClickStart,
    roomPreviewEnd,
    showMeasurements,
    angleSnapEnabled
  ]);

  /**
   * Set up canvas size on mount/resize, then redraw.
   */
  useEffect(() => {
    const resizeCanvas = () => {
      if (!canvasRef.current) return;
      const parent = canvasRef.current.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      canvasRef.current.width = rect.width;
      canvasRef.current.height = rect.height;
      redraw();
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [redraw]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {showGrid && <Grid width={0} height={0} />}
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%" }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      />
    </div>
  );
};

export default FloorPlanner2D;