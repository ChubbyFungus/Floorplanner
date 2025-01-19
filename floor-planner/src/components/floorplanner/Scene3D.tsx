import React, { memo, useEffect } from "react";
import { GroupProps } from "@react-three/fiber";
import { WallData, FixtureData } from "../../types";
import { Wall3D } from "./Wall3D";
import { Fixture3D } from "./Fixture3D";
import { debugLogger } from "../../utils/debugLogger";

/**
 * Scene3DProps
 * -----------
 * @property walls - An array of WallData to be displayed in 3D.
 * @property fixtures - An array of FixtureData to be displayed in 3D.
 */
interface Scene3DProps extends GroupProps {
  walls: WallData[];
  fixtures: FixtureData[];
}

/**
 * Scene3D
 * -------
 * Renders a 3D scene of the floor plan using React Three Fiber.
 * Wrapped with React.memo to minimize re-renders when walls/fixtures are unchanged.
 */
const Scene3D: React.FC<Scene3DProps> = memo(({ walls, fixtures, ...groupProps }) => {
  // Debug: log each time Scene3D re-renders, to see if props are changing
  useEffect(() => {
    debugLogger("Scene3D re-render", {
      wallsCount: walls.length,
      fixturesCount: fixtures.length
    });
  }, [walls, fixtures]);

  return (
    <group {...groupProps}>
      {/* Render each wall as a Wall3D component */}
      {walls.map((wall) => (
        <Wall3D key={wall.id} wall={wall} />
      ))}

      {/* Render each fixture as a Fixture3D component */}
      {fixtures.map((fixture) => (
        <Fixture3D key={fixture.id} fixture={fixture} />
      ))}

      {/* Simple floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#f0f0f0" metalness={0.1} roughness={0.9} />
      </mesh>
    </group>
  );
});

Scene3D.displayName = "Scene3D";

export default Scene3D;