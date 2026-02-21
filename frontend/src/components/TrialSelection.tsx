import { motion } from 'framer-motion';
import { Shuffle, Info, Check } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Trial } from '@/types/game';
import IndividualTrialInfo from './IndividualTrialInfo';

interface TrialSelectionProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedTrials: Trial[]) => void;
  mode: 1 | 3 | 5;
  allTrials: Trial[];
}

export default function TrialSelection({ isOpen, onClose, onConfirm, mode, allTrials }: TrialSelectionProps) {
  const [selectedTrials, setSelectedTrials] = useState<Trial[]>([]);
  const [selectedTrialInfo, setSelectedTrialInfo] = useState<Trial | null>(null);

  const modeColors = {
    1: '#00F0FF',
    3: '#FFD700',
    5: '#FF2E63',
  };

  const color = modeColors[mode];
  const isFixed = mode === 5; // 5-trial mode has all trials fixed

  const toggleTrial = (trial: Trial) => {
    if (isFixed) return; // Can't change for 5-trial mode

    const isSelected = selectedTrials.some(t => t.id === trial.id);
    
    if (isSelected) {
      setSelectedTrials(selectedTrials.filter(t => t.id !== trial.id));
    } else {
      if (selectedTrials.length < mode) {
        setSelectedTrials([...selectedTrials, trial]);
      }
    }
  };

  const randomizeTrials = () => {
    if (isFixed) return;

    const shuffled = [...allTrials].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, mode);
    setSelectedTrials(selected);
  };

  const handleConfirm = () => {
    if (isFixed) {
      onConfirm(allTrials);
    } else {
      if (selectedTrials.length === mode) {
        onConfirm(selectedTrials);
      }
    }
  };

  const isTrialSelected = (trial: Trial) => {
    if (isFixed) return true;
    return selectedTrials.some(t => t.id === trial.id);
  };

  const getTrialNumber = (trial: Trial) => {
    if (isFixed) {
      return allTrials.findIndex(t => t.id === trial.id) + 1;
    }
    return selectedTrials.findIndex(t => t.id === trial.id) + 1;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl bg-void/95 border-2 text-foreground max-h-[90vh] overflow-y-auto" style={{ borderColor: color }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <h2
                className="text-2xl md:text-3xl font-bold mb-2"
                style={{ color, fontFamily: 'var(--font-display)' }}
              >
                {isFixed ? 'YOUR TRIALS' : 'SELECT YOUR TRIALS'}
              </h2>
              <p className="text-sm tracking-[0.3em] opacity-70 mb-3" style={{ fontFamily: 'var(--font-body)' }}>
                {isFixed 
                  ? 'All 5 trials must be completed in order'
                  : `Choose ${mode} ${mode === 1 ? 'trial' : 'trials'} for your arena`
                }
              </p>
              {!isFixed && (
                <div className="text-xs opacity-60">
                  Selected: {selectedTrials.length} / {mode}
                </div>
              )}
            </div>

            {/* Random Button (only for non-fixed modes) */}
            {!isFixed && (
              <div className="mb-6 flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={randomizeTrials}
                  className="px-6 py-3 rounded-lg font-bold transition-all duration-300 flex items-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${color}20, ${color}30)`,
                    border: `2px solid ${color}`,
                    color,
                    boxShadow: `0 0 15px ${color}30`,
                  }}
                >
                  <Shuffle size={20} />
                  <span>Random Selection</span>
                </motion.button>
              </div>
            )}

            {/* Trial Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {allTrials.map((trial, index) => {
                const selected = isTrialSelected(trial);
                const trialNum = getTrialNumber(trial);
                
                return (
                  <motion.div
                    key={trial.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className={`relative p-4 rounded-lg border-2 transition-all duration-300 ${!isFixed ? 'cursor-pointer' : ''}`}
                    style={{
                      borderColor: selected ? trial.portalColor : 'hsl(var(--border))',
                      background: selected ? `${trial.portalColor}15` : 'hsl(var(--card))',
                      boxShadow: selected ? `0 0 20px ${trial.portalColor}40` : 'none',
                      opacity: !isFixed && !selected && selectedTrials.length >= mode ? 0.5 : 1,
                    }}
                    onClick={() => !isFixed && toggleTrial(trial)}
                  >
                    {/* Selection indicator */}
                    {selected && (
                      <div
                        className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                        style={{
                          background: trial.portalColor,
                          color: '#000',
                        }}
                      >
                        {trialNum}
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: `${trial.portalColor}30`,
                          border: `2px solid ${trial.portalColor}`,
                        }}
                      >
                        {selected && <Check size={24} style={{ color: trial.portalColor }} />}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-1" style={{ color: trial.portalColor, fontFamily: 'var(--font-display)' }}>
                          {trial.name}
                        </h3>
                        <p className="text-xs opacity-70 mb-2" style={{ fontFamily: 'var(--font-body)' }}>
                          {trial.description}
                        </p>
                        
                        {/* Info button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTrialInfo(trial);
                          }}
                          className="text-xs flex items-center gap-1 px-3 py-1 rounded transition-all"
                          style={{
                            color: trial.portalColor,
                            background: `${trial.portalColor}20`,
                            border: `1px solid ${trial.portalColor}40`,
                          }}
                        >
                          <Info size={14} />
                          <span>View Details</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded border-2 transition-all duration-300 hover:bg-white/5"
                style={{ borderColor: 'hsl(var(--border))' }}
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isFixed && selectedTrials.length !== mode}
                className="flex-1 px-6 py-3 rounded font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(135deg, ${color}20, ${color}40)`,
                  border: `2px solid ${color}`,
                  color,
                  boxShadow: (isFixed || selectedTrials.length === mode) ? `0 0 20px ${color}40` : 'none',
                }}
              >
                {isFixed ? 'Continue →' : `Confirm Selection (${selectedTrials.length}/${mode})`}
              </button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Individual Trial Info Dialog */}
      {selectedTrialInfo && (
        <IndividualTrialInfo
          isOpen={!!selectedTrialInfo}
          onClose={() => setSelectedTrialInfo(null)}
          trial={selectedTrialInfo}
        />
      )}
    </>
  );
}
