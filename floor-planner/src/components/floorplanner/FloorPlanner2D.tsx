import React, {
  useRef,
  useEffect,
  useCallback,
  useState
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { debugLogger } from "../../utils/debugLogger";
import { RootState, AppDispatch } from "../../store/store";
import {
  snapToGrid,
  getDistance,
  pixelsToFeetAndInches,
  PIXELS_PER_INCH,
  isPointInPolygon,
  arePointsEqual,
  snapToWall
} from "../../utils/geometryUtils";
import {
  generateAngleGuides,
  findNearestSnapAngle
} from "../../utils/angleUtils";
import { createStraightWall } from "../../utils/wallUtils";
import { WallData, Point2D } from "../../types";
import {
  startWall,
  updateWallEnd,
  finishWall,
  selectWall,
  deselectWall,
  deleteWall,
  startWallEditing,
  addWall,
  updateWall,
  cancelWall
} from "../../store/slices/floorPlannerSlice";
import ContextMenu from "./ContextMenu";
import Grid from "./Grid";

// Constants
const WALL_THRESHOLD = 10; // Distance in pixels for wall selection

interface FloorPlanner2DProps {
  selectedTool: string;
  snapEnabled: boolean;
  showGrid: boolean;
}

// Helper function to create a wall
const createWall = (start: Point2D, end: Point2D): WallData => {
  return createStraightWall(start, end);
};

const FloorPlanner2D: React.FC<FloorPlanner2DProps> = ({
  selectedTool,
  snapEnabled,
  showGrid
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const [contextMenuPosition, setContextMenuPosition] = useState<Point2D | null>(null);
  const [clickPoint, setClickPoint] = useState<Point2D | null>(null);

  const uiState = useSelector((state: RootState) => state.ui);
  const {
    snapGridSize,
    showMeasurements,
    angleSnapEnabled,
    selectedTool: uiSelectedTool,
    snapToGrid: shouldSnapToGrid
  } = uiState;

  // Use the tool from props or UI state
  const activeTool = selectedTool || uiSelectedTool;

  // Access the present state directly from the selector
  const walls = useSelector((state: RootState) => state.floorPlanner.present.walls);
  const selectedWallId = useSelector((state: RootState) => state.floorPlanner.present.selectedWallId);
  const wallInProgress = useSelector((state: RootState) => state.floorPlanner.present.wallInProgress);

  // Handle mouse move for wall preview
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    // Snap to grid if enabled
    if (shouldSnapToGrid) {
      const snapped = snapToGrid({ x, y }, snapGridSize);
      x = snapped.x;
      y = snapped.y;
    }

    // If user is drawing a wall, make the endpoint follow cursor
    if (activeTool === "wall" && wallInProgress) {
      if (angleSnapEnabled) {
        // The angle from start->(x,y):
        const dx = x - wallInProgress.start.x;
        const dy = y - wallInProgress.start.y;
        const angle = Math.atan2(dy, dx);
        const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
        const dist = Math.sqrt(dx * dx + dy * dy);
        x = wallInProgress.start.x + dist * Math.cos(snappedAngle);
        y = wallInProgress.start.y + dist * Math.sin(snappedAngle);
      }

      // Then update the wall end
      dispatch(updateWallEnd({ ...wallInProgress, end: { x, y } }));
    }
  }, [canvasRef, shouldSnapToGrid, snapGridSize, angleSnapEnabled, activeTool, wallInProgress, dispatch]);

  // Handle click for context menu
  const handleClick = useCallback((e: React.MouseEvent) => {
    debugLogger("Click event", { 
      tool: activeTool,
      position: { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY },
      clientPosition: { x: e.clientX, y: e.clientY },
      wallInProgress: wallInProgress ? {
        id: wallInProgress.id,
        start: wallInProgress.start,
        end: wallInProgress.end
      } : null
    });

    const canvasPoint = {
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY
    };

    // Handle wall drawing
    if (activeTool === "wall") {
      debugLogger("Wall tool click", {
        wallInProgress,
        clickPoint: canvasPoint,
        existingWalls: walls.length,
        shouldSnapToGrid,
        snapGridSize
      });

      // Get snapped point
      let snappedPoint = shouldSnapToGrid ? snapToGrid(canvasPoint, snapGridSize) : canvasPoint;
      
      // If there are existing walls, try to snap to their endpoints
      if (walls.length > 0) {
        snappedPoint = snapToWall(snappedPoint, walls);
      }

      debugLogger("Snapped point", {
        original: canvasPoint,
        snapped: snappedPoint,
        snapToGrid: shouldSnapToGrid,
        snapGridSize
      });

      if (!wallInProgress) {
        // Start new wall
        const newWall = createWall(snappedPoint, snappedPoint);
        debugLogger("Starting new wall", { 
          startPoint: snappedPoint,
          wallId: newWall.id,
          shouldSnapToGrid,
          snapGridSize
        });
        dispatch(startWall(newWall));
      } else {
        // Only finish wall if end point is different from start point
        if (!arePointsEqual(wallInProgress.start, snappedPoint)) {
          // Update end point and finish wall
          const finalWall = { ...wallInProgress, end: snappedPoint };
          debugLogger("Finishing wall", { 
            start: wallInProgress.start,
            end: snappedPoint,
            wallId: wallInProgress.id,
            shouldSnapToGrid,
            snapGridSize,
            distance: getDistance(wallInProgress.start, snappedPoint)
          });
          debugLogger("About to dispatch updateWallEnd", finalWall);
          dispatch(updateWallEnd(finalWall));
          debugLogger("About to dispatch finishWall");
          dispatch(finishWall({}));
        } else {
          // Cancel wall if clicked on start point
          debugLogger("Canceling wall - same point", {
            start: wallInProgress.start,
            end: snappedPoint
          });
          dispatch(cancelWall());
        }
      }
      return;
    }

    // Handle selection
    if (activeTool === "select") {
      // Check for wall selection
      let closestWall: WallData | null = null;
      let minDist = WALL_THRESHOLD;
      let clickProjection = { x: 0, y: 0 };
      
      // Log all walls for debugging
      debugLogger("Checking walls", { 
        numWalls: walls.length,
        threshold: WALL_THRESHOLD,
        walls: walls.map((wall: WallData) => ({ id: wall.id, start: wall.start, end: wall.end }))
      });

      for (const wall of walls) {
        const dx = wall.end.x - wall.start.x;
        const dy = wall.end.y - wall.start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        const t = Math.max(0, Math.min(1, ((canvasPoint.x - wall.start.x) * dx + (canvasPoint.y - wall.start.y) * dy) / (length * length)));
        const projX = wall.start.x + t * dx;
        const projY = wall.start.y + t * dy;
        const distance = Math.sqrt((canvasPoint.x - projX) * (canvasPoint.x - projX) + (canvasPoint.y - projY) * (canvasPoint.y - projY));
        
        debugLogger("Wall distance check", { 
          wallId: wall.id,
          distance,
          minDist,
          projection: { x: projX, y: projY }
        });

        if (distance < minDist) {
          minDist = distance;
          closestWall = wall;
          clickProjection = { x: projX, y: projY };
          debugLogger("New closest wall", { 
            wallId: wall.id, 
            distance: minDist,
            projection: clickProjection
          });
        }
      }

      if (closestWall) {
        debugLogger("Wall selected", {
          wallId: closestWall.id,
          clickPoint: clickProjection,
          menuPosition: { x: e.clientX, y: e.clientY }
        });
        dispatch(selectWall(closestWall.id));
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setClickPoint(clickProjection);
      } else {
        debugLogger("Nothing selected");
        dispatch(deselectWall({}));
        setContextMenuPosition(null);
        setClickPoint(null);
      }
    }
  }, [dispatch, walls, activeTool, wallInProgress]);

  // Handle context menu actions
  const handleContextMenuAction = useCallback((action: string) => {
    debugLogger("Context menu action", { 
      action, 
      selectedWallId,
      clickPoint,
      walls: walls.map((wall: WallData) => ({ id: wall.id, start: wall.start, end: wall.end }))
    });

    switch (action) {
      case 'split':
        if (selectedWallId && clickPoint) {
          const wall = walls.find((wall: WallData) => wall.id === selectedWallId);
          debugLogger("Split wall attempt", { wall, clickPoint });
          if (wall) {
            // Create two new walls from the split point
            const wall1 = createWall(wall.start, clickPoint);
            const wall2 = createWall(clickPoint, wall.end);
            dispatch(deleteWall(selectedWallId));
            dispatch(addWall(wall1));
            dispatch(addWall(wall2));
            debugLogger("Wall split complete", { 
              originalWall: wall,
              newWalls: [wall1, wall2]
            });
          }
        }
        break;

      case 'newWall':
        if (clickPoint) {
          debugLogger("Start new wall", { startPoint: clickPoint });
          const newWall = createWall(clickPoint, clickPoint);
          dispatch(startWall(newWall));
        }
        break;

      case 'curve':
        if (selectedWallId && clickPoint) {
          const wall = walls.find((wall: WallData) => wall.id === selectedWallId);
          debugLogger("Curve wall attempt", { wall, clickPoint });
          if (wall) {
            dispatch(updateWall({
              ...wall,
              type: 'curved',
              controlPoint: clickPoint
            }));
            debugLogger("Wall curved", { 
              wallId: wall.id,
              controlPoint: clickPoint 
            });
          }
        }
        break;

      case 'delete':
        if (selectedWallId) {
          debugLogger("Delete wall", { wallId: selectedWallId });
          dispatch(deleteWall(selectedWallId));
          dispatch(deselectWall({}));
        }
        break;
    }
    setContextMenuPosition(null);
    setClickPoint(null);
  }, [dispatch, selectedWallId, walls, clickPoint]);

  // Handle closing context menu
  const handleCloseContextMenu = useCallback(() => {
    debugLogger("Close context menu");
    setContextMenuPosition(null);
    setClickPoint(null);
  }, []);

  // Render context menu
  const renderContextMenu = () => {
    debugLogger("Render context menu", {
      position: contextMenuPosition,
      selectedWallId,
      clickPoint
    });

    if (!contextMenuPosition) {
      debugLogger("No context menu - no position");
      return null;
    }

    const selectedType = selectedWallId ? 'wall' : null;
    if (!selectedType) {
      debugLogger("No context menu - no selection");
      return null;
    }

    return (
      <ContextMenu
        position={contextMenuPosition}
        onClose={handleCloseContextMenu}
        onAction={handleContextMenuAction}
        selectedType={selectedType}
        clickPoint={clickPoint}
      />
    );
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        style={{ width: "100%", height: "100%", backgroundColor: "#ccc" }}
      />
      {renderContextMenu()}
      {showGrid && <Grid width={0} height={0} />}
    </div>
  );
};

export default FloorPlanner2D;
