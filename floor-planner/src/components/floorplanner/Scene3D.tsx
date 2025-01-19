import React, { memo, useEffect } from "react";
import { GroupProps } from "@react-three/fiber";
import { WallData, FixtureData } from "../../types";
import { Wall3D } from "./Wall3D";
import { Fixture3D } from "./Fixture3D";
import { debugLogger } from "../../utils/debugLogger";
import { getMinMaxPoints } from "../../utils/scene3DUtils";

/**
 * Scene3DProps
 * @property walls - array of WallData
 * @property fixtures - array of FixtureData
 */
interface Scene3DProps extends GroupProps {
  walls: WallData[];
  fixtures: FixtureData[];
}

/**
 * Scene3D
 * Renders floor plan in 3D with React Three Fiber.
 * This version does not invert Y; it uses x,y in typical 3D XY-plane.
 */
const Scene3D: React.FC<Scene3DProps> = memo(({ walls, fixtures, ...groupProps }) => {
  useEffect(() => {
    debugLogger("Scene3D re-render", {
      wallsCount: walls.length,
      fixturesCount: fixtures.length
    });
  }, [walls, fixtures]);

  // Compute bounding box to shift scene near origin
  const { minX, minY } = getMinMaxPoints(walls);

  return (
    <group {...groupProps}>
      {walls.map((wall) => (
        <Wall3D
          key={wall.id}
          wall={{
            ...wall,
            // Shift so minX, minY is near 0,0
            start: { x: wall.start.x - minX, y: wall.start.y - minY },
            end: { x: wall.end.x - minX, y: wall.end.y - minY },
            controlPoints: wall.controlPoints
              ? wall.controlPoints.map((cp) => ({
                  x: cp.x - minX,
                  y: cp.y - minY
                }))
              : undefined
          }}
        />
      ))}

      {fixtures.map((fixture) => (
        <Fixture3D
          key={fixture.id}
          fixture={{
            ...fixture,
            position: {
              x: fixture.position.x - minX,
              y: fixture.position.y - minY
            }
          }}
        />
      ))}

      {/* Large plane for floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#f0f0f0" metalness={0.1} roughness={0.9} />
      </mesh>
    </group>
  );
});

Scene3D.displayName = "Scene3D";
export default Scene3D;