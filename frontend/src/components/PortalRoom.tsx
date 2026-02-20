import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { motion } from 'framer-motion';
import { PortalRoomEnvironment } from '@/components/3d/PortalObjects';
import ParticleField from '@/components/effects/ParticleField';
import { TRIALS, Trial, TrialMode } from '@/types/game';
import { ArenaPlatform } from '@/components/3d/ThroneObjects';
import TrialInfoDialog from '@/components/TrialInfoDialog';
import MultiplayerSelection from '@/components/MultiplayerSelection';
import TrialSelection from '@/components/TrialSelection';
import RoomLobby from '@/components/RoomLobby';

interface PortalRoomProps {
  onSelectMode: (mode: TrialMode, trials: Trial[]) => void;
  onBack: () => void;
}

export default function PortalRoom({ onSelectMode, onBack }: PortalRoomProps) {
  const [selectedMode, setSelectedMode] = useState<TrialMode | null>(null);
  const [hoveredPortal, setHoveredPortal] = useState<Trial | null>(null);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [showMultiplayerDialog, setShowMultiplayerDialog] = useState(false);
  const [showTrialSelection, setShowTrialSelection] = useState(false);
  const [showRoomLobby, setShowRoomLobby] = useState(false);
  const [pendingMode, setPendingMode] = useState<TrialMode | null>(null);

  const modes: { count: TrialMode; label: string; subtitle: string; color: string }[] = [
    { count: 1, label: '1 TRIAL', subtitle: 'Initiate Path', color: 'hsl(var(--neon))' },
    { count: 3, label: '3 TRIALS', subtitle: 'Champion Path', color: 'hsl(var(--gold))' },
    { count: 5, label: "5 TRIALS — KING'S PATH", subtitle: 'Ultimate Sovereignty', color: 'hsl(var(--crimson))' },
  ];

  const handleModeClick = (mode: TrialMode) => {
    setSelectedMode(mode);
    setPendingMode(mode);
    setShowInfoDialog(true);
  };

  const handleInfoContinue = () => {
    setShowInfoDialog(false);
    setShowMultiplayerDialog(true);
  };

  const handleShowTrialSelection = () => {
    setShowMultiplayerDialog(false);
    setShowTrialSelection(true);
  };

  const handleShowRoomLobby = () => {
    setShowMultiplayerDialog(false);
    setShowRoomLobby(true);
  };

  const handleTrialSelectionConfirm = (selectedTrials: Trial[]) => {
    setShowTrialSelection(false);
    if (pendingMode) {
      onSelectMode(pendingMode, selectedTrials);
    }
  };

  const handleJoinFromLobby = (roomCode: string, requiresCode: boolean) => {
    setShowRoomLobby(false);
    if (pendingMode) {
      console.log(`Joining room: ${roomCode}, Required code: ${requiresCode}`);
      // For joining, use the default trial order (or fetch from server)
      const selected = TRIALS.slice(0, pendingMode);
      onSelectMode(pendingMode, selected);
    }
  };

  const handleJoin = (roomCode: string) => {
    setShowMultiplayerDialog(false);
    if (pendingMode) {
      // TODO: Implement room joining logic with roomCode
      console.log(`Joining room: ${roomCode}`);
      // For joining, use the default trial order
      const selected = TRIALS.slice(0, pendingMode);
      onSelectMode(pendingMode, selected);
    }
  };

  const handleBegin = () => {
    if (!selectedMode) return;
    setPendingMode(selectedMode);
    setShowInfoDialog(true);
  };

  return (
    <div className="relative w-full h-screen bg-void overflow-hidden">
      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 3, 7], fov: 60 }}>
        <ambientLight intensity={0.05} />
        <pointLight position={[0, 5, 0]} color="#FFD700" intensity={0.5} distance={12} />
        <pointLight position={[-4, 2, 4]} color="#00F0FF" intensity={0.4} distance={10} />
        <pointLight position={[4, 2, -4]} color="#8B5CF6" intensity={0.4} distance={10} />

        <Stars radius={80} depth={50} count={2000} factor={3} saturation={0.5} fade speed={0.3} />
        <fogExp2 attach="fog" color="#0A0A0F" density={0.05} />

        <PortalRoomEnvironment
          trials={TRIALS}
          onPortalClick={setHoveredPortal}
          activatedPortals={selectedMode ? TRIALS.slice(0, selectedMode).map(t => t.id) : []}
        />
        <ArenaPlatform />

        <ParticleField count={120} color="#FFD700" size={0.02} spread={7} speed={0.12} />
        <ParticleField count={80} color="#8B5CF6" size={0.025} spread={5} speed={0.08} />

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 5}
          maxPolarAngle={Math.PI / 2.2}
          autoRotate
          autoRotateSpeed={0.4}
          target={[0, 0, 0]}
        />
      </Canvas>

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 20%, hsl(240 20% 4% / 0.8) 100%)' }}
      />

      {/* UI Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-between pointer-events-none">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="pt-8 text-center"
        >
          <button
            onClick={onBack}
            className="pointer-events-auto text-xs tracking-widest mb-4 block mx-auto"
            style={{ color: 'hsl(var(--gold) / 0.5)', fontFamily: 'var(--font-body)' }}
          >
            ← THRONE HALL
          </button>
          <h2
            className="text-3xl md:text-5xl font-bold text-gold-glow"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            TRIAL SELECTION
          </h2>
          <div className="energy-line w-48 mx-auto mt-3" />
        </motion.div>

        {/* Portal info (hover) */}
        {hoveredPortal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="panel-arcane px-8 py-4 text-center max-w-xs pointer-events-none"
          >
            <p className="text-xs tracking-widest mb-1" style={{ color: 'hsl(var(--neon))', fontFamily: 'var(--font-body)' }}>
              PORTAL SELECTED
            </p>
            <h3 className="text-xl font-bold text-gold-glow" style={{ fontFamily: 'var(--font-display)' }}>
              {hoveredPortal.name}
            </h3>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--foreground) / 0.6)', fontFamily: 'var(--font-body)' }}>
              {hoveredPortal.description}
            </p>
          </motion.div>
        )}

        {/* Mode selection */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="pb-8 px-4 w-full max-w-2xl pointer-events-auto"
        >
          <p className="text-center text-xs tracking-[0.3em] mb-5" style={{ color: 'hsl(var(--gold) / 0.6)', fontFamily: 'var(--font-body)' }}>
            SELECT YOUR PATH
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            {modes.map(({ count, label, subtitle, color }) => (
              <button
                key={count}
                onClick={() => handleModeClick(count)}
                className="relative px-6 py-4 text-center transition-all duration-300"
                style={{
                  border: `1px solid ${selectedMode === count ? color : 'hsl(var(--border))'}`,
                  background: selectedMode === count ? `${color}15` : 'hsl(var(--card))',
                  boxShadow: selectedMode === count ? `0 0 20px ${color}40, inset 0 0 20px ${color}10` : 'none',
                  clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
                  transform: selectedMode === count ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <p className="text-sm font-bold tracking-widest" style={{ color: selectedMode === count ? color : 'hsl(var(--foreground))', fontFamily: 'var(--font-display)' }}>
                  {label}
                </p>
                <p className="text-xs mt-1 tracking-wider" style={{ color: 'hsl(var(--foreground) / 0.5)', fontFamily: 'var(--font-body)' }}>
                  {subtitle}
                </p>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Corner frames */}
      {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
        <div
          key={i}
          className={`absolute ${pos} w-16 h-16 pointer-events-none`}
          style={{
            borderColor: 'hsl(var(--gold) / 0.3)',
            borderStyle: 'solid',
            borderWidth: i === 0 ? '2px 0 0 2px' : i === 1 ? '2px 2px 0 0' : i === 2 ? '0 0 2px 2px' : '0 2px 2px 0',
          }}
        />
      ))}

      {/* Dialogs */}
      {pendingMode && (
        <>
          <TrialInfoDialog
            isOpen={showInfoDialog}
            onClose={() => {
              setShowInfoDialog(false);
              setPendingMode(null);
              setSelectedMode(null);
            }}
            onContinue={handleInfoContinue}
            mode={pendingMode}
          />
          <MultiplayerSelection
            isOpen={showMultiplayerDialog}
            onClose={() => {
              setShowMultiplayerDialog(false);
              setPendingMode(null);
              setSelectedMode(null);
            }}
            onHost={(selectedTrials) => {
              setShowTrialSelection(false);
              onSelectMode(pendingMode, selectedTrials);
            }}
            onJoin={handleJoin}
            mode={pendingMode}
            onShowTrialSelection={handleShowTrialSelection}
            onShowRoomLobby={handleShowRoomLobby}
          />
          <TrialSelection
            isOpen={showTrialSelection}
            onClose={() => {
              setShowTrialSelection(false);
              setShowMultiplayerDialog(true);
            }}
            onConfirm={handleTrialSelectionConfirm}
            mode={pendingMode}
            allTrials={TRIALS}
          />
          <RoomLobby
            isOpen={showRoomLobby}
            onClose={() => {
              setShowRoomLobby(false);
              setShowMultiplayerDialog(true);
            }}
            onJoinRoom={handleJoinFromLobby}
            mode={pendingMode}
          />
        </>
      )}
    </div>
  );
}
