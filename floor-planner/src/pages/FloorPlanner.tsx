// src/pages/FloorPlanner.tsx
import React, { useEffect, useState } from "react";
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
import {
  clearCanvas,
  setDimensions,
  cancelWall
} from "../store/slices/floorPlannerSlice";
import { calculateAreaAndVolume } from "../utils/geometryUtils";
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  Slider,
  Stack
} from "@mui/material";
import FloorPlanner2D from "../components/floorplanner/FloorPlanner2D";
import FloorPlanner3D from "../components/floorplanner/FloorPlanner3D";
import WallEditControls from "../components/floorplanner/WallEditControls";
import { WallData, RoomData, FixtureData } from "../types";
import { cancelRoom } from "../store/slices/roomToolSlice";
import SelectedItemPanel from "../components/floorplanner/SelectedItemPanel";

type ViewMode = "2D" | "3D";

export function FloorPlanner() {
  const dispatch = useDispatch();

  // UI slice
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

  // FloorPlanner slice (with undoable present)
  const floorPlannerState = useSelector((state: RootState) => state.floorPlanner.present);
  const { walls, fixtures, dimensions } = floorPlannerState;

  // RoomTool slice
  const roomToolState = useSelector((state: RootState) => state.roomTool);
  const { rooms } = roomToolState;

  const [viewMode, setViewMode] = useState<ViewMode>("2D");

  // We'll track a selected item (wall, room, fixture) for the panel
  const [selectedWall, setSelectedWall] = useState<WallData | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null);
  const [selectedFixture, setSelectedFixture] = useState<FixtureData | null>(null);

  // Recompute total area/volume if walls/fixtures/rooms change
  useEffect(() => {
    const { totalArea, totalVolume } = calculateAreaAndVolume(walls, fixtures, rooms);
    dispatch(setDimensions({ totalArea, totalVolume }));
  }, [walls, fixtures, rooms, dispatch]);

  // KeyDown for undo/redo/clear/escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        dispatch(UndoActionCreators.undo());
      }
      // Redo
      if (
        (e.ctrlKey || e.metaKey) &&
        ((e.key === "z" && e.shiftKey) || e.key === "y")
      ) {
        e.preventDefault();
        dispatch(UndoActionCreators.redo());
      }
      // Clear
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "c") {
        e.preventDefault();
        if (
          window.confirm(
            "Are you sure you want to clear the canvas? This action can be undone."
          )
        ) {
          dispatch(clearCanvas());
        }
      }
      // Escape to cancel current drawing
      if (e.key === "Escape") {
        // If in wall mode or room mode, we cancel and revert to select
        if (selectedTool === "wall") {
          dispatch(cancelWall());
          dispatch(setSelectedTool("select"));
        } else if (selectedTool === "room") {
          dispatch(cancelRoom());
          dispatch(setSelectedTool("select"));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dispatch, selectedTool]);

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
      dispatch(setAngleSnapIncrement(value));
    }
  };

  const handleToggleView = () => {
    setViewMode((prev) => (prev === "2D" ? "3D" : "2D"));
  };

  const handleUndo = () => {
    dispatch(UndoActionCreators.undo());
  };

  const handleRedo = () => {
    dispatch(UndoActionCreators.redo());
  };

  const handleClearCanvas = () => {
    if (
      window.confirm(
        "Are you sure you want to clear the canvas? This action can be undone."
      )
    ) {
      dispatch(clearCanvas());
    }
  };

  const handleToolSelect = (tool: "wall" | "room" | "select") => {
    if (selectedTool === tool) {
      dispatch(setSelectedTool("select"));
    } else {
      dispatch(setSelectedTool(tool));
    }
  };

  const handleCloseError = () => {
    dispatch(setErrorMessage(null));
  };

  // Called by FloorPlanner2D when a wall is clicked
  const handleWallSelect = (wall: WallData) => {
    setSelectedWall(wall);
    setSelectedRoom(null);
    setSelectedFixture(null);
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

      <Stack direction="row" spacing={2} flexWrap="wrap" marginBottom={2}>
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

        <Box width={180} ml={2}>
          <Typography variant="body2" gutterBottom>
            Angle Snap Inc
          </Typography>
          <Slider
            min={1}
            max={90}
            step={1}
            value={angleSnapIncrement}
            onChange={handleAngleSnapChange}
            valueLabelDisplay="auto"
          />
        </Box>

        <Button variant="contained" onClick={handleToggleView}>
          Switch to {viewMode === "2D" ? "3D" : "2D"} View
        </Button>

        <Button variant="outlined" onClick={handleUndo}>
          Undo
        </Button>
        <Button variant="outlined" onClick={handleRedo}>
          Redo
        </Button>
        <Button variant="outlined" color="error" onClick={handleClearCanvas}>
          Clear Canvas
        </Button>
      </Stack>

      <Box mb={2}>
        <Stack direction="row" spacing={2}>
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
        </Stack>
      </Box>

      <Box mb={2}>
        <Typography variant="body1">
          Total Area: {Math.round(dimensions.totalArea)} sq ft
        </Typography>
      </Box>

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
            <FloorPlanner2D
              onWallSelect={handleWallSelect}
              showMeasurements={showMeasurements}
              angleSnapEnabled={angleSnapEnabled}
              angleSnapIncrement={angleSnapIncrement}
              showGrid={showGrid}
            />
            {selectedWall && (
              <Box
                sx={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  zIndex: 1000
                }}
              >
                <WallEditControls wall={selectedWall} onClose={handleCloseWallEdit} />
              </Box>
            )}
            {/* Selected item details panel */}
            {(selectedWall || selectedRoom || selectedFixture) && (
              <SelectedItemPanel
                wall={selectedWall}
                room={selectedRoom}
                fixture={selectedFixture}
              />
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
}