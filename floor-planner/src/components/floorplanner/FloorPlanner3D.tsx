import React from 'react';
import { useSelector } from 'react-redux';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { RootState } from '../../store/store';
import Scene3D from './Scene3D';

/**
 * FloorPlanner3D
 * -------------
 * Renders a 3D view (using React Three Fiber) of the current floor plan, 
 * including orbit controls and basic lighting.
 */
const FloorPlanner3D: React.FC = () => {
  const { walls, fixtures } = useSelector((state: RootState) => state.floorPlanner.present);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [0, 10, 10], fov: 75 }}
        style={{ background: '#f0f0f0' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Scene3D walls={walls} fixtures={fixtures} />
        <OrbitControls />
      </Canvas>
    </div>
  );
};

export default FloorPlanner3D;