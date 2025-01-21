import React, {
  useRef,
  useEffect,
  useCallback,
  useState
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../store/store";
import {
  startWall,
  updateWallEnd,
  finishWall,
  selectWall,
  deselectWall,
  addWall
} from "../../store/slices/floorPlannerSlice";
import {
  createRectangularRoom,
  cancelRoom
} from "../../store/slices/roomToolSlice";
import {
  snapToGrid,
  getDistance,
  pixelsToFeetAndInches
} from "../../utils/geometryUtils";
import {
  drawInProgressWall
} from "./drawing";
import {
  WallData,
  Point2D,
  RoomData
} from "../../types";
import {
  generateAngleGuides,
  findNearestSnapAngle
} from "../../utils/angleUtils";
import Grid from "./Grid";
import { setSelectedTool } from "../../store/slices/uiSlice";
import { selectRoom, detectRooms } from "../../store/slices/roomSlice";
import { isPointInRoom } from "../../utils/roomDetection";
import WallContextMenu from "./WallContextMenu";
import { TapeMeasureTool } from "./TapeMeasureTool";

/**
 * FloorPlanner2D
 * -------------
 * Enhanced wall selection, refined angle snapping, and better room selection detection.
 */

interface EndPointHit {
  wallId: string;
  isStart: boolean;
}

interface FloorPlanner2DProps {
  onWallSelect?: (wall: WallData) => void;
  onRoomSelect?: (room: RoomData) => void;
  showMeasurements?: boolean;
  angleSnapEnabled?: boolean;
  showGrid?: boolean;
}

const WALL_THRESHOLD = 8;
const ENDPOINT_THRESHOLD = 10;

const FloorPlanner2D: React.FC<FloorPlanner2DProps> = ({
  onWallSelect,
  onRoomSelect,
  showMeasurements = false,
  angleSnapEnabled = true,
  showGrid = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dispatch = useDispatch<AppDispatch>();

  const uiState = useSelector((state: RootState) => state.ui);
  const { snapToGrid: snapEnabled, snapGridSize, showMeasurements: uiShowMeasurements, tapeMeasureActive } = uiState;
  const showMeasurementLabels = showMeasurements || uiShowMeasurements;

  const floorPlan = useSelector((state: RootState) => state.floorPlanner.present);
  const { walls, wallInProgress, selectedWallId } = floorPlan;

  const roomState = useSelector((state: RootState) => state.room);
  const { rooms } = roomState;

  const [roomClickStart, setRoomClickStart] = useState<Point2D | null>(null);
  const [roomPreviewEnd, setRoomPreviewEnd] = useState<Point2D | null>(null);
  const [draggingEndpoint, setDraggingEndpoint] = useState<EndPointHit | null>(null);

  // Right-click context menu
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenuWall, setContextMenuWall] = useState<WallData | null>(null);
  const [contextClickPoint, setContextClickPoint] = useState<Point2D | null>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();

      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;

      if (snapEnabled) {
        const snapped = snapToGrid({ x, y }, snapGridSize);
        x = snapped.x;
        y = snapped.y;
      }

      if (draggingEndpoint) {
        const wall = walls.find((w) => w.id === draggingEndpoint.wallId);
        if (!wall) return;

        if (draggingEndpoint.isStart) {
          dispatch(updateWallEnd({ ...wall, start: { x, y } }));
        } else {
          dispatch(updateWallEnd({ ...wall, end: { x, y } }));
        }
        return;
      }

      if (wallInProgress && angleSnapEnabled) {
        const dx = x - wallInProgress.start.x;
        const dy = y - wallInProgress.start.y;
        const currentAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
        const nearest = findNearestSnapAngle(currentAngle, walls);
        if (nearest) {
          const distance = getDistance(wallInProgress.start, { x, y });
          const angleRad = (nearest.angle * Math.PI) / 180;
          x = wallInProgress.start.x + distance * Math.cos(angleRad);
          y = wallInProgress.start.y + distance * Math.sin(angleRad);
        }
      }

      if (wallInProgress) {
        dispatch(
          updateWallEnd({
            ...wallInProgress,
            end: { x, y }
          })
        );
      }

      if (roomClickStart) {
        setRoomPreviewEnd({ x, y });
      }
    },
    [
      snapEnabled,
      snapGridSize,
      draggingEndpoint,
      wallInProgress,
      angleSnapEnabled,
      walls,
      dispatch,
      roomClickStart
    ]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return;

      if (draggingEndpoint) {
        setDraggingEndpoint(null);
        return;
      }

      const rect = canvasRef.current.getBoundingClientRect();
      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;

      if (snapEnabled) {
        const snapped = snapToGrid({ x, y }, snapGridSize);
        x = snapped.x;
        y = snapped.y;
      }

      const clickPoint: Point2D = { x, y };

      // Room tool
      if (uiState.selectedTool === "room") {
        if (!roomClickStart) {
          setRoomClickStart(clickPoint);
          setRoomPreviewEnd(clickPoint);
        } else {
          dispatch(createRectangularRoom({ start: roomClickStart, end: clickPoint }));
          setRoomClickStart(null);
          setRoomPreviewEnd(null);
          dispatch(setSelectedTool("select"));
        }
        return;
      }

      // Wall tool
      if (uiState.selectedTool === "wall") {
        if (!wallInProgress) {
          dispatch(
            startWall({
              id: "temp-wall",
              type: "straight",
              start: { x, y },
              end: { x, y },
              thickness: 10,
              height: 100
            })
          );
        } else {
          const distanceFromStart = getDistance(wallInProgress.start, clickPoint);
          if (distanceFromStart < 10) {
            dispatch(finishWall());
            dispatch(detectRooms({ walls }));
          } else {
            dispatch(
              updateWallEnd({
                ...wallInProgress,
                end: { x, y }
              })
            );
            dispatch(finishWall());
            dispatch(detectRooms({ walls }));

            // Start new consecutive wall
            dispatch(
              startWall({
                id: "temp-wall",
                type: "straight",
                start: { x, y },
                end: { x, y },
                thickness: 10,
                height: 100
              })
            );
          }
        }
        return;
      }

      // Select tool
      if (uiState.selectedTool === "select") {
        const endpoint = findEndpointHit(clickPoint);
        if (endpoint) {
          setDraggingEndpoint(endpoint);
          dispatch(selectWall(endpoint.wallId));
          return;
        }

        const nearestWall = findWallHit(clickPoint);
        if (nearestWall && nearestWall.dist <= WALL_THRESHOLD) {
          dispatch(selectWall(nearestWall.wall.id));
          onWallSelect?.(nearestWall.wall);
          return;
        }

        // Check if clicked inside a room
        for (const r of rooms) {
          if (isPointInRoom(clickPoint, r.points)) {
            dispatch(selectRoom(r.id));
            onRoomSelect?.(r);
            return;
          }
        }

        // If none matched, deselect
        dispatch(deselectWall());
        dispatch(selectRoom(null));
      }
    },
    [
      draggingEndpoint,
      snapEnabled,
      snapGridSize,
      uiState.selectedTool,
      wallInProgress,
      walls,
      roomClickStart,
      dispatch,
      onWallSelect,
      onRoomSelect,
      rooms
    ]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;

      const clickPt: Point2D = { x, y };

      const nearest = findWallHit(clickPt);
      if (nearest && nearest.dist <= WALL_THRESHOLD) {
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setContextMenuWall(nearest.wall);
        setContextClickPoint(clickPt);
        setContextMenuOpen(true);
      } else {
        setContextMenuOpen(false);
      }
    },
    []
  );

  const findEndpointHit = (pt: Point2D): EndPointHit | null => {
    for (const w of walls) {
      const distStart = getDistance(pt, w.start);
      if (distStart <= ENDPOINT_THRESHOLD) {
        return { wallId: w.id, isStart: true };
      }
      const distEnd = getDistance(pt, w.end);
      if (distEnd <= ENDPOINT_THRESHOLD) {
        return { wallId: w.id, isStart: false };
      }
    }
    return null;
  };

  const findWallHit = (pt: Point2D) => {
    let nearestWall: WallData | null = null;
    let nearestDistance = Infinity;

    for (const wall of walls) {
      const dist = distanceToSegment(pt, wall);
      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestWall = wall;
      }
    }
    if (!nearestWall) return null;
    return { wall: nearestWall, dist: nearestDistance };
  };

  const distanceToSegment = (pt: Point2D, wall: WallData): number => {
    // For straight walls only
    // If curved is needed, approximate or handle differently
    const { start, end } = wall;
    return pointSegmentDistance(pt, start, end);
  };

  const pointSegmentDistance = (p: Point2D, p1: Point2D, p2: Point2D) => {
    const A = p.x - p1.x;
    const B = p.y - p1.y;
    const C = p2.x - p1.x;
    const D = p2.y - p1.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;
    if (param < 0) {
      xx = p1.x;
      yy = p1.y;
    } else if (param > 1) {
      xx = p2.x;
      yy = p2.y;
    } else {
      xx = p1.x + param * C;
      yy = p1.y + param * D;
    }

    const dx = p.x - xx;
    const dy = p.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    walls.forEach((wall) => {
      ctx.save();
      ctx.strokeStyle = wall.id === selectedWallId ? "#ff0000" : "#333";
      ctx.lineWidth = wall.thickness;
      ctx.beginPath();
      ctx.moveTo(wall.start.x, wall.start.y);
      ctx.lineTo(wall.end.x, wall.end.y);
      ctx.stroke();
      ctx.restore();

      if (showMeasurementLabels) {
        const dist = getDistance(wall.start, wall.end);
        const label = pixelsToFeetAndInches(dist);
        const midX = (wall.start.x + wall.end.x) / 2;
        const midY = (wall.start.y + wall.end.y) / 2;
        ctx.save();
        ctx.fillStyle = "#000";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(label, midX, midY - 10);
        ctx.restore();
      }

      // Endpoints
      ctx.save();
      ctx.fillStyle = "#00f";
      ctx.beginPath();
      ctx.arc(wall.start.x, wall.start.y, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(wall.end.x, wall.end.y, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    });

    // In-progress wall
    if (uiState.selectedTool === "wall" && wallInProgress) {
      const angleGuides = angleSnapEnabled
        ? generateAngleGuides(
            wallInProgress.start,
            wallInProgress.end,
            (Math.atan2(
              wallInProgress.end.y - wallInProgress.start.y,
              wallInProgress.end.x - wallInProgress.start.x
            ) *
              180) /
              Math.PI,
            walls
          )
        : undefined;
      drawInProgressWall(ctx, wallInProgress, showMeasurementLabels, angleGuides);
    }

    // Room preview
    if (uiState.selectedTool === "room" && roomClickStart && roomPreviewEnd) {
      const startX = roomClickStart.x;
      const startY = roomClickStart.y;
      const endX = roomPreviewEnd.x;
      const endY = roomPreviewEnd.y;
      ctx.save();
      ctx.setLineDash([5, 3]);
      ctx.strokeStyle = "#888";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(
        Math.min(startX, endX),
        Math.min(startY, endY),
        Math.abs(endX - startX),
        Math.abs(endY - startY)
      );
      ctx.stroke();
      ctx.restore();
    }
  }, [
    walls,
    wallInProgress,
    uiState.selectedTool,
    roomClickStart,
    roomPreviewEnd,
    showMeasurementLabels,
    angleSnapEnabled,
    selectedWallId
  ]);

  useEffect(() => {
    const resizeCanvas = () => {
      if (!canvasRef.current) return;
      const parent = canvasRef.current.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      canvasRef.current.width = rect.width;
      canvasRef.current.height = rect.height;
      redraw();
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [redraw]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  return (
    <div
      style={{ position: "relative", width: "100%", height: "100%" }}
      tabIndex={0}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          zIndex: 2,
          /* Set background to grey: */
          backgroundColor: "#ccc"
        }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      />
      {showGrid && <Grid width={0} height={0} />}
      {tapeMeasureActive && <TapeMeasureTool canvasRef={canvasRef} />}
      {contextMenuOpen && (
        <WallContextMenu
          open={contextMenuOpen}
          anchorPoint={contextMenuPosition}
          wall={contextMenuWall}
          clickPoint={contextClickPoint}
          onClose={() => setContextMenuOpen(false)}
          onStartNewWall={(startPt) => {
            dispatch(
              startWall({
                id: "temp-wall",
                type: "straight",
                start: startPt,
                end: startPt,
                thickness: 10,
                height: 100
              })
            );
            dispatch(setSelectedTool("wall"));
          }}
        />
      )}
    </div>
  );
};

export default FloorPlanner2D;