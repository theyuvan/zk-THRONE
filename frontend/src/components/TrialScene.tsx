import { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { Trial } from '@/types/game';
import ParticleField from '@/components/effects/ParticleField';
import * as THREE from 'three';

// New Trial Components
import CipherGridTrial from '@/components/trials/CipherGridTrial';
import HiddenSigilTrial from '@/components/trials/HiddenSigilTrial';
import LogicLabyrinthTrial from '@/components/trials/LogicLabyrinthTrial';
import PatternOracleTrial from '@/components/trials/PatternOracleTrial';
import MemoryOfCrownTrial from '@/components/trials/MemoryOfCrownTrial';
import TrapDetectionTrial from '@/components/trials/TrapDetectionTrial';
import ThronebreakerProtocolTrial from '@/components/trials/ThronebreakerProtocolTrial';

// Trial-specific 3D objects
function ColorSigilScene() {
  const colors = ['#FFD700', '#FF2E63', '#00F0FF', '#8B5CF6', '#00FF88'];
  return (
    <group>
      {colors.map((color, i) => {
        const angle = (i / colors.length) * Math.PI * 2;
        const ref = useRef<THREE.Mesh>(null);
        return (
          <Crystal key={i} color={color} position={[Math.cos(angle) * 2, 0, Math.sin(angle) * 2]} index={i} />
        );
      })}
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={3} />
      </mesh>
      <pointLight color="#FFD700" intensity={3} distance={5} />
    </group>
  );
}

function Crystal({ color, position, index }: { color: string; position: [number, number, number]; index: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime() + index;
    ref.current.rotation.y = t * 0.5;
    ref.current.position.y = Math.sin(t * 0.8) * 0.2;
  });
  return (
    <mesh ref={ref} position={position}>
      <octahedronGeometry args={[0.35, 0]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} transparent opacity={0.85} />
    </mesh>
  );
}

function LogicMazeScene() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
  });
  const walls = [
    [[-1, 0, 0], [0.1, 1, 2]], [[1, 0, 0], [0.1, 1, 2]],
    [[0, 0, -1], [2, 1, 0.1]], [[0, 0, 1], [2, 1, 0.1]],
    [[-0.5, 0, 0.5], [0.1, 1, 1]], [[0.5, 0, -0.5], [0.1, 1, 1]],
  ] as const;
  return (
    <group ref={groupRef}>
      {walls.map(([pos, scale], i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <boxGeometry args={scale as [number, number, number]} />
          <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={1} transparent opacity={0.6} wireframe />
        </mesh>
      ))}
      <pointLight color="#00F0FF" intensity={2} distance={5} />
    </group>
  );
}

function PatternOracleScene() {
  const cards = Array.from({ length: 6 });
  return (
    <group>
      {cards.map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const x = Math.cos(angle) * 1.8;
        const z = Math.sin(angle) * 1.8;
        return <FlipCard key={i} position={[x, 0, z]} index={i} />;
      })}
      <pointLight color="#8B5CF6" intensity={2} distance={6} />
    </group>
  );
}

function FlipCard({ position, index }: { position: [number, number, number]; index: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.rotation.y = Math.sin(t * 0.5 + index * 1.2) * Math.PI;
  });
  return (
    <mesh ref={ref} position={position}>
      <boxGeometry args={[0.5, 0.7, 0.02]} />
      <meshStandardMaterial color="#8B5CF6" emissive="#8B5CF6" emissiveIntensity={1.5} side={THREE.DoubleSide} />
    </mesh>
  );
}

function ClockScene() {
  const handRef = useRef<THREE.Mesh>(null);
  const minuteRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (handRef.current) handRef.current.rotation.z = -t * 0.2;
    if (minuteRef.current) minuteRef.current.rotation.z = -t * 0.8;
  });
  return (
    <group>
      <mesh>
        <torusGeometry args={[1.5, 0.06, 8, 64]} />
        <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={1.5} />
      </mesh>
      {/* Hour hand */}
      <mesh ref={handRef} position={[0, 0.4, 0]}>
        <boxGeometry args={[0.06, 0.8, 0.05]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={2} />
      </mesh>
      {/* Minute hand */}
      <mesh ref={minuteRef} position={[0, 0.6, 0]}>
        <boxGeometry args={[0.04, 1.2, 0.05]} />
        <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={2} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={3} />
      </mesh>
      <pointLight color="#00F0FF" intensity={2} distance={5} />
    </group>
  );
}

function FinalOathScene() {
  const chainRefs = Array.from({ length: 4 }, () => useRef<THREE.Mesh>(null));
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    chainRefs.forEach((ref, i) => {
      if (ref.current) {
        ref.current.rotation.z = Math.sin(t * 1.5 + i) * 0.5;
        ref.current.position.y = Math.sin(t + i * 0.8) * 0.2;
      }
    });
  });
  return (
    <group>
      {/* Throne fragment */}
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[0.8, 0.2, 0.8]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={1} metalness={1} />
      </mesh>
      {/* Energy chains */}
      {chainRefs.map((ref, i) => {
        const angle = (i / 4) * Math.PI * 2;
        return (
          <mesh key={i} ref={ref} position={[Math.cos(angle) * 1.2, 0, Math.sin(angle) * 1.2]}>
            <torusGeometry args={[0.3, 0.04, 8, 16]} />
            <meshStandardMaterial color="#FF2E63" emissive="#FF2E63" emissiveIntensity={2} />
          </mesh>
        );
      })}
      <pointLight color="#FF2E63" intensity={2} distance={5} />
    </group>
  );
}

function DefaultTrialScene() {
  return (
    <group>
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <RuneSymbol key={i} position={[Math.cos(angle) * 2, Math.sin(i * 0.5) * 0.5, Math.sin(angle) * 2]} index={i} />
        );
      })}
      <pointLight color="#FFD700" intensity={2} distance={6} />
    </group>
  );
}

function RuneSymbol({ position, index }: { position: [number, number, number]; index: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.getElapsedTime() * 0.4 + index;
    ref.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 0.6 + index) * 0.2;
  });
  return (
    <group ref={ref} position={position}>
      <mesh>
        <ringGeometry args={[0.15, 0.22, 6]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

const trialScenes: Record<string, () => JSX.Element> = {
  colorSigil: ColorSigilScene,
  logicLabyrinth: LogicMazeScene,
  patternOracle: PatternOracleScene,
  timekeeper: ClockScene,
  finalOath: FinalOathScene,
};

interface TrialSceneProps {
  trial: Trial;
  trialNumber: number;
  totalTrials: number;
  onComplete: () => void;
  onBack: () => void;
}

// Simple trial mini-games
function ColorSigilGame({ onSolve }: { onSolve: () => void }) {
  const sequence = ['🔴', '🟡', '🔵', '🟣', '🟢'];
  const [selected, setSelected] = useState<number[]>([]);
  const answer = [0, 2, 4];

  const handleClick = (i: number) => {
    const next = [...selected, i];
    setSelected(next);
    if (next.length === 3) {
      const correct = answer.every((a, idx) => a === next[idx]);
      if (correct) {
        setTimeout(onSolve, 500);
      } else {
        setTimeout(() => setSelected([]), 800);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm tracking-widest" style={{ color: 'hsl(var(--neon))', fontFamily: 'var(--font-body)' }}>
        SELECT: RED → BLUE → GREEN
      </p>
      <div className="flex gap-4">
        {sequence.map((emoji, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            className="text-3xl p-3 rounded transition-all duration-200"
            style={{
              background: selected.includes(i) ? 'hsl(var(--gold) / 0.2)' : 'hsl(var(--card))',
              border: `1px solid ${selected.includes(i) ? 'hsl(var(--gold))' : 'hsl(var(--border))'}`,
              transform: selected.includes(i) ? 'scale(1.2)' : 'scale(1)',
              boxShadow: selected.includes(i) ? 'var(--glow-gold)' : 'none',
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
      <p className="text-xs" style={{ color: 'hsl(var(--foreground) / 0.4)', fontFamily: 'var(--font-body)' }}>
        {selected.length}/3 selected
      </p>
    </div>
  );
}

function LogicGame({ onSolve }: { onSolve: () => void }) {
  const [path, setPath] = useState<number[]>([]);
  const correctPath = [0, 2, 5, 7];
  const grid = Array.from({ length: 9 }, (_, i) => i);

  const handleStep = (i: number) => {
    const next = [...path, i];
    setPath(next);
    if (next.length === 4) {
      const correct = correctPath.every((v, idx) => v === next[idx]);
      if (correct) setTimeout(onSolve, 500);
      else setTimeout(() => setPath([]), 800);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm tracking-widest" style={{ color: 'hsl(var(--neon))', fontFamily: 'var(--font-body)' }}>
        FIND THE PATH: 0 → 2 → 5 → 7
      </p>
      <div className="grid grid-cols-3 gap-2">
        {grid.map((n) => (
          <button
            key={n}
            onClick={() => handleStep(n)}
            className="w-14 h-14 text-lg font-bold transition-all duration-200"
            style={{
              background: path.includes(n) ? 'hsl(var(--neon) / 0.2)' : 'hsl(var(--card))',
              border: `1px solid ${path.includes(n) ? 'hsl(var(--neon))' : 'hsl(var(--border))'}`,
              color: path.includes(n) ? 'hsl(var(--neon))' : 'hsl(var(--foreground))',
              fontFamily: 'var(--font-display)',
              boxShadow: path.includes(n) ? 'var(--glow-neon)' : 'none',
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function PatternGame({ onSolve }: { onSolve: () => void }) {
  const sequence = [3, 6, 9, 12];
  const [answer, setAnswer] = useState('');

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm tracking-widest" style={{ color: 'hsl(var(--neon))', fontFamily: 'var(--font-body)' }}>
        COMPLETE THE SEQUENCE
      </p>
      <div className="flex gap-3 items-center">
        {sequence.map((n, i) => (
          <div key={i} className="text-xl font-bold text-gold-glow" style={{ fontFamily: 'var(--font-display)' }}>
            {n}
          </div>
        ))}
        <div style={{ color: 'hsl(var(--gold))' }}>→</div>
        <input
          type="number"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-20 text-center text-xl font-bold bg-card border-gold border rounded"
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--gold) / 0.5)',
            color: 'hsl(var(--gold))',
            fontFamily: 'var(--font-display)',
            padding: '0.5rem',
          }}
          placeholder="?"
        />
      </div>
      <button
        onClick={() => { if (parseInt(answer) === 15) onSolve(); }}
        className="btn-neon text-xs px-6 py-2"
      >
        SUBMIT
      </button>
    </div>
  );
}

function GenericGame({ onSolve, trial }: { onSolve: () => void; trial: Trial }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-sm tracking-widest text-center max-w-sm" style={{ color: 'hsl(var(--neon))', fontFamily: 'var(--font-body)' }}>
        {trial.description.toUpperCase()}
      </p>
      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="btn-neon text-xs px-8 py-3"
        >
          REVEAL THE TRIAL
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div
            className="text-6xl animate-rune-flicker"
            style={{ filter: 'drop-shadow(0 0 20px hsl(var(--gold)))' }}
          >
            ᚱ
          </div>
          <p className="text-xs" style={{ color: 'hsl(var(--gold) / 0.6)', fontFamily: 'var(--font-body)' }}>THE RUNE SPEAKS TO YOU</p>
          <button onClick={onSolve} className="btn-throne text-xs px-8 py-3">
            I ACCEPT THE OATH
          </button>
        </motion.div>
      )}
    </div>
  );
}

export default function TrialScene({ trial, trialNumber, totalTrials, onComplete, onBack }: TrialSceneProps) {
  const [completed, setCompleted] = useState(false);
  const SceneComponent = trialScenes[trial.id] || DefaultTrialScene;

  const handleTrialComplete = () => {
    setCompleted(true);
  };

  const GameComponent = (() => {
    switch (trial.id) {
      case 'colorSigil':
        return <CipherGridTrial onComplete={handleTrialComplete} />;
      case 'hiddenSigil':
        return <HiddenSigilTrial onComplete={handleTrialComplete} />;
      case 'logicLabyrinth':
        return <LogicLabyrinthTrial onComplete={handleTrialComplete} />;
      case 'patternOracle':
        return <PatternOracleTrial onComplete={handleTrialComplete} />;
      case 'memoryOfCrown':
        return <MemoryOfCrownTrial onComplete={handleTrialComplete} />;
      case 'timekeeper':
        return <TrapDetectionTrial onComplete={handleTrialComplete} />;
      case 'finalOath':
        return <ThronebreakerProtocolTrial onComplete={handleTrialComplete} />;
      default:
        return <GenericGame onSolve={() => setCompleted(true)} trial={trial} />;
    }
  })();

  return (
    <div className="relative w-full h-screen bg-void overflow-hidden">
      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 2, 5], fov: 55 }}>
        <ambientLight intensity={0.05} />
        <pointLight position={[0, 5, 0]} color="#FFD700" intensity={0.3} distance={10} />
        <Stars radius={60} depth={40} count={1500} factor={3} saturation={0} fade speed={0.3} />
        <fogExp2 attach="fog" color="#0A0A0F" density={0.06} />

        {/* Energy grid floor */}
        <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[12, 12, 12, 12]} />
          <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={0.5} wireframe transparent opacity={0.15} />
        </mesh>

        <SceneComponent />
        <ParticleField count={80} color={trial.portalColor} size={0.02} spread={5} speed={0.1} />

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.8}
          autoRotate
          autoRotateSpeed={0.5}
          target={[0, 0, 0]}
        />
      </Canvas>

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 25%, hsl(240 20% 4% / 0.85) 100%)' }}
      />

      {/* UI */}
      <div className="absolute inset-0 flex flex-col items-center justify-between pointer-events-none">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-6 px-6 w-full flex items-center justify-between"
        >
          <button
            onClick={onBack}
            className="pointer-events-auto text-xs tracking-widest"
            style={{ color: 'hsl(var(--gold) / 0.5)', fontFamily: 'var(--font-body)' }}
          >
            ← RETREAT
          </button>

          <div className="text-center">
            <p className="text-xs tracking-[0.3em]" style={{ color: 'hsl(var(--neon))', fontFamily: 'var(--font-body)' }}>
              TRIAL {trialNumber} / {totalTrials}
            </p>
            <h2 className="text-xl font-bold text-gold-glow" style={{ fontFamily: 'var(--font-display)' }}>
              {trial.name.toUpperCase()}
            </h2>
          </div>

          {/* Progress dots */}
          <div className="flex gap-1.5">
            {Array.from({ length: totalTrials }).map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  background: i < trialNumber - 1 ? 'hsl(var(--gold))' : i === trialNumber - 1 ? 'hsl(var(--neon))' : 'hsl(var(--border))',
                  boxShadow: i === trialNumber - 1 ? 'var(--glow-neon)' : 'none',
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Spacer */}
        <div />

        {/* Game UI */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pb-8 px-4 w-full h-full pointer-events-auto absolute inset-0"
        >
          <AnimatePresence mode="wait">
            {!completed ? (
              <motion.div
                key="game"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                {GameComponent}
              </motion.div>
            ) : (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="panel-arcane p-8 flex flex-col items-center gap-4 text-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              >
                <div className="text-5xl animate-pulse-gold">⚡</div>
                <h3 className="text-2xl font-bold text-gold-glow" style={{ fontFamily: 'var(--font-display)' }}>
                  TRIAL CONQUERED
                </h3>
                <p className="text-sm" style={{ color: 'hsl(var(--neon))', fontFamily: 'var(--font-body)' }}>
                  The throne recognizes your power
                </p>
                <button onClick={onComplete} className="btn-throne text-sm px-10 py-4">
                  CONTINUE ⚔
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Corner frames */}
      {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
        <div
          key={i}
          className={`absolute ${pos} w-12 h-12 pointer-events-none`}
          style={{
            borderColor: `${trial.portalColor}60`,
            borderStyle: 'solid',
            borderWidth: i === 0 ? '2px 0 0 2px' : i === 1 ? '2px 2px 0 0' : i === 2 ? '0 0 2px 2px' : '0 2px 2px 0',
          }}
        />
      ))}
    </div>
  );
}
