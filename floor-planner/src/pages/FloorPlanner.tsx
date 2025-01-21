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
  IconButton,
  Tooltip,
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
// Removed old CommonRoomShapesMenu import
// import CommonRoomShapesMenu from "../components/floorplanner/CommonRoomShapesMenu";
import AiDesignTipsPanel from "../components/floorplanner/AiDesignTipsPanel";

// Import our new EnhancedToolbar
import { EnhancedToolbar } from "../components/ui/EnhancedToolbar";

type ViewMode = "2D" | "3D";

// Outer layout: navy blue region
const LayoutWrapper = styled(Box)(() => ({
  display: "flex",
  flexDirection: "row",
  height: "calc(100vh - 64px)",
  backgroundColor: "#182C4F"
}));

// Toolbar: was used for the old left column - now replaced by EnhancedToolbar
// const ToolbarColumn = styled(Box)(() => ({
//   width: 72,
//   backgroundColor: "#000000",
//   display: "flex",
//   flexDirection: "column",
//   alignItems: "center",
//   boxShadow: `
//     inset 1px 1px 3px rgba(255,255,255,0.02),
//     inset -2px -2px 4px rgba(0,0,0,0.75)
//   `
// }));

/**
 * KeycapIconButton, CanvasArea, etc. were part of old toolbar.
 * If needed, we can keep them, but let's simplify to use EnhancedToolbar now.
 */

// We still define CanvasArea for the main content region
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
      if (
        (e.ctrlKey || e.metaKey) &&
        ((e.key === "z" && e.shiftKey) || e.key === "y")
      ) {
        e.preventDefault();
        dispatch(UndoActionCreators.redo());
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "c") {
        e.preventDefault();
        if (window.confirm("Are you sure you want to clear the canvas? This action can be undone.")) {
          dispatch(clearCanvas());
        }
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

  const handleToggleView = () => {
    setViewMode((prev) => (prev === "2D" ? "3D" : "2D"));
  };

  const handleToggleGrid = () => dispatch(toggleGrid());
  const handleToggleSnap = () => dispatch(toggleSnapToGrid());
  const handleToggleMeasurements = () => dispatch(toggleMeasurements());
  const handleToggleTapeMeasure = () => dispatch(toggleTapeMeasure());
  const handleToggleAiTips = () => dispatch(toggleAiTips());

  const handleUndo = () => {
    dispatch(UndoActionCreators.undo());
  };

  const handleRedo = () => {
    dispatch(UndoActionCreators.redo());
  };

  const handleClearCanvas = () => {
    if (window.confirm("Are you sure you want to clear the canvas? This action can be undone.")) {
      dispatch(clearCanvas());
    }
  };

  const handleToolSelect = (tool: string) => {
    // Example: Map some tool IDs to existing Redux states
    if (tool === "pointer") {
      dispatch(setSelectedTool("select"));
    } else if (tool === "square") {
      dispatch(setSelectedTool("wall"));
    } else if (tool === "brush") {
      dispatch(setSelectedTool("room"));
    }
    // You can add more mapping logic for other tools
    console.log("EnhancedToolbar tool selected:", tool);
  };

  const handleCloseError = () => {
    dispatch(setErrorMessage(null));
  };

  const handleWallSelect = (wall: WallData) => {
    // optional highlight logic
  };

  const handleRoomSelect = (room: RoomData) => {
    // optional highlight logic
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
          {/* Replace old left toolbar with our new EnhancedToolbar */}
          <EnhancedToolbar onToolSelect={handleToolSelect} className="" />

          <CanvasArea>
            {viewMode === "2D" ? (
              <>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontFamily: "serif", backgroundColor: "#0B1F3A", p: 1 }}
                >
                  2D Floor Planner
                </Typography>
                <Box sx={{ flex: 1, position: "relative" }}>
                  <FloorPlanner2D
                    onWallSelect={handleWallSelect}
                    onRoomSelect={handleRoomSelect}
                    showMeasurements={showMeasurements}
                    angleSnapEnabled={true}
                    showGrid={showGrid}
                  />
                </Box>
              </>
            ) : (
              <>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontFamily: "serif", backgroundColor: "#0B1F3A", p: 1 }}
                >
                  3D Visualization
                </Typography>
                <Box sx={{ flex: 1 }}>
                  <FloorPlanner3D />
                </Box>
              </>
            )}
          </CanvasArea>

          <PropertiesPanel />
        </LayoutWrapper>

        {aiTipsOpen && <AiDesignTipsPanel />}
      </Container>
    </Box>
  );
}