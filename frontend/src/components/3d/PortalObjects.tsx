import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Trial } from '@/types/game';

interface PortalProps {
  trial: Trial;
  position: [number, number, number];
  onClick: () => void;
  isActive?: boolean;
  index: number;
}

export function Portal({ trial, position, onClick, isActive = false, index }: PortalProps) {
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const energyRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() + index * 0.5;
    if (outerRingRef.current) outerRingRef.current.rotation.z = t * 0.5;
    if (innerRingRef.current) innerRingRef.current.rotation.z = -t * 0.8;
    if (energyRef.current) energyRef.current.rotation.z = t * 1.2;
    if (glowRef.current) {
      glowRef.current.intensity = (isActive ? 3 : 1.5) + Math.sin(t * 2) * 0.5;
    }
  });

  const color = trial.portalColor;

  return (
    <group position={position} onClick={onClick}>
      {/* Outer ring */}
      <mesh ref={outerRingRef}>
        <torusGeometry args={[0.7, 0.05, 8, 48]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isActive ? 3 : 1.5} metalness={1} roughness={0} />
      </mesh>

      {/* Inner ring */}
      <mesh ref={innerRingRef}>
        <torusGeometry args={[0.5, 0.03, 8, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} transparent opacity={0.8} />
      </mesh>

      {/* Energy disc */}
      <mesh ref={energyRef}>
        <circleGeometry args={[0.45, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isActive ? 1.5 : 0.5}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Center rune */}
      <mesh>
        <ringGeometry args={[0.15, 0.22, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} side={THREE.DoubleSide} />
      </mesh>

      {/* Point light */}
      <pointLight ref={glowRef} color={color} intensity={2} distance={2} />

      {/* Hover area */}
      <mesh>
        <circleGeometry args={[0.8, 32]} />
        <meshStandardMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

interface PortalRoomEnvironmentProps {
  trials: Trial[];
  onPortalClick: (trial: Trial) => void;
  activatedPortals: string[];
}

export function PortalRoomEnvironment({ trials, onPortalClick, activatedPortals }: PortalRoomEnvironmentProps) {
  return (
    <group>
      {trials.map((trial, i) => {
        const angle = (i / trials.length) * Math.PI * 2 - Math.PI / 2;
        const radius = 3.5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        return (
          <Portal
            key={trial.id}
            trial={trial}
            position={[x, 0, z]}
            onClick={() => onPortalClick(trial)}
            isActive={activatedPortals.includes(trial.id)}
            index={i}
          />
        );
      })}
    </group>
  );
}
