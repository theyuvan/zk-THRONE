import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';

interface PatternOracleTrialProps {
  onComplete: () => void;
}

// ============================================================================
// 10 DIFFERENT PATTERN SETS FOR VARIETY
// ============================================================================
const PATTERN_SETS = [
  // Set 1: Powers of 2
  [
    { sequence: [2, 4, 8, 16], options: [32, 24, 18, 20], correct: 32, rule: 'Multiply by 2' },
    { sequence: [1, 2, 4, 8], options: [16, 12, 10, 14], correct: 16, rule: 'Multiply by 2' },
    { sequence: [5, 10, 20, 40], options: [80, 60, 50, 70], correct: 80, rule: 'Multiply by 2' },
  ],
  // Set 2: Square Numbers
  [
    { sequence: [1, 4, 9, 16], options: [25, 20, 24, 21], correct: 25, rule: 'Square numbers' },
    { sequence: [4, 9, 16, 25], options: [36, 30, 32, 35], correct: 36, rule: 'Square numbers' },
    { sequence: [1, 9, 25, 49], options: [81, 64, 72, 100], correct: 81, rule: 'Odd square numbers' },
  ],
  // Set 3: Add Constant
  [
    { sequence: [3, 8, 13, 18], options: [23, 21, 22, 24], correct: 23, rule: 'Add 5' },
    { sequence: [7, 14, 21, 28], options: [35, 32, 33, 36], correct: 35, rule: 'Add 7' },
    { sequence: [10, 20, 30, 40], options: [50, 45, 48, 55], correct: 50, rule: 'Add 10' },
  ],
  // Set 4: Fibonacci Style
  [
    { sequence: [1, 1, 2, 3], options: [5, 4, 6, 7], correct: 5, rule: 'Fibonacci' },
    { sequence: [2, 3, 5, 8], options: [13, 11, 12, 10], correct: 13, rule: 'Fibonacci' },
    { sequence: [1, 2, 3, 5], options: [8, 7, 6, 9], correct: 8, rule: 'Fibonacci' },
  ],
  // Set 5: Multiply by 3
  [
    { sequence: [1, 3, 9, 27], options: [81, 54, 72, 90], correct: 81, rule: 'Multiply by 3' },
    { sequence: [2, 6, 18, 54], options: [162, 108, 144, 180], correct: 162, rule: 'Multiply by 3' },
    { sequence: [5, 15, 45, 135], options: [405, 270, 360, 450], correct: 405, rule: 'Multiply by 3' },
  ],
  // Set 6: Alternating Pattern
  [
    { sequence: [2, 5, 8, 11], options: [14, 13, 15, 12], correct: 14, rule: 'Add 3' },
    { sequence: [1, 4, 7, 10], options: [13, 12, 14, 11], correct: 13, rule: 'Add 3' },
    { sequence: [5, 9, 13, 17], options: [21, 20, 22, 19], correct: 21, rule: 'Add 4' },
  ],
  // Set 7: Subtract Pattern
  [
    { sequence: [100, 90, 80, 70], options: [60, 65, 55, 50], correct: 60, rule: 'Subtract 10' },
    { sequence: [50, 45, 40, 35], options: [30, 32, 28, 33], correct: 30, rule: 'Subtract 5' },
    { sequence: [200, 180, 160, 140], options: [120, 130, 110, 125], correct: 120, rule: 'Subtract 20' },
  ],
  // Set 8: Prime Numbers
  [
    { sequence: [2, 3, 5, 7], options: [11, 9, 10, 8], correct: 11, rule: 'Prime numbers' },
    { sequence: [3, 5, 7, 11], options: [13, 12, 14, 15], correct: 13, rule: 'Prime numbers' },
    { sequence: [5, 7, 11, 13], options: [17, 15, 16, 18], correct: 17, rule: 'Prime numbers' },
  ],
  // Set 9: Geometric Growth
  [
    { sequence: [1, 4, 16, 64], options: [256, 128, 192, 512], correct: 256, rule: 'Multiply by 4' },
    { sequence: [3, 15, 75, 375], options: [1875, 1125, 1500, 2250], correct: 1875, rule: 'Multiply by 5' },
    { sequence: [2, 12, 72, 432], options: [2592, 1728, 2160, 3024], correct: 2592, rule: 'Multiply by 6' },
  ],
  // Set 10: Mixed Operations
  [
    { sequence: [1, 3, 6, 10], options: [15, 13, 14, 12], correct: 15, rule: 'Triangular numbers' },
    { sequence: [2, 6, 12, 20], options: [30, 28, 24, 26], correct: 30, rule: 'n(n+1)' },
    { sequence: [3, 7, 15, 31], options: [63, 60, 62, 64], correct: 63, rule: 'Double + 1' },
  ],
];

// Select a random pattern set on component mount
const getRandomPatternSet = () => {
  const randomIndex = Math.floor(Math.random() * PATTERN_SETS.length);
  console.log(`🎲 PatternOracle: Selected pattern set ${randomIndex + 1}/${PATTERN_SETS.length}`);
  return PATTERN_SETS[randomIndex];
};

export default function PatternOracleTrial({ onComplete }: PatternOracleTrialProps) {
  // Select a random pattern set on component mount (only happens once)
  const [PATTERNS] = useState(() => getRandomPatternSet());
  
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
