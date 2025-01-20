import StraightenIcon from "@mui/icons-material/Straighten";
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
import {
  calculateAreaAndVolume
} from "../utils/geometryUtils";
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
import CommonRoomShapesMenu from "../components/floorplanner/CommonRoomShapesMenu";
import AiDesignTipsPanel from "../components/floorplanner/AiDesignTipsPanel";

type ViewMode = "2D" | "3D";

/**
 * Styled components for the 3D "keycap" style.
 */
const ToolbarContainer = styled(Box)(() => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
  marginBottom: 16,
  backgroundColor: "#171717",
  padding: 8,
  borderRadius: 12,
  boxShadow: "inset 1px 1px 2px rgba(255,255,255,0.05), inset -1px -1px 3px rgba(0,0,0,0.8)",
  justifyContent: "flex-start",
  // Slight gradient for a subtle “metallic” or “plastic” look:
  background: "linear-gradient(145deg, #101010, #1c1c1c)",
  position: "relative"
}));

const KeycapIconButton = styled(IconButton)(() => ({
  color: "#999",
  backgroundColor: "#222",
  borderRadius: 8,
  padding: 8,
  // 3D keycap effect:
  boxShadow:
    "inset 2px 2px 3px rgba(0,0,0,0.7), inset -1px -1px 2px rgba(255,255,255,0.05), 2px 2px 5px rgba(0,0,0,0.8)",
  transition: "transform 0.1s ease, box-shadow 0.2s ease",
  "&:hover": {
    color: "#fff",
    backgroundColor: "#2d2d2d",
    boxShadow:
      "inset 2px 2px 3px rgba(0,0,0,0.8), inset -1px -1px 2px rgba(255,255,255,0.07), 1px 1px 6px rgba(0,0,0,0.95)",
    transform: "translateY(-1px)"
  },
  "&:active": {
    transform: "translateY(1px)",
    boxShadow:
      "inset 2px 2px 3px rgba(0,0,0,0.85), inset -1px -1px 2px rgba(255,255,255,0.02)"
  }
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
  const { walls, fixtures, dimensions } = floorPlannerState;

  const roomToolState = useSelector((state: RootState) => state.roomTool);
  const { rooms } = roomToolState;

  const [viewMode, setViewMode] = useState<ViewMode>("2D");

  useEffect(() => {
    const { totalArea, totalVolume } = calculateAreaAndVolume(walls, fixtures, rooms);
    dispatch({
      type: "floorPlanner/setDimensions",
      payload: { totalArea, totalVolume }
    });
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

  const handleToggleGrid = () => dispatch(toggleGrid());
  const handleToggleSnap = () => dispatch(toggleSnapToGrid());
  const handleToggleMeasurements = () => dispatch(toggleMeasurements());
  const handleToggleTapeMeasure = () => dispatch(toggleTapeMeasure());
  const handleToggleAiTips = () => dispatch(toggleAiTips());

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
    if (window.confirm("Are you sure you want to clear the canvas? This action can be undone.")) {
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

  const handleWallSelect = (wall: WallData) => {
    // handle highlight if desired
  };

  const handleRoomSelect = (room: RoomData) => {
    // handle highlight if desired
  };

  return (
    <Box sx={{ backgroundColor: "#0B0B0B", color: "#FFF", minHeight: "100vh", pb: 4 }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {errorMessage && (
          <Alert severity="error" onClose={handleCloseError}>
            {errorMessage}
          </Alert>
        )}

        {/* Updated 3D "keycap" toolbar container */}
        <ToolbarContainer>
          {/* Show/Hide Grid */}
          <Tooltip title={showGrid ? "Hide Grid" : "Show Grid"} arrow>
            <KeycapIconButton
              onClick={handleToggleGrid}
              sx={{
                color: showGrid ? "#d4af37" : "#999"
              }}
            >
              {showGrid ? <GridOnIcon /> : <GridOffIcon />}
            </KeycapIconButton>
          </Tooltip>

          {/* Snap to Grid */}
          <Tooltip title={snapToGrid ? "Disable Grid Snap" : "Enable Grid Snap"} arrow>
            <KeycapIconButton
              onClick={handleToggleSnap}
              sx={{
                color: snapToGrid ? "#d4af37" : "#999"
              }}
            >
              <GridOnIcon />
            </KeycapIconButton>
          </Tooltip>

          {/* Show Measurements */}
          <Tooltip title={showMeasurements ? "Hide Measurements" : "Show Measurements"} arrow>
            <KeycapIconButton
              onClick={handleToggleMeasurements}
              sx={{
                color: showMeasurements ? "#d4af37" : "#999"
              }}
            >
              <MeasureIcon />
            </KeycapIconButton>
          </Tooltip>

          {/* Tape Measure */}
          <Tooltip title={tapeMeasureActive ? "Close Tape Measure" : "Tape Measure"} arrow>
            <KeycapIconButton
              onClick={handleToggleTapeMeasure}
              sx={{
                color: tapeMeasureActive ? "#d4af37" : "#999"
              }}
            >
              <StraightenIcon />
            </KeycapIconButton>
          </Tooltip>

          {/* AI Design Tips */}
          <Tooltip title={aiTipsOpen ? "Hide AI Tips" : "AI Design Tips"} arrow>
            <KeycapIconButton
              onClick={handleToggleAiTips}
              sx={{
                color: aiTipsOpen ? "#d4af37" : "#999"
              }}
            >
              <TipsIcon />
            </KeycapIconButton>
          </Tooltip>

          {/* Switch 2D / 3D */}
          <Tooltip title={`Switch to ${viewMode === "2D" ? "3D" : "2D"} View`} arrow>
            <KeycapIconButton>
              <ThreeDIcon onClick={handleToggleView} />
            </KeycapIconButton>
          </Tooltip>

          {/* Undo */}
          <Tooltip title="Undo" arrow>
            <KeycapIconButton onClick={handleUndo}>
              <UndoIcon />
            </KeycapIconButton>
          </Tooltip>

          {/* Redo */}
          <Tooltip title="Redo" arrow>
            <KeycapIconButton onClick={handleRedo}>
              <RedoIcon />
            </KeycapIconButton>
          </Tooltip>

          {/* Clear Canvas */}
          <Tooltip title="Clear Canvas" arrow>
            <KeycapIconButton
              onClick={handleClearCanvas}
              sx={{
                color: "#e03030"
              }}
            >
              <ClearIcon />
            </KeycapIconButton>
          </Tooltip>

          {/* Wall Tool */}
          <Tooltip title="Wall Tool" arrow>
            <KeycapIconButton
              onClick={() => handleToolSelect("wall")}
              sx={{
                color: selectedTool === "wall" ? "#d4af37" : "#999"
              }}
            >
              <WallIcon />
            </KeycapIconButton>
          </Tooltip>

          {/* Room Tool */}
          <Tooltip title="Room Tool" arrow>
            <KeycapIconButton
              onClick={() => handleToolSelect("room")}
              sx={{
                color: selectedTool === "room" ? "#d4af37" : "#999"
              }}
            >
              <RoomIcon />
            </KeycapIconButton>
          </Tooltip>

          {/* Select Tool */}
          <Tooltip title="Select Tool" arrow>
            <KeycapIconButton
              onClick={() => handleToolSelect("select")}
              sx={{
                color: selectedTool === "select" ? "#d4af37" : "#999"
              }}
            >
              <SelectIcon />
            </KeycapIconButton>
          </Tooltip>

          {/* Common Shapes Menu */}
          <CommonRoomShapesMenu />
        </ToolbarContainer>

        <Box mb={2}>
          <Typography
            variant="h6"
            sx={{ fontFamily: "serif", mb: 1, color: "#fff" }}
          >
            Your Floor Plan Summary
          </Typography>
          <Typography variant="body1">
            Total Area: {Math.round(dimensions.totalArea)} sq ft
          </Typography>
          <Typography variant="body1">
            Total Volume: {Math.round(dimensions.totalVolume)} cubic ft
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "row", height: "calc(100vh - 350px)" }}>
          <Box
            sx={{
              flex: 1,
              border: "1px solid #444",
              overflow: "hidden",
              position: "relative"
            }}
          >
            {viewMode === "2D" ? (
              <>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontFamily: "serif", backgroundColor: "#171717", p: 1 }}
                >
                  2D Floor Planner
                </Typography>
                <FloorPlanner2D
                  onWallSelect={handleWallSelect}
                  onRoomSelect={handleRoomSelect}
                  showMeasurements={showMeasurements}
                  angleSnapEnabled={true}
                  showGrid={showGrid}
                />
              </>
            ) : (
              <>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontFamily: "serif", backgroundColor: "#171717", p: 1 }}
                >
                  3D Visualization
                </Typography>
                <Box sx={{ width: "100%", height: "100%" }}>
                  <FloorPlanner3D />
                </Box>
              </>
            )}
          </Box>

          <PropertiesPanel />
        </Box>

        {aiTipsOpen && <AiDesignTipsPanel />}
      </Container>
    </Box>
  );
}