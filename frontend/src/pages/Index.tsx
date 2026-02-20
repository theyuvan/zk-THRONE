import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ThroneHall from '@/components/ThroneHall';
import PortalRoom from '@/components/PortalRoom';
import TrialScene from '@/components/TrialScene';
import ProofScene from '@/components/ProofScene';
import ThroneClaim from '@/components/ThroneClaim';
import KingReveal from '@/components/KingReveal';
import { GameScene, GameState, Trial, TrialMode, TRIALS } from '@/types/game';

const initialState: GameState = {
  scene: 'throneHall',
  selectedMode: null,
  trialsCompleted: 0,
  totalTrials: 3,
  currentTrial: null,
  activatedPortals: [],
};

function SceneTransition({ children, sceneKey }: { children: React.ReactNode; sceneKey: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={sceneKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default function Index() {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [selectedTrials, setSelectedTrials] = useState<Trial[]>([]);

  const goTo = useCallback((scene: GameScene, extra?: Partial<GameState>) => {
    setGameState(prev => ({ ...prev, scene, ...extra }));
  }, []);

  const handleEnterThrone = useCallback(() => {
    goTo('portalRoom');
  }, [goTo]);

  const handleSelectMode = useCallback((mode: TrialMode, trials: Trial[]) => {
    setSelectedTrials(trials);
    const firstTrial = trials[0];
    setGameState(prev => ({
      ...prev,
      scene: 'trial' as GameScene,
      selectedMode: mode,
      totalTrials: mode,
      trialsCompleted: 0,
      currentTrial: firstTrial,
      activatedPortals: [],
    }));
  }, []);

  const handleTrialComplete = useCallback(() => {
    setGameState(prev => {
      const nextCompleted = prev.trialsCompleted + 1;
      const nextTrial = selectedTrials[nextCompleted];

      if (nextCompleted >= prev.totalTrials || !nextTrial) {
        return { ...prev, scene: 'proof', trialsCompleted: nextCompleted };
      }

      return {
        ...prev,
        trialsCompleted: nextCompleted,
        currentTrial: nextTrial,
        activatedPortals: [...prev.activatedPortals, prev.currentTrial?.id || ''].filter(Boolean),
      };
    });
  }, [selectedTrials]);

  const handleProofComplete = useCallback(() => {
    goTo('throneClaim');
  }, [goTo]);

  const handleThroneClaimComplete = useCallback(() => {
    goTo('kingReveal');
  }, [goTo]);

  const handleRestart = useCallback(() => {
    setGameState(initialState);
    setSelectedTrials([]);
  }, []);

  const renderScene = () => {
    switch (gameState.scene) {
      case 'throneHall':
        return (
          <SceneTransition sceneKey="throneHall">
            <ThroneHall onEnter={handleEnterThrone} />
          </SceneTransition>
        );

      case 'portalRoom':
        return (
          <SceneTransition sceneKey="portalRoom">
            <PortalRoom
              onSelectMode={handleSelectMode}
              onBack={() => goTo('throneHall')}
            />
          </SceneTransition>
        );

      case 'trial':
        if (!gameState.currentTrial) return null;
        return (
          <SceneTransition sceneKey={`trial-${gameState.trialsCompleted}`}>
            <TrialScene
              trial={gameState.currentTrial}
              trialNumber={gameState.trialsCompleted + 1}
              totalTrials={gameState.totalTrials}
              onComplete={handleTrialComplete}
              onBack={() => goTo('portalRoom')}
            />
          </SceneTransition>
        );

      case 'proof':
        return (
          <SceneTransition sceneKey="proof">
            <ProofScene onComplete={handleProofComplete} />
          </SceneTransition>
        );

      case 'throneClaim':
        return (
          <SceneTransition sceneKey="throneClaim">
            <ThroneClaim onComplete={handleThroneClaimComplete} />
          </SceneTransition>
        );

      case 'kingReveal':
        return (
          <SceneTransition sceneKey="kingReveal">
            <KingReveal onRestart={handleRestart} />
          </SceneTransition>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-screen h-screen bg-void overflow-hidden font-body">
      {renderScene()}
    </div>
  );
}
