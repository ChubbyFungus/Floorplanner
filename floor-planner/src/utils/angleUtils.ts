import { Point2D, WallData } from '../types';

/**
 * List of standard angles (every 45°) to snap to, if angleSnapEnabled.
 */
export const SNAP_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315, 360];

/** Snap tolerance in degrees. Increase if you want more "sticky" snapping. */
export const SNAP_TOLERANCE = 15;

export type AngleType = 'parallel' | 'perpendicular' | 'standard';

export interface AngleGuide {
  angle: number;
  start: Point2D;
  end: Point2D;
  isSnapped: boolean;
  type: AngleType;
}

/**
 * calculateAngle
 * Returns angle in degrees between 0..360
 */
export const calculateAngle = (start: Point2D, end: Point2D): number => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  // Normalize so 0 <= angleDeg < 360
  if (angleDeg < 0) angleDeg += 360;
  return angleDeg;
};

/**
 * findNearestSnapAngle
 * Permits a full 360 range. No forced ±180 wrap.
 */
export const findNearestSnapAngle = (
  angle: number,
  existingWalls: WallData[] = []
): { angle: number; type: AngleType } | null => {
  let bestAngle: number | null = null;
  let bestDiff = SNAP_TOLERANCE;
  let snappedType: AngleType = 'standard';

  // 1) Check standard angles
  for (const snapAngle of SNAP_ANGLES) {
    const diff = Math.abs(angle - snapAngle);
    if (diff < bestDiff) {
      bestAngle = snapAngle;
      bestDiff = diff;
      snappedType = 'standard';
    }
  }

  // 2) Check existing wall angles for parallel/perpendicular
  for (const w of existingWalls) {
    const wallAngle = calculateAngle(w.start, w.end);

    // parallel
    const diffParallel = Math.abs(angle - wallAngle);
    if (diffParallel < bestDiff) {
      bestAngle = wallAngle;
      bestDiff = diffParallel;
      snappedType = 'parallel';
    }

    // perpendicular
    const perpAngle = (wallAngle + 90) % 360;
    const diffPerp = Math.abs(angle - perpAngle);
    if (diffPerp < bestDiff) {
      bestAngle = perpAngle;
      bestDiff = diffPerp;
      snappedType = 'perpendicular';
    }
  }

  if (bestAngle !== null) {
    return { angle: bestAngle, type: snappedType };
  }
  return null;
};

/**
 * snapPointToAngle
 * Shifts 'end' to match the distance and nearest angle from 'start'.
 */
export const snapPointToAngle = (
  start: Point2D,
  end: Point2D,
  snapAngle: number
): Point2D => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angleRad = (snapAngle * Math.PI) / 180;
  return {
    x: start.x + distance * Math.cos(angleRad),
    y: start.y + distance * Math.sin(angleRad)
  };
};

/**
 * generateAngleGuides
 * Creates dashed guide lines for standard angles and parallel/perp angles near currentAngle.
 */
export const generateAngleGuides = (
  start: Point2D,
  end: Point2D,
  currentAngle: number,
  existingWalls: WallData[] = []
): AngleGuide[] => {
  const guides: AngleGuide[] = [];
  const distance = Math.sqrt((end.x - start.x)**2 + (end.y - start.y)**2);

  // Which angle are we actually snapping to?
  const nearest = findNearestSnapAngle(currentAngle, existingWalls);

  // 1) Standard angles
  for (const snapAngle of SNAP_ANGLES) {
    const diff = Math.abs(currentAngle - snapAngle);
    if (diff <= SNAP_TOLERANCE * 1.5) {
      const angleRad = (snapAngle * Math.PI) / 180;
      const guideEnd = {
        x: start.x + distance * Math.cos(angleRad),
        y: start.y + distance * Math.sin(angleRad)
      };
      guides.push({
        angle: snapAngle,
        start,
        end: guideEnd,
        isSnapped: nearest?.angle === snapAngle && nearest?.type === 'standard',
        type: 'standard'
      });
    }
  }

  // 2) Parallel / Perp to existing walls
  for (const w of existingWalls) {
    const wAngle = calculateAngle(w.start, w.end);
    const anglesToCheck: Array<{ angle: number; t: AngleType }> = [
      { angle: wAngle, t: 'parallel' },
      { angle: (wAngle + 90) % 360, t: 'perpendicular' }
    ];

    for (const candidate of anglesToCheck) {
      const diff = Math.abs(currentAngle - candidate.angle);
      if (diff <= SNAP_TOLERANCE * 1.5) {
        const angleRad = (candidate.angle * Math.PI) / 180;
        const guideEnd = {
          x: start.x + distance * Math.cos(angleRad),
          y: start.y + distance * Math.sin(angleRad)
        };
        guides.push({
          angle: candidate.angle,
          start,
          end: guideEnd,
          isSnapped:
            nearest?.angle === candidate.angle &&
            nearest?.type === candidate.t,
          type: candidate.t
        });
      }
    }
  }

  return guides;
};