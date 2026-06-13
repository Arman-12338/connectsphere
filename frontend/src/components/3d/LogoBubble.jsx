import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const LogoBubble = () => {
  const meshRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    // Rotate, float up/down, and pulsate scale
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(time / 4) * 0.2;
      meshRef.current.rotation.y = time * 0.2;
      meshRef.current.position.y = Math.sin(time * 1.2) * 0.2;
      
      const pulse = 1.6 + Math.sin(time * 2.5) * 0.06;
      meshRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshPhysicalMaterial
        color="#5c7cff"
        roughness={0.1}
        metalness={0.15}
        transmission={0.85} // High glass transmission
        thickness={1.2}     // Refraction thickness
        clearcoat={1.0}
        clearcoatRoughness={0.05}
      />
    </mesh>
  );
};

export default LogoBubble;
