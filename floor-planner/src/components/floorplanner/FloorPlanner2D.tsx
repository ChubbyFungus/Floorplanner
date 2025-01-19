import React, { useRef, useEffect, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../store/store";
import {
  startWall,
  updateWallEnd,
  finishWall
} from "../../store/slices/floorPlannerSlice";
import { createRectangularRoom } from "../../store/slices/roomToolSlice";
import { snapToGrid } from "../../utils/geometryUtils";
import { drawWalls, drawInProgressWall } from "./drawing";
import { WallData, Point2D } from "../../types";

/**
 * Optional props for the FloorPlanner2D component.
 * @property {Function} onWallSelect - Callback triggered if a user double-clicks or specifically selects a wall.
 */
interface FloorPlanner2DProps {
  onWallSelect?: (wall: WallData) => void;
}

/**
 * FloorPlanner2D
 * -------------
 * Renders the 2D canvas for user interaction.
 * - Mouse/Touch events for walls or room creation.
 * - Grid-based snapping if enabled.
 * - Real-time drawing for wall in progress & room preview rectangle.
 */
const FloorPlanner2D: React.FC<FloorPlanner2DProps> = ({ onWallSelect }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const [roomClickStart, setRoomClickStart] = useState<Point2D | null>(null);
  const [roomPreviewEnd, setRoomPreviewEnd] = useState<Point2D | null>(null);

  const uiState = useSelector((state: RootState) => state.ui);
  const selectedTool = uiState.selectedTool;
  const {
    snapToGrid: snapEnabled,
    snapGridSize
  } = uiState;

  const floorPlan = useSelector((state: RootState) => state.floorPlanner.present);
  const { walls, wallInProgress } = floorPlan;

  /**
   * handleMouseMove
   * - Update wall in progress if "wall" tool is active.
   * - Show a dashed room preview if "room" tool is active & we have a start point.
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

      // WALL TOOL: if a wall is in progress, update its end
      if (selectedTool === "wall" && wallInProgress) {
        dispatch(
          updateWallEnd({
            ...wallInProgress,
            end: { x, y }
          })
        );
      }

      // ROOM TOOL: if we have a start point, store a "previewEnd"
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
      roomClickStart
    ]
  );

  /**
   * handleClick
   * - If the tool is "wall," do start/finish logic.
   * - If the tool is "room," do two-click rectangle creation.
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

      // ROOM TOOL
      if (selectedTool === "room") {
        if (!roomClickStart) {
          setRoomClickStart({ x, y });
          setRoomPreviewEnd({ x, y });
        } else {
          // second click -> createRectangularRoom
          dispatch(createRectangularRoom({ start: roomClickStart, end: { x, y } }));
          setRoomClickStart(null);
          setRoomPreviewEnd(null);
        }
        return;
      }

      // WALL TOOL
      if (selectedTool === "wall") {
        if (!wallInProgress) {
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
          dispatch(
            updateWallEnd({
              ...wallInProgress,
              end: { x, y }
            })
          );
          dispatch(finishWall());
        }
      }
    },
    [
      dispatch,
      wallInProgress,
      snapEnabled,
      snapGridSize,
      selectedTool,
      roomClickStart
    ]
  );

  /**
   * redraw
   * Clears the canvas and draws existing walls + in-progress walls + room rectangle preview.
   */
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw existing walls
    drawWalls(ctx, walls, true);

    // Draw wall in progress
    if (selectedTool === "wall" && wallInProgress) {
      drawInProgressWall(ctx, wallInProgress, true);
    }

    // Draw a dashed rectangle if we're in "room" mode and have a start + preview
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
  }, [walls, wallInProgress, selectedTool, roomClickStart, roomPreviewEnd]);

  /**
   * On mount/resize, set canvas dimensions and redraw.
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

  // Redraw on relevant state changes
  useEffect(() => {
    redraw();
  }, [redraw]);

  /**
   * handleDoubleClick
   * If a wall is near pointer, call onWallSelect. (Stub)
   */
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (onWallSelect) {
        // You could do a pixel-based hit detection to find nearest wall
        // onWallSelect(nearestWall);
      }
    },
    [onWallSelect]
  );

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%" }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      />
    </div>
  );
};

export default FloorPlanner2D;