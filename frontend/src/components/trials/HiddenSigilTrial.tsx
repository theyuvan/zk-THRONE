import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Target } from 'lucide-react';

interface HiddenSigilTrialProps {
  onComplete: () => void;
}

// Hidden location (same for all players)
const HIDDEN_X = 720; // relative to viewport width
const HIDDEN_Y = 400; // relative to viewport height
const CLICK_TOLERANCE = 50; //  pixels tolerance

export default function HiddenSigilTrial({ onComplete }: HiddenSigilTrialProps) {
  const [attempts, setAttempts] = useState(3);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTime, setLockTime] = useState(0);
  const [clicks, setClicks] = useState<{ x: number; y: number; success: boolean }[]>([]);
  const [found, setFound] = useState(false);
  const [particles, setParticles] = useState<{ x: number; y: number; id: number }[]>([]);

  useEffect(() => {
    // Generate floating particles
    const interval = setInterval(() => {
      setParticles(prev => [
        ...prev.slice(-30),
        {
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          id: Date.now() + Math.random(),
        },
      ]);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (lockTime > 0) {
      const timer = setTimeout(() => setLockTime(lockTime - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isLocked && lockTime === 0) {
      setIsLocked(false);
      setAttempts(1); // Give 1 more attempt after cooldown
    }
  }, [lockTime, isLocked]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLocked || found) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const distance = Math.sqrt(
      Math.pow(x - HIDDEN_X, 2) + Math.pow(y - HIDDEN_Y, 2)
    );

    const success = distance <= CLICK_TOLERANCE;

    setClicks(prev => [...prev, { x, y, success }]);

    if (success) {
      setFound(true);
      setTimeout(() => {
        onComplete();
      }, 2000);
    } else {
      const newAttempts = attempts - 1;
      setAttempts(newAttempts);

      if (newAttempts <= 0) {
        setIsLocked(true);
        setLockTime(120); // 2 minutes
      }
    }
  };

  return (
    <div
      className="w-full h-full relative overflow-hidden cursor-crosshair"
      style={{
        background: 'radial-gradient(ellipse at center, #0A0A0F 0%, #000000 100%)',
      }}
      onClick={handleClick}
    >
      {/* Lock Overlay */}
      <AnimatePresence>
        {isLocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none"
            style={{
              background: 'rgba(0, 0, 0, 0.95)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Lock size={80} color="#FF2E63" strokeWidth={2} />
            <h2 className="text-4xl font-bold mt-6 mb-4" style={{ color: '#FF2E63' }}>
              LOCKED
            </h2>
            <p className="text-2xl" style={{ color: '#FF2E63' }}>
              {Math.floor(lockTime / 60)}:{(lockTime % 60).toString().padStart(2, '0')}
            </p>
            <p className="text-sm opacity-60 mt-2">Failed attempts - wait for cooldown</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Particles */}
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0.6, 0],
            scale: [0, 1, 0],
            y: [0, -100],
          }}
          transition={{ duration: 3, ease: 'easeOut' }}
          className="absolute w-2 h-2 rounded-full pointer-events-none"
          style={{
            left: p.x,
            top: p.y,
            background: '#8B5CF6',
            boxShadow: '0 0 10px #8B5CF6',
          }}
        />
      ))}

      {/* Click Ripples */}
      {clicks.map((click, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: click.x - 50,
            top: click.y - 50,
            width: 100,
            height: 100,
            border: `3px solid ${click.success ? '#00FF88' : '#FF2E63'}`,
            boxShadow: `0 0 20px ${click.success ? '#00FF88' : '#FF2E63'}`,
          }}
        />
      ))}

      {/* Found Symbol */}
      <AnimatePresence>
        {found && (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -180 }}
            animate={{ scale: 1.5, opacity: 1, rotate: 0 }}
            className="absolute flex items-center justify-center pointer-events-none"
            style={{
              left: HIDDEN_X - 40,
              top: HIDDEN_Y - 40,
              width: 80,
              height: 80,
            }}
          >
            <Target size={80} color="#00FF88" strokeWidth={3} />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute w-full h-full rounded-full"
              style={{
                border: '3px solid #00FF88',
                boxShadow: '0 0 40px #00FF88',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center pointer-events-none"
      >
        <h2 className="text-3xl font-bold mb-2" style={{ color: '#FF2E63' }}>
          HIDDEN SIGIL
        </h2>
        <p className="text-sm opacity-70">Find the invisible point</p>
      </motion.div>

      {/* Attempts Counter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute top-8 right-8 flex gap-2 pointer-events-none"
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-full"
            style={{
              background: i < attempts ? '#00FF88' : '#FF2E6340',
              boxShadow: i < attempts ? '0 0 10px #00FF88' : 'none',
            }}
          />
        ))}
      </motion.div>

      {/* Instructions */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center text-sm opacity-60 pointer-events-none">
        <p>Click anywhere on the screen to find the hidden sigil</p>
        <p className="mt-2">Attempts remaining: {attempts}</p>
        <p className="text-xs mt-1" style={{ color: '#FF2E63' }}>
          3 chances, then 2 minute lockout per attempt
        </p>
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {found && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl font-bold pointer-events-none"
            style={{
              color: '#00FF88',
              textShadow: '0 0 20px #00FF88',
            }}
          >
            FOUND!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
