import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ActionCreators as UndoActionCreators } from "redux-undo";
import { RootState } from "../store/store";
import { Box, Typography, Alert, SxProps, Theme } from "@mui/material";
import {
  setSelectedTool,
  toggleMeasurements,
  setErrorMessage,
  type ToolType
} from "../store/slices/uiSlice";
import {
  clearCanvas,
  cancelWall,
  deleteWall
} from "../store/slices/floorPlannerSlice";
import { calculateAreaAndVolume } from "../utils/geometryUtils";
import FloorPlanner2D from "../components/floorplanner/FloorPlanner2D";
import FloorPlanner3D from "../components/floorplanner/FloorPlanner3D";
import { cancelRoom } from "../store/slices/roomToolSlice";
import PropertiesPanel from "../components/floorplanner/PropertiesPanel";
import AiDesignTipsPanel from "../components/floorplanner/AiDesignTipsPanel";
import { MuiToolbar } from "../components/ui/EnhancedToolbar";

// Type definitions
type ViewMode = "2D" | "3D";

// Styles
const styles: Record<string, SxProps<Theme>> = {
  root: {
    backgroundColor: "#182C4F",
    color: "#e5d2b3",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    position: "relative"
  },
  errorContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000
  },
  mainContent: {
    display: "flex",
    flexDirection: "row",
    height: "calc(100vh - 64px)",
    overflow: "hidden"
  },
  toolbar: {
    width: 120,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#0B1F3A",
    padding: 2,
    borderRadius: 2
  },
  canvasArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    overflow: "hidden",
    margin: "16px"
  },
  viewToggle: {
    color: "#fff",
    textAlign: "center",
    marginTop: 1,
    cursor: "pointer"
  },
  propertiesPanel: {
    width: 400,
    backgroundColor: "#0B1F3A",
    padding: 2,
    borderRadius: 2
  }
};

export function FloorPlanner() {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>("2D");
  const dispatch = useDispatch();

  // Selectors
  const selectedTool = useSelector((state: RootState) => state.ui.selectedTool) ?? "select";
  const errorMessage = useSelector((state: RootState) => state.ui.errorMessage);
  const floorPlannerState = useSelector((state: RootState) => state.floorPlanner.present);
  const showMeasurements = useSelector((state: RootState) => state.ui.showMeasurements);
  const snapToGrid = useSelector((state: RootState) => state.ui.snapToGrid);
  const showGrid = useSelector((state: RootState) => state.ui.showGrid);

  // Event Handlers
  const handleCloseError = () => {
    dispatch(setErrorMessage(null));
  };

  const handleToggleView = () => {
    setViewMode((prev) => (prev === "2D" ? "3D" : "2D"));
  };

  const handleToolSelect = (toolId: string) => {
    // Special tools
    switch (toolId) {
      case "undo":
        dispatch(UndoActionCreators.undo());
        return;
      case "redo":
        dispatch(UndoActionCreators.redo());
        return;
      case "showMeasurements":
        dispatch(toggleMeasurements());
        return;
    }

    // Regular tools
    const tools: ToolType[] = ["select", "wall", "room", "door", "window"];
    if (tools.includes(toolId as ToolType)) {
      dispatch(setSelectedTool({ tool: toolId as ToolType }));
    }
  };

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key handling
      if (e.key === "Escape") {
        if (selectedTool === "wall") {
          dispatch(cancelWall(undefined));
          dispatch(setSelectedTool({ tool: "select" }));
        } else if (selectedTool === "room") {
          dispatch(cancelRoom(undefined));
          dispatch(setSelectedTool({ tool: "select" }));
        }
      }

      // Backspace/Delete handling
      if ((e.key === "Backspace" || e.key === "Delete") && floorPlannerState.selectedWallId) {
        dispatch(deleteWall(floorPlannerState.selectedWallId));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch, selectedTool, floorPlannerState.selectedWallId]);

  useEffect(() => {
    const { totalArea, totalVolume } = calculateAreaAndVolume(floorPlannerState.walls, floorPlannerState.fixtures);
    dispatch({ type: "floorPlanner/setDimensions", payload: { totalArea, totalVolume } });
  }, [floorPlannerState.walls, floorPlannerState.fixtures, dispatch]);

  return (
    <Box sx={styles.root}>
      {errorMessage && (
        <Box sx={styles.errorContainer}>
          <Alert severity="error" onClose={handleCloseError}>
            {errorMessage}
          </Alert>
        </Box>
      )}

      <Box sx={styles.mainContent}>
        <Box sx={styles.toolbar}>
          <MuiToolbar onToolSelect={handleToolSelect} />
          <Typography sx={styles.viewToggle} onClick={handleToggleView}>
            Switch to {viewMode === "2D" ? "3D" : "2D"}
          </Typography>
        </Box>

        <Box sx={styles.canvasArea}>
          {viewMode === "2D" ? (
            <FloorPlanner2D
              selectedTool={selectedTool}
              snapEnabled={snapToGrid}
              showGrid={showGrid}
            />
          ) : (
            <FloorPlanner3D />
          )}
        </Box>

        <Box sx={styles.propertiesPanel}>
          <PropertiesPanel />
          <AiDesignTipsPanel />
        </Box>
      </Box>
    </Box>
  );
}