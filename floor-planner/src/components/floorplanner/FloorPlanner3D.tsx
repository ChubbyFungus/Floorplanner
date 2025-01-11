import React, { useRef } from "react";
import { Canvas, useFrame, Props } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { Group } from "three";
import { Wall3D } from "./Wall3D";
import { Fixture3D } from "./Fixture3D";
import { MaterialLibrary3D } from "./MaterialLibrary3D";
import { WallData, FixtureData } from "../../types";

// Explicitly type the Canvas component
const ThreeCanvas = Canvas as unknown as React.FC<Props>;

/**
 * Top-level component: renders <Canvas> and adds R3F controls/lights.
 * Does NOT call R3F hooks here, so no error about "Hooks can only be used within the Canvas component."
 */
export const FloorPlanner3D: React.FC = () => {
  return (
    <ThreeCanvas
      camera={{ position: [0, 5, 10], fov: 50 }}
      shadows
      gl={{ preserveDrawingBuffer: true }}
    >
      <OrbitControls />
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

      {/* The child scene is inside <Canvas>, so it can safely use R3F hooks if needed. */}
      <Scene3D />
    </ThreeCanvas>
  );
};

/**
 * Child scene component that lives inside <Canvas>.
 * We can safely access R3F hooks like `useFrame`, `useThree`, or `useLoader` here.
 */
function Scene3D() {
  const groupRef = useRef<Group>(null);
  const { walls, fixtures, materials } = useSelector(
    (state: RootState) => state.floorPlanner
  );

  // Example: We can call useFrame here if we want animations, e.g.:
  // useFrame(() => {
  //   if (groupRef.current) {
  //     groupRef.current.rotation.y += 0.001;
  //   }
  // });

  return (
    <MaterialLibrary3D materials={materials}>
      <group ref={groupRef}>
        {walls.map((wall: WallData) => (
          <Wall3D key={wall.id} wall={wall} />
        ))}
        {fixtures.map((fixture: FixtureData) => (
          <Fixture3D key={fixture.id} fixture={fixture} />
        ))}
      </group>
    </MaterialLibrary3D>
  );
}
