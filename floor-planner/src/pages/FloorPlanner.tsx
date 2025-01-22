import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ActionCreators as UndoActionCreators } from "redux-undo";
import { RootState } from "../store/store";
import {
  toggleGrid,
  toggleSnapToGrid,
  toggleMeasurements,
  toggleTapeMeasure,
  toggleAiTips,
  setSelectedTool,
  setErrorMessage
} from "../store/slices/uiSlice";
import {
  clearCanvas,
  cancelWall,
  deleteWall
} from "../store/slices/floorPlannerSlice";
import { calculateAreaAndVolume } from "../utils/geometryUtils";
import {
  Box,
  Container,
  Typography,
  Alert,
  styled
} from "@mui/material";
import {
  GridOn as GridOnIcon,
  GridOff as GridOffIcon,
  Straighten as MeasureIcon,
  Lightbulb as TipsIcon,
  ThreeDRotation as ThreeDIcon,
  Replay as RedoIcon,
  Undo as UndoIcon,
  DeleteForever as ClearIcon,
  Architecture as RoomIcon,
  CropSquare as WallIcon,
  TouchApp as SelectIcon
} from "@mui/icons-material";
import FloorPlanner2D from "../components/floorplanner/FloorPlanner2D";
import FloorPlanner3D from "../components/floorplanner/FloorPlanner3D";
import { WallData, RoomData } from "../types";
import { cancelRoom } from "../store/slices/roomToolSlice";
import PropertiesPanel from "../components/floorplanner/PropertiesPanel";
import AiDesignTipsPanel from "../components/floorplanner/AiDesignTipsPanel";
// Enhanced custom toolbar
import { Toolbar } from "../components/ui/EnhancedToolbar";

type ViewMode = "2D" | "3D";

/**
 * Styles for the main container (filling the viewport minus header).
 */
const floorPlannerStyles = {
  display: "flex",
  flexDirection: "row",
  height: "calc(100vh - 64px)",
  backgroundColor: "#182C4F"
} as const;

/**
 * LayoutWrapper
 * -------------
 * A styled Box that applies the floorPlannerStyles.
 */
const LayoutWrapper = styled(Box)(() => ({
  ...floorPlannerStyles
}));

/**
 * CanvasArea
 * ----------
 * A styled Box for the central canvas region where
 * 2D or 3D floor planner will render.
 */
const CanvasArea = styled(Box)(() => ({
  flex: 1,
  display: "flex",
  flexDirection: "column"
}));

export function FloorPlanner() {
  const dispatch = useDispatch();
  const ui = useSelector((state: RootState) => state.ui);
  const {
    showGrid,
    snapToGrid,
    showMeasurements,
    tapeMeasureActive,
    aiTipsOpen,
    selectedTool,
    errorMessage
  } = ui;

  const floorPlannerState = useSelector((state: RootState) => state.floorPlanner.present);
  const { walls, fixtures } = floorPlannerState;

  const roomToolState = useSelector((state: RootState) => state.roomTool);
  const { rooms } = roomToolState;

  // Track which view is displayed (2D or 3D)
  const [viewMode, setViewMode] = useState<ViewMode>("2D");

  /**
   * Recompute total area/volume whenever walls, fixtures, or rooms change.
   */
  useEffect(() => {
    const { totalArea, totalVolume } = calculateAreaAndVolume(walls, fixtures, rooms);
    dispatch({
      type: "floorPlanner/setDimensions",
      payload: { totalArea, totalVolume }
    });
  }, [walls, fixtures, rooms, dispatch]);

  /**
   * Handle keyboard shortcuts for undo/redo, clearing, canceling wall/room, etc.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Z => Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        dispatch(UndoActionCreators.undo());
      }
      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y => Redo
      if (
        (e.ctrlKey || e.metaKey) &&
        ((e.key === "z" && e.shiftKey) || e.key === "y")
      ) {
        e.preventDefault();
        dispatch(UndoActionCreators.redo());
      }
      // Ctrl/Cmd + Shift + C => Clear Canvas
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "c") {
        e.preventDefault();
        if (window.confirm("Are you sure you want to clear the canvas? This can be undone.")) {
          dispatch(clearCanvas());
        }
      }
      // Escape => Cancel any in-progress wall/room
      if (e.key === "Escape") {
        if (selectedTool === "wall") {
          dispatch(cancelWall());
          dispatch(setSelectedTool("select"));
        } else if (selectedTool === "room") {
          dispatch(cancelRoom());
          dispatch(setSelectedTool("select"));
        }
      }
      // Backspace => Delete selected wall if any
      if (e.key === "Backspace") {
        if (floorPlannerState.selectedWallId) {
          dispatch(deleteWall(floorPlannerState.selectedWallId));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dispatch, selectedTool, floorPlannerState.selectedWallId]);

  /**
   * Toggle between 2D and 3D view modes.
   */
  const handleToggleView = () => {
    setViewMode((prev) => (prev === "2D" ? "3D" : "2D"));
  };

  /**
   * Other toolbar toggle handlers (snap/grid/measure/AI tips).
   */
  const handleToggleGrid = () => dispatch(toggleGrid());
  const handleToggleSnap = () => dispatch(toggleSnapToGrid());
  const handleToggleMeasurements = () => dispatch(toggleMeasurements());
  const handleToggleTapeMeasure = () => dispatch(toggleTapeMeasure());
  const handleToggleAiTips = () => dispatch(toggleAiTips());
  const handleUndo = () => dispatch(UndoActionCreators.undo());
  const handleRedo = () => dispatch(UndoActionCreators.redo());
  const handleClearCanvas = () => {
    if (window.confirm("Clear the canvas? This can be undone.")) {
      dispatch(clearCanvas());
    }
  };

  /**
   * Mapping from EnhancedToolbar tool IDs to Redux actions.
   */
  const handleToolSelect = (tool: string) => {
    if (tool === "pointer") {
      dispatch(setSelectedTool("select"));
    } else if (tool === "square") {
      dispatch(setSelectedTool("wall"));
    } else if (tool === "brush") {
      dispatch(setSelectedTool("room"));
    }
    // You can extend more tools here...
    // console.log("Toolbar tool selected:", tool);
  };

  const handleCloseError = () => {
    dispatch(setErrorMessage(null));
  };

  /**
   * Called when a wall is clicked in 2D mode.
   */
  const handleWallSelect = (wall: WallData) => {
    // e.g., highlight or open a panel
  };

  /**
   * Called when a room is clicked in 2D mode.
   */
  const handleRoomSelect = (room: RoomData) => {
    // e.g., highlight or open a panel
  };

  return (
    <Box sx={{ backgroundColor: "#182C4F", color: "#e5d2b3", minHeight: "100vh", pb: 4 }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {errorMessage && (
          <Alert severity="error" onClose={handleCloseError}>
            {errorMessage}
          </Alert>
        )}

        <LayoutWrapper>
          {/* Left-side custom toolbar */}
          <Toolbar onToolSelect={handleToolSelect} className="" />

          {/* Main canvas area and top bar */}
          <CanvasArea>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontFamily: "serif", backgroundColor: "#0B1F3A", p: 1 }}
            >
              {viewMode === "2D" ? "2D Floor Planner" : "3D Visualization"}
            </Typography>

            {/* Either 2D or 3D floor planner content */}
            {viewMode === "2D" ? (
              <FloorPlanner2D
                onWallSelect={handleWallSelect}
                onRoomSelect={handleRoomSelect}
                showMeasurements={showMeasurements}
                angleSnapEnabled
                showGrid={showGrid}
              />
            ) : (
              <FloorPlanner3D />
            )}
          </CanvasArea>

          {/* Right-side properties panel */}
          <PropertiesPanel />
        </LayoutWrapper>

        {/* AI Tips Panel */}
        {aiTipsOpen && <AiDesignTipsPanel />}
      </Container>
    </Box>
  );
}

export default FloorPlanner;