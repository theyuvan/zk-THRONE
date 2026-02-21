import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface LogicLabyrinthTrialProps {
  onComplete: () => void;
}

// Maze grid (0=path, 1=wall, 2=trap, 3=logic gate, 4=exit)
const MAZE = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 3, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 2, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 3, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 3, 0, 1, 0, 0, 2, 1],
  [1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 4, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const LOGIC_GATES = [
  { pos: [2, 13], question: 'Is 25 divisible by 5?', answer: true },
  { pos: [7, 2], question: 'Is 9 a prime number?', answer: false },
  { pos: [11, 8], question: 'Is 2+2 equal to 4?', answer: true },
];

export default function LogicLabyrinthTrial({ onComplete }: LogicLabyrinthTrialProps) {
  const [playerPos, setPlayerPos] = useState<[number, number]>([1, 1]);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTime, setLockTime] = useState(0);
  const [currentGate, setCurrentGate] = useState<number | null>(null);
  const [visitedCells, setVisitedCells] = useState<Set<string>>(new Set(['1,1']));

  useEffect(() => {
    if (lockTime > 0) {
      const timer = setTimeout(() => setLockTime(lockTime - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isLocked && lockTime === 0) {
      setIsLocked(false);
    }
  }, [lockTime, isLocked]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLocked || currentGate !== null) return;

      const [y, x] = playerPos;
      let newPos: [number, number] = [y, x];

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          newPos = [y - 1, x];
          break;
        case 's':
        case 'arrowdown':
          newPos = [y + 1, x];
          break;
        case 'a':
        case 'arrowleft':
          newPos = [y, x - 1];
          break;
        case 'd':
        case 'arrowright':
          newPos = [y, x + 1];
          break;
        default:
          return;
      }

      const [newY, newX] = newPos;
      const cell = MAZE[newY]?.[newX];

      if (cell === 1) return; // Wall

      if (cell === 2) {
        // Trap hit
        setIsLocked(true);
        setLockTime(120);
        setPlayerPos([1, 1]); // Reset position
        setVisitedCells(new Set(['1,1']));
        return;
      }

      if (cell === 3) {
        // Logic gate
        const gateIndex = LOGIC_GATES.findIndex(
          g => g.pos[0] === newY && g.pos[1] === newX
        );
        if (gateIndex !== -1) {
          setCurrentGate(gateIndex);
          return;
        }
      }

      if (cell === 4) {
        // Exit
        onComplete();
        return;
      }

      setPlayerPos(newPos);
      setVisitedCells(prev => new Set([...prev, `${newY},${newX}`]));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPos, isLocked, currentGate, onComplete]);

  const answerGate = (answer: boolean) => {
    if (currentGate === null) return;

    const gate = LOGIC_GATES[currentGate];
    if (answer === gate.answer) {
      setPlayerPos(gate.pos as [number, number]);
      setVisitedCells(prev => new Set([...prev, `${gate.pos[0]},${gate.pos[1]}`]));
      setCurrentGate(null);
    } else {
      setIsLocked(true);
      setLockTime(120);
      setPlayerPos([1, 1]);
      setVisitedCells(new Set(['1,1']));
      setCurrentGate(null);
    }
  };

  const getCellColor = (y: number, x: number) => {
    const cell = MAZE[y][x];
    if (cell === 1) return '#FFD70040';
    if (cell === 2) return '#FF2E6340';
    if (cell === 3) return '#00F0FF40';
    if (cell === 4) return '#00FF8840';
    if (visitedCells.has(`${y},${x}`)) return '#8B5CF620';
    return '#00000040';
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
            <p className="text-sm opacity-60 mt-2">Hit trap - wait for cooldown</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logic Gate Dialog */}
      <AnimatePresence>
        {currentGate !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 flex items-center justify-center z-40"
            style={{ background: 'rgba(0, 0, 0, 0.9)' }}
          >
            <div
              className="p-8 rounded-lg max-w-md"
              style={{ background: '#00F0FF20', border: '2px solid #00F0FF' }}
            >
              <h3 className="text-2xl font-bold mb-4" style={{ color: '#00F0FF' }}>
                LOGIC GATE
              </h3>
              <p className="text-xl mb-6">{LOGIC_GATES[currentGate].question}</p>
              <div className="flex gap-4">
                <button
                  onClick={() => answerGate(true)}
                  className="flex-1 py-3 rounded-lg font-bold"
                  style={{ background: '#00FF8830', border: '2px solid #00FF88', color: '#00FF88' }}
                >
                  TRUE
                </button>
                <button
                  onClick={() => answerGate(false)}
                  className="flex-1 py-3 rounded-lg font-bold"
                  style={{ background: '#FF2E6330', border: '2px solid #FF2E63', color: '#FF2E63' }}
                >
                  FALSE
                </button>
              </div>
            </div>
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
          LOGIC LABYRINTH
        </h2>
        <p className="text-sm opacity-70">Reach the exit without hitting traps</p>
      </motion.div>

      {/* Maze */}
      <div className="mb-6" style={{ display: 'grid', gridTemplateColumns: `repeat(15, 30px)`, gap: '2px' }}>
        {MAZE.map((row, y) =>
          row.map((cell, x) => (
            <motion.div
              key={`${y}-${x}`}
              className="w-[30px] h-[30px] relative"
              style={{
                background: getCellColor(y, x),
                border: cell === 1 ? '1px solid #FFD700' : '1px solid #ffffff20',
              }}
            >
              {playerPos[0] === y && playerPos[1] === x && (
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    background: '#FFD700',
                    boxShadow: '0 0 20px #FFD700',
                    borderRadius: '50%',
                  }}
                />
              )}
              {cell === 4 && (
                <div className="absolute inset-0 flex items-center justify-center text-lg">
                  🏁
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-8 text-sm opacity-70">
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <ArrowUp size={16} />
            <span>W</span>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <ArrowLeft size={16} />
            <span>A</span>
          </div>
          <div className="flex flex-col items-center">
            <ArrowDown size={16} />
            <span>S</span>
          </div>
          <div className="flex flex-col items-center">
            <ArrowRight size={16} />
            <span>D</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-8 left-8 text-xs opacity-60">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4" style={{ background: '#FF2E6340' }} />
          <span>Trap</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4" style={{ background: '#00F0FF40' }} />
          <span>Logic Gate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4" style={{ background: '#00FF8840' }} />
          <span>Exit</span>
        </div>
      </div>

      {/* Warning */}
      <div className="absolute bottom-8 right-8 text-xs" style={{ color: '#FF2E63' }}>
        Wrong answer or trap = 2 min lockout
      </div>
    </div>
  );
}
