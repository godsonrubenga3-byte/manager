import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface BarProps {
  position: [number, number, number];
  height: number;
  color: string;
  label: string;
}

const Bar = ({ position, height, color, label }: BarProps) => {
  const mesh = useRef<THREE.Mesh>(null);
  
  return (
    <group position={position}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh ref={mesh} position={[0, height / 2, 0]}>
          <boxGeometry args={[0.8, height, 0.8]} />
          <meshStandardMaterial color={color} metalness={0.8} roughness={0.1} emissive={color} emissiveIntensity={0.2} />
        </mesh>
      </Float>
      <Text
        position={[0, -0.5, 0]}
        fontSize={0.3}
        color="#888"
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, 0]}
      >
        {label}
      </Text>
    </group>
  );
};

interface Spending3DProps {
  data: { category: string; amount: number }[];
}

export default function Spending3D({ data }: Spending3DProps) {
  const maxAmount = Math.max(...data.map(d => d.amount), 1);
  const colors = ['#800020', '#a52a2a', '#5c1010', '#911e1e', '#4d0013', '#66001b'];

  return (
    <div className="h-[400px] w-full rounded-2xl overflow-hidden bg-white/5 border border-white/10">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[5, 5, 10]} fov={50} />
        <OrbitControls enableZoom={false} maxPolarAngle={Math.PI / 2.1} />
        
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1.5} castShadow />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />

        <group position={[-((data.length - 1) * 1.5) / 2, 0, 0]}>
          {data.map((item, index) => (
            <Bar
              key={item.category}
              position={[index * 1.5, 0, 0]}
              height={(item.amount / maxAmount) * 5}
              color={colors[index % colors.length]}
              label={item.category}
            />
          ))}
        </group>

        <gridHelper args={[20, 20, 0x444444, 0x222222]} position={[0, -0.1, 0]} />
      </Canvas>
      <div className="absolute bottom-4 left-4 text-xs font-mono text-stone-600 uppercase tracking-widest pointer-events-none">
        3D Spending Analytics
      </div>
    </div>
  );
}
