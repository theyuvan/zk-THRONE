import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { Throne, FloatingCrown, ArenaPlatform } from '@/components/3d/ThroneObjects';
import ParticleField from '@/components/effects/ParticleField';

function EnergyExplosion() {
  const rings = Array.from({ length: 5 });
  return (
    <>
      {rings.map((_, i) => (
        <ExpandingRing key={i} delay={i * 0.3} />
      ))}
    </>
  );
}

function ExpandingRing({ delay }: { delay: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const startTime = useRef<number | null>(null);

  useFrame((state) => {
    if (!ref.current) return;
    if (startTime.current === null) startTime.current = state.clock.getElapsedTime() + delay;
    const elapsed = (state.clock.getElapsedTime() - startTime.current) % 3;
    const t = Math.max(0, elapsed);
    ref.current.scale.setScalar(1 + t * 2);
    (ref.current.material as THREE.MeshStandardMaterial).opacity = Math.max(0, 1 - t / 2);
  });

  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[1, 0.04, 8, 64]} />
      <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={2} transparent opacity={1} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}

function ThroneActivated() {
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    if (!lightRef.current) return;
    const t = state.clock.getElapsedTime();
    lightRef.current.intensity = 4 + Math.sin(t * 3) * 2;
  });
  return (
    <>
      <Throne position={[0, 0, 0]} />
      <FloatingCrown position={[0, 2.2, 0]} />
      <pointLight ref={lightRef} color="#FFD700" intensity={5} distance={8} position={[0, 1, 1]} />
      <pointLight color="#00F0FF" intensity={2} distance={6} position={[-2, 2, 2]} />
      <pointLight color="#2A0E5C" intensity={3} distance={5} position={[2, 0, -2]} />
    </>
  );
}

interface ThroneClaimProps {
  onComplete: () => void;
}

export default function ThroneClaim({ onComplete }: ThroneClaimProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 6000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="relative w-full h-screen bg-void overflow-hidden">
      <Canvas camera={{ position: [0, 3, 8], fov: 55 }}>
        <ambientLight intensity={0.08} />
        <Stars radius={80} depth={50} count={3000} factor={4} saturation={0.3} fade speed={2} />
        <fogExp2 attach="fog" color="#0A0A0F" density={0.04} />

        <ThroneActivated />
        <ArenaPlatform />
        <EnergyExplosion />

        <ParticleField count={300} color="#FFD700" size={0.03} spread={8} speed={0.4} rising />
        <ParticleField count={200} color="#00F0FF" size={0.02} spread={6} speed={0.3} rising />
        <ParticleField count={100} color="#FF2E63" size={0.025} spread={5} speed={0.25} rising />

        <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={1.5} target={[0, 0.5, 0]} />
      </Canvas>

      {/* Gold light overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.4, 0, 0.2, 0] }}
        transition={{ duration: 3, times: [0, 0.2, 0.5, 0.7, 1] }}
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, hsl(51 100% 50% / 0.3) 0%, transparent 70%)' }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 30%, hsl(240 20% 4% / 0.7) 100%)' }}
      />

      {/* UI */}
      <div className="absolute inset-0 flex flex-col items-center justify-between pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, type: 'spring', stiffness: 100 }}
          className="pt-16 text-center"
        >
          <p className="text-xs tracking-[0.5em] mb-4" style={{ color: 'hsl(var(--neon))', fontFamily: 'var(--font-body)' }}>
            PROOF ACCEPTED BY THE VOID
          </p>
          <h1
            className="text-5xl md:text-7xl font-bold text-gold-glow"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            THRONE CLAIMED
          </h1>
          <div className="energy-line w-64 mx-auto mt-4" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="pb-16 text-center"
        >
          <p className="text-sm tracking-widest mb-6" style={{ color: 'hsl(var(--gold) / 0.7)', fontFamily: 'var(--font-body)' }}>
            THE CROWN DESCENDS UPON THE WORTHY
          </p>
          <div className="flex items-center gap-4 justify-center">
            <div className="h-px w-24" style={{ background: 'hsl(var(--gold) / 0.4)' }} />
            <span className="text-3xl animate-float">👑</span>
            <div className="h-px w-24" style={{ background: 'hsl(var(--gold) / 0.4)' }} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
