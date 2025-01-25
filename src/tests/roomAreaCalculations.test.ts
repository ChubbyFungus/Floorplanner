import { describe, expect, it } from 'vitest';
import { calculateRoomAreas } from '../utils/geometryUtils';

describe('Room Area Calculations', () => {
  const mockRooms = [
    {
      id: 'room1',
      vertices: [{x:0,y:0}, {x:10,y:0}, {x:10,y:10}, {x:0,y:10}], // 100m²
      children: ['room2']
    },
    {
      id: 'room2',
      vertices: [{x:2,y:2}, {x:8,y:2}, {x:8,y:8}, {x:2,y:8}], // 36m²
      parent: 'room1'
    },
    {
      id: 'room3',
      vertices: [{x:0,y:0}, {x:5,y:0}, {x:5,y:5}, {x:0,y:5}], // 25m²
      children: ['room4']
    },
    {
      id: 'room4', 
      vertices: [{x:1,y:1}, {x:4,y:1}, {x:4,y:4}, {x:1,y:4}], // 9m²
      parent: 'room3'
    }
  ];

  it('should calculate individual room areas', () => {
    const results = calculateRoomAreas(mockRooms);
    expect(results.get('room1')?.baseArea).toBe(100);
    expect(results.get('room2')?.baseArea).toBe(36);
  });

  it('should subtract child areas from parent', () => {
    const results = calculateRoomAreas(mockRooms);
    expect(results.get('room1')?.effectiveArea).toBe(64); // 100 - 36
    expect(results.get('room3')?.effectiveArea).toBe(16); // 25 - 9
  });

  it('should exclude nested rooms from total area', () => {
    const { totalArea } = calculateRoomAreas(mockRooms);
    // Only room1 and room3 are top-level (100-36 + 25-9 = 64 + 16 = 80)
    expect(totalArea).toBe(80);
  });

  it('should handle multi-level nesting', () => {
    const rooms = [
      ...mockRooms,
      {
        id: 'room5',
        vertices: [{x:3,y:3}, {x:7,y:3}, {x:7,y:7}, {x:3,y:7}], // 16m²
        parent: 'room2' // Child of room2 which is child of room1
      }
    ];
    
    const results = calculateRoomAreas(rooms);
    // room1 should subtract both room2 and room5
    expect(results.get('room1')?.effectiveArea).toBe(100 - 36 - 16); // 48
    expect(results.get('room2')?.effectiveArea).toBe(36 - 16); // 20
    expect(results.totalArea).toBe(48 + 16); // room1 + room3
  });
});
