import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { FloatingCrown } from '@/components/3d/ThroneObjects';
import ParticleField from '@/components/effects/ParticleField';

function KingOnThrone() {
  const groupRef = useRef<THREE.Group>(null);
  const auraRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = Math.sin(t * 0.4) * 0.05;
    if (auraRef.current) {
      auraRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.1);
      (auraRef.current.material as THREE.MeshStandardMaterial).opacity = 0.15 + Math.sin(t * 1.5) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Throne seat */}
      <mesh position={[0, -0.8, 0.1]}>
        <boxGeometry args={[1.2, 0.2, 0.9]} />
        <meshStandardMaterial color="#0d0720" emissive="#2A0E5C" emissiveIntensity={0.5} metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Throne back */}
      <mesh position={[0, 0.3, -0.3]}>
        <boxGeometry args={[1.2, 2.2, 0.15]} />
        <meshStandardMaterial color="#0d0720" emissive="#FFD700" emissiveIntensity={0.15} metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Gold pillars */}
      {[-0.55, 0.55].map((x, i) => (
        <mesh key={i} position={[x, 0.3, -0.3]}>
          <cylinderGeometry args={[0.07, 0.07, 2.2, 8]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={1} metalness={1} roughness={0} />
        </mesh>
      ))}

      {/* Player silhouette */}
      <mesh position={[0, -0.2, 0.1]}>
        <capsuleGeometry args={[0.2, 0.8, 4, 8]} />
        <meshStandardMaterial color="#0A0A0F" emissive="#2A0E5C" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, 0.4, 0.1]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#0A0A0F" emissive="#2A0E5C" emissiveIntensity={1} />
      </mesh>

      {/* Aura */}
      <mesh ref={auraRef} position={[0, 0, 0]}>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={2} transparent opacity={0.15} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Crown */}
      <FloatingCrown position={[0, 0.85, 0.1]} />

      {/* Royal lights */}
      <pointLight color="#FFD700" intensity={4} distance={5} position={[0, 1, 1]} />
      <pointLight color="#00F0FF" intensity={1.5} distance={4} position={[-1.5, 1, 1]} />
      <pointLight color="#FF2E63" intensity={1} distance={3} position={[1.5, -0.5, 1]} />
    </group>
  );
}

function VictoryRings() {
  return (
    <>
      {[2, 3.5, 5].map((r, i) => (
        <RotatingRing key={i} radius={r} speed={0.2 + i * 0.1} color={['#FFD700', '#00F0FF', '#8B5CF6'][i]} />
      ))}
    </>
  );
}

function RotatingRing({ radius, speed, color }: { radius: number; speed: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.getElapsedTime() * speed;
    ref.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.3;
  });
  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, 0.03, 8, 128]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}

interface KingRevealProps {
  onRestart?: () => void;
  onContinue?: () => void;
  winnerName?: string;
  isMultiplayer?: boolean;
  isCurrentPlayerWinner?: boolean;
}

export default function KingReveal({ 
  onRestart, 
  onContinue, 
  winnerName, 
  isMultiplayer = false,
  isCurrentPlayerWinner = true 
}: KingRevealProps) {
  // Auto-advance to leaderboard after 15 seconds in multiplayer mode
  useEffect(() => {
    if (isMultiplayer && onContinue) {
      const timer = setTimeout(() => onContinue(), 15000);
      return () => clearTimeout(timer);
    }
  }, [isMultiplayer, onContinue]);

  return (
    <div className="relative w-full h-screen bg-void overflow-hidden">
      <Canvas camera={{ position: [0, 2, 7], fov: 55 }}>
        <ambientLight intensity={0.06} />
        <Stars radius={80} depth={50} count={4000} factor={4} saturation={0.5} fade speed={3} />
        <fogExp2 attach="fog" color="#0A0A0F" density={0.035} />

        <KingOnThrone />
        <VictoryRings />

        <ParticleField count={400} color="#FFD700" size={0.025} spread={9} speed={0.5} rising />
        <ParticleField count={200} color="#00F0FF" size={0.02} spread={7} speed={0.35} rising />
        <ParticleField count={150} color="#FF2E63" size={0.02} spread={6} speed={0.3} rising />

        <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.6} target={[0, 0, 0]} />
      </Canvas>

      {/* Gold screen flash */}
      <motion.div
        initial={{ opacity: 0.8 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 2 }}
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'hsl(51 100% 50% / 0.5)' }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 25%, hsl(240 20% 4% / 0.8) 100%)' }}
      />

      {/* UI */}
      <div className="absolute inset-0 flex flex-col items-center justify-between pointer-events-none">
        {/* Top */}
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1.5 }}
          className="pt-12 text-center"
        >
          <div className="energy-line w-64 mx-auto mb-6" />
          <p className="text-xs tracking-[0.5em] mb-3" style={{ color: 'hsl(var(--neon))', fontFamily: 'var(--font-body)' }}>
            ZERO-KNOWLEDGE PROOF ACCEPTED
          </p>
          <h1
            className="text-5xl md:text-8xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-display)', color: 'hsl(var(--gold))', textShadow: 'var(--glow-gold)' }}
          >
            {isMultiplayer ? (isCurrentPlayerWinner ? 'VICTORY' : 'DEFEATED') : 'NEW KING'}
          </h1>
          <h2
            className="text-4xl md:text-6xl font-bold animate-shimmer"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {isMultiplayer ? (winnerName || 'CHAMPION') : 'CROWNED'}
          </h2>
          <div className="energy-line w-64 mx-auto mt-6" />
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="panel-arcane px-10 py-6 text-center"
        >
          <p className="text-xs tracking-widest mb-4" style={{ color: 'hsl(var(--neon))', fontFamily: 'var(--font-body)' }}>
            SOVEREIGNTY VERIFIED
          </p>
          <div className="flex gap-10">
            {[
              { label: 'PROOF', value: 'VALID' },
              { label: 'RANK', value: 'KING' },
              { label: 'POWER', value: '∞' },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-gold-glow" style={{ fontFamily: 'var(--font-display)' }}>{value}</p>
                <p className="text-xs tracking-widest mt-1" style={{ color: 'hsl(var(--foreground) / 0.4)', fontFamily: 'var(--font-body)' }}>{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bottom */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 1 }}
          className="pb-12 flex flex-col items-center gap-4 pointer-events-auto"
        >
          {isMultiplayer ? (
            <>
              <button onClick={onContinue} className="btn-throne text-sm px-12 py-4">
                🏆 VIEW LEADERBOARD 🏆
              </button>
              <p className="text-xs tracking-widest" style={{ color: 'hsl(var(--gold) / 0.4)', fontFamily: 'var(--font-body)' }}>
                Auto-advancing in 15 seconds...
              </p>
            </>
          ) : (
            <>
              <button onClick={onRestart} className="btn-throne text-sm px-12 py-4">
                ⚔ CHALLENGE THE THRONE AGAIN ⚔
              </button>
              <p className="text-xs tracking-widest" style={{ color: 'hsl(var(--gold) / 0.4)', fontFamily: 'var(--font-body)' }}>
                THE VOID REMEMBERS YOUR NAME
              </p>
            </>
          )}
        </motion.div>
      </div>

      {/* Corner frames (gold) */}
      {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-20 h-20 pointer-events-none`}
          style={{
            borderColor: 'hsl(var(--gold) / 0.6)',
            borderStyle: 'solid',
            borderWidth: i === 0 ? '2px 0 0 2px' : i === 1 ? '2px 2px 0 0' : i === 2 ? '0 0 2px 2px' : '0 2px 2px 0',
          }}
        />
      ))}
    </div>
  );
}
