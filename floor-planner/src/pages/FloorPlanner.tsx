import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ActionCreators as UndoActionCreators } from "redux-undo";
import { RootState } from "../store/store";
import {
  toggleGrid,
  toggleSnapToGrid,
  toggleAngleSnap,
  setAngleSnapIncrement,
  setSelectedTool,
  setErrorMessage,
  toggleMeasurements
} from "../store/slices/uiSlice";
import { setDimensions, clearCanvas } from "../store/slices/floorPlannerSlice";
import { calculateAreaAndVolume } from "../utils/geometryUtils";
import { Box, Container, Typography, Button, Alert, Slider } from "@mui/material";
import FloorPlanner2D from "../components/floorplanner/FloorPlanner2D";
import FloorPlanner3D from "../components/floorplanner/FloorPlanner3D";
import WallEditControls from "../components/floorplanner/WallEditControls";
import { WallData } from "../types";

type ViewMode = "2D" | "3D";

export const FloorPlanner: React.FC = () => {
  const dispatch = useDispatch();
  const ui = useSelector((state: RootState) => state.ui);
  const {
    angleSnapEnabled,
    angleSnapIncrement,
    showGrid,
    snapToGrid,
    selectedTool,
    showMeasurements,
    errorMessage
  } = ui;

  // We will store either "2D" or "3D" here to toggle between views
  const [viewMode, setViewMode] = useState<ViewMode>("2D");

  const floorPlannerState = useSelector((state: RootState) => state.floorPlanner.present);
  const { walls, fixtures, dimensions } = floorPlannerState;

  const [localAngleSnap, setLocalAngleSnap] = useState(angleSnapIncrement);
  const [selectedWall, setSelectedWall] = useState<WallData | null>(null);

  // Store the last area/volume in a ref to avoid repeated dispatches
  const lastDimensionsRef = useRef<{ area: number; volume: number }>({ area: 0, volume: 0 });

  // Keyboard shortcuts (undo, redo, clear, escape).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        dispatch(UndoActionCreators.undo());
      }
      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if ((e.ctrlKey || e.metaKey) && ((e.key === "z" && e.shiftKey) || e.key === "y")) {
        e.preventDefault();
        dispatch(UndoActionCreators.redo());
      }
      // Clear Canvas: Ctrl/Cmd + Shift + C
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "c") {
        e.preventDefault();
        if (window.confirm("Are you sure you want to clear the canvas? This action can be undone.")) {
          dispatch(clearCanvas());
        }
      }
      // Escape to deselect wall
      if (e.key === "Escape" && selectedWall) {
        setSelectedWall(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch, selectedWall]);

  // Recalculate total area/volume whenever walls or fixtures change
  useEffect(() => {
    if (walls.length === 0) {
      // If no walls, reset area/volume if not already zero
      if (lastDimensionsRef.current.area !== 0 || lastDimensionsRef.current.volume !== 0) {
        lastDimensionsRef.current = { area: 0, volume: 0 };
        dispatch(setDimensions({ totalArea: 0, totalVolume: 0 }));
      }
      return;
    }

    // Perform calculations
    const { totalArea, totalVolume } = calculateAreaAndVolume(walls, fixtures);

    // Round to avoid repeated float differences
    const newArea = parseFloat(totalArea.toFixed(2));
    const newVolume = parseFloat(totalVolume.toFixed(2));

    // Use a slightly larger threshold to avoid micro differences
    const areaDiff = Math.abs(newArea - lastDimensionsRef.current.area);
    const volDiff = Math.abs(newVolume - lastDimensionsRef.current.volume);

    // Only dispatch if there's a meaningful change
    if (areaDiff > 0.5 || volDiff > 0.5) {
      lastDimensionsRef.current = { area: newArea, volume: newVolume };
      dispatch(setDimensions({ totalArea: newArea, totalVolume: newVolume }));
    }
  }, [walls, fixtures, dispatch]);

  const handleToggleGrid = () => {
    dispatch(toggleGrid());
  };

  const handleToggleSnap = () => {
    dispatch(toggleSnapToGrid());
  };

  const handleToggleAngleSnap = () => {
    dispatch(toggleAngleSnap());
  };

  const handleToggleMeasurements = () => {
    dispatch(toggleMeasurements());
  };

  const handleAngleSnapChange = (_: any, value: number | number[]) => {
    if (typeof value === "number") {
      setLocalAngleSnap(value);
    }
  };

  const handleAngleSnapCommit = (_: any, value: number | number[]) => {
    if (typeof value === "number") {
      dispatch(setAngleSnapIncrement(value));
    }
  };

  const handleToolSelect = (tool: "wall" | "room" | "select") => {
    if (selectedTool === tool) {
      dispatch(setSelectedTool(null));
    } else {
      dispatch(setSelectedTool(tool));
    }
  };

  const handleCloseError = () => {
    dispatch(setErrorMessage(null));
  };

  const handleWallSelect = (wall: WallData) => {
    setSelectedWall(wall);
  };

  const handleCloseWallEdit = () => {
    setSelectedWall(null);
  };

  // Switch between 2D and 3D
  const handleToggleView = () => {
    setViewMode((prev) => (prev === "2D" ? "3D" : "2D"));
  };

  return (
    <Container maxWidth="xl" sx={{ marginTop: 4 }}>
      {errorMessage && (
        <Alert severity="error" onClose={handleCloseError}>
          {errorMessage}
        </Alert>
      )}

      <Box mb={2} display="flex" gap={2} flexWrap="wrap">
        {/* Toggle for grid/snapping/angle */}
        <Button variant="contained" onClick={handleToggleGrid}>
          {showGrid ? "Hide Grid" : "Show Grid"}
        </Button>
        <Button variant="contained" onClick={handleToggleSnap}>
          {snapToGrid ? "Disable Grid Snap" : "Enable Grid Snap"}
        </Button>
        <Button variant="contained" onClick={handleToggleAngleSnap}>
          {angleSnapEnabled ? "Disable Angle Snap" : "Enable Angle Snap"}
        </Button>
        <Button variant="contained" onClick={handleToggleMeasurements}>
          {showMeasurements ? "Hide Measurements" : "Show Measurements"}
        </Button>

        {/* Angle snap slider */}
        <Box width={200} ml={2}>
          <Typography variant="body2" gutterBottom>
            Angle Snap Increment
          </Typography>
          <Slider
            min={1}
            max={90}
            step={1}
            value={localAngleSnap}
            onChange={handleAngleSnapChange}
            onChangeCommitted={handleAngleSnapCommit}
            valueLabelDisplay="auto"
          />
        </Box>

        {/* Toggle 2D/3D View */}
        <Button variant="contained" onClick={handleToggleView}>
          Switch to {viewMode === "2D" ? "3D" : "2D"} View
        </Button>
      </Box>

      {/* Tool selection */}
      <Box mb={2} display="flex" gap={2}>
        <Button
          variant={selectedTool === "wall" ? "contained" : "outlined"}
          onClick={() => handleToolSelect("wall")}
        >
          Wall Tool
        </Button>
        <Button
          variant={selectedTool === "room" ? "contained" : "outlined"}
          onClick={() => handleToolSelect("room")}
        >
          Room Tool
        </Button>
        <Button
          variant={selectedTool === "select" ? "contained" : "outlined"}
          onClick={() => handleToolSelect("select")}
        >
          Select Tool
        </Button>
      </Box>

      {/* Show total area */}
      <Box mb={2}>
        <Typography variant="body1">
          Total Area: {Math.round(dimensions.totalArea)} sq ft
        </Typography>
      </Box>

      {/* Conditional rendering based on viewMode */}
      {viewMode === "2D" ? (
        <>
          <Typography variant="h6" gutterBottom>
            2D Floor Planner
          </Typography>
          <Box
            sx={{
              height: "calc(100vh - 300px)",
              border: "1px solid #ccc",
              overflow: "hidden",
              position: "relative"
            }}
          >
            <FloorPlanner2D onWallSelect={handleWallSelect} />
            {selectedWall && (
              <Box sx={{ position: "absolute", top: 16, right: 16, zIndex: 1000 }}>
                <WallEditControls wall={selectedWall} onClose={handleCloseWallEdit} />
              </Box>
            )}
          </Box>
        </>
      ) : (
        <>
          <Typography variant="h6" gutterBottom>
            3D Visualization
          </Typography>
          <Box height={600} border="1px solid #ccc">
            <FloorPlanner3D />
          </Box>
        </>
      )}
    </Container>
  );
};

export default FloorPlanner;