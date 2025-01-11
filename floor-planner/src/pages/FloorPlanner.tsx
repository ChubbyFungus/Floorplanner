import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import {
  toggleGrid,
  toggleSnapToGrid,
  toggleAngleSnap,
  setAngleSnapIncrement,
  setSelectedTool,
  setErrorMessage
} from "../store/slices/uiSlice";
import { setDimensions } from "../store/slices/floorPlannerSlice";
import { calculateAreaAndVolume } from "../utils/geometryUtils";
import { Box, Container, Typography, Button, Alert, Slider } from "@mui/material";
import { FloorPlanner2D } from "../components/floorplanner/FloorPlanner2D";
import { FloorPlanner3D } from "../components/floorplanner/FloorPlanner3D";

export const FloorPlanner: React.FC = () => {
  const dispatch = useDispatch();
  const ui = useSelector((state: RootState) => state.ui);
  const { angleSnapEnabled, angleSnapIncrement, showGrid, snapToGrid, selectedTool, errorMessage } = ui;

  const floorPlanner = useSelector((state: RootState) => state.floorPlanner);
  const { walls, fixtures, dimensions } = floorPlanner;

  const [localAngleSnap, setLocalAngleSnap] = useState(angleSnapIncrement);

  // Recalculate area/volume whenever walls or fixtures change
  useEffect(() => {
    const { totalArea, totalVolume } = calculateAreaAndVolume(walls, fixtures);
    dispatch(setDimensions({ totalArea, totalVolume }));
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

  const handleToolSelect = (tool: string) => {
    console.log('Tool selected:', { currentTool: selectedTool, newTool: tool });
    if (selectedTool === tool) {
      console.log('Deselecting tool');
      dispatch(setSelectedTool(null));
    } else {
      console.log('Setting new tool');
      dispatch(setSelectedTool(tool));
    }
  };

  const handleCloseError = () => {
    dispatch(setErrorMessage(null));
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
          variant={selectedTool === "fixture" ? "contained" : "outlined"}
          onClick={() => handleToolSelect("fixture")}
        >
          Fixture Tool
        </Button>
        <Button
          variant={selectedTool === "room" ? "contained" : "outlined"}
          onClick={() => handleToolSelect("room")}
        >
          Room Tool
        </Button>
      </Box>

      <Box mb={2}>
        <Typography variant="body1">
          Total Area: {Math.round(dimensions.totalArea / (50 * 50))} sq ft
        </Typography>
      </Box>

      <Typography variant="h6" gutterBottom>
        2D Floor Planner (with Real-Time Angle Snapping + Room Tool)
      </Typography>
      <Box sx={{ 
        height: 'calc(100vh - 300px)', 
        border: '1px solid #ccc',
        overflow: 'hidden'
      }}>
        <FloorPlanner2D />
      </Box>

      <Typography variant="h6" mt={4} gutterBottom>
        3D Visualization (Advanced Material Mapping)
      </Typography>
      <Box height={500} border="1px solid #ccc">
        <FloorPlanner3D />
      </Box>
    </Container>
  );
};
