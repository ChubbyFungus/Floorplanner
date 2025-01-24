import React, { useEffect, useRef } from "react";
import { Paper, List, ListItemButton, ListItemText, ListItemIcon } from "@mui/material";
import { useDispatch } from "react-redux";
import { splitWall, deleteWall, updateWall } from "../../store/slices/floorPlannerSlice";
import { CurvedWallData, Point2D, WallData } from "../../types";
import { v4 as uuidv4 } from "uuid";
// We'll import a trash icon from lucide-react for the Delete
import { Trash2 } from "lucide-react";

interface WallContextMenuProps {
  open: boolean;
  anchorPoint: { x: number; y: number };
  wall: WallData | null;
  clickPoint: Point2D | null;
  onClose: () => void;
  onStartNewWall?: (startPoint: Point2D) => void;
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
    if (!wall) return;
    if (!clickPoint) return;

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
    handleSplitWall();
    onStartNewWall?.(clickPoint);
  };

  const handleCurveWall = () => {
    if (!wall) return;
    const midX = (wall.start.x + wall.end.x) / 2;
    const midY = (wall.start.y + wall.end.y) / 2;
    const controlPoint: Point2D = { x: midX, y: midY + 40 };

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
          <ListItemIcon>
            <Trash2 size={16} />
          </ListItemIcon>
          <ListItemText primary="Delete" />
        </ListItemButton>
      </List>
    </Paper>
  );
};

export default WallContextMenu;