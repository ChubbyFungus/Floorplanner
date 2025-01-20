import React, { useEffect, useRef } from "react";
import { Paper, List, ListItemButton, ListItemText } from "@mui/material";
import { useDispatch } from "react-redux";
import { splitWall, deleteWall, addWall, updateWall } from "../../store/slices/floorPlannerSlice";
import { CurvedWallData, Point2D, StraightWallData, WallData } from "../../types";
import { v4 as uuidv4 } from "uuid";

/**
 * WallContextMenu
 * ---------------
 * Displays a small pop-up menu when the user right-clicks (or otherwise triggers context) on a wall,
 * offering the following:
 *  - "Split Wall" at the clicked point
 *  - "Create Wall from Here" (start a new wall from the clicked point)
 *  - "Curve Wall" (convert to a curved wall)
 *  - "Delete Wall"
 */

interface WallContextMenuProps {
  open: boolean;
  anchorPoint: { x: number; y: number };
  wall: WallData | null;
  clickPoint: Point2D | null;
  onClose: () => void;
  onStartNewWall?: (startPoint: Point2D) => void; // If we want immediate new wall creation
}

const MENU_WIDTH = 160;

const WallContextMenu: React.FC<WallContextMenuProps> = ({
  open,
  anchorPoint,
  wall,
  clickPoint,
  onClose,
  onStartNewWall
}) => {
  const dispatch = useDispatch();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    // Close menu on outside click
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onClose]);

  if (!open || !wall || !clickPoint) {
    return null;
  }

  const handleSplitWall = () => {
    if (!wall || !clickPoint) return;
    // We'll split the wall at the clicked point, creating two new walls.
    const newWallId1 = uuidv4();
    const newWallId2 = uuidv4();

    const wall1: WallData = {
      ...wall,
      id: newWallId1,
      end: clickPoint
    };
    const wall2: WallData = {
      ...wall,
      id: newWallId2,
      start: clickPoint
    };

    dispatch(splitWall({ originalWallId: wall.id, newWalls: [wall1, wall2] }));
    onClose();
  };

  const handleCreateWallFromHere = () => {
    if (!clickPoint) return;
    // Start a new wall from the clicked point. Optionally, we can split the old wall as well.
    // For now, let's also do a split so the user doesn't lose continuity.
    handleSplitWall();

    // Then call some callback to start a new in-progress wall from clickPoint
    onStartNewWall?.(clickPoint);
  };

  const handleCurveWall = () => {
    if (!wall) return;
    // Convert a straight wall to a curved wall with a simple control point at the midpoint
    const midX = (wall.start.x + wall.end.x) / 2;
    const midY = (wall.start.y + wall.end.y) / 2;
    const controlPoint: Point2D = { x: midX, y: midY + 40 }; // Basic offset for demonstration

    // Build a new curved wall using the old wall's data
    const curved: CurvedWallData = {
      ...wall,
      type: "curved",
      controlPoints: [controlPoint]
    };

    dispatch(updateWall(curved));
    onClose();
  };

  const handleDeleteWall = () => {
    if (!wall) return;
    dispatch(deleteWall(wall.id));
    onClose();
  };

  return (
    <Paper
      ref={menuRef}
      elevation={4}
      style={{
        position: "absolute",
        top: anchorPoint.y,
        left: anchorPoint.x,
        width: MENU_WIDTH,
        zIndex: 9999
      }}
    >
      <List dense disablePadding>
        <ListItemButton onClick={handleSplitWall}>
          <ListItemText primary="Split Wall" />
        </ListItemButton>
        <ListItemButton onClick={handleCreateWallFromHere}>
          <ListItemText primary="Create Wall from Here" />
        </ListItemButton>
        <ListItemButton onClick={handleCurveWall}>
          <ListItemText primary="Curve Wall" />
        </ListItemButton>
        <ListItemButton onClick={handleDeleteWall}>
          <ListItemText primary="Delete Wall" />
        </ListItemButton>
      </List>
    </Paper>
  );
};

export default WallContextMenu;