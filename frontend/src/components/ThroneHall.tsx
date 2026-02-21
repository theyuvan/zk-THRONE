import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Throne, FloatingCrown, ArenaPlatform } from '@/components/3d/ThroneObjects';
import ParticleField from '@/components/effects/ParticleField';
import { TRIALS } from '@/types/game';
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWallet } from '@/hooks/useWallet';
import { useGame } from '@/hooks/useGame';
import { walletService } from '@/services/walletService';

function FloatingPortalMini({ index }: { index: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    const angle = (index / 7) * Math.PI * 2 + t * 0.1;
    ref.current.position.x = Math.cos(angle) * 5;
    ref.current.position.z = Math.sin(angle) * 5;
    ref.current.position.y = Math.sin(t * 0.5 + index) * 0.3;
    ref.current.rotation.z = t * 0.3 + index;
  });

  const color = TRIALS[index]?.portalColor || '#FFD700';
  return (
    <mesh ref={ref}>
      <torusGeometry args={[0.4, 0.04, 8, 32]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
    </mesh>
  );
}

function ThroneScene() {
  return (
    <>
      <ambientLight intensity={0.05} />
      <directionalLight position={[0, 10, 0]} intensity={0.1} color="#2A0E5C" />
      <pointLight position={[0, 5, 0]} color="#FFD700" intensity={0.5} distance={10} />
      <pointLight position={[-3, 2, 3]} color="#00F0FF" intensity={0.3} distance={8} />
      <pointLight position={[3, 2, -3]} color="#2A0E5C" intensity={0.4} distance={8} />

      <Stars radius={80} depth={50} count={3000} factor={3} saturation={0.5} fade speed={0.5} />
      <fogExp2 attach="fog" color="#0A0A0F" density={0.05} />

      <Throne position={[0, 0, 0]} />
      <FloatingCrown position={[0, 1.8, 0]} />
      <ArenaPlatform />

      {Array.from({ length: 7 }).map((_, i) => (
        <FloatingPortalMini key={i} index={i} />
      ))}

      <ParticleField count={200} color="#FFD700" size={0.025} spread={8} speed={0.15} />
      <ParticleField count={100} color="#00F0FF" size={0.02} spread={6} speed={0.1} />

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.8}
        autoRotate
        autoRotateSpeed={0.3}
        target={[0, 0, 0]}
      />
    </>
  );
}

interface ThroneHallProps {
  onEnter: () => void;
}

export default function ThroneHall({ onEnter }: ThroneHallProps) {
  const { publicKey, isConnected, isConnecting, connect, disconnect } = useWallet();
  const { progress, king, isKing, backendHealthy } = useGame();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleResetAllData = async () => {
    if (!showResetConfirm) {
      setShowResetConfirm(true);
      return;
    }

    try {
      await walletService.clearAllData();
      setShowResetConfirm(false);
      window.location.reload(); // Refresh to start fresh
    } catch (error) {
      console.error('Failed to reset data:', error);
      alert('Failed to reset data. Please try again.');
    }
  };

  return (
    <div className="relative w-full h-screen bg-void overflow-hidden">
      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 2, 8], fov: 55 }} className="absolute inset-0">
        <ThroneScene />
      </Canvas>

      {/* Overlay vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, hsl(240 20% 4% / 0.7) 100%)',
        }}
      />

      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
        }}
      />

      {/* Wallet Button - Top Right Corner */}
      <div className="absolute top-6 right-6 z-50 pointer-events-auto flex flex-col gap-2">
        {!isConnected ? (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            onClick={connect}
            disabled={isConnecting}
            className="px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300"
            style={{ 
              background: 'linear-gradient(135deg, hsl(var(--gold) / 0.2), hsl(var(--neon) / 0.2))',
              border: '1px solid hsl(var(--gold) / 0.5)',
              color: 'hsl(var(--gold))',
            }}
          >
            {isConnecting ? '🔌 Connecting...' : '🔌 Connect Wallet'}
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex items-center gap-2"
          >
            <div 
              className="px-4 py-2 rounded-lg text-sm font-mono"
              style={{ 
                background: 'hsl(var(--gold) / 0.2)',
                border: '1px solid hsl(var(--gold) / 0.5)',
                color: 'hsl(var(--gold))',
              }}
            >
              {publicKey?.substring(0, 6)}...{publicKey?.substring(publicKey.length - 4)}
            </div>
            <button
              onClick={disconnect}
              className="px-3 py-2 rounded-lg text-sm font-bold transition-all duration-300 hover:scale-105"
              style={{ 
                background: 'hsl(var(--void) / 0.8)',
                border: '1px solid hsl(var(--gold) / 0.3)',
                color: 'hsl(var(--gold) / 0.7)',
              }}
              title="Disconnect Wallet"
            >
              ✕
            </button>
          </motion.div>
        )}

        {/* Reset Data Button */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          onClick={handleResetAllData}
          onMouseLeave={() => setShowResetConfirm(false)}
          className="px-3 py-2 rounded-lg text-xs font-bold transition-all duration-300 hover:scale-105"
          style={{ 
            background: showResetConfirm ? 'hsl(0 70% 50% / 0.3)' : 'hsl(var(--void) / 0.6)',
            border: showResetConfirm ? '1px solid hsl(0 70% 50% / 0.7)' : '1px solid hsl(var(--gold) / 0.2)',
            color: showResetConfirm ? 'hsl(0 70% 70%)' : 'hsl(var(--gold) / 0.5)',
          }}
          title="Clear all user data and start fresh"
        >
          {showResetConfirm ? '⚠️ Click Again to Confirm' : '🗑️ Reset Data'}
        </motion.button>
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-between pointer-events-none">
        {/* Top header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="pt-6 text-center"
        >
          <div className="energy-line w-48 mx-auto mb-3" />
          <p className="text-xs tracking-[0.4em] font-body" style={{ color: 'hsl(var(--neon))', fontFamily: 'var(--font-body)' }}>
            ZERO-KNOWLEDGE SOVEREIGNTY ARENA
          </p>
          <div className="energy-line w-48 mx-auto mt-3" />
        </motion.div>

        {/* Center title - moved higher */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.8 }}
          className="text-center" style={{ marginTop: '-17rem' }}
        >
          <h1
            className="text-7xl md:text-9xl font-bold mb-2 animate-shimmer"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            zk-Throne
          </h1>
          <p className="text-lg tracking-[0.3em]" style={{ color: 'hsl(var(--gold) / 0.6)', fontFamily: 'var(--font-body)' }}>
            PROVE YOUR SOVEREIGNTY
          </p>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="pb-16 flex flex-col items-center gap-6 pointer-events-auto"
        >
          {/* Backend Status & Info */}
          <div className="flex flex-col items-center gap-4 mb-4">
            {/* Backend Status Indicator */}
            <div className="flex items-center gap-2 text-xs">
              <div 
                className={`w-2 h-2 rounded-full ${backendHealthy ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}
                style={{ boxShadow: backendHealthy ? '0 0 10px rgba(74, 222, 128, 0.5)' : '0 0 10px rgba(248, 113, 113, 0.5)' }}
              />
              <span style={{ color: backendHealthy ? 'hsl(var(--neon))' : 'hsl(0 70% 60%)' }}>
                {backendHealthy ? 'ZK BACKEND ONLINE' : 'ZK BACKEND OFFLINE'}
              </span>
            </div>
            
            {/* Show progress and king status if connected */}
            {isConnected && (
              <div className="flex flex-col items-center gap-1 text-xs" style={{ color: 'hsl(var(--gold) / 0.8)' }}>
                <div className="flex items-center gap-4">
                  <span>📊 CAREER PROGRESS: {progress}/7</span>
                  {isKing && <span className="animate-pulse">👑 REIGNING KING</span>}
                </div>
                <span className="text-[10px]" style={{ color: 'hsl(var(--gold) / 0.5)' }}>
                  (Total trials completed on-chain)
                </span>
              </div>
            )}
          </div>

          {/* Enter Button */}
          <button
            onClick={onEnter}
            className="btn-throne text-base px-12 py-5 animate-pulse-gold"
          >
            ⚔ ENTER THE THRONE ⚔
          </button>

          {/* Corner decorations */}
          <div className="flex items-center gap-4">
            <div className="h-px w-16" style={{ background: 'hsl(var(--gold) / 0.4)' }} />
            <div className="text-xs tracking-[0.3em]" style={{ color: 'hsl(var(--gold) / 0.5)', fontFamily: 'var(--font-body)' }}>
              CLAIM YOUR CROWN
            </div>
            <div className="h-px w-16" style={{ background: 'hsl(var(--gold) / 0.4)' }} />
          </div>
        </motion.div>
      </div>

      {/* Corner frames */}
      {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
        <div
          key={i}
          className={`absolute ${pos} w-16 h-16 pointer-events-none`}
          style={{
            borderColor: 'hsl(var(--gold) / 0.4)',
            borderStyle: 'solid',
            borderWidth: i === 0 ? '2px 0 0 2px' : i === 1 ? '2px 2px 0 0' : i === 2 ? '0 0 2px 2px' : '0 2px 2px 0',
          }}
        />
      ))}
    </div>
  );
}
