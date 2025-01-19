import React, { useRef, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../store/store";
import { startWall, updateWallEnd, finishWall } from "../../store/slices/floorPlannerSlice";
import { snapToGrid } from "../../utils/geometryUtils";
import { drawWalls, drawInProgressWall } from "./drawing";
import { WallData } from "../../types";

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
 * This component renders the 2D canvas for user interaction:
 * - Mouse/Touch events to place or finish walls.
 * - Snapping (grid-based, angle-based) handled via UI toggles from Redux.
 * - Real-time drawing of in-progress walls plus measurements from `drawing.ts`.
 *
 * The actual data model (walls, fixtures, etc.) lives in the Redux store, ensuring this
 * component remains primarily a "view/controller" layer for user input and rendering.
 */
const FloorPlanner2D: React.FC<FloorPlanner2DProps> = ({ onWallSelect }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dispatch = useDispatch<AppDispatch>();

  // Grab UI toggles and floorPlan data from Redux
  const {
    snapToGrid: snapEnabled,
    snapGridSize,
    angleSnapEnabled,
    angleSnapIncrement
  } = useSelector((state: RootState) => state.ui);
  const floorPlan = useSelector((state: RootState) => state.floorPlanner.present);
  const { walls, wallInProgress } = floorPlan;

  /**
   * handleMouseMove
   * Updates the "wall in progress" endpoint as the user moves the mouse,
   * optionally snapping the coordinates to grid if enabled.
   */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;

      // Snap to grid if toggled on
      if (snapEnabled) {
        const snapped = snapToGrid({ x, y }, snapGridSize);
        x = snapped.x;
        y = snapped.y;
      }

      // Future angle snapping logic could be added here if angleSnapEnabled is true.

      // If a wall is being drawn, update its end coordinate
      if (wallInProgress) {
        dispatch(updateWallEnd({
          ...wallInProgress,
          end: { x, y }
        }));
      }
    },
    [dispatch, wallInProgress, snapEnabled, snapGridSize, angleSnapEnabled, angleSnapIncrement]
  );

  /**
   * handleClick
   * On click:
   * - If no wall is in progress, start a new one at the clicked point.
   * - Otherwise, finalize the existing wall by setting its endpoint and dispatching finishWall().
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

      if (!wallInProgress) {
        dispatch(startWall({
          id: "temp-wall",
          start: { x, y },
          end: { x, y },
          thickness: 10,
          height: 100,
          type: "straight"
        }));
      } else {
        // Finalize in-progress wall
        dispatch(updateWallEnd({
          ...wallInProgress,
          end: { x, y }
        }));
        dispatch(finishWall());
      }
    },
    [dispatch, wallInProgress, snapEnabled, snapGridSize]
  );

  /**
   * redraw
   * Clears the canvas and re-draws all existing walls + the in-progress wall (if any).
   */
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear the entire drawing area
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw existing walls, optionally with measurements
    drawWalls(ctx, walls, true);

    // If there's a wall being drawn, display it in a dashed style
    if (wallInProgress) {
      drawInProgressWall(ctx, wallInProgress, true);
    }
  }, [walls, wallInProgress]);

  /**
   * On mount or resize, set canvas dimensions to match the parent element.
   * Re-apply drawing calls afterward.
   */
  useEffect(() => {
    function resizeCanvas() {
      if (!canvasRef.current) return;
      const parent = canvasRef.current.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      canvasRef.current.width = rect.width;
      canvasRef.current.height = rect.height;
      redraw();
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [redraw]);

  // Whenever walls or wallInProgress changes, re-draw
  useEffect(() => {
    redraw();
  }, [redraw]);

  /**
   * handleDoubleClick
   * If we implement selection logic, double-click can detect a wall near the pointer
   * and call onWallSelect if provided. Currently just a stub.
   */
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (onWallSelect) {
        // Example: We could do some pixel-based hit detection to find the nearest wall
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