import React, { useRef, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Group, Shape, ExtrudeGeometry, Vector3, CatmullRomCurve3, BufferGeometry, LineBasicMaterial, Line, BoxGeometry, MeshStandardMaterial, Mesh } from 'three';
import { RootState } from '../../store/store';
import { WallData, FixtureData, CurvedWallData } from '../../types';
import { calculateDistance } from '../../utils/geometryUtils';
import { generateWallPoints } from '../../utils/curveUtils';

interface Scene3DProps {
  walls: (WallData | CurvedWallData)[];
  fixtures: FixtureData[];
}

const Scene3D: React.FC<Scene3DProps> = ({ walls, fixtures }) => {
  const groupRef = useRef<Group>(null);
  const { materials } = useSelector((state: RootState) => state.floorPlanner.present);

  useEffect(() => {
    walls.forEach(wall => {
      if (wall.type === 'curved') {
        // Handle curved walls
        const curve = new CatmullRomCurve3([
          new Vector3(wall.start.x, 0, wall.start.y),
          new Vector3(wall.controlPoint.x, 0, wall.controlPoint.y),
          new Vector3(wall.end.x, 0, wall.end.y)
        ]);
        
        const points = curve.getPoints(50);
        const geometry = new BufferGeometry().setFromPoints(points);
        const material = new LineBasicMaterial({ color: 0x000000 });
        const curvedWall = new Line(geometry, material);
        groupRef.current?.add(curvedWall);
      } else {
        // Handle straight walls
        const wallGeometry = new BoxGeometry(
          calculateDistance(wall.start, wall.end),
          wall.height,
          wall.thickness
        );

        const wallMaterial = new MeshStandardMaterial({
          color: 0xcccccc,
          roughness: 0.7,
          metalness: 0.1
        });

        const wallMesh = new Mesh(wallGeometry, wallMaterial);

        // Position and rotate wall
        const midPoint = {
          x: (wall.start.x + wall.end.x) / 2,
          y: (wall.start.y + wall.end.y) / 2
        };

        wallMesh.position.set(midPoint.x, wall.height / 2, midPoint.y);
        wallMesh.rotation.y = Math.atan2(
          wall.end.y - wall.start.y,
          wall.end.x - wall.start.x
        );

        groupRef.current?.add(wallMesh);
      }
    });
  }, [walls]);

  useEffect(() => {
    fixtures.forEach(fixture => {
      const { dimensions } = fixture;
      const fixtureGeometry = new BoxGeometry(
        dimensions.width,
        dimensions.height,
        dimensions.depth
      );

      const fixtureMaterial = new MeshStandardMaterial({
        color: 0x4444ff,
        roughness: 0.5,
        metalness: 0.2
      });

      const fixtureMesh = new Mesh(fixtureGeometry, fixtureMaterial);
      fixtureMesh.position.set(
        fixture.position.x,
        dimensions.height / 2,
        fixture.position.y
      );
      fixtureMesh.rotation.y = fixture.rotation;

      groupRef.current?.add(fixtureMesh);
    });
  }, [fixtures]);

  return (
    <group ref={groupRef}>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial 
          color="#f0f0f0"
          metalness={0.1}
          roughness={0.9}
        />
      </mesh>
    </group>
  );
};

export default Scene3D;
