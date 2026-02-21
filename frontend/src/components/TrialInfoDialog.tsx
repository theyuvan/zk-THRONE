import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Shield, Swords, Zap, Lock, Trophy } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface TrialInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  mode: 1 | 3 | 5;
}

const modeInfo = {
  1: {
    title: '1 TRIAL — INITIATE PATH',
    subtitle: 'The Path of Discovery',
    icon: Shield,
    color: '#00F0FF',
    difficulty: 'Beginner',
    description: 'Begin your journey to sovereignty. Complete one fundamental trial to prove your worth.',
    trials: ['Cipher Grid'],
  },
  3: {
    title: '3 TRIALS — CHAMPION PATH',
    subtitle: 'The Path of Mastery',
    icon: Swords,
    color: '#FFD700',
    difficulty: 'Intermediate',
    description: 'Challenge yourself with three diverse trials. Only true champions reach this level.',
    trials: ['Cipher Grid', 'Logic Labyrinth', 'Pattern Oracle'],
  },
  5: {
    title: "5 TRIALS — KING'S PATH",
    subtitle: 'The Path of Ultimate Sovereignty',
    icon: Crown,
    color: '#FF2E63',
    difficulty: 'Master',
    description: 'Face all five trials and claim the throne. The ultimate test of intelligence, speed, and strategy.',
    trials: ['Cipher Grid', 'Logic Labyrinth', 'Pattern Oracle', 'Memory of Crown', 'Thronebreaker Protocol'],
  },
};

export default function TrialInfoDialog({ isOpen, onClose, onContinue, mode }: TrialInfoDialogProps) {
  const info = modeInfo[mode];
  const Icon = info.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-void/95 border-2 text-foreground max-h-[90vh] overflow-y-auto" style={{ borderColor: info.color }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="relative text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-4"
              style={{
                background: `radial-gradient(circle, ${info.color}30 0%, transparent 70%)`,
                border: `2px solid ${info.color}`,
                boxShadow: `0 0 30px ${info.color}60`,
              }}
            >
              <Icon size={48} style={{ color: info.color }} strokeWidth={1.5} />
            </motion.div>

            <h2
              className="text-3xl md:text-4xl font-bold mb-2"
              style={{ color: info.color, fontFamily: 'var(--font-display)' }}
            >
              {info.title}
            </h2>
            <p className="text-sm tracking-[0.3em] opacity-70" style={{ fontFamily: 'var(--font-body)' }}>
              {info.subtitle}
            </p>
            <div className="w-32 h-px mx-auto mt-4" style={{ background: `linear-gradient(90deg, transparent, ${info.color}, transparent)` }} />
          </div>

          {/* Game Rules Section */}
          <div className="mb-6 p-4 rounded-lg" style={{ background: `${info.color}10`, border: `1px solid ${info.color}30` }}>
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2" style={{ color: info.color }}>
              <Zap size={20} />
              <span>Game Rules</span>
            </h3>
            <ul className="space-y-2 text-sm" style={{ fontFamily: 'var(--font-body)' }}>
              <li className="flex items-start gap-2">
                <span style={{ color: info.color }}>▸</span>
                <span>Complete all {mode} trials in sequence to progress</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: info.color }}>▸</span>
                <span>Each trial tests different cognitive abilities (memory, logic, patterns)</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: info.color }}>▸</span>
                <span>Solutions are verified using zero-knowledge proofs</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: info.color }}>▸</span>
                <span>First player to complete all trials and submit valid proofs becomes King</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: info.color }}>▸</span>
                <span>Only ONE King can exist per round</span>
              </li>
            </ul>
          </div>

          {/* How It Works Section */}
          <div className="mb-6 p-4 rounded-lg" style={{ background: `${info.color}10`, border: `1px solid ${info.color}30` }}>
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2" style={{ color: info.color }}>
              <Lock size={20} />
              <span>How It Works</span>
            </h3>
            <div className="space-y-3 text-sm" style={{ fontFamily: 'var(--font-body)' }}>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold" style={{ background: `${info.color}30`, color: info.color }}>
                  1
                </div>
                <div>
                  <p className="font-bold mb-1">Choose Your Path</p>
                  <p className="opacity-70">Select difficulty: {info.difficulty} ({mode} trials)</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold" style={{ background: `${info.color}30`, color: info.color }}>
                  2
                </div>
                <div>
                  <p className="font-bold mb-1">Host or Join a Game</p>
                  <p className="opacity-70">Create a new arena or join an existing battle</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold" style={{ background: `${info.color}30`, color: info.color }}>
                  3
                </div>
                <div>
                  <p className="font-bold mb-1">Complete Trials</p>
                  <p className="opacity-70">Solve puzzles privately - your solutions remain secret</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold" style={{ background: `${info.color}30`, color: info.color }}>
                  4
                </div>
                <div>
                  <p className="font-bold mb-1">Generate Proofs</p>
                  <p className="opacity-70">Create zero-knowledge proofs without revealing solutions</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold" style={{ background: `${info.color}30`, color: info.color }}>
                  5
                </div>
                <div>
                  <p className="font-bold mb-1">Claim the Throne</p>
                  <p className="opacity-70">First to verify all proofs wins and becomes King</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trial List */}
          <div className="mb-6 p-4 rounded-lg" style={{ background: `${info.color}10`, border: `1px solid ${info.color}30` }}>
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2" style={{ color: info.color }}>
              <Trophy size={20} />
              <span>Your Trials</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {info.trials.map((trial, i) => (
                <motion.div
                  key={trial}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="p-2 rounded flex items-center gap-2"
                  style={{ background: `${info.color}15` }}
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: info.color, color: '#000' }}>
                    {i + 1}
                  </div>
                  <span className="text-sm">{trial}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded border-2 transition-all duration-300 hover:bg-white/5"
              style={{ borderColor: 'hsl(var(--border))' }}
            >
              Cancel
            </button>
            <button
              onClick={onContinue}
              className="flex-1 px-6 py-3 rounded font-bold transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${info.color}20, ${info.color}40)`,
                border: `2px solid ${info.color}`,
                color: info.color,
                boxShadow: `0 0 20px ${info.color}40`,
              }}
            >
              Continue →
            </button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
