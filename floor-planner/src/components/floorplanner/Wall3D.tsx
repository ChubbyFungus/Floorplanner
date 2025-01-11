import React, { useMemo, useRef } from "react";
import { Mesh, Vector3, Curve, Shape } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { WallData, Point2D } from "../../types";
import { useMaterial } from "./MaterialLibrary3D";

class WallPathCurve extends Curve<Vector3> {
  private pathPoints: Point2D[];

  constructor(pathPoints: Point2D[]) {
    super();
    this.pathPoints = pathPoints;
  }

  getPoint(t: number, optionalTarget = new Vector3()): Vector3 {
    const len = this.pathPoints.length;
    if (len < 2) {
      return optionalTarget.set(0, 0, 0);
    }
    const scaledT = t * (len - 1);
    const idx = Math.floor(scaledT);
    const alpha = scaledT - idx;
    if (idx >= len - 1) {
      const last = this.pathPoints[len - 1];
      return optionalTarget.set(last.x, 0, -last.y);
    }
    const p1 = this.pathPoints[idx];
    const p2 = this.pathPoints[idx + 1];
    const x = p1.x + alpha * (p2.x - p1.x);
    const y = p1.y + alpha * (p2.y - p1.y);
    return optionalTarget.set(x, 0, -y);
  }
}

export const Wall3D: React.FC<{ wall: WallData }> = ({ wall }) => {
  const meshRef = useRef<Mesh>(null);
  const material = useMaterial(wall.materialId);
  const { scene } = useThree();

  // Build path points
  const pathPoints = useMemo(() => {
    const array: Point2D[] = [wall.start];
    if (wall.controlPoints && wall.controlPoints.length > 0) {
      array.push(...wall.controlPoints);
    }
    array.push(wall.end);
    return array;
  }, [wall]);

  const wallCurve = useMemo(() => {
    return new WallPathCurve(pathPoints);
  }, [pathPoints]);

  // Rectangle shape thickness x height
  const shape = useMemo(() => {
    const s = new Shape();
    s.moveTo(0, 0);
    s.lineTo(wall.thickness, 0);
    s.lineTo(wall.thickness, wall.height);
    s.lineTo(0, wall.height);
    s.closePath();
    return s;
  }, [wall.thickness, wall.height]);

  const extrudeSettings = useMemo(() => {
    return {
      steps: pathPoints.length * 10,
      bevelEnabled: false,
      extrudePath: wallCurve
    };
  }, [wallCurve, pathPoints]);

  useFrame(() => {
    // optional runtime transformations
  });

  return (
    <mesh ref={meshRef}>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      {material ? (
        <primitive object={material} attach="material" />
      ) : (
        <meshStandardMaterial color="#999" />
      )}
    </mesh>
  );
};
