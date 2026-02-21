import { motion } from 'framer-motion';
import { Palette, Eye, Brain, TrendingUp, Clock, Crown, Scroll, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Trial } from '@/types/game';

interface IndividualTrialInfoProps {
  isOpen: boolean;
  onClose: () => void;
  trial: Trial;
}

const trialDetails = {
  colorSigil: {
    icon: Palette,
    color: '#FFD700',
    howItWorks: [
      'A sequence of colored symbols will be displayed',
      'Memorize the color pattern and order',
      'Reproduce the exact sequence',
      'Each correct answer unlocks the next level',
    ],
    rules: [
      'You have 30 seconds to study the pattern',
      'Pattern complexity increases with each level',
      'Must match all colors in correct order',
      '3 levels must be completed to pass',
      'No hints or retries during active sequence',
    ],
    objective: 'Test your chromatic memory and color recognition skills',
    difficulty: 'Beginner',
  },
  logicLabyrinth: {
    icon: Brain,
    color: '#00F0FF',
    howItWorks: [
      'Navigate through a maze of logical puzzles',
      'Apply deduction to find the correct path',
      'Chain multiple logic gates together',
      'Reach the exit using pure reasoning',
    ],
    rules: [
      'Each decision unlocks or locks paths',
      'Must solve 4 interconnected logic puzzles',
      'Wrong choices may create dead ends',
      'Can backtrack but time keeps running',
      'Final solution must be logically coherent',
    ],
    objective: 'Master logical reasoning and deductive thinking',
    difficulty: 'Intermediate',
  },
  patternOracle: {
    icon: TrendingUp,
    color: '#8B5CF6',
    howItWorks: [
      'Study a sequence of numbers or shapes',
      'Identify the underlying pattern rule',
      'Predict the next element in the sequence',
      'Patterns increase in complexity',
    ],
    rules: [
      'Sequences can be mathematical or visual',
      'Must complete 3 different pattern types',
      'Each pattern has only one correct answer',
      'Time limit: 45 seconds per pattern',
      'Bonus points for identifying pattern rule',
    ],
    objective: 'Develop pattern recognition and predictive analysis',
    difficulty: 'Intermediate',
  },
  memoryOfCrown: {
    icon: Crown,
    color: '#FFD700',
    howItWorks: [
      'Royal artifacts are shown in succession',
      'Memorize positions, colors, and symbols',
      'Reconstruct the complete arrangement',
      'Challenge your short-term memory limits',
    ],
    rules: [
      'Up to 12 items shown simultaneously',
      'View time: 15 seconds',
      'Must recall positions and attributes',
      'Perfect recall required to pass',
      'High difficulty memory challenge',
    ],
    objective: 'Push your memory capacity to royal limits',
    difficulty: 'Advanced',
  },
  finalOath: {
    icon: Scroll,
    color: '#FF2E63',
    howItWorks: [
      'Multi-stage challenge combining all previous trials',
      'Solve interconnected puzzles in sequence',
      'Each stage builds on previous solutions',
      'Prove your mastery of all cognitive domains',
    ],
    rules: [
      'Combines elements from all previous trials',
      'Cannot skip or retry individual stages',
      'Time limit: 5 minutes for entire sequence',
      'One mistake fails the entire trial',
      'Only the worthy may claim the throne',
    ],
    objective: 'Demonstrate complete mastery and claim sovereignty',
    difficulty: 'Master',
  },
};

export default function IndividualTrialInfo({ isOpen, onClose, trial }: IndividualTrialInfoProps) {
  const details = trialDetails[trial.id];
  const Icon = details.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-void/95 border-2 text-foreground max-h-[90vh] overflow-y-auto" style={{ borderColor: details.color }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="relative text-center mb-6">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-4"
              style={{
                background: `radial-gradient(circle, ${details.color}30 0%, transparent 70%)`,
                border: `2px solid ${details.color}`,
                boxShadow: `0 0 40px ${details.color}80, inset 0 0 20px ${details.color}30`,
              }}
            >
              <Icon size={48} style={{ color: details.color }} strokeWidth={1.5} />
            </motion.div>

            <h2
              className="text-3xl md:text-4xl font-bold mb-2"
              style={{ color: details.color, fontFamily: 'var(--font-display)' }}
            >
              {trial.name.toUpperCase()}
            </h2>
            <p className="text-sm tracking-[0.3em] opacity-70 mb-2" style={{ fontFamily: 'var(--font-body)' }}>
              {trial.description}
            </p>
            <div className="inline-block px-4 py-1 rounded-full text-xs font-bold" style={{ background: `${details.color}20`, color: details.color }}>
              {details.difficulty}
            </div>
            <div className="w-32 h-px mx-auto mt-4" style={{ background: `linear-gradient(90deg, transparent, ${details.color}, transparent)` }} />
          </div>

          {/* Objective */}
          <div className="mb-6 p-4 rounded-lg text-center" style={{ background: `${details.color}15`, border: `2px solid ${details.color}40` }}>
            <h3 className="text-sm font-bold mb-2 tracking-widest" style={{ color: details.color }}>
              OBJECTIVE
            </h3>
            <p className="text-base" style={{ fontFamily: 'var(--font-body)' }}>
              {details.objective}
            </p>
          </div>

          {/* How It Works */}
          <div className="mb-6 p-4 rounded-lg" style={{ background: `${details.color}10`, border: `1px solid ${details.color}30` }}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: details.color }}>
              <Icon size={20} />
              <span>How It Works</span>
            </h3>
            <div className="space-y-3">
              {details.howItWorks.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="flex gap-3"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: `${details.color}30`, color: details.color }}>
                    {i + 1}
                  </div>
                  <p className="text-sm flex-1 pt-1" style={{ fontFamily: 'var(--font-body)' }}>
                    {step}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Rules */}
          <div className="mb-6 p-4 rounded-lg" style={{ background: `${details.color}10`, border: `1px solid ${details.color}30` }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: details.color }}>
              Trial Rules
            </h3>
            <ul className="space-y-2">
              {details.rules.map((rule, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="flex items-start gap-2 text-sm"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  <span style={{ color: details.color }} className="flex-shrink-0 mt-1">▸</span>
                  <span className="flex-1">{rule}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full px-6 py-3 rounded font-bold transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, ${details.color}20, ${details.color}40)`,
              border: `2px solid ${details.color}`,
              color: details.color,
              boxShadow: `0 0 20px ${details.color}40`,
            }}
          >
            Got It!
          </button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
