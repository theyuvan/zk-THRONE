import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ThroneHall from '@/components/ThroneHall';
import PortalRoom from '@/components/PortalRoom';
import TrialScene from '@/components/TrialScene';
import ProofScene from '@/components/ProofScene';
import ThroneClaim from '@/components/ThroneClaim';
import KingReveal from '@/components/KingReveal';
import { FinalLeaderboard } from '@/components/FinalLeaderboard';
import { GameScene, GameState, Trial, TrialMode, TRIALS, MultiplayerInfo } from '@/types/game';
import { useGame } from '@/hooks/useGame';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { useWallet } from '@/hooks/useWallet';
import { generateTrialSolution } from '@/utils/trialSolutions';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'throne-game-state';
const TRIALS_KEY = 'throne-selected-trials';

const initialState: GameState = {
  scene: 'throneHall',
  selectedMode: null,
  trialsCompleted: 0,
  totalTrials: 3,
  currentTrial: null,
  activatedPortals: [],
};

// Load saved state from localStorage
function loadSavedState(): { gameState: GameState; selectedTrials: Trial[] } {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    const savedTrials = localStorage.getItem(TRIALS_KEY);
    
    if (savedState && savedTrials) {
      const gameState = JSON.parse(savedState) as GameState;
      const selectedTrials = JSON.parse(savedTrials) as Trial[];
      console.log('📂 Restored saved progress:', gameState.trialsCompleted, '/', gameState.totalTrials);
      return { gameState, selectedTrials };
    }
  } catch (error) {
    console.warn('Failed to load saved state:', error);
  }
  return { gameState: initialState, selectedTrials: [] };
}

// Clear saved state
function clearSavedState() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TRIALS_KEY);
  console.log('🗑️  Cleared saved progress');
}

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
  const { gameState: savedGameState, selectedTrials: savedSelectedTrials } = loadSavedState();
  const [gameState, setGameState] = useState<GameState>(savedGameState);
  const [selectedTrials, setSelectedTrials] = useState<Trial[]>(savedSelectedTrials);
  const { submitSolution: submitSinglePlayer, isSubmitting } = useGame();
  const { submitSolution: submitMultiplayer, getFinalResults, getRoomState } = useMultiplayer();
  const { isConnected, connect, publicKey } = useWallet();
  const { toast } = useToast();

  // Poll for game state during multiplayer trials to detect when game ends
  useEffect(() => {
    if (!gameState.multiplayer || gameState.scene !== 'trial') return;

    const pollInterval = setInterval(async () => {
      try {
        const roomState = await getRoomState(gameState.multiplayer!.roomId);
        
        // Check if game finished
        if (roomState.state === 'FINISHED') {
          console.log('🏁 Game finished detected via polling!');
          clearInterval(pollInterval);
          
          // Fetch final results
          const finalResults = await getFinalResults(gameState.multiplayer!.roomId);
          const isWinner = finalResults.winner.wallet === publicKey;
          
          console.log(`🎯 Final results: Winner is ${finalResults.winner.wallet}`);
          console.log(`👤 Current player: ${publicKey}`);
          console.log(`🏆 Is winner: ${isWinner}`);
          
          if (isWinner) {
            toast({
              title: "🎉 VICTORY!",
              description: "You completed all trials first!",
            });
          } else {
            toast({
              title: "💀 DEFEATED",
              description: `${finalResults.winner.displayName} completed the trials first!`,
              variant: "destructive",
            });
          }
          
          // Go to leaderboard
          clearSavedState();
          setGameState(prev => ({ ...prev, scene: 'leaderboard' as GameScene }));
        }
      } catch (error) {
        console.error('❌ Failed to poll room state:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [gameState.multiplayer, gameState.scene, publicKey, getRoomState, getFinalResults, toast]);

  // Save state to localStorage whenever it changes (single-player only)
  useEffect(() => {
    if (!gameState.multiplayer && gameState.scene !== 'throneHall') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
      if (selectedTrials.length > 0) {
        localStorage.setItem(TRIALS_KEY, JSON.stringify(selectedTrials));
      }
    }
  }, [gameState, selectedTrials]);

  const goTo = useCallback((scene: GameScene, extra?: Partial<GameState>) => {
    setGameState(prev => ({ ...prev, scene, ...extra }));
  }, []);

  const handleEnterThrone = useCallback(() => {
    // Clear any saved progress when starting fresh from throne hall
    if (gameState.scene === 'throneHall' && gameState.trialsCompleted === 0) {
      clearSavedState();
    }
    goTo('portalRoom');
  }, [goTo, gameState.scene, gameState.trialsCompleted]);

  const handleSelectMode = useCallback((mode: TrialMode, trials: Trial[], multiplayerInfo?: MultiplayerInfo) => {
    console.log('🎮 handleSelectMode called with:', { mode, trialsCount: trials.length, multiplayerInfo });
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
      multiplayer: multiplayerInfo, // Store multiplayer info
    }));
  }, []);

  const handleTrialComplete = useCallback(async () => {
    try {
      // CRITICAL: Check wallet connection
      if (!isConnected) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your XBull wallet to submit trials.",
          variant: "destructive",
        });
        await connect();
        return;
      }

      // Generate solution token for current trial
      const currentTrialId = gameState.currentTrial?.id;
      if (!currentTrialId) {
        console.error('❌ No current trial ID');
        return;
      }

      const roundId = gameState.trialsCompleted + 1;
      const solution = generateTrialSolution(currentTrialId, roundId);
      
      console.log('\n╔═══════════════════════════════════════════════╗');
      console.log('║     TRIAL COMPLETED - SUBMITTING PROOF        ║');
      console.log('╚═══════════════════════════════════════════════╝');
      console.log('🎯 Trial:', currentTrialId);
      console.log('🔢 Round:', roundId);
      console.log('💡 Solution:', solution);

      // Show submission toast
      toast({
        title: "Submitting Proof...",
        description: "Generating ZK proof and preparing transaction",
      });

      // STEP 1: Submit to backend (ZK proof) + contract (transaction)
      // Choose submission flow based on game mode
      let result;
      if (gameState.multiplayer?.roomId) {
        console.log('🎮 MULTIPLAYER MODE - Using room:', gameState.multiplayer.roomId);
        console.log('   Player round:', roundId);
        // Multiplayer: Submit to room endpoint with player's current round
        result = await submitMultiplayer(solution, roundId, gameState.multiplayer.roomId);
      } else {
        console.log('👤 SINGLE-PLAYER MODE');
        // Single-player: Submit to contract
        result = await submitSinglePlayer(solution);
      }

      if (result.success) {
        console.log('✅ Trial submission successful!');
        console.log('📋 TX Hash:', result.txHash);
        
        // Check if game finished in multiplayer
        if (gameState.multiplayer && result.gameFinished) {
          console.log('🏁 Multiplayer game finished! Fetching final results...');
          clearSavedState();
          
          try {
            const finalResults = await getFinalResults(gameState.multiplayer.roomId);
            const isWinner = finalResults.winner.wallet === publicKey;
            
            console.log(`🎯 Final results: Winner is ${finalResults.winner.wallet}`);
            console.log(`👤 Current player: ${publicKey}`);
            console.log(`🏆 Is winner: ${isWinner}`);
            
            if (isWinner) {
              toast({
                title: "🎉 VICTORY!",
                description: "You completed all trials first!",
              });
            } else {
              toast({
                title: "💀 DEFEATED",
                description: `${finalResults.winner.displayName} completed the trials first!`,
                variant: "destructive",
              });
            }
            
            // Go to leaderboard regardless
            setGameState(prev => ({ ...prev, scene: 'leaderboard' as GameScene }));
            return;
          } catch (error) {
            console.error('❌ Failed to fetch final results:', error);
          }
        }
        
        const progressMsg = gameState.multiplayer 
          ? `Trial ${gameState.trialsCompleted + 1}/${gameState.totalTrials} verified!`
          : `Progress: ${result.progress}/7 trials completed`;
        
        toast({
          title: "Trial Verified! ✅",
          description: progressMsg,
        });

        // STEP 2: Update UI state - ALWAYS advance to next trial
        // Each player progresses independently!
        setGameState(prev => {
          const nextCompleted = prev.trialsCompleted + 1;
          const nextTrial = selectedTrials[nextCompleted];

          console.log(`📈 Player progress: ${nextCompleted}/${prev.totalTrials} trials completed`);

          if (nextCompleted >= prev.totalTrials || !nextTrial) {
            console.log('🏁 All trials completed!');
            clearSavedState(); // Clear progress when game is complete
            
            // In multiplayer: Show leaderboard
            // In single-player: Show proof scene
            const finalScene = gameState.multiplayer ? 'leaderboard' : 'proof';
            console.log(`   → Going to ${finalScene} scene`);
            
            return { ...prev, scene: finalScene, trialsCompleted: nextCompleted };
          }

          console.log(`➡️  Advancing to next trial: ${nextTrial.name}`);
          return {
            ...prev,
            trialsCompleted: nextCompleted,
            currentTrial: nextTrial,
            activatedPortals: [...prev.activatedPortals, prev.currentTrial?.id || ''].filter(Boolean),
          };
        });
      } else {
        // Submission failed
        console.error('❌ Trial submission failed:', result.error);
        toast({
          title: "Submission Failed",
          description: result.error || "Failed to verify trial. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('💥 Trial completion error:', error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }, [gameState, selectedTrials, isConnected, connect, submitSinglePlayer, submitMultiplayer, toast]);

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
              isSubmitting={isSubmitting}
            />
          </SceneTransition>
        );

      case 'proof':
        return (
          <SceneTransition sceneKey="proof">
            <ProofScene onComplete={handleProofComplete} />
          </SceneTransition>
        );

      case 'leaderboard':
        return (
          <SceneTransition sceneKey="leaderboard">
            <FinalLeaderboard />
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
