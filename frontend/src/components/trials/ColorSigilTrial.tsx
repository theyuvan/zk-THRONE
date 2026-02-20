import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface ColorSigilTrialProps {
  onComplete: () => void;
}

const COLORS = [
  { name: 'Gold', hex: '#FFD700' },
  { name: 'Crimson', hex: '#FF2E63' },
  { name: 'Neon', hex: '#00F0FF' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Emerald', hex: '#00FF88' },
];

export default function ColorSigilTrial({ onComplete }: ColorSigilTrialProps) {
  const [level, setLevel] = useState(1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [isShowing, setIsShowing] = useState(false);
  const [currentShowIndex, setCurrentShowIndex] = useState(-1);
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [studyTime, setStudyTime] = useState(30);
  const [phase, setPhase] = useState<'study' | 'input'>('study');

  useEffect(() => {
    startLevel();
  }, [level]);

  useEffect(() => {
    if (phase === 'study' && studyTime > 0) {
      const timer = setTimeout(() => setStudyTime(studyTime - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'study' && studyTime === 0) {
      setPhase('input');
    }
  }, [studyTime, phase]);

  const startLevel = () => {
    const sequenceLength = 3 + level;
    const newSequence = Array.from({ length: sequenceLength }, () => 
      Math.floor(Math.random() * COLORS.length)
    );
    setSequence(newSequence);
    setUserSequence([]);
    setFeedback(null);
    setPhase('study');
    setStudyTime(30);
    showSequence(newSequence);
  };

  const showSequence = async (seq: number[]) => {
    setIsShowing(true);
    for (let i = 0; i < seq.length; i++) {
      setCurrentShowIndex(i);
      await new Promise(resolve => setTimeout(resolve, 800));
      setCurrentShowIndex(-1);
      await new Promise(resolve => setTimeout(resolve, 400));
    }
    setIsShowing(false);
  };

  const handleColorClick = (colorIndex: number) => {
    if (isShowing || phase === 'study' || isChecking) return;

    const newUserSequence = [...userSequence, colorIndex];
    setUserSequence(newUserSequence);

    if (newUserSequence.length === sequence.length) {
      checkSequence(newUserSequence);
    }
  };

  const checkSequence = (userSeq: number[]) => {
    setIsChecking(true);
    const isCorrect = userSeq.every((color, index) => color === sequence[index]);

    setTimeout(() => {
      if (isCorrect) {
        setFeedback('correct');
        setTimeout(() => {
          if (level >= 3) {
            onComplete();
          } else {
            setLevel(level + 1);
          }
        }, 1500);
      } else {
        setFeedback('wrong');
        setTimeout(() => {
          setUserSequence([]);
          setIsChecking(false);
          setFeedback(null);
        }, 1500);
      }
    }, 500);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold text-gold-glow mb-2">COLOR SIGIL</h2>
        <p className="text-sm opacity-70">Level {level} / 3</p>
        {phase === 'study' && (
          <div className="mt-4 text-lg" style={{ color: '#FFD700' }}>
            Study Time: {studyTime}s
          </div>
        )}
        {phase === 'input' && (
          <div className="mt-4 text-sm opacity-70">
            Reproduce the sequence ({userSequence.length} / {sequence.length})
          </div>
        )}
      </motion.div>

      {/* Color Display */}
      <div className="flex gap-6 mb-8">
        {COLORS.map((color, index) => (
          <motion.button
            key={index}
            whileHover={phase === 'input' && !isChecking ? { scale: 1.1 } : {}}
            whileTap={phase === 'input' && !isChecking ? { scale: 0.95 } : {}}
            onClick={() => handleColorClick(index)}
            disabled={phase === 'study' || isChecking}
            className="relative w-24 h-24 rounded-full transition-all duration-300 disabled:cursor-not-allowed"
            style={{
              background: color.hex,
              boxShadow: currentShowIndex === index 
                ? `0 0 40px ${color.hex}, 0 0 80px ${color.hex}`
                : userSequence.includes(index)
                ? `0 0 20px ${color.hex}`
                : `0 0 10px ${color.hex}40`,
              opacity: currentShowIndex === index ? 1 : phase === 'study' ? 0.6 : 1,
              transform: currentShowIndex === index ? 'scale(1.2)' : 'scale(1)',
            }}
          >
            <AnimatePresence>
              {userSequence.filter(c => c === index).length > 0 && phase === 'input' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: '#000', color: color.hex }}
                >
                  {userSequence.filter(c => c === index).length}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>

      {/* User Sequence Display */}
      {phase === 'input' && (
        <div className="flex gap-3 mb-8">
          {Array.from({ length: sequence.length }).map((_, index) => (
            <div
              key={index}
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{
                background: userSequence[index] !== undefined 
                  ? COLORS[userSequence[index]].hex 
                  : '#ffffff20',
                border: '2px solid #ffffff40',
              }}
            />
          ))}
        </div>
      )}

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-8 rounded-2xl"
            style={{
              background: feedback === 'correct' ? '#00FF8830' : '#FF2E6330',
              border: `3px solid ${feedback === 'correct' ? '#00FF88' : '#FF2E63'}`,
              boxShadow: `0 0 40px ${feedback === 'correct' ? '#00FF88' : '#FF2E63'}`,
            }}
          >
            {feedback === 'correct' ? (
              <Check size={64} color="#00FF88" strokeWidth={3} />
            ) : (
              <X size={64} color="#FF2E63" strokeWidth={3} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      <div className="mt-8 text-center text-sm opacity-60 max-w-md">
        {phase === 'study' 
          ? 'Watch and memorize the color sequence...'
          : 'Click the colors in the correct order'
        }
      </div>
    </div>
  );
}
