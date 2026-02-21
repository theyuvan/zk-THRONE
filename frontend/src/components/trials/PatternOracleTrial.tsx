import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';

interface PatternOracleTrialProps {
  onComplete: () => void;
}

const PATTERNS = [
  {
    sequence: [2, 4, 8, 16],
    options: [32, 24, 18, 20],
    correct: 32,
    rule: 'Multiply by 2',
  },
  {
    sequence: [1, 4, 9, 16],
    options: [25, 20, 24, 21],
    correct: 25,
    rule: 'Square numbers',
  },
  {
    sequence: [3, 6, 12, 24],
    options: [48, 36, 30, 42],
    correct: 48,
    rule: 'Multiply by 2',
  },
];

export default function PatternOracleTrial({ onComplete }: PatternOracleTrialProps) {
  const [currentPattern, setCurrentPattern] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTime, setLockTime] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const pattern = PATTERNS[currentPattern];

  useEffect(() => {
    if (lockTime > 0) {
      const timer = setTimeout(() => setLockTime(lockTime - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isLocked && lockTime === 0) {
      setIsLocked(false);
    }
  }, [lockTime, isLocked]);

  useEffect(() => {
    if (timeLeft > 0 && !isLocked && !feedback) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !feedback) {
      handleTimeout();
    }
  }, [timeLeft, isLocked, feedback]);

  const handleTimeout = () => {
    setIsLocked(true);
    setLockTime(120);
    setTimeLeft(45);
  };

  const handleAnswer = (answer: number) => {
    if (isLocked || feedback) return;

    setSelectedAnswer(answer);

    if (answer === pattern.correct) {
      setFeedback('correct');
      setTimeout(() => {
        if (currentPattern < PATTERNS.length - 1) {
          setCurrentPattern(currentPattern + 1);
          setTimeLeft(45);
          setSelectedAnswer(null);
          setFeedback(null);
        } else {
          onComplete();
        }
      }, 1500);
    } else {
      setFeedback('wrong');
      setTimeout(() => {
        setIsLocked(true);
        setLockTime(120);
        setSelectedAnswer(null);
        setFeedback(null);
        setTimeLeft(45);
      }, 1500);
    }
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
            <Lock size={80} color="#FF2E63" strokeWidth={2} />
            <h2 className="text-4xl font-bold mt-6 mb-4" style={{ color: '#FF2E63' }}>
              LOCKED
            </h2>
            <p className="text-2xl" style={{ color: '#FF2E63' }}>
              {Math.floor(lockTime / 60)}:{(lockTime % 60).toString().padStart(2, '0')}
            </p>
            <p className="text-sm opacity-60 mt-2">Wrong answer - wait for cooldown</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold mb-2" style={{ color: '#8B5CF6' }}>
          PATTERN ORACLE
        </h2>
        <p className="text-sm opacity-70">Pattern {currentPattern + 1} / {PATTERNS.length}</p>
      </motion.div>

      {/* Timer */}
      <motion.div
        className="mb-8 text-4xl font-bold"
        animate={{
          color: timeLeft <= 10 ? '#FF2E63' : '#8B5CF6',
          scale: timeLeft <= 10 ? [1, 1.1, 1] : 1,
        }}
        transition={{ duration: 0.5, repeat: timeLeft <= 10 ? Infinity : 0 }}
      >
        {timeLeft}s
      </motion.div>

      {/* Sequence Display */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex gap-4 mb-8"
      >
        {pattern.sequence.map((num, i) => (
          <motion.div
            key={i}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="w-20 h-20 flex items-center justify-center text-3xl font-bold rounded-lg"
            style={{
              background: '#8B5CF630',
              border: '2px solid #8B5CF6',
              color: '#8B5CF6',
              boxShadow: '0 0 20px #8B5CF640',
            }}
          >
            {num}
          </motion.div>
        ))}
        <motion.div
          animate={{
            opacity: [0.4, 1, 0.4],
          }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-20 h-20 flex items-center justify-center text-4xl font-bold rounded-lg"
          style={{
            background: '#8B5CF620',
            border: '2px dashed #8B5CF6',
            color: '#8B5CF6',
          }}
        >
          ?
        </motion.div>
      </motion.div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {pattern.options.map((option, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAnswer(option)}
            disabled={isLocked || feedback !== null}
            className="w-32 h-32 flex items-center justify-center text-3xl font-bold rounded-lg transition-all disabled:cursor-not-allowed"
            style={{
              background: selectedAnswer === option
                ? feedback === 'correct'
                  ? '#00FF8830'
                  : '#FF2E6330'
                : '#8B5CF620',
              border: `2px solid ${
                selectedAnswer === option
                  ? feedback === 'correct'
                    ? '#00FF88'
                    : '#FF2E63'
                  : '#8B5CF6'
              }`,
              color: selectedAnswer === option
                ? feedback === 'correct'
                  ? '#00FF88'
                  : '#FF2E63'
                : '#8B5CF6',
              boxShadow: selectedAnswer === option
                ? `0 0 30px ${feedback === 'correct' ? '#00FF88' : '#FF2E63'}`
                : '0 0 10px #8B5CF640',
            }}
          >
            {option}
          </motion.button>
        ))}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl font-bold"
            style={{
              color: feedback === 'correct' ? '#00FF88' : '#FF2E63',
              textShadow: `0 0 20px ${feedback === 'correct' ? '#00FF88' : '#FF2E63'}`,
            }}
          >
            {feedback === 'correct' ? '✓ CORRECT' : '✗ WRONG'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      <div className="absolute bottom-8 text-center text-sm opacity-60">
        <p>Identify the pattern and select the next number</p>
        <p className="text-xs mt-1" style={{ color: '#FF2E63' }}>
          Wrong answer or timeout = 2 minute lockout
        </p>
      </div>
    </div>
  );
}
