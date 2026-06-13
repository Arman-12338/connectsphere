import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

const ThreeCanvas = ({ children, cameraPos = [0, 0, 5], enableZoom = false, enableRotate = true }) => {
  return (
    <div className="absolute inset-0 w-full h-full -z-10 pointer-events-none opacity-40 md:opacity-75">
      <Canvas
        camera={{ position: cameraPos, fov: 60 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <pointLight position={[-5, -5, -2]} intensity={0.5} />
        
        <Suspense fallback={null}>
          {children}
        </Suspense>
        
        <OrbitControls 
          enableZoom={enableZoom} 
          enableRotate={enableRotate}
          enablePan={false}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
};

export default ThreeCanvas;
