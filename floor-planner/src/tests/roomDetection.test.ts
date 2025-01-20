import { describe, it, expect } from 'vitest';
import { findRooms, isPointInRoom } from '../utils/roomDetection';
import { WallData } from '../types';

describe('roomDetection', () => {
  it('returns no rooms if walls do not form an enclosure', () => {
    const walls: WallData[] = [
      {
        id: 'w1',
        type: 'straight',
        start: { x: 0, y: 0 },
        end: { x: 100, y: 0 },
        thickness: 10,
        height: 100
      }
      // single line
    ];
    const rooms = findRooms(walls);
    expect(rooms.length).toBe(0);
  });

  it('detects a single rectangular room', () => {
    const walls: WallData[] = [
      {
        id: 'w1',
        type: 'straight',
        start: { x: 0, y: 0 },
        end: { x: 100, y: 0 },
        thickness: 10,
        height: 100
      },
      {
        id: 'w2',
        type: 'straight',
        start: { x: 100, y: 0 },
        end: { x: 100, y: 100 },
        thickness: 10,
        height: 100
      },
      {
        id: 'w3',
        type: 'straight',
        start: { x: 100, y: 100 },
        end: { x: 0, y: 100 },
        thickness: 10,
        height: 100
      },
      {
        id: 'w4',
        type: 'straight',
        start: { x: 0, y: 100 },
        end: { x: 0, y: 0 },
        thickness: 10,
        height: 100
      }
    ];
    const rooms = findRooms(walls);
    expect(rooms.length).toBe(1);
    const [room] = rooms;
    expect(room.points.length).toBeGreaterThanOrEqual(4);
    expect(room.walls).toHaveLength(4);
  });

  it('isPointInRoom correctly identifies inside vs. outside', () => {
    const rectPoints = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 }
    ];
    expect(isPointInRoom({ x: 50, y: 50 }, rectPoints)).toBe(true);
    expect(isPointInRoom({ x: 200, y: 50 }, rectPoints)).toBe(false);
  });
});