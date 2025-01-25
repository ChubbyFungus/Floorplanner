// src/components/floorplanner/Scene3DContent.tsx
import React from "react";
import { WallData, FixtureData } from "../../types";
import { Wall3D } from "./Wall3D";
import { Fixture3D } from "./Fixture3D";

interface Scene3DContentProps {
  walls: WallData[];
  fixtures: FixtureData[];
}

/**
 * Scene3DContent
 * --------------
 * Renders 3D geometry for each wall and fixture,
 * ensuring something actually appears in the 3D view.
 */
const Scene3DContent: React.FC<Scene3DContentProps> = ({ walls, fixtures }) => {
  return (
    <>
      {walls.map((wall) => (
        <Wall3D key={wall.id} wall={wall} />
      ))}
      {fixtures.map((fx) => (
        <Fixture3D key={fx.id} fixture={fx} />
      ))}
    </>
  );
};

export default Scene3DContent;