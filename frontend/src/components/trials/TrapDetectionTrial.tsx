import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Zap } from 'lucide-react';

interface TrapDetectionTrialProps {
  onComplete: () => void;
}

const GRID_SIZE = 8;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;

const generateTraps = (level: number): Set<number> => {
  const trapCount = 10 + level * 2;
  const traps = new Set<number>();
  while (traps.size < trapCount) {
    const trap = Math.floor(Math.random() * (TOTAL_TILES - GRID_SIZE));
    if (trap < TOTAL_TILES - GRID_SIZE) {
      traps.add(trap);
    }
  }
  return traps;
};

export default function TrapDetectionTrial({ onComplete }: TrapDetectionTrialProps) {
  const [level, setLevel] = useState(0);
  const [position, setPosition] = useState(3); // Start in middle of first row
  const [traps, setTraps] = useState<Set<number>>(() => generateTraps(0));
  const [visitedTiles, setVisitedTiles] = useState<Set<number>>(new Set([3]));
  const [isLocked, setIsLocked] = useState(false);
  const [lockTime, setLockTime] = useState(0);
  const [hitTrap, setHitTrap] = useState<number | null>(null);
  const [revealedTraps, setRevealedTraps] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (lockTime > 0) {
      const timer = setTimeout(() => setLockTime(lockTime - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isLocked && lockTime === 0) {
      setIsLocked(false);
      setPosition(3);
      setVisitedTiles(new Set([3]));
      setHitTrap(null);
    }
  }, [lockTime, isLocked]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isLocked) return;

      const row = Math.floor(position / GRID_SIZE);
      const col = position % GRID_SIZE;

      let newPosition = position;

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          if (row > 0) newPosition = position - GRID_SIZE;
          break;
        case 's':
        case 'arrowdown':
          if (row < GRID_SIZE - 1) newPosition = position + GRID_SIZE;
          break;
        case 'a':
        case 'arrowleft':
          if (col > 0) newPosition = position - 1;
          break;
        case 'd':
        case 'arrowright':
          if (col < GRID_SIZE - 1) newPosition = position + 1;
          break;
      }

      if (newPosition !== position) {
        movePlayer(newPosition);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [position, isLocked, traps]);

  const movePlayer = (newPosition: number) => {
    setPosition(newPosition);
    setVisitedTiles(new Set([...visitedTiles, newPosition]));

    // Check if trap
    if (traps.has(newPosition)) {
      setHitTrap(newPosition);
      setRevealedTraps(new Set([...revealedTraps, newPosition]));
      setIsLocked(true);
      setLockTime(120);
      return;
    }

    // Check if reached bottom row
    const row = Math.floor(newPosition / GRID_SIZE);
    if (row === GRID_SIZE - 1) {
      if (level < 2) {
        setTimeout(() => {
          setLevel(level + 1);
          setTraps(generateTraps(level + 1));
          setPosition(3);
          setVisitedTiles(new Set([3]));
          setRevealedTraps(new Set());
        }, 500);
      } else {
        onComplete();
      }
    }
  };

  const getTileColor = (index: number) => {
    if (position === index) return '#00F0FF';
    if (revealedTraps.has(index)) return '#FF2E63';
    if (visitedTiles.has(index)) return '#8B5CF6';
    return '#333';
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 relative" style={{ background: '#0A0A0F' }}>
      {/* Lock Overlay */}
      <AnimatePresence>
        {isLocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-50"
            style={{
              background: 'rgba(0, 0, 0, 0.95)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Zap size={80} color="#FF2E63" strokeWidth={2} fill="#FF2E63" />
            <h2 className="text-4xl font-bold mt-6 mb-4" style={{ color: '#FF2E63' }}>
              TRAP TRIGGERED!
            </h2>
            <p className="text-2xl" style={{ color: '#FF2E63' }}>
              {Math.floor(lockTime / 60)}:{(lockTime % 60).toString().padStart(2, '0')}
            </p>
            <p className="text-sm opacity-60 mt-2">Wait for cooldown to retry</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h2 className="text-3xl font-bold mb-2" style={{ color: '#00F0FF' }}>
          TRAP DETECTION
        </h2>
        <p className="text-sm opacity-70">Level {level + 1} / 3</p>
      </motion.div>

      {/* Grid */}
      <div
        className="grid gap-2 mb-6"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
        }}
      >
        {Array.from({ length: TOTAL_TILES }, (_, i) => (
          <motion.div
            key={i}
            animate={{
              backgroundColor: getTileColor(i),
              scale: position === i ? 1.1 : 1,
              boxShadow:
                position === i
                  ? '0 0 20px #00F0FF'
                  : revealedTraps.has(i)
                  ? '0 0 20px #FF2E63'
                  : 'none',
            }}
            transition={{ duration: 0.2 }}
            className="w-12 h-12 rounded-lg flex items-center justify-center relative"
            style={{
              border: `2px solid ${
                position === i
                  ? '#00F0FF'
                  : revealedTraps.has(i)
                  ? '#FF2E63'
                  : visitedTiles.has(i)
                  ? '#8B5CF6'
                  : '#555'
              }`,
            }}
          >
            {/* Player Icon */}
            {position === i && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-6 h-6 rounded-full"
                style={{ background: '#00F0FF' }}
              />
            )}

            {/* Trap Icon (revealed) */}
            {revealedTraps.has(i) && position !== i && (
              <Zap size={20} color="#FF2E63" fill="#FF2E63" />
            )}

            {/* Goal Row Indicator */}
            {Math.floor(i / GRID_SIZE) === GRID_SIZE - 1 && (
              <motion.div
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 rounded-lg"
                style={{ border: '2px dashed #FFD700' }}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Stats */}
      <div className="flex gap-8 mb-4">
        <div className="text-center">
          <p className="text-sm opacity-60">Traps Revealed</p>
          <p className="text-2xl font-bold" style={{ color: '#FF2E63' }}>
            {revealedTraps.size}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm opacity-60">Tiles Visited</p>
          <p className="text-2xl font-bold" style={{ color: '#8B5CF6' }}>
            {visitedTiles.size}
          </p>
        </div>
      </div>

      {/* Controls Display */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div />
        <kbd className="px-3 py-2 rounded bg-gray-800 text-center">W</kbd>
        <div />
        <kbd className="px-3 py-2 rounded bg-gray-800 text-center">A</kbd>
        <kbd className="px-3 py-2 rounded bg-gray-800 text-center">S</kbd>
        <kbd className="px-3 py-2 rounded bg-gray-800 text-center">D</kbd>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-8 text-center text-sm opacity-60">
        <p>Navigate to the bottom row without hitting traps (WASD)</p>
        <p className="text-xs mt-1" style={{ color: '#FF2E63' }}>
          Each trap hit = 2 minute lockout
        </p>
      </div>
    </div>
  );
}
