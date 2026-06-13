import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const GlobeNetwork = () => {
  const globeGroupRef = useRef();
  const nodesRef = useRef();

  // Create random nodes on a spherical boundary
  const nodeCount = 35;
  const nodes = useMemo(() => {
    const temp = [];
    const radius = 2.2;
    for (let i = 0; i < nodeCount; i++) {
      // Spherical coordinate distribution
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      temp.push({
        position: new THREE.Vector3(x, y, z),
        speed: 0.2 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2
      });
    }
    return temp;
  }, []);

  // Compute positions of connections/edges between close nodes
  const connectionPositions = useMemo(() => {
    const points = [];
    const maxDistance = 1.6;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = nodes[i].position.distanceTo(nodes[j].position);
        if (dist < maxDistance) {
          points.push(
            nodes[i].position.x, nodes[i].position.y, nodes[i].position.z,
            nodes[j].position.x, nodes[j].position.y, nodes[j].position.z
          );
        }
      }
    }
    return new Float32Array(points);
  }, [nodes]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Rotate the overall system
    if (globeGroupRef.current) {
      globeGroupRef.current.rotation.y = time * 0.08;
      globeGroupRef.current.rotation.x = Math.sin(time * 0.05) * 0.1;
    }

    // Slightly animate each node (float on boundary)
    if (nodesRef.current) {
      const children = nodesRef.current.children;
      nodes.forEach((node, idx) => {
        if (children[idx]) {
          const scaleOffset = Math.sin(time * node.speed + node.phase) * 0.15 + 1.0;
          children[idx].scale.set(scaleOffset, scaleOffset, scaleOffset);
        }
      });
    }
  });

  return (
    <group ref={globeGroupRef}>
      {/* 1. Core Globe (Wireframe/Tech grid representation) */}
      <mesh>
        <sphereGeometry args={[1.8, 20, 20]} />
        <meshBasicMaterial 
          color="#3d53eb" 
          wireframe 
          transparent 
          opacity={0.15} 
        />
      </mesh>
      
      <mesh scale={0.99}>
        <sphereGeometry args={[1.8, 20, 20]} />
        <meshBasicMaterial 
          color="#1b1e22" 
          transparent 
          opacity={0.4} 
        />
      </mesh>

      {/* 2. Floating Network Nodes */}
      <group ref={nodesRef}>
        {nodes.map((node, i) => (
          <mesh key={i} position={node.position.toArray()}>
            <sphereGeometry args={[0.045, 12, 12]} />
            <meshBasicMaterial 
              color={i % 3 === 0 ? '#ffffff' : '#5c7cff'} 
              transparent 
              opacity={0.8}
            />
          </mesh>
        ))}
      </group>

      {/* 3. Communication Network Links */}
      {connectionPositions.length > 0 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[connectionPositions, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial 
            color="#5c7cff" 
            transparent 
            opacity={0.25} 
          />
        </lineSegments>
      )}
    </group>
  );
};

export default GlobeNetwork;
