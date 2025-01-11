// drawing.ts
import { WallData } from "../../types";
import { pixelsToFeetAndInches } from "../../utils/geometryUtils";

export function drawWalls(ctx: CanvasRenderingContext2D, wallArray: WallData[]) {
  ctx.save();
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  wallArray.forEach((wall) => {
    ctx.beginPath();
    ctx.moveTo(wall.start.x, wall.start.y);

    if (wall.controlPoints && wall.controlPoints.length > 0) {
      const start = wall.start;
      const end = wall.end;
      const cp = wall.controlPoints[0];

      // Calculate midpoint and control point
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const normalX = -dy / dist;
      const normalY = dx / dist;

      // Calculate how far the control point is from the line
      const cpDist = (cp.x - start.x) * normalX + (cp.y - start.y) * normalY;
      
      // Use quadratic curve for smoother control
      const controlX = midX + normalX * cpDist;
      const controlY = midY + normalY * cpDist;
      
      ctx.quadraticCurveTo(controlX, controlY, end.x, end.y);
    } else {
      ctx.lineTo(wall.end.x, wall.end.y);
    }
    ctx.stroke();

    // Draw endpoints
    ctx.beginPath();
    ctx.arc(wall.start.x, wall.start.y, 3, 0, 2 * Math.PI);
    ctx.arc(wall.end.x, wall.end.y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = '#0000ff';
    ctx.fill();

    // Draw measurement
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const measurement = pixelsToFeetAndInches(distance);
    
    // Position the text above the wall
    const midX = (wall.start.x + wall.end.x) / 2;
    const midY = (wall.start.y + wall.end.y) / 2;
    const offset = 15; // Offset the text above the wall
    
    ctx.save();
    ctx.fillStyle = "#000";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    
    // Draw white background for better visibility
    const textMetrics = ctx.measureText(measurement);
    const padding = 2;
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillRect(
      midX - textMetrics.width / 2 - padding,
      midY - offset - 12 - padding,
      textMetrics.width + padding * 2,
      16
    );
    
    // Draw the measurement text
    ctx.fillStyle = "#000";
    ctx.fillText(measurement, midX, midY - offset);
    ctx.restore();
  });
  ctx.restore();
}

export function drawInProgressWall(ctx: CanvasRenderingContext2D, wall: WallData) {
  ctx.save();
  ctx.strokeStyle = "#d00";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(wall.start.x, wall.start.y);
  
  if (wall.controlPoints && wall.controlPoints.length > 0) {
    const start = wall.start;
    const end = wall.end;
    const cp = wall.controlPoints[0];

    // Calculate midpoint and control point
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const normalX = -dy / dist;
    const normalY = dx / dist;

    // Calculate how far the control point is from the line
    const cpDist = (cp.x - start.x) * normalX + (cp.y - start.y) * normalY;
    
    // Use quadratic curve for smoother control
    const controlX = midX + normalX * cpDist;
    const controlY = midY + normalY * cpDist;
    
    ctx.quadraticCurveTo(controlX, controlY, end.x, end.y);
  } else {
    ctx.lineTo(wall.end.x, wall.end.y);
  }
  ctx.stroke();

  // Draw endpoints
  ctx.beginPath();
  ctx.arc(wall.start.x, wall.start.y, 3, 0, 2 * Math.PI);
  ctx.arc(wall.end.x, wall.end.y, 3, 0, 2 * Math.PI);
  ctx.fillStyle = '#0000ff';
  ctx.fill();

  // Draw measurement for in-progress wall
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const measurement = pixelsToFeetAndInches(distance);
  
  // Position the text above the wall
  const midX = (wall.start.x + wall.end.x) / 2;
  const midY = (wall.start.y + wall.end.y) / 2;
  const offset = 15;
  
  ctx.fillStyle = "#000";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  
  // Draw white background
  const textMetrics = ctx.measureText(measurement);
  const padding = 2;
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.fillRect(
    midX - textMetrics.width / 2 - padding,
    midY - offset - 12 - padding,
    textMetrics.width + padding * 2,
    16
  );
  
  // Draw the measurement text
  ctx.fillStyle = "#d00"; // Use red for in-progress measurement
  ctx.fillText(measurement, midX, midY - offset);
  
  ctx.restore();
}
