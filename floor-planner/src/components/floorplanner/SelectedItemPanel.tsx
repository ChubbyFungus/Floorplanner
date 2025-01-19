import React from "react";
import { Paper, Typography, Box } from "@mui/material";
import { WallData, RoomData, FixtureData } from "../../types";
import { getDistance, pixelsToFeetAndInches } from "../../utils/geometryUtils";

interface SelectedItemPanelProps {
  wall: WallData | null;
  room: RoomData | null;
  fixture: FixtureData | null;
}

/**
 * SelectedItemPanel
 * Shows properties of the currently selected wall, room, or fixture.
 */
const SelectedItemPanel: React.FC<SelectedItemPanelProps> = ({
  wall,
  room,
  fixture
}) => {
  if (!wall && !room && !fixture) return null;

  return (
    <Paper
      elevation={3}
      sx={{
        position: "absolute",
        top: 80,
        right: 16,
        width: 240,
        padding: 2,
        zIndex: 2000
      }}
    >
      {wall && (
        <Box mb={2}>
          <Typography variant="h6">Selected Wall</Typography>
          <Typography variant="body2">ID: {wall.id}</Typography>
          <Typography variant="body2">
            Length:{" "}
            {pixelsToFeetAndInches(
              getDistance(wall.start, wall.end)
            )}
          </Typography>
          <Typography variant="body2">
            Thickness: {wall.thickness}
          </Typography>
          <Typography variant="body2">
            Height: {wall.height}
          </Typography>
        </Box>
      )}

      {room && (
        <Box mb={2}>
          <Typography variant="h6">Selected Room</Typography>
          <Typography variant="body2">ID: {room.id}</Typography>
          <Typography variant="body2">Name: {room.name}</Typography>
          <Typography variant="body2">Area: {Math.round(room.area)}</Typography>
        </Box>
      )}

      {fixture && (
        <Box mb={2}>
          <Typography variant="h6">Selected Fixture</Typography>
          <Typography variant="body2">ID: {fixture.id}</Typography>
          <Typography variant="body2">Name: {fixture.name}</Typography>
          <Typography variant="body2">
            Position: ({fixture.position.x}, {fixture.position.y})
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default SelectedItemPanel;