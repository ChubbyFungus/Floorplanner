import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Typography,
  TextField,
  Paper,
  Divider
} from "@mui/material";
import { RootState } from "../../store/store";
import { WallData, RoomData } from "../../types";
import { updateWall } from "../../store/slices/floorPlannerSlice";
import { setRoomName } from "../../store/slices/roomSlice";
import {
  getDistance,
  pixelsToFeetAndInches
} from "../../utils/geometryUtils";

const PANEL_WIDTH = 280;

const PropertiesPanel: React.FC = () => {
  const dispatch = useDispatch();
  const floorPlan = useSelector((state: RootState) => state.floorPlanner.present);
  const { selectedWallId, walls, dimensions } = floorPlan;

  const roomState = useSelector((state: RootState) => state.room);
  const { selectedRoomId, rooms } = roomState;

  let selectedWall: WallData | null = null;
  if (selectedWallId) {
    selectedWall = walls.find((w) => w.id === selectedWallId) || null;
  }

  let selectedRoom: RoomData | null = null;
  if (selectedRoomId) {
    selectedRoom = rooms.find((r) => r.id === selectedRoomId) || null;
  }

  const [wallLengthInput, setWallLengthInput] = useState<string>("");
  const [wallHeightInput, setWallHeightInput] = useState<string>("");

  const applyWallLengthChange = () => {
    if (!selectedWall || !wallLengthInput.trim()) return;

    const regex = /^(\d+)'-?\s?(\d+)?$/;
    const match = wallLengthInput.trim().match(regex);
    if (!match) return;
    const feet = parseInt(match[1], 10);
    const inches = match[2] ? parseInt(match[2], 10) : 0;
    const totalInches = feet * 12 + inches;

    const currentLength = getDistance(selectedWall.start, selectedWall.end);
    if (currentLength < 1) return;

    const newLengthPx = (totalInches / 12) * 25; // 25 px per foot
    const dx = selectedWall.end.x - selectedWall.start.x;
    const dy = selectedWall.end.y - selectedWall.start.y;
    const scale = newLengthPx / currentLength;
    const newEnd = {
      x: selectedWall.start.x + dx * scale,
      y: selectedWall.start.y + dy * scale
    };
    const updatedWall = { ...selectedWall, end: newEnd };
    dispatch(updateWall(updatedWall));
  };

  const applyWallHeightChange = () => {
    if (!selectedWall || !wallHeightInput.trim()) return;
    const heightVal = parseFloat(wallHeightInput.trim());
    if (isNaN(heightVal) || heightVal < 0) return;

    const updatedWall = { ...selectedWall, height: heightVal * 25 };
    dispatch(updateWall(updatedWall));
  };

  const handleWallLengthBlur = () => {
    applyWallLengthChange();
  };
  const handleWallHeightBlur = () => {
    applyWallHeightChange();
  };

  const handleWallLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWallLengthInput(e.target.value);
  };
  const handleWallHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWallHeightInput(e.target.value);
  };

  const handleRoomNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedRoom) return;
    dispatch(setRoomName({ id: selectedRoom.id, name: e.target.value }));
  };

  return (
    <Box
      sx={{
        width: PANEL_WIDTH,
        height: "100%",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <Paper
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#171717",
          color: "#d4af37",
          overflowY: "auto"
        }}
        elevation={3}
      >
        <Box padding={2}>

          {/* 1) Add "Your Floor Plan Summary" here */}
          <Box mb={3}>
            <Typography variant="h6" gutterBottom sx={{ fontFamily: "serif" }}>
              Your Floor Plan Summary
            </Typography>
            <Typography variant="body1">
              Total Area: {Math.round(dimensions.totalArea)} sq ft
            </Typography>
            <Typography variant="body1">
              Total Volume: {Math.round(dimensions.totalVolume)} cubic ft
            </Typography>
          </Box>

          <Divider sx={{ mb: 2, borderColor: "#444" }} />

          {/* 2) Show details for selected wall or room */}
          {selectedWall && (
            <Box mb={2}>
              <Typography variant="subtitle1" sx={{ color: "#fff", fontFamily: "serif" }}>
                Selected Wall
              </Typography>
              <Typography variant="body2" sx={{ color: "#fff" }}>
                Wall ID: {selectedWall.id}
              </Typography>
              <Typography variant="body2" sx={{ color: "#fff" }}>
                Current Length: {pixelsToFeetAndInches(getDistance(selectedWall.start, selectedWall.end))}
              </Typography>
              <Box mt={1} mb={1}>
                <TextField
                  label="Set Length (e.g. 8'-6)"
                  size="small"
                  value={wallLengthInput}
                  onChange={handleWallLengthChange}
                  onBlur={handleWallLengthBlur}
                  sx={{
                    mr: 1,
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": {
                        borderColor: "#d4af37"
                      }
                    },
                    "& .MuiInputLabel-root": {
                      color: "#d4af37"
                    },
                    "& .MuiOutlinedInput-input": {
                      color: "#fff"
                    }
                  }}
                />
              </Box>

              <Typography variant="body2" sx={{ color: "#fff" }}>
                Current Height: {(selectedWall.height / 25).toFixed(1)} ft
              </Typography>
              <Box mt={1} mb={1}>
                <TextField
                  label="Set Height (feet)"
                  size="small"
                  value={wallHeightInput}
                  onChange={handleWallHeightChange}
                  onBlur={handleWallHeightBlur}
                  sx={{
                    mr: 1,
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": {
                        borderColor: "#d4af37"
                      }
                    },
                    "& .MuiInputLabel-root": {
                      color: "#d4af37"
                    },
                    "& .MuiOutlinedInput-input": {
                      color: "#fff"
                    }
                  }}
                />
              </Box>
            </Box>
          )}

          {selectedRoom && (
            <Box mb={2}>
              <Typography variant="subtitle1" sx={{ color: "#fff", fontFamily: "serif" }}>
                Selected Room
              </Typography>
              <Typography variant="body2" sx={{ color: "#fff" }}>
                Room ID: {selectedRoom.id}
              </Typography>
              <TextField
                label="Room Name"
                size="small"
                value={selectedRoom.name}
                onChange={handleRoomNameChange}
                fullWidth
                sx={{
                  mb: 1,
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "#d4af37"
                    }
                  },
                  "& .MuiInputLabel-root": {
                    color: "#d4af37"
                  },
                  "& .MuiOutlinedInput-input": {
                    color: "#fff"
                  }
                }}
              />
              <Typography variant="body2" sx={{ color: "#fff" }} gutterBottom>
                Area: {Math.round(selectedRoom.area)} px²
              </Typography>
            </Box>
          )}

          {!selectedWall && !selectedRoom && (
            <Typography variant="body2" sx={{ color: "#fff" }}>
              No wall or room selected.
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default PropertiesPanel;