import { WallData, Point2D } from "../../types";
import {
  pixelsToFeetAndInches,
  getDistance
} from "../../utils/geometryUtils";
import { AngleGuide } from '../../utils/angleUtils';

/**
 * drawWalls
 * Renders existing walls with optional measurements.
 */
export function drawWalls(
  ctx: CanvasRenderingContext2D,
  walls: WallData[],
  showMeasurements: boolean = false
) {
  walls.forEach((wall) => {
    drawWall(ctx, wall, false, showMeasurements);
  });
}

/**
 * drawWall
 * Renders a wall with optional measurements.
 */
function drawWall(
  ctx: CanvasRenderingContext2D,
  wall: WallData,
  isSelected: boolean = false,
  showMeasurements: boolean = false
) {
  ctx.save();
  ctx.strokeStyle = isSelected ? '#f00' : '#333';
  ctx.lineWidth = wall.thickness || 10;
  ctx.beginPath();

  if (wall.controlPoints && wall.controlPoints.length > 0) {
    // Draw curved wall
    ctx.moveTo(wall.start.x, wall.start.y);
    const cp = wall.controlPoints;
    if (cp.length === 2) {
      ctx.bezierCurveTo(
        cp[0].x, cp[0].y,
        cp[1].x, cp[1].y,
        wall.end.x, wall.end.y
      );
    } else if (cp.length === 1) {
      ctx.quadraticCurveTo(
        cp[0].x, cp[0].y,
        wall.end.x, wall.end.y
      );
    }
  } else {
    // Draw straight wall
    ctx.moveTo(wall.start.x, wall.start.y);
    ctx.lineTo(wall.end.x, wall.end.y);
  }

  ctx.stroke();
  ctx.restore();

  if (showMeasurements) {
    drawWallMeasurement(ctx, wall);
  }
}

/**
 * drawInProgressWall
 * Renders the wall that the user is currently drawing, optionally with measurements and angle guides.
 */
export function drawInProgressWall(
  ctx: CanvasRenderingContext2D,
  wall: WallData,
  showMeasurements: boolean = true,
  angleGuides?: AngleGuide[]
) {
  drawWallPreview(ctx, wall, showMeasurements);
  if (showMeasurements) {
    drawWallMeasurement(ctx, wall);
  }
  if (angleGuides) {
    drawAngleGuides(ctx, angleGuides);
  }
}

/**
 * drawWallPreview
 * Renders a wall preview with optional guides.
 */
function drawWallPreview(
  ctx: CanvasRenderingContext2D,
  wall: WallData,
  showGuides: boolean = false
) {
  ctx.save();
  ctx.strokeStyle = '#999';
  ctx.lineWidth = wall.thickness || 10;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();

  if (wall.controlPoints && wall.controlPoints.length > 0) {
    // Draw curved wall preview
    ctx.moveTo(wall.start.x, wall.start.y);
    const cp = wall.controlPoints;
    if (cp.length === 2) {
      ctx.bezierCurveTo(
        cp[0].x, cp[0].y,
        cp[1].x, cp[1].y,
        wall.end.x, wall.end.y
      );
    } else if (cp.length === 1) {
      ctx.quadraticCurveTo(
        cp[0].x, cp[0].y,
        wall.end.x, wall.end.y
      );
    }
  } else {
    // Draw straight wall preview
    ctx.moveTo(wall.start.x, wall.start.y);
    ctx.lineTo(wall.end.x, wall.end.y);
  }

  ctx.stroke();

  if (showGuides) {
    // Draw guide lines or points
    ctx.strokeStyle = '#66f';
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(wall.start.x, wall.start.y);
    ctx.lineTo(wall.end.x, wall.end.y);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * drawWallMeasurement
 * Draws the length of the wall in feet/inches near its midpoint.
 */
function drawWallMeasurement(ctx: CanvasRenderingContext2D, wall: WallData) {
  const distance = getDistance(wall.start, wall.end);
  const measurement = pixelsToFeetAndInches(distance);
  const midX = (wall.start.x + wall.end.x) / 2;
  const midY = (wall.start.y + wall.end.y) / 2;

  ctx.save();
  ctx.font = "12px Arial";
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(measurement, midX, midY - 10);
  ctx.restore();
}

/**
 * drawAngleGuides
 * Renders dashed lines or angles that assist with snapping or alignment, if angleGuides are provided.
 */
export function drawAngleGuides(
  ctx: CanvasRenderingContext2D,
  guides: AngleGuide[]
) {
  guides.forEach((guide) => {
    ctx.save();
    ctx.strokeStyle = guide.isSnapped ? "#2196f3" : "#9e9e9e";
    ctx.lineWidth = guide.isSnapped ? 2 : 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(guide.start.x, guide.start.y);
    ctx.lineTo(guide.end.x, guide.end.y);
    ctx.stroke();
    ctx.restore();
  });
}