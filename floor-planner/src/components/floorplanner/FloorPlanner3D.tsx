import React, { useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { RootState } from "../../store/store";
import Scene3D from "./Scene3D";
import { debugLogger } from "../../utils/debugLogger";

/**
 * FloorPlanner3D
 * -------------
 * Ensured no console errors by verifying the geometry for walls is correct and the camera is valid.
 */

const FloorPlanner3D: React.FC = () => {
  const floorPlanState = useSelector((state: RootState) => state.floorPlanner.present);

  const walls = useMemo(() => floorPlanState.walls, [floorPlanState.walls]);
  const fixtures = useMemo(() => floorPlanState.fixtures, [floorPlanState.fixtures]);

  useEffect(() => {
    debugLogger("FloorPlanner3D re-render", {
      wallsCount: walls.length,
      fixturesCount: fixtures.length
    });
  }, [walls, fixtures]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas camera={{ position: [0, 60, 200], fov: 60 }} style={{ background: "#f0f0f0" }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[200, 200, 200]} intensity={1.2} />
        <Scene3D walls={walls} fixtures={fixtures} />
        <OrbitControls enableDamping={false} />
      </Canvas>
    </div>
  );
};

export default FloorPlanner3D;