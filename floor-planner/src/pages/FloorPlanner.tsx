import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ActionCreators as UndoActionCreators } from 'redux-undo';
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
import FloorPlanner3D from '../components/floorplanner/FloorPlanner3D';
import WallEditControls from '../components/floorplanner/WallEditControls';
import { WallData } from '../types';

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

  const floorPlannerState = useSelector((state: RootState) => state.floorPlanner.present);
  const { walls, fixtures, dimensions } = floorPlannerState;

  const [localAngleSnap, setLocalAngleSnap] = useState(angleSnapIncrement);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedWall, setSelectedWall] = useState<WallData | null>(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch(UndoActionCreators.undo());
      }
      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        dispatch(UndoActionCreators.redo());
      }
      // Clear Canvas: Ctrl/Cmd + Shift + C
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'c') {
        e.preventDefault();
        if (window.confirm('Are you sure you want to clear the canvas? This action can be undone.')) {
          dispatch(clearCanvas());
        }
      }
      // Escape to deselect wall
      if (e.key === 'Escape' && selectedWall) {
        setSelectedWall(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, selectedWall]);

  // Recalculate area/volume whenever walls or fixtures change
  useEffect(() => {
    if (isCalculating) return;

    const timer = setTimeout(() => {
      setIsCalculating(true);
      try {
        if (walls.length === 0) {
          dispatch(setDimensions({ totalArea: 0, totalVolume: 0 }));
        } else {
          const { totalArea, totalVolume } = calculateAreaAndVolume(walls, fixtures);
          if (Math.abs(dimensions.totalArea - totalArea) > 0.001 || 
              Math.abs(dimensions.totalVolume - totalVolume) > 0.001) {
            dispatch(setDimensions({ totalArea, totalVolume }));
          }
        }
      } catch (error) {
        console.error('Error calculating dimensions:', error);
      } finally {
        setIsCalculating(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [walls, fixtures, dimensions, dispatch, isCalculating]);

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

  const handleToolSelect = (tool: 'wall' | 'room' | 'select') => {
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

  return (
    <Container maxWidth="xl" sx={{ marginTop: 4 }}>
      {errorMessage && (
        <Alert severity="error" onClose={handleCloseError}>
          {errorMessage}
        </Alert>
      )}

      <Box mb={2} display="flex" gap={2} flexWrap="wrap">
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
      </Box>

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

      <Box mb={2}>
        <Typography variant="body1">
          Total Area: {Math.round(dimensions.totalArea)} sq ft
        </Typography>
      </Box>

      <Typography variant="h6" gutterBottom>
        2D Floor Planner
      </Typography>
      <Box sx={{ 
        height: 'calc(100vh - 300px)', 
        border: '1px solid #ccc',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <FloorPlanner2D onWallSelect={handleWallSelect} />
        {selectedWall && (
          <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1000 }}>
            <WallEditControls wall={selectedWall} onClose={handleCloseWallEdit} />
          </Box>
        )}
      </Box>

      <Typography variant="h6" mt={4} gutterBottom>
        3D Visualization
      </Typography>
      <Box height={500} border="1px solid #ccc">
        <FloorPlanner3D />
      </Box>
    </Container>
  );
};
