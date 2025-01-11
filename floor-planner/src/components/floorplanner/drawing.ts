// drawing.ts
import { WallData } from "../../types";

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
  ctx.restore();
}
