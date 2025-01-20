import { Point2D, WallData, RoomData } from '../types';
import { getDistance, arePointsEqual } from './geometryUtils';

interface WallConnection {
  wall: WallData;
  point: Point2D;
  isStart: boolean;
}

export const findRooms = (walls: WallData[]): RoomData[] => {
  const rooms: RoomData[] = [];
  const wallConnections = buildWallConnectionMap(walls);
  const visited = new Set<string>();

  // We'll ignore any single-wall or incomplete loops
  // If there's no loop of at least 3 corners, skip
  walls.forEach(wall => {
    [
      { point: wall.start, isStart: true },
      { point: wall.end, isStart: false }
    ].forEach(({ point }) => {
      if (!visited.has(getPointKey(point))) {
        const room = traceRoom(point, wallConnections, visited);
        if (room && room.points.length >= 3) {
          rooms.push(room);
        }
      }
    });
  });

  return rooms;
};

const buildWallConnectionMap = (walls: WallData[]): Map<string, WallConnection[]> => {
  const connections = new Map<string, WallConnection[]>();

  walls.forEach(wall => {
    const startKey = getPointKey(wall.start);
    if (!connections.has(startKey)) {
      connections.set(startKey, []);
    }
    connections.get(startKey)!.push({ wall, point: wall.start, isStart: true });

    const endKey = getPointKey(wall.end);
    if (!connections.has(endKey)) {
      connections.set(endKey, []);
    }
    connections.get(endKey)!.push({ wall, point: wall.end, isStart: false });
  });

  return connections;
};

const traceRoom = (
  startPoint: Point2D,
  connections: Map<string, WallConnection[]>,
  visited: Set<string>
): RoomData | null => {
  const points: Point2D[] = [];
  const walls: WallData[] = [];
  let currentPoint = startPoint;
  let firstIteration = true;

  while (firstIteration || !arePointsEqual(currentPoint, startPoint)) {
    firstIteration = false;
    const pointKey = getPointKey(currentPoint);
    if (visited.has(pointKey) && !arePointsEqual(currentPoint, startPoint)) {
      return null;
    }
    visited.add(pointKey);
    points.push(currentPoint);

    const pointConnections = connections.get(pointKey) || [];
    if (pointConnections.length !== 2) {
      return null;
    }

    const nextConnection = pointConnections.find(conn =>
      !walls.includes(conn.wall)
    );
    if (!nextConnection) {
      return null;
    }
    walls.push(nextConnection.wall);

    currentPoint = nextConnection.isStart
      ? nextConnection.wall.end
      : nextConnection.wall.start;
  }

  if (points.length < 3) {
    return null;
  }

  return {
    id: generateRoomId(),
    name: "Unnamed",
    points,
    walls: walls.map(w => w.id),
    area: calculateArea(points)
  };
};

const getPointKey = (point: Point2D): string => {
  return `${point.x},${point.y}`;
};

const calculateArea = (points: Point2D[]): number => {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
};

let roomCounter = 1;
const generateRoomId = () =>
  `room-${Date.now()}-${roomCounter++}`;

export const isPointInRoom = (point: Point2D, roomPoints: Point2D[]): boolean => {
  let inside = false;
  for (let i = 0, j = roomPoints.length - 1; i < roomPoints.length; j = i++) {
    const xi = roomPoints[i].x, yi = roomPoints[i].y;
    const xj = roomPoints[j].x, yj = roomPoints[j].y;

    const intersect = ((yi > point.y) !== (yj > point.y))
      && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};