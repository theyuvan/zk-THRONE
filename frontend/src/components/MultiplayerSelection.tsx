import { motion } from 'framer-motion';
import { Users, Plus, LogIn, Copy, Check, Unlock, Lock } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Trial } from '@/types/game';

interface MultiplayerSelectionProps {
  isOpen: boolean;
  onClose: () => void;
  onHost: (selectedTrials: Trial[]) => void;
  onJoin: (roomCode: string) => void;
  mode: 3 | 5 | 7;
  onShowTrialSelection: () => void;
  onShowRoomLobby: () => void;
}

export default function MultiplayerSelection({ isOpen, onClose, onHost, onJoin, mode, onShowTrialSelection, onShowRoomLobby }: MultiplayerSelectionProps) {
  const [selectedOption, setSelectedOption] = useState<'host' | 'join' | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isPublicRoom, setIsPublicRoom] = useState(true);
  const [roomName, setRoomName] = useState('');

  const generateRoomCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGeneratedCode(code);
    return code;
  };

  const handleHost = () => {
    generateRoomCode();
    setSelectedOption('host');
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
    3: '#00F0FF',
    5: '#FFD700',
    7: '#FF2E63',
  };

  const color = modeColors[mode];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-void/95 border-2 text-foreground" style={{ borderColor: color }}>
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

          {!selectedOption ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Host Option */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleHost}
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
                    <Plus size={24} style={{ color }} />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-xl font-bold mb-1" style={{ color, fontFamily: 'var(--font-display)' }}>
                      HOST ARENA
                    </h3>
                    <p className="text-sm opacity-70">Create a new game room and invite challengers</p>
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
          ) : selectedOption === 'host' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Room Name Input */}
              <div className="space-y-2">
                <label className="text-sm font-bold block" style={{ color }}>
                  Room Name
                </label>
                <Input
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="My Awesome Arena"
                  maxLength={30}
                  className="text-lg"
                  style={{
                    background: `${color}10`,
                    border: `2px solid ${color}30`,
                    color,
                  }}
                />
              </div>

              {/* Room Visibility Toggle */}
              <div className="space-y-3">
                <label className="text-sm font-bold block" style={{ color }}>
                  Room Visibility
                </label>
                
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsPublicRoom(true)}
                    className="p-4 rounded-lg border-2 transition-all duration-300"
                    style={{
                      borderColor: isPublicRoom ? '#00F0FF' : 'hsl(var(--border))',
                      background: isPublicRoom ? '#00F0FF15' : 'hsl(var(--card))',
                      boxShadow: isPublicRoom ? '0 0 20px #00F0FF40' : 'none',
                    }}
                  >
                    <Unlock size={24} className="mx-auto mb-2" style={{ color: '#00F0FF' }} />
                    <p className="text-sm font-bold mb-1" style={{ color: '#00F0FF' }}>PUBLIC</p>
                    <p className="text-xs opacity-70">Anyone can join</p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsPublicRoom(false)}
                    className="p-4 rounded-lg border-2 transition-all duration-300"
                    style={{
                      borderColor: !isPublicRoom ? '#FF2E63' : 'hsl(var(--border))',
                      background: !isPublicRoom ? '#FF2E6315' : 'hsl(var(--card))',
                      boxShadow: !isPublicRoom ? '0 0 20px #FF2E6340' : 'none',
                    }}
                  >
                    <Lock size={24} className="mx-auto mb-2" style={{ color: '#FF2E63' }} />
                    <p className="text-sm font-bold mb-1" style={{ color: '#FF2E63' }}>PRIVATE</p>
                    <p className="text-xs opacity-70">Requires code</p>
                  </motion.button>
                </div>
              </div>

              <div className="p-6 rounded-lg text-center" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                <p className="text-sm mb-3 opacity-70">Your Room Code</p>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div
                    className="text-3xl font-bold tracking-widest px-6 py-3 rounded"
                    style={{ background: `${color}30`, color, fontFamily: 'monospace' }}
                  >
                    {generatedCode}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="p-3 rounded transition-all"
                    style={{ background: `${color}20`, border: `1px solid ${color}` }}
                  >
                    {copied ? <Check size={20} style={{ color }} /> : <Copy size={20} style={{ color }} />}
                  </button>
                </div>
                <p className="text-xs opacity-60">
                  {isPublicRoom 
                    ? 'Room will be visible in lobby. Code optional for direct join.'
                    : 'Share this code with players to join your private arena.'
                  }
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedOption(null);
                    setGeneratedCode('');
                    setRoomName('');
                    setIsPublicRoom(true);
                  }}
                  className="flex-1 px-6 py-3 rounded border-2 transition-all duration-300 hover:bg-white/5"
                  style={{ borderColor: 'hsl(var(--border))' }}
                >
                  Back
                </button>
                <button
                  onClick={handleProceedToTrialSelection}
                  disabled={!roomName.trim()}
                  className="flex-1 px-6 py-3 rounded font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: `linear-gradient(135deg, ${color}20, ${color}40)`,
                    border: `2px solid ${color}`,
                    color,
                    boxShadow: roomName.trim() ? `0 0 20px ${color}40` : 'none',
                  }}
                >
                  Select Trials →
                </button>
              </div>
            </motion.div>
          ) : null}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
