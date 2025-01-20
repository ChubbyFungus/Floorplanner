import React, { useState } from "react";
import { Box, Button, Menu, MenuItem } from "@mui/material";
import { useDispatch } from "react-redux";
import { addWalls } from "../../store/slices/floorPlannerSlice";
import { v4 as uuidv4 } from "uuid";
import { DEFAULT_WALL_THICKNESS, DEFAULT_WALL_HEIGHT } from "../../constants";

/**
 * CommonRoomShapesMenu
 * --------------------
 * A dropdown to quickly add typical shapes: rectangle or L-shaped rooms.
 */

const CommonRoomShapesMenu: React.FC = () => {
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const addRectangle = () => {
    // Hardcoded for demonstration
    const x = 100;
    const y = 100;
    const w = 200;
    const h = 150;
    const walls = [
      {
        id: uuidv4(),
        type: "straight",
        start: { x, y },
        end: { x: x + w, y },
        thickness: DEFAULT_WALL_THICKNESS,
        height: DEFAULT_WALL_HEIGHT
      },
      {
        id: uuidv4(),
        type: "straight",
        start: { x: x + w, y },
        end: { x: x + w, y: y + h },
        thickness: DEFAULT_WALL_THICKNESS,
        height: DEFAULT_WALL_HEIGHT
      },
      {
        id: uuidv4(),
        type: "straight",
        start: { x: x + w, y: y + h },
        end: { x, y: y + h },
        thickness: DEFAULT_WALL_THICKNESS,
        height: DEFAULT_WALL_HEIGHT
      },
      {
        id: uuidv4(),
        type: "straight",
        start: { x, y: y + h },
        end: { x, y },
        thickness: DEFAULT_WALL_THICKNESS,
        height: DEFAULT_WALL_HEIGHT
      }
    ];
    dispatch(addWalls(walls));
    handleClose();
  };

  const addLShape = () => {
    // Hardcoded for demonstration
    const x = 300;
    const y = 300;
    const w = 150;
    const h = 200;
    const cutOut = 80;
    // Simple L shape
    const walls = [
      {
        id: uuidv4(),
        type: "straight",
        start: { x, y },
        end: { x: x + w, y },
        thickness: DEFAULT_WALL_THICKNESS,
        height: DEFAULT_WALL_HEIGHT
      },
      {
        id: uuidv4(),
        type: "straight",
        start: { x: x + w, y },
        end: { x: x + w, y: y + (h - cutOut) },
        thickness: DEFAULT_WALL_THICKNESS,
        height: DEFAULT_WALL_HEIGHT
      },
      {
        id: uuidv4(),
        type: "straight",
        start: { x: x + w, y: y + (h - cutOut) },
        end: { x: x + (w - cutOut), y: y + (h - cutOut) },
        thickness: DEFAULT_WALL_THICKNESS,
        height: DEFAULT_WALL_HEIGHT
      },
      {
        id: uuidv4(),
        type: "straight",
        start: { x: x + (w - cutOut), y: y + (h - cutOut) },
        end: { x: x + (w - cutOut), y: y + h },
        thickness: DEFAULT_WALL_THICKNESS,
        height: DEFAULT_WALL_HEIGHT
      },
      {
        id: uuidv4(),
        type: "straight",
        start: { x: x + (w - cutOut), y: y + h },
        end: { x, y: y + h },
        thickness: DEFAULT_WALL_THICKNESS,
        height: DEFAULT_WALL_HEIGHT
      },
      {
        id: uuidv4(),
        type: "straight",
        start: { x, y: y + h },
        end: { x, y },
        thickness: DEFAULT_WALL_THICKNESS,
        height: DEFAULT_WALL_HEIGHT
      }
    ];
    dispatch(addWalls(walls));
    handleClose();
  };

  return (
    <Box>
      <Button variant="outlined" onClick={handleOpen}>
        Common Shapes
      </Button>
      <Menu
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorEl={anchorEl}
      >
        <MenuItem onClick={addRectangle}>Rectangle</MenuItem>
        <MenuItem onClick={addLShape}>L-Shape</MenuItem>
      </Menu>
    </Box>
  );
};

export default CommonRoomShapesMenu;