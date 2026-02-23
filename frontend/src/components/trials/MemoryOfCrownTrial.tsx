import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface MemoryOfCrownTrialProps {
  onComplete: () => void;
  variantIndex?: number; // NEW: Deterministic question set (0-9)
}

// ============================================================================
// 10 DIFFERENT WORD SETS FOR VARIETY
// ============================================================================
const WORD_SETS = [
  // Set 1: Royal Kingdom
  ['THRONE', 'CROWN', 'SCEPTER', 'KINGDOM', 'ROYAL', 'SOVEREIGN', 'DECREE', 'MAJESTY', 'HERALD', 'EMPIRE'],
  
  // Set 2: Ancient Treasures
  ['GOLD', 'SILVER', 'DIAMOND', 'RUBY', 'EMERALD', 'SAPPHIRE', 'PEARL', 'CRYSTAL', 'JEWEL', 'TREASURE'],
  
  // Set 3: Warrior Titles
  ['KNIGHT', 'WARRIOR', 'CHAMPION', 'GUARDIAN', 'DEFENDER', 'SENTINEL', 'PALADIN', 'CRUSADER', 'HERO', 'PROTECTOR'],
  
  // Set 4: Mythical Creatures
  ['DRAGON', 'PHOENIX', 'GRIFFIN', 'UNICORN', 'KRAKEN', 'BASILISK', 'PEGASUS', 'CHIMERA', 'HYDRA', 'SPHINX'],
  
  // Set 5: Magic & Spells
  ['MAGIC', 'SPELL', 'ENCHANT', 'WAND', 'POTION', 'CHARM', 'RUNE', 'ORACLE', 'MYSTIC', 'ARCANE'],
  
  // Set 6: Celestial Bodies
  ['STAR', 'MOON', 'SUN', 'COMET', 'GALAXY', 'NEBULA', 'METEOR', 'PLANET', 'COSMOS', 'ECLIPSE'],
  
  // Set 7: Elements & Forces
  ['FIRE', 'WATER', 'EARTH', 'WIND', 'LIGHTNING', 'ICE', 'STORM', 'THUNDER', 'FLAME', 'FROST'],
  
  // Set 8: Ancient Weapons
  ['SWORD', 'SHIELD', 'SPEAR', 'BOW', 'ARROW', 'DAGGER', 'HAMMER', 'AXE', 'LANCE', 'BLADE'],
  
  // Set 9: Sacred Places
  ['TEMPLE', 'SHRINE', 'ALTAR', 'SANCTUM', 'CHAPEL', 'CITADEL', 'FORTRESS', 'CATHEDRAL', 'MONASTERY', 'HOLY'],
  
  // Set 10: Time & Destiny
  ['FATE', 'DESTINY', 'PROPHECY', 'ORACLE', 'VISION', 'FUTURE', 'PAST', 'ETERNAL', 'LEGEND', 'MYTH'],
];

// Select word set based on variant index (deterministic)
// If no variantIndex provided, use random (for single player)
const getWordSet = (variantIndex?: number) => {
  const index = variantIndex !== undefined ? variantIndex % WORD_SETS.length : Math.floor(Math.random() * WORD_SETS.length);
  console.log(`🎲 MemoryOfCrown: Using word set ${index + 1}/${WORD_SETS.length}${variantIndex !== undefined ? ` (from room, variantIndex=${variantIndex})` : ' (random)'}`);
  console.log(`📋 First words: [${WORD_SETS[index].slice(0, 3).join(', ')}]`);
  return WORD_SETS[index];
};

export default function MemoryOfCrownTrial({ onComplete, variantIndex }: MemoryOfCrownTrialProps) {
  console.log('🔄 MemoryOfCrownTrial mounted with variantIndex:', variantIndex);
  
  // Select word set based on variant index (deterministic per room)
  const [words] = useState(() => getWordSet(variantIndex));
  
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<'memorize' | 'recall' | 'result'>('memorize');
  const [memorizeTime, setMemorizeTime] = useState(5);
  const [currentInput, setCurrentInput] = useState('');
  const [recalledWords, setRecalledWords] = useState<string[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTime, setLockTime] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  useEffect(() => {
    if (lockTime > 0) {
      const timer = setTimeout(() => setLockTime(lockTime - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isLocked && lockTime === 0) {
      setIsLocked(false);
      setPhase('memorize');
      setMemorizeTime(5);
    }
  }, [lockTime, isLocked]);

  useEffect(() => {
    if (phase === 'memorize' && memorizeTime > 0 && !isLocked) {
      const timer = setTimeout(() => setMemorizeTime(memorizeTime - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'memorize' && memorizeTime === 0) {
      setPhase('recall');
    }
  }, [memorizeTime, phase, isLocked]);

  const handleSubmitWord = (e: React.FormEvent) => {
    e.preventDefault();
    const word = currentInput.trim().toUpperCase();
    if (word && !recalledWords.includes(word)) {
      const newRecalled = [...recalledWords, word];
      setRecalledWords(newRecalled);
      setCurrentInput('');

      if (newRecalled.length === words.length) {
        checkAnswer(newRecalled);
      }
    }
  };

  const checkAnswer = (recalled: string[]) => {
    const isCorrect = recalled.every((word, index) => word === words[index]);

    if (isCorrect) {
      setFeedback('correct');
      setTimeout(() => {
        onComplete();
      }, 2000);
    } else {
      setFeedback('wrong');
      setTimeout(() => {
        setIsLocked(true);
        setLockTime(120);
        setRecalledWords([]);
        setFeedback(null);
      }, 2000);
    }
  };

  const handleSkip = () => {
    setIsLocked(true);
    setLockTime(120);
    setRecalledWords([]);
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
            <p className="text-sm opacity-60 mt-2">Wrong order - wait for cooldown</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold mb-2" style={{ color: '#FFD700' }}>
          MEMORY OF THE CROWN
        </h2>
        <p className="text-sm opacity-70">Round {round + 1} / {WORD_SETS.length}</p>
      </motion.div>

      {/* Memorize Phase */}
      {phase === 'memorize' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center"
        >
          <div className="mb-8 flex items-center gap-3">
            <Eye size={32} color="#FFD700" />
            <span className="text-5xl font-bold" style={{ color: '#FFD700' }}>
              {memorizeTime}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {words.map((word, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="px-6 py-4 text-2xl font-bold text-center rounded-lg"
                style={{
                  background: '#FFD70030',
                  border: '2px solid #FFD700',
                  color: '#FFD700',
                  boxShadow: '0 0 20px #FFD70040',
                }}
              >
                {word}
              </motion.div>
            ))}
          </div>

          <p className="text-sm opacity-60">Memorize the words in ORDER</p>
        </motion.div>
      )}

      {/* Recall Phase */}
      {phase === 'recall' && !feedback && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center w-full max-w-md"
        >
          <div className="mb-8 flex items-center gap-3">
            <EyeOff size={32} color="#FFD700" />
            <span className="text-2xl font-bold" style={{ color: '#FFD700' }}>
              RECALL IN ORDER
            </span>
          </div>

          {/* Recalled Words */}
          <div className="mb-6 w-full">
            {recalledWords.map((word, i) => (
              <motion.div
                key={i}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="mb-2 px-4 py-2 text-lg font-bold rounded-lg flex items-center gap-2"
                style={{
                  background: '#FFD70020',
                  border: '1px solid #FFD700',
                  color: '#FFD700',
                }}
              >
                <span className="opacity-50">{i + 1}.</span> {word}
              </motion.div>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmitWord} className="w-full mb-4">
            <input
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder={`Word ${recalledWords.length + 1} of ${words.length}`}
              autoFocus
              className="w-full px-4 py-3 text-lg font-bold text-center rounded-lg outline-none"
              style={{
                background: '#FFD70020',
                border: '2px solid #FFD700',
                color: '#FFD700',
              }}
            />
          </form>

          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              onClick={handleSubmitWord}
              className="px-8 py-3 rounded-lg font-bold"
              style={{
                background: '#FFD700',
                color: '#000',
              }}
            >
              SUBMIT WORD
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSkip}
              className="px-8 py-3 rounded-lg font-bold"
              style={{
                background: '#FF2E6330',
                border: '2px solid #FF2E63',
                color: '#FF2E63',
              }}
            >
              GIVE UP
            </motion.button>
          </div>

          <p className="text-xs opacity-50 mt-4">
            {recalledWords.length} / {words.length} words recalled
          </p>
        </motion.div>
      )}

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
            {feedback === 'correct' ? '✓ PERFECT' : '✗ WRONG ORDER'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      <div className="absolute bottom-8 text-center text-sm opacity-60">
        <p>Memorize 10 words, then type them in exact order</p>
        <p className="text-xs mt-1" style={{ color: '#FF2E63' }}>
          Wrong order = 2 minute lockout
        </p>
      </div>
    </div>
  );
}
