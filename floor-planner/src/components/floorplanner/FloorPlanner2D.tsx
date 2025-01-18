import React, { useRef, useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../store/store";
import { startWall, updateWallEnd, finishWall } from "../../store/slices/floorPlannerSlice";
import { snapToGrid } from "../../utils/geometry/snapUtils";
import { drawWalls, drawInProgressWall } from "./drawing";

const FloorPlanner2D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dispatch = useDispatch<AppDispatch>();

  // UI toggles from uiSlice
  const {
    snapToGrid: snapEnabled,
    snapGridSize,
    angleSnapEnabled,
    angleSnapIncrement,
    showRoomLabels,
    showTooltips
  } = useSelector((state: RootState) => state.ui);

  const floorPlan = useSelector((state: RootState) => state.floorPlanner.present);
  const { walls, wallInProgress } = floorPlan;

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
      // angleSnapEnabled logic might go here in the future
      // if angleSnapEnabled => do angle-based adjustments with angleSnapIncrement

      if (wallInProgress) {
        dispatch(updateWallEnd({ ...wallInProgress, end: { x, y } }));
      }
    },
    [dispatch, wallInProgress, snapEnabled, snapGridSize, angleSnapEnabled, angleSnapIncrement]
  );

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
        // Start new wall
        dispatch(
          startWall({
            id: "temp-wall",
            start: { x, y },
            end: { x, y },
            thickness: 10,
            height: 100,
            type: "straight"
          })
        );
      } else {
        // finish the in-progress wall
        dispatch(updateWallEnd({ ...wallInProgress, end: { x, y } }));
        dispatch(finishWall());
      }
    },
    [dispatch, wallInProgress, snapEnabled, snapGridSize]
  );

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawWalls(ctx, walls, true);
    if (wallInProgress) {
      drawInProgressWall(ctx, wallInProgress, true);
    }

    // If showRoomLabels => we can overlay text for each detected room
    // If showTooltips => maybe show a tooltip near the mouse or near selected items
  }, [walls, wallInProgress, showRoomLabels, showTooltips]);

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

  useEffect(() => {
    redraw();
  }, [redraw]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
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