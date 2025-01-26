import React, { useMemo, useRef } from "react";
import { Mesh } from "three";
import { useFrame } from "@react-three/fiber";
import { FixtureData } from "../../types";
import { useMaterial } from "./MaterialLibrary3D";

interface Fixture3DProps {
  fixture: FixtureData;
}

export const Fixture3D: React.FC<Fixture3DProps> = ({ fixture }) => {
  const meshRef = useRef<Mesh>(null);
  const material = useMaterial(fixture.materialId);

  // Debug logging
  console.log('Fixture object:', {
    id: fixture.id,
    name: fixture.name,
    position: fixture.position,
    width: fixture.dimensions.width,
    depth: fixture.dimensions.depth,
    height: fixture.dimensions.height,
    rotation: fixture.rotation,
    materialId: fixture.materialId
  });

  const position3D = useMemo(() => {
    return [
      fixture.position.x, 
      fixture.dimensions.height / 2, 
      -fixture.position.y
    ] as [number, number, number];
  }, [fixture.position.x, fixture.position.y, fixture.dimensions.height]);

  const rotationY = useMemo(() => {
    // Ensure rotation is treated as a number with default value of 0
    const rotation = typeof fixture.rotation === 'number' ? fixture.rotation : 0;
    return (rotation * Math.PI) / 180;
  }, [fixture.rotation]);

  useFrame(() => {
    // optional updates
  });

  return (
    <mesh ref={meshRef} position={position3D} rotation={[0, rotationY, 0]}>
      <boxGeometry args={[
        fixture.dimensions.width,
        fixture.dimensions.height,
        fixture.dimensions.depth
      ]} />
      {material ? (
        <primitive object={material} attach="material" />
      ) : (
        <meshStandardMaterial color="#00f" />
      )}
    </mesh>
  );
};
