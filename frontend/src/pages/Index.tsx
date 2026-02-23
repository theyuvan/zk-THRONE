import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ThroneHall from '@/components/ThroneHall';
import PortalRoom from '@/components/PortalRoom';
import TrialScene from '@/components/TrialScene';
import ProofScene from '@/components/ProofScene';
import ThroneClaim from '@/components/ThroneClaim';
import KingReveal from '@/components/KingReveal';
import { FinalLeaderboard } from '@/components/FinalLeaderboard';
import { FinalResults } from '@/services/multiplayerService';
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
  const [finalResultsData, setFinalResultsData] = useState<FinalResults | null>(null);
  const [isSubmittingFinalTrial, setIsSubmittingFinalTrial] = useState(false);
  const { submitSolution: submitSinglePlayer, isSubmitting } = useGame();
  const { submitSolution: submitMultiplayer, getFinalResults, getRoomState, currentRoom } = useMultiplayer();
  const { isConnected, connect, publicKey } = useWallet();
  const { toast } = useToast();

  // Poll for game state during multiplayer trials to detect when game ends
  useEffect(() => {
    if (!gameState.multiplayer || gameState.scene !== 'trial') return;

    let pollInterval: NodeJS.Timeout;
    
    const startPolling = async () => {
      pollInterval = setInterval(async () => {
        try {
          const roomState = await getRoomState(gameState.multiplayer!.roomId);
          
          // Check if game finished
          // IMPORTANT: Only show celebration if we're not currently submitting a trial
          // This prevents showing celebration before the on-chain transaction completes
          if (roomState.state === 'FINISHED' && !isSubmittingFinalTrial) {
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
                description: `${finalResults.winner.displayName || 'Another player'} completed the trials first!`,
                variant: "destructive",
              });
            }
            
            // Store results for celebration screen
            setFinalResultsData(finalResults);
            
            // Go to celebration first, then leaderboard
            setGameState(prev => ({ ...prev, scene: 'celebration' as GameScene }));
          }
        } catch (error) {
          console.error('❌ Failed to poll room state:', error);
        }
      }, 2000); // Poll every 2 seconds
    };
    
    startPolling();

    return () => {
      if (pollInterval) {
        console.log('🛑 Stopping game state polling');
        clearInterval(pollInterval);
      }
    };
  }, [gameState.multiplayer, gameState.scene, publicKey, getRoomState, getFinalResults, toast, isSubmittingFinalTrial, setFinalResultsData]);

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
      
      // Check if this is the final trial in multiplayer
      const isFinalTrial = gameState.multiplayer && 
        gameState.trialsCompleted === gameState.totalTrials - 1;
      
      if (isFinalTrial) {
        console.log('🏁 Submitting FINAL trial - blocking celebration until confirmed');
        setIsSubmittingFinalTrial(true);
      }
      
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
        console.log('   Game round:', roundId);
        
        // CRITICAL: Get player's cumulative on-chain progress
        // Contract tracks progress across ALL games, not per-game rounds
        const { throneContractService } = await import("@/services/throneContractService");
        const cumulativeProgress = await throneContractService.getProgress(publicKey!);
        const trialRoundId = cumulativeProgress + 1;
        
        console.log(`📊 Cumulative progress: ${cumulativeProgress}, submitting as trial_round_id: ${trialRoundId}`);
        
        // Multiplayer: Submit with cumulative trial_round_id (NOT per-game round)
        result = await submitMultiplayer(solution, trialRoundId, gameState.multiplayer.roomId);
      } else {
        console.log('👤 SINGLE-PLAYER MODE');
        // Single-player: Submit to contract
        result = await submitSinglePlayer(solution);
      }

      if (result.success) {
        console.log('✅ Trial submission successful!');
        console.log('📋 TX Hash:', result.txHash);
        console.log('✅ On-chain transaction CONFIRMED');
        
        // Clear the final trial submission flag
        setIsSubmittingFinalTrial(false);
        
        // Check if game finished in multiplayer
        if (gameState.multiplayer && result.gameFinished) {
          console.log('🏁 Multiplayer game finished! Fetching final results...');
          // DON'T clear state yet - leaderboard needs roomId to fetch results
          
          try {
            const finalResults = await getFinalResults(gameState.multiplayer.roomId);
            const isWinner = finalResults.winner.wallet === publicKey;
            
            console.log(`🎯 Final results: Winner is ${finalResults.winner.wallet}`);
            console.log(`👤 Current player: ${publicKey}`);
            console.log(`🏆 Is winner: ${isWinner}`);
            
            // Store results for celebration screen
            setFinalResultsData(finalResults);
            
            if (isWinner) {
              toast({
                title: "🎉 VICTORY!",
                description: "You completed all trials first!",
              });
            } else {
              toast({
                title: "💀 DEFEATED",
                description: `${finalResults.winner.displayName || finalResults.winner.wallet.slice(0, 8)} completed the trials first!`,
                variant: "destructive",
              });
            }
            
            // Wait 1 second to let wallet UI close before showing celebration
            console.log('⏳ Waiting 1 second for wallet UI to close...');
            setTimeout(() => {
              console.log('✨ Now showing celebration screen');
              setGameState(prev => ({ ...prev, scene: 'celebration' as GameScene }));
            }, 1000);
            
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
        setIsSubmittingFinalTrial(false); // Clear flag on failure
        toast({
          title: "Submission Failed",
          description: result.error || "Failed to verify trial. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('💥 Trial completion error:', error);
      setIsSubmittingFinalTrial(false); // Clear flag on error
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
              currentRoom={currentRoom}
            />
          </SceneTransition>
        );

      case 'proof':
        return (
          <SceneTransition sceneKey="proof">
            <ProofScene onComplete={handleProofComplete} />
          </SceneTransition>
        );

      case 'celebration':
        return (
          <SceneTransition sceneKey="celebration">
            <KingReveal 
              isMultiplayer={true}
              isCurrentPlayerWinner={finalResultsData?.winner.wallet === publicKey}
              winnerName={finalResultsData?.winner.displayName || finalResultsData?.winner.wallet.slice(0, 8)}
              onContinue={() => setGameState(prev => ({ ...prev, scene: 'leaderboard' as GameScene }))}
            />
          </SceneTransition>
        );

      case 'leaderboard':
        return (
          <SceneTransition sceneKey="leaderboard">
            <FinalLeaderboard roomId={gameState.multiplayer?.roomId} />
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
