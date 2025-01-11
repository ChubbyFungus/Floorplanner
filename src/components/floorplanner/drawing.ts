import { Point2D, Wall, calculateRoomAreaInSquareFeet, subdivideWall } from '../../utils/geometryUtils';

interface Room {
    id: string;
    walls: Wall[];
    area?: number;  // in square feet
}

interface FloorPlan {
    rooms: Room[];
    totalArea: number;  // in square feet
}

/**
 * Finds all enclosed regions (rooms) from a set of walls
 * @param walls Array of walls to analyze
 * @returns Array of rooms, where each room is an array of connected walls
 */
function findEnclosedRegions(walls: Wall[]): Room[] {
    const rooms: Room[] = [];
    const usedWalls = new Set<Wall>();

    for (const startWall of walls) {
        if (usedWalls.has(startWall)) continue;

        const room: Room = {
            id: crypto.randomUUID(),
            walls: []
        };

        let currentWall = startWall;
        let currentPoint = currentWall.end;
        
        while (true) {
            room.walls.push(currentWall);
            usedWalls.add(currentWall);

            // Find next wall that starts at current wall's endpoint
            const nextWall = walls.find(w => 
                !usedWalls.has(w) && 
                Math.abs(w.start.x - currentPoint.x) < 0.001 && 
                Math.abs(w.start.y - currentPoint.y) < 0.001
            );

            if (!nextWall || nextWall === startWall) break;

            currentWall = nextWall;
            currentPoint = currentWall.end;
        }

        if (room.walls.length > 2) {
            rooms.push(room);
        }
    }

    return rooms;
}

/**
 * Converts a room's walls into a polygon (array of points)
 * @param room Room to convert
 * @param segmentsPerCurve Number of segments to use for curved walls
 * @returns Array of points forming the room's polygon
 */
function roomToPolygon(room: Room, segmentsPerCurve: number = 10): Point2D[] {
    const points: Point2D[] = [];

    for (const wall of room.walls) {
        const wallPoints = subdivideWall(wall, segmentsPerCurve);
        // Add all points except the last one (it will be the start of the next wall)
        points.push(...wallPoints.slice(0, -1));
    }

    return points;
}

/**
 * Updates area calculations for all rooms in the floor plan
 * @param walls Array of all walls in the floor plan
 * @returns Updated FloorPlan object with areas calculated
 */
export function updateAreaCalculations(walls: Wall[]): FloorPlan {
    const rooms = findEnclosedRegions(walls);
    let totalArea = 0;

    for (const room of rooms) {
        const polygon = roomToPolygon(room);
        room.area = calculateRoomAreaInSquareFeet(polygon);
        totalArea += room.area;
    }

    return {
        rooms,
        totalArea
    };
}

// Event handler types for wall modifications
export type WallModificationEvent = 
    | { type: 'MOVE_WALL'; wall: Wall; newStart: Point2D; newEnd: Point2D }
    | { type: 'RESIZE_WALL'; wall: Wall; newLength: number }
    | { type: 'ADD_CONTROL_POINT'; wall: Wall; point: Point2D }
    | { type: 'REMOVE_CONTROL_POINT'; wall: Wall; pointIndex: number }
    | { type: 'SPLIT_WALL'; wall: Wall; point: Point2D }
    | { type: 'MERGE_WALLS'; wall1: Wall; wall2: Wall };

/**
 * Handles wall modification events and updates area calculations
 * @param walls Current array of walls
 * @param event Modification event
 * @returns Updated FloorPlan object
 */
export function handleWallModification(walls: Wall[], event: WallModificationEvent): FloorPlan {
    let updatedWalls = [...walls];

    switch (event.type) {
        case 'MOVE_WALL':
            updatedWalls = walls.map(w => 
                w === event.wall 
                    ? { ...w, start: event.newStart, end: event.newEnd }
                    : w
            );
            break;

        case 'RESIZE_WALL':
            // Implementation depends on how you want to handle wall resizing
            break;

        case 'ADD_CONTROL_POINT':
            updatedWalls = walls.map(w =>
                w === event.wall
                    ? { ...w, controlPoints: [...(w.controlPoints || []), event.point] }
                    : w
            );
            break;

        case 'REMOVE_CONTROL_POINT':
            updatedWalls = walls.map(w =>
                w === event.wall && w.controlPoints
                    ? { 
                        ...w, 
                        controlPoints: w.controlPoints.filter((_, i) => i !== event.pointIndex)
                    }
                    : w
            );
            break;

        case 'SPLIT_WALL':
            const wallIndex = walls.indexOf(event.wall);
            if (wallIndex !== -1) {
                const wall1: Wall = {
                    start: event.wall.start,
                    end: event.point
                };
                const wall2: Wall = {
                    start: event.point,
                    end: event.wall.end
                };
                updatedWalls = [
                    ...walls.slice(0, wallIndex),
                    wall1,
                    wall2,
                    ...walls.slice(wallIndex + 1)
                ];
            }
            break;

        case 'MERGE_WALLS':
            updatedWalls = walls.filter(w => w !== event.wall1 && w !== event.wall2);
            updatedWalls.push({
                start: event.wall1.start,
                end: event.wall2.end
            });
            break;
    }

    return updateAreaCalculations(updatedWalls);
}
