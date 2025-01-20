// src/components/floorplanner/Scene3D.tsx
import React, { useEffect } from "react";
import { OrbitControls } from "@react-three/drei";
import { debugLogger } from "../../utils/debugLogger";
import Scene3DContent from "./Scene3DContent";
import { RootState } from "../../store/store";

type Wall = RootState["floorPlanner"]["present"]["walls"][number];
type Fixture = RootState["floorPlanner"]["present"]["fixtures"][number];

/**
 * Scene3D
 * -------
 * A component that renders 3D scene content including walls, fixtures, and controls.
 * Designed to be used within a Canvas component from FloorPlanner3D.
 */
const Scene3D: React.FC<{ walls: Wall[]; fixtures: Fixture[] }> = ({ walls, fixtures }) => {
  useEffect(() => {
    debugLogger("Scene3D re-render", { wallsCount: walls.length, fixturesCount: fixtures.length });
  }, [walls, fixtures]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[200, 200, 200]} intensity={1.2} />
      <Scene3DContent walls={walls} fixtures={fixtures} />
      <OrbitControls enableDamping={false} />
    </>
  );
};

export default Scene3D;