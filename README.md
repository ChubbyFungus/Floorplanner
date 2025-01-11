# Floor Planner with Dynamic Area Calculation

A TypeScript-based floor planner that provides real-time area calculations as users modify room layouts.

## Core Features

- Real-time area calculations
- Support for curved walls
- Handles complex room shapes (concave, multiple rooms)
- Unit conversion (pixels/inches/feet)

## Technical Implementation

### Area Calculation Process

1. **Find Room Perimeters**
   - Detect closed loops of walls
   - Each loop represents a room
   - Handles multiple rooms

2. **Handle Curved Walls**
   - Subdivide curved walls into line segments
   - Uses Bezier curves for smooth transitions
   - Configurable segment count for precision/performance balance

3. **Area Calculation**
   - Uses shoelace formula for simple polygons
   - Prepared for Earcut triangulation for complex shapes
   - Handles both concave and convex shapes

4. **Unit Conversion**
   - Supports pixel to inch conversion (default: 2.5px/inch)
   - Converts square inches to square feet
   - Maintains precision throughout calculations

### Key Components

#### `geometryUtils.ts`
- Basic geometry types and interfaces
- Core calculation functions
- Unit conversion utilities

#### `drawing.ts`
- Wall management
- Real-time update handling
- Event-driven recalculation

## Usage

The system automatically recalculates areas when:
- Walls are moved or resized
- Control points are added/removed
- Walls are split or merged

```typescript
// Example: Calculate room area
const walls: WallData[] = [/* wall data */];
const totalArea = updateRoomArea(walls);  // Returns area in square feet
```

## Performance Considerations

- Efficient polygon detection
- Optimized for typical floor plan scale
- Real-time updates without performance impact

## Future Enhancements

- [ ] Add Earcut triangulation for complex polygons
- [ ] Support for room holes/cutouts
- [ ] Additional unit conversion options
