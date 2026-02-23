import { motion } from 'framer-motion';
import { Users, Plus, LogIn, Copy, Check, Unlock, Lock } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Trial, TrialMode } from '@/types/game';
import { useWallet } from '@/hooks/useWallet';

interface MultiplayerSelectionProps {
  isOpen: boolean;
  onClose: () => void;
  onHost: (selectedTrials: Trial[]) => void;
  onJoin: (roomCode: string) => void;
  mode: TrialMode;
  onShowTrialSelection: () => void;
  onShowRoomLobby: () => void;
  onRoomCreated: (roomId: string, joinCode: string) => void;
  createRoom: (maxPlayers: number, totalRounds: number) => Promise<{
    success: boolean;
    roomId: string;
    joinCode: string;
  }>;
}

export default function MultiplayerSelection({ isOpen, onClose, onHost, onJoin, mode, onShowTrialSelection, onShowRoomLobby, onRoomCreated, createRoom }: MultiplayerSelectionProps) {
  const [selectedOption, setSelectedOption] = useState<'host' | 'join' | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isPublicRoom, setIsPublicRoom] = useState(true);
  const [roomName, setRoomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const { isConnected, connect, publicKey } = useWallet();

  const handleHost = async () => {
    try {
      // Check wallet connection
      if (!isConnected) {
        await connect();
        return;
      }

      setIsCreating(true);
      
      // Create room on backend
      const result = await createRoom(4, mode); // 4 players, N trials (mode)
      
      console.log('✅ Room created:', result);
      
      // Notify parent component (don't close dialog - parent will handle it)
      onRoomCreated(result.roomId, result.joinCode);
      
    } catch (error) {
      console.error('❌ Failed to create room:', error);
      alert('Failed to create room. Please make sure your wallet is connected and try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProceedToTrialSelection = () => {
    onShowTrialSelection();
  };

  const handleJoinRoom = () => {
    if (roomCode.trim().length === 6) {
      onJoin(roomCode.toUpperCase());
    }
  };

  const modeColors = {
    1: '#00F0FF',
    3: '#FFD700',
    5: '#FF2E63',
  };

  const color = modeColors[mode];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-void/95 border-2 text-foreground" style={{ borderColor: color }}>
        <DialogTitle className="sr-only">Multiplayer Arena - {mode} Trials Challenge</DialogTitle>
        <DialogDescription className="sr-only">Choose to host a new game room or join an existing arena</DialogDescription>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
              className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{
                background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
                border: `2px solid ${color}`,
                boxShadow: `0 0 30px ${color}60`,
              }}
            >
              <Users size={40} style={{ color }} strokeWidth={1.5} />
            </motion.div>

            <h2
              className="text-2xl md:text-3xl font-bold mb-2"
              style={{ color, fontFamily: 'var(--font-display)' }}
            >
              MULTIPLAYER ARENA
            </h2>
            <p className="text-sm tracking-[0.3em] opacity-70" style={{ fontFamily: 'var(--font-body)' }}>
              {mode} Trials Challenge
            </p>
          </div>

          {!selectedOption && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Host Option */}
              <motion.button
                whileHover={{ scale: isCreating ? 1 : 1.02 }}
                whileTap={{ scale: isCreating ? 1 : 0.98 }}
                onClick={handleHost}
                disabled={isCreating}
                className="w-full p-6 rounded-lg border-2 transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-wait"
                style={{
                  borderColor: color,
                  background: `${color}10`,
                  boxShadow: `0 0 20px ${color}20`,
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}30` }}
                  >
                    <Plus size={24} style={{ color }} />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-xl font-bold mb-1" style={{ color, fontFamily: 'var(--font-display)' }}>
                      {isCreating ? 'CREATING ROOM...' : 'HOST ARENA'}
                    </h3>
                    <p className="text-sm opacity-70">
                      {isCreating ? 'Connecting to backend...' : 'Create a new game room and invite challengers'}
                    </p>
                  </div>
                </div>
              </motion.button>

              {/* Join Option */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onShowRoomLobby}
                className="w-full p-6 rounded-lg border-2 transition-all duration-300 hover:shadow-lg"
                style={{
                  borderColor: color,
                  background: `${color}10`,
                  boxShadow: `0 0 20px ${color}20`,
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}30` }}
                  >
                    <LogIn size={24} style={{ color }} />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-xl font-bold mb-1" style={{ color, fontFamily: 'var(--font-display)' }}>
                      BROWSE ARENAS
                    </h3>
                    <p className="text-sm opacity-70">View and join available game rooms</p>
                  </div>
                </div>
              </motion.button>

              <button
                onClick={onClose}
                className="w-full px-6 py-3 rounded border-2 transition-all duration-300 hover:bg-white/5"
                style={{ borderColor: 'hsl(var(--border))' }}
              >
                Back
              </button>
            </motion.div>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
