import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Trash2 } from 'lucide-react';

interface CipherGridTrialProps {
  onComplete: () => void;
}

type Direction = 'horizontal' | 'vertical';

interface Puzzle {
  question: string;
  answer: string;
  startPos: [number, number];
  direction: Direction;
}

const PUZZLES: Puzzle[] = [
  // Horizontal words (Row 1, Row 2, Row 3)
  {
    question: 'Armed conflict between nations (3 letters)',
    answer: 'WAR',
    startPos: [0, 0],
    direction: 'horizontal',
  },
  {
    question: 'A distinct period in history (3 letters)',
    answer: 'ERA',
    startPos: [1, 0],
    direction: 'horizontal',
  },
  {
    question: 'The number that comes after nine (3 letters)',
    answer: 'TEN',
    startPos: [2, 0],
    direction: 'horizontal',
  },
  // Vertical words (Column 1, Column 2, Column 3)
  {
    question: 'Covered or soaked with water (3 letters)',
    answer: 'WET',
    startPos: [0, 0],
    direction: 'vertical',
  },
  {
    question: 'Plural form of the verb "is" (3 letters)',
    answer: 'ARE',
    startPos: [0, 1],
    direction: 'vertical',
  },
  {
    question: 'Past tense of the verb "run" (3 letters)',
    answer: 'RAN',
    startPos: [0, 2],
    direction: 'vertical',
  },
];

const GRID_SIZE = 3;

export default function CipherGridTrial({ onComplete }: CipherGridTrialProps) {
  const [grid, setGrid] = useState<string[][]>(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill('')));
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTime, setLockTime] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [previewMode, setPreviewMode] = useState(true);
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    if (lockTime > 0) {
      const timer = setTimeout(() => setLockTime(lockTime - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isLocked && lockTime === 0) {
      setIsLocked(false);
    }
  }, [lockTime, isLocked]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!selectedCell || isLocked || feedback) return;

      const key = e.key.toUpperCase();
      
      // Only allow A-Z letters
      if (key.length === 1 && key >= 'A' && key <= 'Z') {
        const [row, col] = selectedCell;
        const newGrid = grid.map(r => [...r]);
        newGrid[row][col] = key;
        setGrid(newGrid);
      }

      // Backspace to clear
      if (e.key === 'Backspace') {
        const [row, col] = selectedCell;
        const newGrid = grid.map(r => [...r]);
        newGrid[row][col] = '';
        setGrid(newGrid);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedCell, grid, isLocked, feedback]);

  const getCellsInDirection = (start: [number, number], direction: Direction, length: number): [number, number][] => {
    const [startRow, startCol] = start;
    const cells: [number, number][] = [];

    for (let i = 0; i < length; i++) {
      let row = startRow;
      let col = startCol;

      switch (direction) {
        case 'horizontal':
          col += i;
          break;
        case 'vertical':
          row += i;
          break;
      }

      if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
        cells.push([row, col]);
      }
    }

    return cells;
  };

  const checkAnswer = () => {
    if (isLocked || feedback) return;

    // Check all 6 answers in the grid
    let allCorrect = true;
    for (const puzzle of PUZZLES) {
      const answerCells = getCellsInDirection(puzzle.startPos, puzzle.direction, puzzle.answer.length);
      const userAnswer = answerCells.map(([row, col]) => grid[row][col]).join('');
      if (userAnswer !== puzzle.answer) {
        allCorrect = false;
        break;
      }
    }

    if (allCorrect) {
      setFeedback('correct');
      setTimeout(() => {
        onComplete();
      }, 2000);
    } else {
      setFeedback('wrong');
      setIsLocked(true);
      setLockTime(120);
      setTimeout(() => {
        setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill('')));
        setSelectedCell(null);
        setFeedback(null);
      }, 2000);
    }
  };

  const clearGrid = () => {
    setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill('')));
    setSelectedCell(null);
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
            <p className="text-sm opacity-60 mt-2">Wrong answer - Try again after cooldown</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question Preview Mode */}
      <AnimatePresence>
        {previewMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-40"
            style={{
              background: 'rgba(0, 0, 0, 0.95)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div className="max-w-2xl w-full px-8">
              <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: '#FFD700' }}>
                REVIEW ALL QUESTIONS
              </h2>
              
              <motion.div
                key={previewIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 rounded-lg mb-8"
                style={{ background: '#FFD70020', border: '2px solid #FFD700' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold" style={{ color: '#FFD70080' }}>
                    Question {previewIndex + 1} of {PUZZLES.length}
                  </span>
                  <span className="text-xs px-3 py-1 rounded" style={{ background: '#FFD70030', color: '#FFD700' }}>
                    {PUZZLES[previewIndex].direction === 'horizontal' ? 'HORIZONTAL' : 'VERTICAL'}
                  </span>
                </div>
                <p className="text-xl font-bold mb-2" style={{ color: '#FFD700' }}>
                  {PUZZLES[previewIndex].question}
                </p>
                <p className="text-sm opacity-60">
                  {PUZZLES[previewIndex].direction === 'horizontal' 
                    ? `Row ${PUZZLES[previewIndex].startPos[0] + 1}` 
                    : `Column ${PUZZLES[previewIndex].startPos[1] + 1}`}
                </p>
              </motion.div>

              <div className="flex items-center justify-between gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
                  disabled={previewIndex === 0}
                  className="px-6 py-3 rounded-lg font-bold flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: '#FFD70030',
                    border: '2px solid #FFD700',
                    color: '#FFD700',
                  }}
                >
                  ← PREVIOUS
                </motion.button>

                <div className="flex gap-2">
                  {PUZZLES.map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full transition-all"
                      style={{
                        background: i === previewIndex ? '#FFD700' : '#FFD70040',
                        boxShadow: i === previewIndex ? '0 0 10px #FFD700' : 'none',
                      }}
                    />
                  ))}
                </div>

                {previewIndex < PUZZLES.length - 1 ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPreviewIndex(previewIndex + 1)}
                    className="px-6 py-3 rounded-lg font-bold flex items-center gap-2"
                    style={{
                      background: '#FFD70030',
                      border: '2px solid #FFD700',
                      color: '#FFD700',
                    }}
                  >
                    NEXT →
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPreviewMode(false)}
                    className="px-6 py-3 rounded-lg font-bold"
                    style={{
                      background: '#FFD700',
                      color: '#000',
                      boxShadow: '0 0 20px #FFD70060',
                    }}
                  >
                    START SOLVING
                  </motion.button>
                )}
              </div>

              <p className="text-center text-xs opacity-50 mt-6">
                Review all questions before starting. You'll fill a 3×3 crossword grid.
              </p>
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
        <h2 className="text-3xl font-bold mb-2" style={{ color: '#FFD700' }}>
          CIPHER GRID
        </h2>
        <p className="text-sm opacity-70">Complete the 3×3 Crossword</p>
      </motion.div>

      {/* Question */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-6 p-4 rounded-lg max-w-2xl text-center"
        style={{ background: '#FFD70015', border: '1px solid #FFD70040' }}
      >
        <p className="text-sm font-bold mb-2" style={{ color: '#FFD700' }}>ALL CLUES:</p>
        <div className="grid grid-cols-2 gap-3 text-left text-sm">
          <div>
            <p className="font-bold mb-1 opacity-70">HORIZONTAL:</p>
            {PUZZLES.filter(p => p.direction === 'horizontal').map((p, i) => (
              <p key={i} className="mb-1 text-xs opacity-80">
                Row {p.startPos[0] + 1}: {p.question}
              </p>
            ))}
          </div>
          <div>
            <p className="font-bold mb-1 opacity-70">VERTICAL:</p>
            {PUZZLES.filter(p => p.direction === 'vertical').map((p, i) => (
              <p key={i} className="mb-1 text-xs opacity-80">
                Col {p.startPos[1] + 1}: {p.question}
              </p>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Grid */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-6"
      >
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
          {grid.map((row, rowIndex) =>
            row.map((letter, colIndex) => (
              <motion.button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => setSelectedCell([rowIndex, colIndex])}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  boxShadow: selectedCell?.[0] === rowIndex && selectedCell?.[1] === colIndex
                    ? '0 0 30px #FFD700'
                    : feedback === 'correct'
                    ? '0 0 20px #00FF88'
                    : feedback === 'wrong'
                    ? '0 0 20px #FF2E63'
                    : '0 0 10px #FFD70040',
                  borderColor: selectedCell?.[0] === rowIndex && selectedCell?.[1] === colIndex
                    ? '#FFD700'
                    : feedback === 'correct'
                    ? '#00FF88'
                    : feedback === 'wrong'
                    ? '#FF2E63'
                    : '#FFD70060',
                }}
                className="w-20 h-20 flex items-center justify-center text-4xl font-bold rounded-lg transition-all duration-200 cursor-pointer"
                style={{
                  background: letter
                    ? feedback === 'correct'
                      ? '#00FF8820'
                      : feedback === 'wrong'
                      ? '#FF2E6320'
                      : '#FFD70030'
                    : '#FFD70010',
                  border: '2px solid',
                  color: letter ? '#FFD700' : '#FFD70040',
                }}
                disabled={isLocked || feedback !== null}
              >
                {letter || ''}
              </motion.button>
            ))
          )}
        </div>
      </motion.div>

      {/* Controls */}
      <div className="flex gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={checkAnswer}
          disabled={isLocked || feedback !== null}
          className="px-8 py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: '#FFD700',
            color: '#000',
            boxShadow: '0 0 20px #FFD70040',
          }}
        >
          SUBMIT
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setPreviewMode(true);
            setPreviewIndex(0);
          }}
          disabled={isLocked || feedback !== null}
          className="px-6 py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: '#8B5CF630',
            border: '2px solid #8B5CF6',
            color: '#8B5CF6',
          }}
        >
          REVIEW QUESTIONS
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={clearGrid}
          disabled={isLocked || feedback !== null}
          className="px-6 py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{
            background: '#FF2E6330',
            border: '2px solid #FF2E63',
            color: '#FF2E63',
          }}
        >
          <Trash2 size={20} />
          CLEAR
        </motion.button>
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl font-bold z-40"
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
      <div className="absolute bottom-8 text-center text-xs opacity-60 max-w-md">
        <p>Click a cell to select it, then type a letter. Build words horizontally and vertically.</p>
        <p className="mt-1" style={{ color: '#FF2E63' }}>
          Wrong answer = 2 minute lockout
        </p>
      </div>
    </div>
  );
}
