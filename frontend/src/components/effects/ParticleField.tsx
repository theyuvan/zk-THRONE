import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleFieldProps {
  count?: number;
  color?: string;
  size?: number;
  spread?: number;
  speed?: number;
  rising?: boolean;
}

export default function ParticleField({
  count = 150,
  color = '#FFD700',
  size = 0.03,
  spread = 8,
  speed = 0.2,
  rising = true,
}: ParticleFieldProps) {
  const meshRef = useRef<THREE.Points>(null);

  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spread * 2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread * 2;

      velocities[i * 3] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 1] = rising ? Math.random() * 0.02 + 0.005 : (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }
    return { positions, velocities };
  }, [count, spread, rising]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  useFrame(() => {
    if (!meshRef.current) return;
    const pos = meshRef.current.geometry.attributes.position;
    const arr = pos.array as Float32Array;

    for (let i = 0; i < count; i++) {
      arr[i * 3] += velocities[i * 3] * speed;
      arr[i * 3 + 1] += velocities[i * 3 + 1] * speed;
      arr[i * 3 + 2] += velocities[i * 3 + 2] * speed;

      const halfSpread = spread;
      if (arr[i * 3 + 1] > halfSpread) arr[i * 3 + 1] = -halfSpread;
      if (Math.abs(arr[i * 3]) > halfSpread) arr[i * 3] = (Math.random() - 0.5) * spread * 2;
      if (Math.abs(arr[i * 3 + 2]) > halfSpread) arr[i * 3 + 2] = (Math.random() - 0.5) * spread * 2;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={meshRef} geometry={geometry}>
      <pointsMaterial
        color={color}
        size={size}
        transparent
        opacity={0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
