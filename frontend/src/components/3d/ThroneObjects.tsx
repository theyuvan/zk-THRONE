import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface ThroneProps {
  position?: [number, number, number];
}

export function Throne({ position = [0, 0, 0] }: ThroneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = Math.sin(t * 0.5) * 0.08;
    if (glowRef.current) {
      glowRef.current.intensity = 2.5 + Math.sin(t * 2) * 0.8;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Base Platform */}
      <mesh position={[0, -1.6, 0]}>
        <cylinderGeometry args={[1.8, 2.2, 0.3, 8]} />
        <meshStandardMaterial color="#1a0a2e" emissive="#2A0E5C" emissiveIntensity={0.3} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Steps */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, -1.45 + i * 0.12, 0]}>
          <cylinderGeometry args={[1.6 - i * 0.3, 1.7 - i * 0.3, 0.12, 8]} />
          <meshStandardMaterial color="#0d0720" emissive="#FFD700" emissiveIntensity={0.05 + i * 0.05} metalness={0.9} roughness={0.1} />
        </mesh>
      ))}

      {/* Throne Seat */}
      <mesh position={[0, -0.9, 0.1]}>
        <boxGeometry args={[1.0, 0.15, 0.8]} />
        <meshStandardMaterial color="#1a0a2e" emissive="#2A0E5C" emissiveIntensity={0.4} metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Throne Back */}
      <mesh position={[0, -0.2, -0.3]}>
        <boxGeometry args={[1.0, 1.5, 0.12]} />
        <meshStandardMaterial color="#0d0720" emissive="#FFD700" emissiveIntensity={0.1} metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Armrests */}
      {[-0.45, 0.45].map((x, i) => (
        <mesh key={i} position={[x, -0.72, 0.1]}>
          <boxGeometry args={[0.12, 0.12, 0.8]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.8} metalness={1} roughness={0} />
        </mesh>
      ))}

      {/* Side Pillars */}
      {[-0.5, 0.5].map((x, i) => (
        <mesh key={i} position={[x, -0.0, -0.3]}>
          <cylinderGeometry args={[0.06, 0.06, 1.6, 8]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.6} metalness={1} roughness={0} />
        </mesh>
      ))}

      {/* Top Ornaments */}
      {[-0.5, 0, 0.5].map((x, i) => (
        <mesh key={i} position={[x, 0.72, -0.3]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={1.5} metalness={1} roughness={0} />
        </mesh>
      ))}

      {/* Gold trim lines on back */}
      {[-0.35, 0, 0.35].map((x, i) => (
        <mesh key={i} position={[x, -0.2, -0.24]}>
          <boxGeometry args={[0.04, 1.3, 0.02]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={2} metalness={1} roughness={0} />
        </mesh>
      ))}

      {/* Glow light */}
      <pointLight ref={glowRef} color="#FFD700" intensity={3} distance={4} position={[0, 0, 0.5]} />
      <pointLight color="#2A0E5C" intensity={1.5} distance={3} position={[0, -1, -0.5]} />
    </group>
  );
}

export function FloatingCrown({ position = [0, 1.5, 0] as [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.4;
    groupRef.current.position.y = position[1] + Math.sin(t * 0.8) * 0.15;
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Crown base ring */}
      <mesh>
        <torusGeometry args={[0.35, 0.06, 8, 32]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={1.5} metalness={1} roughness={0} />
      </mesh>

      {/* Crown points */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2;
        const x = Math.cos(angle) * 0.35;
        const z = Math.sin(angle) * 0.35;
        const height = i % 2 === 0 ? 0.35 : 0.2;
        return (
          <mesh key={i} position={[x, height / 2, z]}>
            <coneGeometry args={[0.05, height, 6]} />
            <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={2} metalness={1} roughness={0} />
          </mesh>
        );
      })}

      {/* Gems */}
      {[0, 2, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2;
        const x = Math.cos(angle) * 0.35;
        const z = Math.sin(angle) * 0.35;
        return (
          <mesh key={i} position={[x, 0.08, z]}>
            <octahedronGeometry args={[0.06]} />
            <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={3} transparent opacity={0.9} />
          </mesh>
        );
      })}

      <pointLight color="#FFD700" intensity={2} distance={2} />
    </group>
  );
}

export function ArenaPlatform() {
  return (
    <group>
      {/* Main platform */}
      <mesh position={[0, -2, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[6, 7, 0.2, 16]} />
        <meshStandardMaterial color="#0d0720" emissive="#2A0E5C" emissiveIntensity={0.15} metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Energy grid */}
      {[-4, -2, 0, 2, 4].map((x) =>
        [-4, -2, 0, 2, 4].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, -1.85, z]}>
            <boxGeometry args={[1.8, 0.01, 1.8]} />
            <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={0.3} transparent opacity={0.15} wireframe />
          </mesh>
        ))
      )}

      {/* Rim glow */}
      <mesh position={[0, -1.9, 0]}>
        <torusGeometry args={[6.5, 0.08, 8, 64]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={1.5} />
      </mesh>
    </group>
  );
}
