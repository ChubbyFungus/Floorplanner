import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ActionCreators as UndoActionCreators } from "redux-undo";
import { RootState } from "../store/store";
import {
  toggleMeasurements,
  setSelectedTool,
  setErrorMessage
} from "../store/slices/uiSlice";
import {
  clearCanvas,
  cancelWall,
  deleteWall
} from "../store/slices/floorPlannerSlice";
import { calculateAreaAndVolume } from "../utils/geometryUtils";
import { Box, Typography, Alert, styled } from "@mui/material";
import FloorPlanner2DImport from "../components/floorplanner/FloorPlanner2D";
import FloorPlanner3D from "../components/floorplanner/FloorPlanner3D";
import { WallData, RoomData } from "../types";
import { cancelRoom } from "../store/slices/roomToolSlice";
import PropertiesPanel from "../components/floorplanner/PropertiesPanel";
import AiDesignTipsPanel from "../components/floorplanner/AiDesignTipsPanel";
import { MuiToolbar } from "../components/ui/EnhancedToolbar";

const FloorPlanner2D: React.FC = () => {
  return <FloorPlanner2DImport />;
}

type ViewMode = "2D" | "3D";

const LayoutWrapper = styled(Box)(() => ({
  display: "flex",
  flexDirection: "row",
  height: "calc(100vh - 64px)",
  overflow: "hidden"
}));

const CanvasArea = styled(Box)(() => ({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  overflow: "hidden",
  margin: "16px"
}));

export function FloorPlanner() {
  const dispatch = useDispatch();
  const ui = useSelector((state: RootState) => state.ui);
  const { showGrid, showMeasurements, aiTipsOpen, selectedTool, errorMessage } = ui;

  const floorPlannerState = useSelector((state: RootState) => state.floorPlanner.present);
  const { walls, fixtures } = floorPlannerState;

  const roomToolState = useSelector((state: RootState) => state.roomTool);
  const { rooms } = roomToolState;

  const [viewMode, setViewMode] = useState<ViewMode>("2D");

  useEffect(() => {
    const { totalArea, totalVolume } = calculateAreaAndVolume(walls, fixtures, rooms);
    dispatch({ type: "floorPlanner/setDimensions", payload: { totalArea, totalVolume } });
  }, [walls, fixtures, rooms, dispatch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        dispatch(UndoActionCreators.undo());
      }
      if ((e.ctrlKey || e.metaKey) && ((e.key === "z" && e.shiftKey) || e.key === "y")) {
        e.preventDefault();
        dispatch(UndoActionCreators.redo());
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "c") {
        e.preventDefault();
        if (window.confirm("Clear canvas?")) dispatch(clearCanvas());
      }
      if (e.key === "Escape") {
        if (selectedTool === "wall") {
          dispatch(cancelWall());
          dispatch(setSelectedTool("select"));
        } else if (selectedTool === "room") {
          dispatch(cancelRoom());
          dispatch(setSelectedTool("select"));
        }
      }
      if (e.key === "Backspace" && floorPlannerState.selectedWallId) {
        dispatch(deleteWall(floorPlannerState.selectedWallId));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch, selectedTool, floorPlannerState.selectedWallId]);

  const handleToggleView = () => setViewMode(prev => (prev === "2D" ? "3D" : "2D"));
  const handleCloseError = () => dispatch(setErrorMessage(null));

  const handleToolSelect = (toolId: string) => {
    switch (toolId) {
      case "select": dispatch(setSelectedTool("select")); break;
      case "wall": dispatch(setSelectedTool("wall")); break;
      case "room": dispatch(setSelectedTool("room")); break;
      case "undo": dispatch(UndoActionCreators.undo()); break;
      case "redo": dispatch(UndoActionCreators.redo()); break;
      case "showMeasurements": dispatch(toggleMeasurements()); break;
    }
  };

  return (
    <Box sx={{ backgroundColor: "#182C4F", color: "#e5d2b3", height: "100vh", display: "flex", flexDirection: "column" }}>
      {errorMessage && <Alert severity="error" onClose={handleCloseError}>{errorMessage}</Alert>}

      <LayoutWrapper>
        <Box sx={{ width: 120, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, backgroundColor: "#0B1F3A", p: 2, borderRadius: 2 }}>
          <MuiToolbar onToolSelect={handleToolSelect} />
          <Typography variant="body2" sx={{ color: "#fff", textAlign: "center", mt: 1, cursor: "pointer" }} onClick={handleToggleView}>
            {viewMode === "2D" ? "Switch to 3D" : "Switch to 2D"}
          </Typography>
        </Box>

        <CanvasArea>
          <Typography variant="h6" gutterBottom sx={{ fontFamily: "serif", backgroundColor: "#0B1F3A", color: "#e5d2b3", p: 1, borderRadius: 1 }}>
            {viewMode === "2D" ? "2D Floor Planner" : "3D Visualization"}
          </Typography>
          
          {viewMode === "2D" ? (
            <FloorPlanner2D />
          ) : <FloorPlanner3D />}
        </CanvasArea>

        <Box sx={{ width: 400, backgroundColor: "#0B1F3A", borderRadius: 2, p: 2 }}>
          <PropertiesPanel />
        </Box>
      </LayoutWrapper>

      {aiTipsOpen && <AiDesignTipsPanel />}
    </Box>
  );
}

export default FloorPlanner;
