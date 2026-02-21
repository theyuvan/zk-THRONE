// ============================================================================
// FINAL LEADERBOARD COMPONENT - Show After Game Ends
// ============================================================================

import { motion } from "framer-motion";
import { Trophy, Star, Award } from "lucide-react";
import { useEffect, useState } from "react";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { FinalResults } from "@/services/multiplayerService";

export function FinalLeaderboard() {
  const { currentRoom, getFinalResults } = useMultiplayer();
  const [results, setResults] = useState<FinalResults | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Auto-fetch results when game finishes
    if (currentRoom?.state === "FINISHED" && !results) {
      fetchResults();
    }
  }, [currentRoom?.state]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const data = await getFinalResults();
      setResults(data);
    } catch (error) {
      console.error("Failed to fetch results:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!results) {
    return loading ? (
      <div className="text-center py-12">
        <p className="text-xl text-cyan-400 animate-pulse">
          🏆 Calculating Final Scores...
        </p>
      </div>
    ) : null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 flex items-center justify-center bg-black/90 z-50 p-8"
    >
      <div className="max-w-2xl w-full bg-gradient-to-b from-gray-900 to-black border-2 border-cyan-400 rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-2">
            🏆 GAME COMPLETE! 🏆
          </h1>
          <p className="text-cyan-400 text-lg">
            {results.totalRounds} Rounds Complete
          </p>
        </div>

        {/* Winner Spotlight */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-yellow-600/20 to-yellow-400/20 border-2 border-yellow-400 rounded-xl p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-300 mb-1">👑 CHAMPION</p>
              <p className="text-2xl font-bold text-white">
                {results.winner.displayName || results.winner.wallet.slice(0, 8)}...
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-yellow-400">
                {results.winner.score}/{results.totalRounds}
              </p>
              <p className="text-sm text-yellow-300">
                {results.winner.accuracy}% Accuracy
              </p>
            </div>
          </div>
        </motion.div>

        {/* Leaderboard */}
        <div className="space-y-3 mb-6">
          {results.leaderboard.map((player, index) => {
            const rankColor = 
              index === 0 ? "text-yellow-400" :
              index === 1 ? "text-gray-300" :
              index === 2 ? "text-orange-400" :
              "text-cyan-400";

            const rankIcon = 
              index === 0 ? <Trophy size={20} /> :
              index === 1 ? <Award size={20} /> :
              index === 2 ? <Star size={20} /> :
              <span className="text-lg font-bold">#{index + 1}</span>;

            return (
              <motion.div
                key={player.wallet}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex items-center justify-between hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`${rankColor} flex items-center gap-2`}>
                    {rankIcon}
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {player.displayName || `${player.wallet.slice(0, 12)}...`}
                    </p>
                    <p className="text-sm text-gray-400">
                      {player.accuracy.toFixed(1)}% Accuracy
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-cyan-400">
                    {player.score}
                  </p>
                  <p className="text-xs text-gray-500">
                    / {results.totalRounds} rounds
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Close Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.reload()}
          className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-colors"
        >
          Play Again
        </motion.button>
      </div>
    </motion.div>
  );
}

/**
 * HOW TO USE IN YOUR GAME:
 * 
 * 1. Add to your main game component:
 * 
 * import { FinalLeaderboard } from "@/components/FinalLeaderboard";
 * import { useMultiplayer } from "@/hooks/useMultiplayer";
 * 
 * function GameComponent() {
 *   const { currentRoom } = useMultiplayer();
 * 
 *   return (
 *     <>
 *       {/* Your 3D scene *\/}
 *       <Canvas>...</Canvas>
 * 
 *       {/* Show leaderboard when game finishes *\/}
 *       {currentRoom?.status === "finished" && <FinalLeaderboard />}
 *     </>
 *   );
 * }
 * 
 * 2. That's it! Leaderboard automatically appears when all rounds complete
 * 
 * 3. Scores are HIDDEN during the game (ZK privacy!)
 *    Only revealed at the end in this component
 */
