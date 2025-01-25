import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ActionCreators as UndoActionCreators } from "redux-undo";
import { RootState } from "../store/store";
import styled from '@emotion/styled';
import {
  setSelectedTool,
  toggleMeasurements,
  setErrorMessage
} from "../store/slices/uiSlice";
import {
  clearCanvas,
  cancelWall,
  deleteWall
} from "../store/slices/floorPlannerSlice";
import { calculateAreaAndVolume } from "../utils/geometryUtils";
import { Box, Typography, Alert } from "@mui/material";
import FloorPlanner2DImport from "../components/floorplanner/FloorPlanner2D";
import FloorPlanner3D from "../components/floorplanner/FloorPlanner3D";
import { cancelRoom } from "../store/slices/roomToolSlice";
import PropertiesPanel from "../components/floorplanner/PropertiesPanel";
import AiDesignTipsPanel from "../components/floorplanner/AiDesignTipsPanel";
import { MuiToolbar } from "../components/ui/EnhancedToolbar";

const CustomAlert = styled(Alert)({
  width: '100%',
  position: 'absolute',
  top: 0,
  zIndex: 1000
});

const FloorPlanner2D: React.FC = () => {
  const selectedTool = useSelector((state: RootState) => state.ui.selectedTool) || 'select';
  const snapToGrid = useSelector((state: RootState) => state.ui.snapToGrid);
  const showGrid = useSelector((state: RootState) => state.ui.showGrid);
  
  return (
    <FloorPlanner2DImport 
      selectedTool={selectedTool}
      snapEnabled={snapToGrid}
      showGrid={showGrid}
    />
  );
};

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
  const { showMeasurements, aiTipsOpen, selectedTool, errorMessage } = ui;

  const floorPlannerState = useSelector((state: RootState) => state.floorPlanner.present);
  const { walls, fixtures } = floorPlannerState;

  const roomToolState = useSelector((state: RootState) => state.roomTool);
  const { rooms } = roomToolState;

  const [viewMode, setViewMode] = useState<ViewMode>("2D");

  useEffect(() => {
    const { totalArea, totalVolume } = calculateAreaAndVolume(walls, fixtures);
    dispatch({ type: "floorPlanner/setDimensions", payload: { totalArea, totalVolume } });
  }, [walls, fixtures, dispatch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        dispatch(UndoActionCreators.undo());
      }
      // Redo
      if ((e.ctrlKey || e.metaKey) && ((e.key === "z" && e.shiftKey) || e.key === "y")) {
        e.preventDefault();
        dispatch(UndoActionCreators.redo());
      }
      // Clear Canvas
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "c") {
        e.preventDefault();
        if (window.confirm("Clear canvas?")) dispatch(clearCanvas(undefined));
      }
      // Escape
      if (e.key === "Escape") {
        if (selectedTool === "wall") {
          dispatch(cancelWall(undefined));
          dispatch(setSelectedTool({ tool: "select" }));
        } else if (selectedTool === "room") {
          dispatch(cancelRoom(undefined));
          dispatch(setSelectedTool({ tool: "select" }));
        }
      }
      // Backspace to delete selected wall
      if (e.key === "Backspace" && floorPlannerState.selectedWallId) {
        dispatch(deleteWall(floorPlannerState.selectedWallId));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch, selectedTool, floorPlannerState.selectedWallId]);

  const handleToggleView = () => setViewMode(prev => (prev === "2D" ? "3D" : "2D"));

  const handleCloseError = () => dispatch(setErrorMessage(null));

  // Called from the EnhancedToolbar whenever a tool is selected
  const handleToolSelect = (toolId: string) => {
    switch (toolId) {
      case "select":
        dispatch(setSelectedTool({ tool: "select" }));
        break;
      case "wall":
        dispatch(setSelectedTool({ tool: "wall" }));
        break;
      case "room":
        dispatch(setSelectedTool({ tool: "room" }));
        break;
      case "door":
        dispatch(setSelectedTool({ tool: "door" }));
        break;
      case "window":
        dispatch(setSelectedTool({ tool: "window" }));
        break;
      case "undo":
        dispatch(UndoActionCreators.undo());
        break;
      case "redo":
        dispatch(UndoActionCreators.redo());
        break;
      case "showMeasurements":
        dispatch(toggleMeasurements());
        break;
      default:
        break;
    }
  };

  return (
    <Box sx={{ backgroundColor: "#182C4F", color: "#e5d2b3", height: "100vh", display: "flex", flexDirection: "column" }}>
      {errorMessage && (
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000 }}>
          <Alert 
            severity="error" 
            onClose={handleCloseError}
          >
            {errorMessage}
          </Alert>
        </Box>
      )}

      <LayoutWrapper>
        <Box sx={{ width: 120, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, backgroundColor: "#0B1F3A", p: 2, borderRadius: 2 }}>
          <MuiToolbar onToolSelect={handleToolSelect} />
          <Typography
            variant="body2"
            sx={{ color: "#fff", textAlign: "center", mt: 1, cursor: "pointer" }}
            onClick={handleToggleView}
          >
            {viewMode === "2D" ? "Switch to 3D" : "Switch to 2D"}
          </Typography>
        </Box>

        <CanvasArea>
          <Typography variant="h6" gutterBottom sx={{ fontFamily: "serif", backgroundColor: "#0B1F3A", color: "#e5d2b3", p: 1, borderRadius: 1 }}>
            {viewMode === "2D" ? "2D Floor Planner" : "3D Visualization"}
          </Typography>
          {viewMode === "2D" ? (
            <FloorPlanner2D />
          ) : (
            <FloorPlanner3D />
          )}
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