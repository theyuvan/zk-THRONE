import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Target, Crosshair } from 'lucide-react';

interface ThronebreakerProtocolTrialProps {
  onComplete: () => void;
  variantIndex?: number; // NEW: Deterministic question set (0-9)
}

interface Question {
  question: string;
  correctAnswer: string;
  wrongAnswer: string;
}

// ============================================================================
// 10 DIFFERENT QUESTION SETS FOR VARIETY (Paradox: Shoot the WRONG answer!)
// ============================================================================
const QUESTION_SETS: Question[][] = [
  // Set 1: Days & Math
  [
    { question: 'What comes before Monday?', correctAnswer: 'Sunday', wrongAnswer: 'Tuesday' },
    { question: '2 + 2 = ?', correctAnswer: '4', wrongAnswer: '5' },
    { question: 'The sky is ___', correctAnswer: 'Blue', wrongAnswer: 'Red' },
    { question: 'Capital of France?', correctAnswer: 'Paris', wrongAnswer: 'London' },
    { question: 'How many sides in a triangle?', correctAnswer: '3', wrongAnswer: '4' },
  ],
  // Set 2: Colors & Animals
  [
    { question: 'Grass is what color?', correctAnswer: 'Green', wrongAnswer: 'Purple' },
    { question: 'A dog has how many legs?', correctAnswer: '4', wrongAnswer: '6' },
    { question: 'The sun rises in the ___', correctAnswer: 'East', wrongAnswer: 'West' },
    { question: 'Fire is ___', correctAnswer: 'Hot', wrongAnswer: 'Cold' },
    { question: 'Birds can ___', correctAnswer: 'Fly', wrongAnswer: 'Swim' },
  ],
  // Set 3: Basic Facts
  [
    { question: 'Ice is ___', correctAnswer: 'Cold', wrongAnswer: 'Hot' },
    { question: 'Humans need ___ to breathe', correctAnswer: 'Air', wrongAnswer: 'Water' },
    { question: 'Night comes after ___', correctAnswer: 'Day', wrongAnswer: 'Morning' },
    { question: 'A week has ___ days', correctAnswer: '7', wrongAnswer: '5' },
    { question: 'The ocean is ___', correctAnswer: 'Salty', wrongAnswer: 'Sweet' },
  ],
  // Set 4: Numbers & Time
  [
    { question: '10 - 5 = ?', correctAnswer: '5', wrongAnswer: '15' },
    { question: 'A year has ___ months', correctAnswer: '12', wrongAnswer: '10' },
    { question: 'A circle has ___ corners', correctAnswer: '0', wrongAnswer: '4' },
    { question: 'The earth is ___', correctAnswer: 'Round', wrongAnswer: 'Flat' },
    { question: 'Rain comes from ___', correctAnswer: 'Clouds', wrongAnswer: 'Ground' },
  ],
  // Set 5: Geography & Nature
  [
    { question: 'Mountains are ___', correctAnswer: 'Tall', wrongAnswer: 'Short' },
    { question: 'Stars appear at ___', correctAnswer: 'Night', wrongAnswer: 'Day' },
    { question: 'Trees have ___', correctAnswer: 'Leaves', wrongAnswer: 'Scales' },
    { question: 'The moon orbits the ___', correctAnswer: 'Earth', wrongAnswer: 'Sun' },
    { question: 'Snow is ___', correctAnswer: 'White', wrongAnswer: 'Black' },
  ],
  // Set 6: Body & Senses
  [
    { question: 'We see with our ___', correctAnswer: 'Eyes', wrongAnswer: 'Ears' },
    { question: 'Hearts pump ___', correctAnswer: 'Blood', wrongAnswer: 'Air' },
    { question: 'Teeth are used to ___', correctAnswer: 'Chew', wrongAnswer: 'See' },
    { question: 'Lungs help us ___', correctAnswer: 'Breathe', wrongAnswer: 'Walk' },
    { question: 'Hands have ___ fingers', correctAnswer: '5', wrongAnswer: '7' },
  ],
  // Set 7: Opposites
  [
    { question: 'Opposite of up is ___', correctAnswer: 'Down', wrongAnswer: 'Left' },
    { question: 'Opposite of hot is ___', correctAnswer: 'Cold', wrongAnswer: 'Wet' },
    { question: 'Opposite of day is ___', correctAnswer: 'Night', wrongAnswer: 'Week' },
    { question: 'Opposite of fast is ___', correctAnswer: 'Slow', wrongAnswer: 'Quick' },
    { question: 'Opposite of big is ___', correctAnswer: 'Small', wrongAnswer: 'Huge' },
  ],
  // Set 8: Science & Space
  [
    { question: 'The sun is a ___', correctAnswer: 'Star', wrongAnswer: 'Planet' },
    { question: 'Water boils at ___ Celsius', correctAnswer: '100', wrongAnswer: '50' },
    { question: 'Plants need ___ to grow', correctAnswer: 'Sunlight', wrongAnswer: 'Darkness' },
    { question: 'Gravity pulls things ___', correctAnswer: 'Down', wrongAnswer: 'Up' },
    { question: 'Diamonds are ___', correctAnswer: 'Hard', wrongAnswer: 'Soft' },
  ],
  // Set 9: Food & Drinks
  [
    { question: 'Lemons taste ___', correctAnswer: 'Sour', wrongAnswer: 'Sweet' },
    { question: 'Milk comes from ___', correctAnswer: 'Cows', wrongAnswer: 'Trees' },
    { question: 'Bread is made from ___', correctAnswer: 'Wheat', wrongAnswer: 'Meat' },
    { question: 'Honey is made by ___', correctAnswer: 'Bees', wrongAnswer: 'Ants' },
    { question: 'Coffee is ___', correctAnswer: 'Bitter', wrongAnswer: 'Sweet' },
  ],
  // Set 10: Sports & Games
  [
    { question: 'Soccer is played with a ___', correctAnswer: 'Ball', wrongAnswer: 'Stick' },
    { question: 'Chess has ___ squares', correctAnswer: '64', wrongAnswer: '100' },
    { question: 'Olympics happen every ___ years', correctAnswer: '4', wrongAnswer: '2' },
    { question: 'A marathon is ___ km', correctAnswer: '42', wrongAnswer: '10' },
    { question: 'Basketball uses a ___', correctAnswer: 'Hoop', wrongAnswer: 'Goal' },
  ],
];

// Select question set based on variant index (deterministic)
// If no variantIndex provided, use random (for single player)
const getQuestionSet = (variantIndex?: number) => {
  const index = variantIndex !== undefined ? variantIndex % QUESTION_SETS.length : Math.floor(Math.random() * QUESTION_SETS.length);
  console.log(`🎲 ThronebreakerProtocol: Using question set ${index + 1}/${QUESTION_SETS.length}${variantIndex !== undefined ? ` (from room, variantIndex=${variantIndex})` : ' (random)'}`);
  console.log(`📋 First question: "${QUESTION_SETS[index][0].question}" → Correct: "${QUESTION_SETS[index][0].correctAnswer}"`);
  return QUESTION_SETS[index];
};

export default function ThronebreakerProtocolTrial({ onComplete, variantIndex }: ThronebreakerProtocolTrialProps) {
  console.log('🔄 ThronebreakerProtocolTrial mounted with variantIndex:', variantIndex);
  
  // Select question set based on variant index (deterministic per room)
  const [QUESTIONS] = useState(() => getQuestionSet(variantIndex));
  
  const [round, setRound] = useState(0);
  const [ammo, setAmmo] = useState(1);
  const [targetPosition, setTargetPosition] = useState<'left' | 'right'>('left');
  const [isLocked, setIsLocked] = useState(false);
  const [lockTime, setLockTime] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [targetHit, setTargetHit] = useState<string | null>(null);

  const question = QUESTIONS[round];

  useEffect(() => {
    if (lockTime > 0) {
      const timer = setTimeout(() => setLockTime(lockTime - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isLocked && lockTime === 0) {
      setIsLocked(false);
      setShowInstructions(true);
    }
  }, [lockTime, isLocked]);

  useEffect(() => {
    // Randomize target positions
    setTargetPosition(Math.random() > 0.5 ? 'left' : 'right');
  }, [round]);

  const handleShoot = (target: 'left' | 'right') => {
    if (isLocked || ammo === 0 || feedback) return;

    const hitAnswer = target === 'left' 
      ? (targetPosition === 'left' ? question.correctAnswer : question.wrongAnswer)
      : (targetPosition === 'right' ? question.correctAnswer : question.wrongAnswer);

    setTargetHit(hitAnswer);
    setAmmo(0);

    // PARADOX: Must shoot the WRONG answer
    const shotWrongAnswer = hitAnswer === question.wrongAnswer;

    if (shotWrongAnswer) {
      setFeedback('correct');
      setTimeout(() => {
        if (round < QUESTIONS.length - 1) {
          setRound(round + 1);
          setAmmo(1);
          setFeedback(null);
          setTargetHit(null);
        } else {
          onComplete();
        }
      }, 2000);
    } else {
      setFeedback('wrong');
      setTimeout(() => {
        setIsLocked(true);
        setLockTime(120);
        setAmmo(1);
        setFeedback(null);
        setTargetHit(null);
        setRound(0);
      }, 2000);
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
              PROTOCOL FAILED
            </h2>
            <p className="text-2xl" style={{ color: '#FF2E63' }}>
              {Math.floor(lockTime / 60)}:{(lockTime % 60).toString().padStart(2, '0')}
            </p>
            <p className="text-sm opacity-60 mt-2">You shot the correct answer</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions Overlay */}
      <AnimatePresence>
        {showInstructions && !isLocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-40"
            style={{
              background: 'rgba(0, 0, 0, 0.9)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Target size={80} color="#FF2E63" strokeWidth={2} />
            <h2 className="text-4xl font-bold mt-6 mb-4" style={{ color: '#FF2E63' }}>
              THRONEBREAKER PROTOCOL
            </h2>
            <div className="max-w-md text-center space-y-4 mb-8">
              <p className="text-xl font-bold" style={{ color: '#FFD700' }}>
                PARADOX RULES:
              </p>
              <p className="text-lg">You must shoot the <span style={{ color: '#FF2E63' }}>WRONG</span> answer</p>
              <p className="opacity-70">Fighting for the throne requires breaking conventional logic</p>
              <p className="text-sm opacity-50">Shooting the correct answer = 2 minute lockout</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowInstructions(false)}
              className="px-8 py-3 rounded-lg font-bold"
              style={{
                background: '#FF2E63',
                color: '#fff',
              }}
            >
              BEGIN PROTOCOL
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold mb-2" style={{ color: '#FF2E63' }}>
          THRONEBREAKER PROTOCOL
        </h2>
        <p className="text-sm opacity-70">Round {round + 1} / {QUESTIONS.length}</p>
      </motion.div>

      {/* Question */}
      <motion.div
        key={round}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-12 text-3xl font-bold text-center"
        style={{ color: '#FFD700' }}
      >
        {question.question}
      </motion.div>

      {/* Targets */}
      <div className="flex gap-32 mb-12">
        {/* Left Target */}
        <motion.div
          whileHover={{ scale: ammo > 0 ? 1.05 : 1 }}
          onClick={() => handleShoot('left')}
          className="relative cursor-pointer"
          style={{ pointerEvents: ammo > 0 && !feedback ? 'auto' : 'none' }}
        >
          <motion.div
            animate={{
              boxShadow: targetHit === (targetPosition === 'left' ? question.correctAnswer : question.wrongAnswer)
                ? `0 0 40px ${feedback === 'correct' ? '#00FF88' : '#FF2E63'}`
                : '0 0 20px #FF2E6340',
            }}
            className="w-40 h-40 rounded-full flex items-center justify-center relative"
            style={{
              background: 'radial-gradient(circle, #FF2E6340, #FF2E6310)',
              border: '3px solid #FF2E63',
            }}
          >
            <Crosshair size={60} color="#FF2E63" strokeWidth={2} />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute text-2xl font-bold"
              style={{ color: '#fff' }}
            >
              {targetPosition === 'left' ? question.correctAnswer : question.wrongAnswer}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Right Target */}
        <motion.div
          whileHover={{ scale: ammo > 0 ? 1.05 : 1 }}
          onClick={() => handleShoot('right')}
          className="relative cursor-pointer"
          style={{ pointerEvents: ammo > 0 && !feedback ? 'auto' : 'none' }}
        >
          <motion.div
            animate={{
              boxShadow: targetHit === (targetPosition === 'right' ? question.correctAnswer : question.wrongAnswer)
                ? `0 0 40px ${feedback === 'correct' ? '#00FF88' : '#FF2E63'}`
                : '0 0 20px #FF2E6340',
            }}
            className="w-40 h-40 rounded-full flex items-center justify-center relative"
            style={{
              background: 'radial-gradient(circle, #FF2E6340, #FF2E6310)',
              border: '3px solid #FF2E63',
            }}
          >
            <Crosshair size={60} color="#FF2E63" strokeWidth={2} />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute text-2xl font-bold"
              style={{ color: '#fff' }}
            >
              {targetPosition === 'right' ? question.correctAnswer : question.wrongAnswer}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Ammo Display */}
      <motion.div
        animate={{
          scale: ammo === 0 ? 0.8 : 1,
          opacity: ammo === 0 ? 0.3 : 1,
        }}
        className="flex items-center gap-3"
      >
        <span className="text-lg font-bold opacity-60">AMMO:</span>
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl font-bold"
          style={{
            background: ammo > 0 ? '#FF2E6330' : '#33333330',
            border: `2px solid ${ammo > 0 ? '#FF2E63' : '#555'}`,
            color: ammo > 0 ? '#FF2E63' : '#555',
          }}
        >
          {ammo}
        </div>
      </motion.div>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl font-bold z-30"
            style={{
              color: feedback === 'correct' ? '#00FF88' : '#FF2E63',
              textShadow: `0 0 30px ${feedback === 'correct' ? '#00FF88' : '#FF2E63'}`,
            }}
          >
            {feedback === 'correct' ? '✓ PROTOCOL EXECUTED' : '✗ WRONG TARGET'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      <div className="absolute bottom-8 text-center text-sm opacity-60">
        <p style={{ color: '#FF2E63' }}>PARADOX: Shoot the WRONG answer</p>
        <p className="text-xs mt-1">Shooting correct answer = 2 minute lockout</p>
      </div>
    </div>
  );
}
