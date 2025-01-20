import { Point2D, WallData } from '../types';

export const SNAP_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315, 360];
// Increase tolerance to strengthen snap
export const SNAP_TOLERANCE = 20; 

export type AngleType = 'parallel' | 'perpendicular' | 'standard';

export interface AngleGuide {
  angle: number;
  start: Point2D;
  end: Point2D;
  isSnapped: boolean;
  type: AngleType;
}

export const calculateAngle = (start: Point2D, end: Point2D): number => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (angle < 0) angle += 360;
  return angle;
};

export const findNearestSnapAngle = (
  angle: number,
  existingWalls: WallData[] = []
): { angle: number; type: AngleType } | null => {
  let bestAngle = null;
  let bestDiff = SNAP_TOLERANCE;
  let type: AngleType = 'standard';

  // Check standard snap angles
  SNAP_ANGLES.forEach(snapAngle => {
    const diff = Math.abs(angle - snapAngle);
    const diffWrapped = Math.min(diff, 360 - diff);
    if (diffWrapped < bestDiff) {
      bestAngle = snapAngle;
      bestDiff = diffWrapped;
      type = 'standard';
    }
  });

  // Check existing wall angles for parallel and perpendicular
  existingWalls.forEach(wall => {
    const wallAngle = calculateAngle(wall.start, wall.end);
    
    // Check parallel
    const diffParallel = Math.abs(angle - wallAngle);
    const diffParallelWrapped = Math.min(diffParallel, 360 - diffParallel);
    if (diffParallelWrapped < bestDiff) {
      bestAngle = wallAngle;
      bestDiff = diffParallelWrapped;
      type = 'parallel';
    }

    // Check perpendicular
    const perpAngle = (wallAngle + 90) % 360;
    const diffPerp = Math.abs(angle - perpAngle);
    const diffPerpWrapped = Math.min(diffPerp, 360 - diffPerp);
    if (diffPerpWrapped < bestDiff) {
      bestAngle = perpAngle;
      bestDiff = diffPerpWrapped;
      type = 'perpendicular';
    }
  });

  return bestAngle !== null ? { angle: bestAngle, type } : null;
};

export const snapPointToAngle = (
  start: Point2D,
  end: Point2D,
  snapAngle: number
): Point2D => {
  const distance = Math.sqrt(
    Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
  );
  const angleInRadians = (snapAngle * Math.PI) / 180;

  return {
    x: start.x + distance * Math.cos(angleInRadians),
    y: start.y + distance * Math.sin(angleInRadians)
  };
};

export const generateAngleGuides = (
  start: Point2D,
  end: Point2D,
  currentAngle: number,
  existingWalls: WallData[] = []
): AngleGuide[] => {
  const guides: AngleGuide[] = [];
  const distance = Math.sqrt(
    Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
  );

  // Find nearest snap angle including parallel/perpendicular
  const nearestSnap = findNearestSnapAngle(currentAngle, existingWalls);
  
  // Generate guides for standard snap angles
  SNAP_ANGLES.forEach(snapAngle => {
    const diff = Math.abs(currentAngle - snapAngle);
    const diffWrapped = Math.min(diff, 360 - diff);
    
    // Show guides if we're within roughly double the tolerance
    if (diffWrapped < SNAP_TOLERANCE * 2) {
      const angleInRadians = (snapAngle * Math.PI) / 180;
      const guideEnd = {
        x: start.x + distance * Math.cos(angleInRadians),
        y: start.y + distance * Math.sin(angleInRadians)
      };

      guides.push({
        angle: snapAngle,
        start,
        end: guideEnd,
        isSnapped: nearestSnap?.angle === snapAngle,
        type: 'standard'
      });
    }
  });

  // Add guides for parallel and perpendicular
  existingWalls.forEach(wall => {
    const wallAngle = calculateAngle(wall.start, wall.end);
    const angles = [
      { angle: wallAngle, type: 'parallel' as const },
      { angle: (wallAngle + 90) % 360, type: 'perpendicular' as const }
    ];

    angles.forEach(({ angle, type }) => {
      const diff = Math.abs(currentAngle - angle);
      const diffWrapped = Math.min(diff, 360 - diff);
      
      if (diffWrapped < SNAP_TOLERANCE * 2) {
        const angleInRadians = (angle * Math.PI) / 180;
        const guideEnd = {
          x: start.x + distance * Math.cos(angleInRadians),
          y: start.y + distance * Math.sin(angleInRadians)
        };

        guides.push({
          angle,
          start,
          end: guideEnd,
          isSnapped: nearestSnap?.angle === angle && nearestSnap?.type === type,
          type
        });
      }
    });
  });

  return guides;
};