import React, { useState, useCallback } from "react";
import { pixelsToFeetAndInches } from "../../utils/geometryUtils";
import { Point2D } from "../../types";

interface TapeMeasureToolProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

/**
 * TapeMeasureTool
 * ---------------
 * Allows measuring distance between two points on the canvas. 
 * Displays a line and numeric label.
 */
export const TapeMeasureTool: React.FC<TapeMeasureToolProps> = ({ canvasRef }) => {
  const [startPoint, setStartPoint] = useState<Point2D | null>(null);
  const [endPoint, setEndPoint] = useState<Point2D | null>(null);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (!startPoint) {
        setStartPoint({ x, y });
        setEndPoint(null);
      } else if (!endPoint) {
        setEndPoint({ x, y });
      } else {
        setStartPoint({ x, y });
        setEndPoint(null);
      }
    },
    [startPoint, endPoint, canvasRef]
  );

  let measureLabel = "";
  let lineStyle: React.CSSProperties = {};

  if (startPoint && endPoint) {
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    measureLabel = pixelsToFeetAndInches(dist);

    const midX = (startPoint.x + endPoint.x) / 2;
    const midY = (startPoint.y + endPoint.y) / 2;
    lineStyle = {
      position: "absolute",
      left: `${Math.min(startPoint.x, endPoint.x)}px`,
      top: `${Math.min(startPoint.y, endPoint.y)}px`,
      border: "1px dashed red",
      width: `${Math.abs(dx)}px`,
      height: `${Math.abs(dy)}px`,
      pointerEvents: "none"
    };
  }

  return (
    <div
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={handleCanvasClick}
    >
      {startPoint && endPoint && (
        <div style={{ ...lineStyle, zIndex: 99999 }}>
          <div
            style={{
              position: "absolute",
              color: "red",
              backgroundColor: "white",
              fontSize: "12px",
              padding: "2px"
            }}
          >
            {measureLabel}
          </div>
        </div>
      )}
    </div>
  );
};