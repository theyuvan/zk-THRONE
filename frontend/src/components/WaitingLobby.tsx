import { useState, useEffect } from 'react';
import { RoomState, Player } from '@/services/multiplayerService';
import { Copy, Check, Users, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WaitingLobbyProps {
  roomId: string;
  joinCode: string;
  currentRoom: RoomState | null;
  isHost: boolean;
  countdown: number | null;
  onStartGame: () => Promise<{ success: boolean }>;
  onGameStart: () => void;
  onBack: () => void;
}

export default function WaitingLobby({ 
  roomId, 
  joinCode,
  currentRoom,
  isHost,
  countdown,
  onStartGame, 
  onGameStart, 
  onBack 
}: WaitingLobbyProps) {
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  
  // Monitor room state changes
  useEffect(() => {
    console.log('🔄 Room state update:', currentRoom);
  }, [currentRoom]);
  
  // Auto-start game when countdown finishes
  useEffect(() => {
    if (countdown === 0) {
      console.log('⏰ Countdown finished, starting game!');
      console.log('🎯 WaitingLobby triggering onGameStart for:', { isHost, roomId });
      onGameStart();
    }
  }, [countdown, onGameStart, isHost, roomId]);
  
  const handleCopyCode = () => {
    navigator.clipboard.writeText(joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleStart = async () => {
    try {
      console.log('🎮 Host requesting game start...');
      setIsStarting(true);
      await onStartGame();
      // Countdown will be handled by multiplayer hook polling
    } catch (error: any) {
      console.error('Failed to start game:', error);
      const errorMessage = error?.message || 'Failed to start game. Please try again.';
      alert(errorMessage);
      setIsStarting(false);
    }
  };
  
  const playerCount = currentRoom?.players.length || 1;
  const maxPlayers = currentRoom?.maxPlayers || 4;
  const canStart = playerCount >= 2;
  
  // Show loading state while room is being fetched
  if (!currentRoom) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-void/95 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="panel-arcane p-8 max-w-2xl w-full mx-4"
          style={{
            border: '2px solid hsl(var(--gold))',
            boxShadow: '0 0 40px hsl(var(--gold) / 0.3)',
          }}
        >
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gold mx-auto mb-4" />
            <p className="text-xl font-bold text-gold-glow" style={{ fontFamily: 'var(--font-display)' }}>
              LOADING ROOM...
            </p>
            <p className="text-sm opacity-70 mt-2">Fetching room state from server</p>
          </div>
        </motion.div>
      </motion.div>
    );
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-void/95 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="panel-arcane p-8 max-w-2xl w-full mx-4"
        style={{
          border: '2px solid hsl(var(--gold))',
          boxShadow: '0 0 40px hsl(var(--gold) / 0.3)',
        }}
      >
        {/* Join Code Display */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4"
            style={{
              background: 'radial-gradient(circle, hsl(var(--gold) / 0.3) 0%, transparent 70%)',
              border: '2px solid hsl(var(--gold))',
              boxShadow: '0 0 30px hsl(var(--gold) / 0.6)',
            }}
          >
            <Users size={40} className="text-gold-glow" strokeWidth={1.5} />
          </motion.div>
          
          <h2 className="text-3xl font-bold mb-2 text-gold-glow" style={{ fontFamily: 'var(--font-display)' }}>
            WAITING FOR CHALLENGERS
          </h2>
          <p className="text-sm tracking-[0.3em] opacity-70 mb-6" style={{ fontFamily: 'var(--font-body)' }}>
            Share the code to invite players
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-5xl font-mono tracking-widest px-8 py-4 rounded"
              style={{
                background: 'hsl(var(--neon) / 0.2)',
                border: '2px solid hsl(var(--neon))',
                color: 'hsl(var(--neon))',
                textShadow: '0 0 20px hsl(var(--neon))',
              }}
            >
              {joinCode}
            </motion.div>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyCode} 
              className="p-4 rounded transition-all"
              style={{
                background: 'hsl(var(--neon) / 0.2)',
                border: '2px solid hsl(var(--neon))',
              }}
            >
              {copied ? (
                <Check size={24} className="text-neon" />
              ) : (
                <Copy size={24} className="text-neon" />
              )}
            </motion.button>
          </div>
          <p className="text-xs opacity-60">
            Room ID: {roomId.slice(0, 8)}...
          </p>
        </div>
        
        {/* Player List */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              Players
            </h3>
            <div className="text-sm opacity-70">
              {playerCount}/{maxPlayers}
            </div>
          </div>
          
          <div className="space-y-3">
            {currentRoom?.players.map((player, i) => (
              <motion.div
                key={player.wallet}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 p-4 rounded transition-all"
                style={{
                  background: player.isHost ? 'hsl(var(--gold) / 0.1)' : 'hsl(var(--card))',
                  border: `1px solid ${player.isHost ? 'hsl(var(--gold) / 0.3)' : 'hsl(var(--border))'}`,
                }}
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: player.isHost ? 'hsl(var(--gold) / 0.3)' : 'hsl(var(--neon) / 0.3)',
                  }}
                >
                  {player.isHost ? (
                    <Crown size={24} className="text-gold-glow" />
                  ) : (
                    <span className="text-xl font-bold">{i + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold font-mono truncate">
                    {player.wallet.slice(0, 8)}...{player.wallet.slice(-6)}
                  </p>
                  {player.isHost && (
                    <p className="text-xs opacity-70 text-gold-glow">Host</p>
                  )}
                </div>
                <div className="text-xs text-green-500">✅ Ready</div>
              </motion.div>
            ))}
            
            {/* Empty slots */}
            {Array.from({ length: maxPlayers - playerCount }).map((_, i) => (
              <motion.div
                key={`empty-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                className="flex items-center gap-3 p-4 rounded border-2 border-dashed"
                style={{ borderColor: 'hsl(var(--border))' }}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/5">
                  <Users size={20} className="opacity-50" />
                </div>
                <p className="text-sm opacity-50">Waiting for player...</p>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Countdown or Action Buttons */}
        <AnimatePresence mode="wait">
          {countdown !== null ? (
            <motion.div 
              key="countdown"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center py-8"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  textShadow: [
                    '0 0 20px hsl(var(--gold))',
                    '0 0 40px hsl(var(--gold))',
                    '0 0 20px hsl(var(--gold))',
                  ]
                }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-8xl font-bold mb-4 text-gold-glow"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {countdown}
              </motion.div>
              <p className="text-2xl tracking-widest" style={{ fontFamily: 'var(--font-display)' }}>
                GAME STARTING...
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key="buttons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-4"
            >
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onBack} 
                className="flex-1 px-6 py-4 rounded border-2 transition-all duration-300 hover:bg-white/5"
                style={{ borderColor: 'hsl(var(--border))' }}
              >
                Leave Room
              </motion.button>
              {isHost && (
                <motion.button 
                  whileHover={{ scale: canStart ? 1.02 : 1 }}
                  whileTap={{ scale: canStart ? 0.98 : 1 }}
                  onClick={handleStart} 
                  disabled={!canStart}
                  className="flex-1 px-6 py-4 rounded font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: canStart 
                      ? 'linear-gradient(135deg, hsl(var(--gold) / 0.2), hsl(var(--gold) / 0.4))' 
                      : 'hsl(var(--muted))',
                    border: `2px solid ${canStart ? 'hsl(var(--gold))' : 'hsl(var(--border))'}`,
                    color: canStart ? 'hsl(var(--gold))' : 'hsl(var(--muted-foreground))',
                    boxShadow: canStart ? '0 0 20px hsl(var(--gold) / 0.4)' : 'none',
                  }}
                >
                  {canStart ? 'Start Game' : 'Need 2+ Players'}
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
