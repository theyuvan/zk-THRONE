import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import ParticleField from '@/components/effects/ParticleField';

function EnergyBeam() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.scale.x = 0.9 + Math.sin(t * 3) * 0.1;
    (ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.5 + Math.sin(t * 4) * 0.5;
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.08, 0.08, 6, 8]} />
      <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={2} transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}

function FloatingSymbols() {
  const symbols = Array.from({ length: 12 });
  return (
    <>
      {symbols.map((_, i) => (
        <FloatingSymbol key={i} index={i} />
      ))}
    </>
  );
}

function FloatingSymbol({ index }: { index: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    const angle = (index / 12) * Math.PI * 2 + t * 0.3;
    const radius = 2 + Math.sin(t * 0.4 + index) * 0.5;
    ref.current.position.x = Math.cos(angle) * radius;
    ref.current.position.y = Math.sin(t * 0.5 + index * 0.8) * 1.5;
    ref.current.position.z = Math.sin(angle) * radius;
    ref.current.rotation.y = t * 0.5;
  });
  return (
    <mesh ref={ref}>
      <ringGeometry args={[0.08, 0.14, 6]} />
      <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={3} side={THREE.DoubleSide} transparent opacity={0.8} />
    </mesh>
  );
}

function ProgressRing({ progress }: { progress: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 1.5 + Math.random() * 0.3;
  });
  // Simple torus to represent progress ring in 3D
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[1.2, 0.05, 8, 64, (progress / 100) * Math.PI * 2]} />
      <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={2} />
    </mesh>
  );
}

interface ProofSceneProps {
  onComplete: () => void;
}

export default function ProofScene({ onComplete }: ProofSceneProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);

  const phases = [
    'INITIALIZING ZK CIRCUIT...',
    'ENCODING WITNESS DATA...',
    'GENERATING PROOF KEYS...',
    'COMPUTING GROTH16 PROOF...',
    'VERIFYING CONSTRAINTS...',
    'PROOF VERIFIED ✓',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = p + 1.2;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 1500);
          return 100;
        }
        return next;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    setPhase(Math.min(Math.floor((progress / 100) * phases.length), phases.length - 1));
  }, [progress]);

  return (
    <div className="relative w-full h-screen bg-void overflow-hidden">
      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 2, 6], fov: 55 }}>
        <ambientLight intensity={0.03} />
        <pointLight position={[0, 5, 0]} color="#00F0FF" intensity={0.8} distance={10} />
        <pointLight position={[0, -2, 0]} color="#FFD700" intensity={0.5} distance={8} />

        <Stars radius={80} depth={50} count={2000} factor={3} saturation={0} fade speed={1} />
        <fogExp2 attach="fog" color="#0A0A0F" density={0.05} />

        {/* Throne silhouette in back */}
        <mesh position={[0, -0.5, -3]} scale={[0.8, 0.8, 0.8]}>
          <boxGeometry args={[1.2, 2, 0.5]} />
          <meshStandardMaterial color="#0d0720" emissive="#2A0E5C" emissiveIntensity={0.3} transparent opacity={0.5} />
        </mesh>

        <EnergyBeam />
        <FloatingSymbols />
        <ProgressRing progress={progress} />

        <ParticleField count={150} color="#00F0FF" size={0.02} spread={5} speed={0.3} rising />
        <ParticleField count={80} color="#FFD700" size={0.015} spread={4} speed={0.2} rising />

        <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.8} target={[0, 0, 0]} />
      </Canvas>

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 20%, hsl(240 20% 4% / 0.9) 100%)' }}
      />

      {/* UI */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-xs tracking-[0.4em] mb-3" style={{ color: 'hsl(var(--neon))', fontFamily: 'var(--font-body)' }}>
            CRYPTOGRAPHIC VALIDATION
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-gold-glow" style={{ fontFamily: 'var(--font-display)' }}>
            GENERATING PROOF
          </h2>
        </motion.div>

        {/* Circular progress */}
        <div className="relative w-48 h-48">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
            {/* Progress circle */}
            <circle
              cx="50" cy="50" r="44" fill="none"
              stroke="hsl(var(--gold))"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
              style={{
                transition: 'stroke-dashoffset 0.1s linear',
                filter: 'drop-shadow(0 0 8px hsl(51 100% 50%))',
              }}
            />
            {/* Inner neon ring */}
            <circle
              cx="50" cy="50" r="36" fill="none"
              stroke="hsl(var(--neon))"
              strokeWidth="1"
              strokeDasharray="3 6"
              opacity="0.5"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gold-glow" style={{ fontFamily: 'var(--font-display)' }}>
              {Math.floor(progress)}%
            </span>
            <span className="text-xs" style={{ color: 'hsl(var(--neon))', fontFamily: 'var(--font-body)' }}>
              COMPLETE
            </span>
          </div>
        </div>

        {/* Phase text */}
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p
            className="text-sm tracking-widest"
            style={{
              color: progress === 100 ? 'hsl(var(--gold))' : 'hsl(var(--neon))',
              fontFamily: 'var(--font-body)',
              textShadow: progress === 100 ? 'var(--glow-gold)' : 'var(--glow-neon)',
            }}
          >
            {phases[phase]}
          </p>
        </motion.div>

        {/* ZK details */}
        <div className="panel-arcane px-8 py-4 text-xs font-mono space-y-1 max-w-sm w-full mx-4" style={{ color: 'hsl(var(--foreground) / 0.4)' }}>
          <p><span style={{ color: 'hsl(var(--neon))' }}>protocol:</span> groth16</p>
          <p><span style={{ color: 'hsl(var(--neon))' }}>curve:</span> bn254</p>
          <p><span style={{ color: 'hsl(var(--neon))' }}>constraints:</span> 12,847</p>
          <p><span style={{ color: 'hsl(var(--gold))' }}>status:</span> {progress === 100 ? 'VERIFIED ✓' : 'COMPUTING...'}</p>
        </div>
      </div>

      {/* Corner frames */}
      {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-16 h-16 pointer-events-none`}
          style={{
            borderColor: 'hsl(var(--neon) / 0.4)',
            borderStyle: 'solid',
            borderWidth: i === 0 ? '2px 0 0 2px' : i === 1 ? '2px 2px 0 0' : i === 2 ? '0 0 2px 2px' : '0 2px 2px 0',
          }}
        />
      ))}
    </div>
  );
}
