// ============================================================================
// TRIAL QUESTION SETS - 10 VARIATIONS PER TRIAL
// ============================================================================
// Each trial has 10 different question sets for variety and replayability
// Frontend randomly selects one set, backend validates any correct solution
// ============================================================================

/**
 * CIPHER GRID - 10 different 3x3 crossword puzzles
 * Players solve crossword-style grid puzzles
 */
const CIPHER_GRID_SETS = [
  {
    id: 1,
    theme: "Animals & Nature",
    puzzles: [
      { question: 'Feline pet (3 letters)', answer: 'CAT', startPos: [0, 0], direction: 'horizontal' },
      { question: 'Winged mammal (3 letters)', answer: 'BAT', startPos: [1, 0], direction: 'horizontal' },
      { question: 'Rodent in a lab (3 letters)', answer: 'RAT', startPos: [2, 0], direction: 'horizontal' },
      { question: 'Horse-drawn vehicle (3 letters)', answer: 'CAB', startPos: [0, 0], direction: 'vertical' },
      { question: 'What you eat with (3 letters)', answer: 'ATE', startPos: [0, 1], direction: 'vertical' },
      { question: 'Faucet (3 letters)', answer: 'TAP', startPos: [0, 2], direction: 'vertical' },
    ]
  },
  {
    id: 2,
    theme: "Time & War",
    puzzles: [
      { question: 'Armed conflict (3 letters)', answer: 'WAR', startPos: [0, 0], direction: 'horizontal' },
      { question: 'Historical period (3 letters)', answer: 'ERA', startPos: [1, 0], direction: 'horizontal' },
      { question: 'Number after nine (3 letters)', answer: 'TEN', startPos: [2, 0], direction: 'horizontal' },
      { question: 'Moist (3 letters)', answer: 'WET', startPos: [0, 0], direction: 'vertical' },
      { question: 'Plural of is (3 letters)', answer: 'ARE', startPos: [0, 1], direction: 'vertical' },
      { question: 'Past of run (3 letters)', answer: 'RAN', startPos: [0, 2], direction: 'vertical' },
    ]
  },
  {
    id: 3,
    theme: "Food & Kitchen",
    puzzles: [
      { question: 'What you eat (3 letters)', answer: 'PIE', startPos: [0, 0], direction: 'horizontal' },
      { question: 'Past of eat (3 letters)', answer: 'ATE', startPos: [1, 0], direction: 'horizontal' },
      { question: 'Cooking vessel (3 letters)', answer: 'PAN', startPos: [2, 0], direction: 'horizontal' },
      { question: 'Writing tool (3 letters)', answer: 'PEN', startPos: [0, 0], direction: 'vertical' },
      { question: 'A long time (3 letters)', answer: 'AGE', startPos: [1, 0], direction: 'vertical' },
      { question: 'Finish (3 letters)', answer: 'END', startPos: [2, 0], direction: 'vertical' },
    ]
  },
  {
    id: 4,
    theme: "Ocean & Sky",
    puzzles: [
      { question: 'Ocean (3 letters)', answer: 'SEA', startPos: [0, 0], direction: 'horizontal' },
      { question: 'Frozen water (3 letters)', answer: 'ICE', startPos: [1, 0], direction: 'horizontal' },
      { question: 'Solar energy (3 letters)', answer: 'SUN', startPos: [2, 0], direction: 'horizontal' },
      { question: 'To steal (3 letters)', answer: 'SIC', startPos: [0, 0], direction: 'vertical' },
      { question: 'Start (3 letters)', answer: 'EMU', startPos: [1, 0], direction: 'vertical' },
      { question: 'Jog (3 letters)', answer: 'RUN', startPos: [2, 0], direction: 'vertical' },
    ]
  },
  {
    id: 5,
    theme: "Colors & Art",
    puzzles: [
      { question: 'Primary color (3 letters)', answer: 'RED', startPos: [0, 0], direction: 'horizontal' },
      { question: 'Past of see (3 letters)', answer: 'SAW', startPos: [1, 0], direction: 'horizontal' },
      { question: 'What you win (3 letters)', answer: 'CUP', startPos: [2, 0], direction: 'horizontal' },
      { question: 'Tree fluid (3 letters)', answer: 'SAP', startPos: [0, 0], direction: 'vertical' },
      { question: 'Not old (3 letters)', answer: 'NEW', startPos: [1, 0], direction: 'vertical' },
      { question: 'Male child (3 letters)', answer: 'SON', startPos: [2, 0], direction: 'vertical' },
    ]
  },
  {
    id: 6,
    theme: "Transportation",
    puzzles: [
      { question: 'Public transport (3 letters)', answer: 'BUS', startPos: [0, 0], direction: 'horizontal' },
      { question: 'Taxi (3 letters)', answer: 'CAB', startPos: [1, 0], direction: 'horizontal' },
      { question: 'Vessel (3 letters)', answer: 'JET', startPos: [2, 0], direction: 'horizontal' },
      { question: 'Male bee (3 letters)', answer: 'BAJ', startPos: [0, 0], direction: 'vertical' },
      { question: 'Speaking ability (3 letters)', answer: 'USE', startPos: [1, 0], direction: 'vertical' },
      { question: 'Male person (3 letters)', answer: 'MAN', startPos: [2, 0], direction: 'vertical' },
    ]
  },
  {
    id: 7,
    theme: "Numbers & Math",
    puzzles: [
      { question: 'Number after one (3 letters)', answer: 'TWO', startPos: [0, 0], direction: 'horizontal' },
      { question: 'Circle shape (3 letters)', answer: 'ORB', startPos: [1, 0], direction: 'horizontal' },
      { question: 'Before (3 letters)', answer: 'ERE', startPos: [2, 0], direction: 'horizontal' },
      { question: 'Upper limb (3 letters)', answer: 'ARM', startPos: [0, 0], direction: 'vertical' },
      { question: 'Possess (3 letters)', answer: 'OWE', startPos: [1, 0], direction: 'vertical' },
      { question: 'Not false (3 letters)', answer: 'TRUE', startPos: [2, 0], direction: 'vertical' },
    ]
  },
  {
    id: 8,
    theme: "Sports & Games",
    puzzles: [
      { question: 'Sports contest (3 letters)', answer: 'WIN', startPos: [0, 0], direction: 'horizontal' },
      { question: 'Not him (3 letters)', answer: 'HER', startPos: [1, 0], direction: 'horizontal' },
      { question: 'Internet URL (3 letters)', answer: 'WEB', startPos: [2, 0], direction: 'horizontal' },
      { question: 'Opposite of no (3 letters)', answer: 'YES', startPos: [0, 0], direction: 'vertical' },
      { question: 'Exist (3 letters)', answer: 'ARE', startPos: [1, 0], direction: 'vertical' },
      { question: 'Small carpet (3 letters)', answer: 'RUG', startPos: [2, 0], direction: 'vertical' },
    ]
  },
  {
    id: 9,
    theme: "House & Home",
    puzzles: [
      { question: 'Sleep furniture (3 letters)', answer: 'BED', startPos: [0, 0], direction: 'horizontal' },
      { question: 'Small insect (3 letters)', answer: 'ANT', startPos: [1, 0], direction: 'horizontal' },
      { question: 'Cooking pot (3 letters)', answer: 'POT', startPos: [2, 0], direction: 'horizontal' },
      { question: 'Flight mammal (3 letters)', answer: 'BAT', startPos: [0, 0], direction: 'vertical' },
      { question: 'Not on (3 letters)', answer: 'OFF', startPos: [1, 0], direction: 'vertical' },
      { question: 'Head covering (3 letters)', answer: 'HAT', startPos: [2, 0], direction: 'vertical' },
    ]
  },
  {
    id: 10,
    theme: "Body & Health",
    puzzles: [
      { question: 'Vision organ (3 letters)', answer: 'EYE', startPos: [0, 0], direction: 'horizontal' },
      { question: 'Hand digit (3 letters)', answer: 'TOE', startPos: [1, 0], direction: 'horizontal' },
      { question: 'Lower limb (3 letters)', answer: 'LEG', startPos: [2, 0], direction: 'horizontal' },
      { question: 'To consume food (3 letters)', answer: 'EAT', startPos: [0, 0], direction: 'vertical' },
      { question: 'Opposite of yes (3 letters)', answer: 'NO', startPos: [1, 0], direction: 'vertical' },
      { question: 'Self (3 letters)', answer: 'EGO', startPos: [2, 0], direction: 'vertical' },
    ]
  }
];

/**
 * COLOR SIGIL - 10 different color sequence patterns
 * Players memorize and repeat color sequences
 */
const COLOR_SIGIL_SETS = [
  { id: 1, sequence: ['red', 'blue', 'yellow', 'green'], theme: 'Primary Colors' },
  { id: 2, sequence: ['purple', 'orange', 'cyan', 'magenta'], theme: 'Secondary Colors' },
  { id: 3, sequence: ['red', 'red', 'blue', 'yellow', 'green'], theme: 'Double Start' },
  { id: 4, sequence: ['green', 'yellow', 'blue', 'red'], theme: 'Reverse Rainbow' },
  { id: 5, sequence: ['blue', 'blue', 'green', 'green', 'red'], theme: 'Pairs' },
  { id: 6, sequence: ['yellow', 'red', 'blue', 'red', 'yellow'], theme: 'Palindrome' },
  { id: 7, sequence: ['cyan', 'magenta', 'yellow', 'cyan'], theme: 'Printer Colors' },
  { id: 8, sequence: ['red', 'orange', 'yellow', 'green', 'blue'], theme: 'Rainbow Short' },
  { id: 9, sequence: ['purple', 'red', 'purple', 'blue'], theme: 'Royal Pattern' },
  { id: 10, sequence: ['green', 'blue', 'green', 'yellow', 'green'], theme: 'Nature Dominant' }
];

/**
 * LOGIC LABYRINTH - 10 different logic gate patterns
 * Players navigate through logic gates to reach the goal
 */
const LOGIC_LABYRINTH_SETS = [
  {
    id: 1,
    theme: 'Simple Path',
    gates: [
      { type: 'AND', inputs: [true, true], position: [1, 1] },
      { type: 'OR', inputs: [false, true], position: [2, 1] },
      { type: 'NOT', inputs: [false], position: [3, 1] }
    ],
    solution: 'RIGHT-RIGHT-RIGHT'
  },
  {
    id: 2,
    theme: 'Complex Maze',
    gates: [
      { type: 'XOR', inputs: [true, false], position: [1, 1] },
      { type: 'AND', inputs: [true, true], position: [1, 2] },
      { type: 'OR', inputs: [false, false], position: [2, 1] }
    ],
    solution: 'RIGHT-DOWN-RIGHT'
  },
  {
    id: 3,
    theme: 'Vertical Challenge',
    gates: [
      { type: 'NOT', inputs: [false], position: [1, 1] },
      { type: 'AND', inputs: [true, false], position: [2, 1] },
      { type: 'OR', inputs: [true, true], position: [3, 1] }
    ],
    solution: 'DOWN-DOWN-RIGHT'
  },
  {
    id: 4,
    theme: 'Split Decision',
    gates: [
      { type: 'XOR', inputs: [false, false], position: [1, 1] },
      { type: 'NOT', inputs: [true], position: [1, 2] },
      { type: 'AND', inputs: [true, true], position: [2, 2] }
    ],
    solution: 'DOWN-RIGHT-RIGHT'
  },
  {
    id: 5,
    theme: 'Logic Loop',
    gates: [
      { type: 'OR', inputs: [true, false], position: [1, 1] },
      { type: 'XOR', inputs: [true, true], position: [2, 1] },
      { type: 'NOT', inputs: [false], position: [3, 1] }
    ],
    solution: 'RIGHT-RIGHT-UP'
  },
  {
    id: 6,
    theme: 'Diagonal Path',
    gates: [
      { type: 'AND', inputs: [false, true], position: [1, 1] },
      { type: 'NOT', inputs: [true], position: [2, 2] },
      { type: 'OR', inputs: [true, true], position: [3, 3] }
    ],
    solution: 'DOWN-RIGHT-DOWN'
  },
  {
    id: 7,
    theme: 'Gate Maze',
    gates: [
      { type: 'XOR', inputs: [true, true], position: [1, 1] },
      { type: 'AND', inputs: [true, false], position: [1, 2] },
      { type: 'OR', inputs: [false, true], position: [2, 2] }
    ],
    solution: 'DOWN-RIGHT-UP'
  },
  {
    id: 8,
    theme: 'Binary Paths',
    gates: [
      { type: 'NOT', inputs: [true], position: [1, 1] },
      { type: 'NOT', inputs: [false], position: [2, 1] },
      { type: 'XOR', inputs: [false, true], position: [3, 1] }
    ],
    solution: 'RIGHT-RIGHT-DOWN'
  },
  {
    id: 9,
    theme: 'Logic Puzzle',
    gates: [
      { type: 'OR', inputs: [false, false], position: [1, 1] },
      { type: 'AND', inputs: [true, true], position: [2, 1] },
      { type: 'NOT', inputs: [true], position: [2, 2] }
    ],
    solution: 'RIGHT-DOWN-RIGHT'
  },
  {
    id: 10,
    theme: 'Final Challenge',
    gates: [
      { type: 'XOR', inputs: [true, false], position: [1, 1] },
      { type: 'OR', inputs: [true, false], position: [1, 2] },
      { type: 'AND', inputs: [false, false], position: [2, 2] }
    ],
    solution: 'RIGHT-DOWN-DOWN'
  }
];

module.exports = {
  CIPHER_GRID_SETS,
  COLOR_SIGIL_SETS,
  LOGIC_LABYRINTH_SETS
};
