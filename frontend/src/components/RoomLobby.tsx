import { motion } from 'framer-motion';
import { Users, Lock, Unlock, Crown, Shield, Swords, ArrowRight, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { RoomInfo, TrialMode } from '@/types/game';
import { multiplayerService } from '@/services/multiplayerService';

interface RoomLobbyProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinRoom: (roomCode: string, requiresCode: boolean) => void;
  mode: TrialMode;
}

export default function RoomLobby({ isOpen, onClose, onJoinRoom, mode }: RoomLobbyProps) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const modeColors = {
    1: '#00F0FF',
    3: '#FFD700',
    5: '#FF2E63',
  };

  const modeIcons = {
    1: Shield,
    3: Swords,
    5: Crown,
  };

  const color = modeColors[mode];

  // Fetch rooms from backend
  const fetchRooms = async () => {
    try {
      setIsRefreshing(true);
      const result = await multiplayerService.listRooms();
      console.log('📋 Fetched rooms:', result.rooms);
      setRooms(result.rooms);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  // Fetch on open
  useEffect(() => {
    if (isOpen) {
      fetchRooms();
    }
  }, [isOpen]);

  const filteredRooms = rooms.filter(room => room.totalRounds === mode && room.status === 'waiting');

  const handleRefresh = () => {
    fetchRooms();
  };

  const handleJoinPublic = (room: any) => {
    onJoinRoom(room.roomId, false);
  };

  const handleJoinPrivate = (room: any) => {
    setSelectedRoom(room);
  };

  const handleConfirmPrivate = () => {
    if (selectedRoom && roomCode.toUpperCase() === selectedRoom.joinCode) {
      onJoinRoom(selectedRoom.roomId, true);
    } else {
      alert('Incorrect room code!');
    }
  };

  const getRoomColor = (totalRounds: number) => modeColors[totalRounds as TrialMode] || '#00F0FF';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-void/95 border-2 text-foreground max-h-[90vh] overflow-y-auto" style={{ borderColor: color }}>
        <DialogTitle className="sr-only">Room Lobby - Available Arenas for {mode} Trials Mode</DialogTitle>
        <DialogDescription className="sr-only">Browse and join available game rooms or enter a private room code</DialogDescription>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          {!selectedRoom ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2
                    className="text-2xl md:text-3xl font-bold mb-2"
                    style={{ color, fontFamily: 'var(--font-display)' }}
                  >
                    AVAILABLE ARENAS
                  </h2>
                  <p className="text-sm tracking-[0.3em] opacity-70" style={{ fontFamily: 'var(--font-body)' }}>
                    {mode} Trials Mode
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05, rotate: 180 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRefresh}
                  className="p-3 rounded-lg transition-all"
                  style={{
                    background: `${color}20`,
                    border: `1px solid ${color}`,
                  }}
                  disabled={isRefreshing}
                >
                  <RefreshCw 
                    size={20} 
                    style={{ color }} 
                    className={isRefreshing ? 'animate-spin' : ''}
                  />
                </motion.button>
              </div>

              {/* Room List */}
              {filteredRooms.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-lg opacity-60 mb-2">No rooms available</p>
                  <p className="text-sm opacity-40">Be the first to create one!</p>
                </div>
              ) : (
                <div className="space-y-3 mb-6 max-h-[500px] overflow-y-auto pr-2">
                  {filteredRooms.map((room, index) => {
                    const ModeIcon = modeIcons[room.totalRounds as TrialMode];
                    const roomColor = getRoomColor(room.totalRounds);
                    const isFull = room.playerCount >= room.maxPlayers;

                    return (
                      <motion.div
                        key={room.roomCode}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * index }}
                        className="p-4 rounded-lg border-2 transition-all duration-300 hover:shadow-lg"
                        style={{
                          borderColor: `${roomColor}40`,
                          background: `${roomColor}10`,
                          opacity: isFull ? 0.6 : 1,
                        }}
                      >
                        <div className="flex items-center justify-between gap-4">
                          {/* Room Info */}
                          <div className="flex items-center gap-4 flex-1">
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{
                                background: `${roomColor}30`,
                                border: `2px solid ${roomColor}`,
                              }}
                            >
                              <ModeIcon size={24} style={{ color: roomColor }} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 
                                  className="text-lg font-bold truncate" 
                                  style={{ color: roomColor, fontFamily: 'var(--font-display)' }}
                                >
                                  {room.roomName}
                                </h3>
                                {room.isPublic ? (
                                  <Unlock size={16} style={{ color: '#00F0FF' }} />
                                ) : (
                                  <Lock size={16} style={{ color: '#FF2E63' }} />
                                )}
                              </div>
                              
                              <div className="flex items-center gap-4 text-xs opacity-70">
                                <span>Host: {room.hostName}</span>
                                <span className="flex items-center gap-1">
                                  <Users size={12} />
                                  {room.playerCount}/{room.maxPlayers}
                                </span>
                                <span>{room.totalRounds} Trials</span>
                              </div>
                            </div>
                          </div>

                          {/* Join Button */}
                          <motion.button
                            whileHover={{ scale: isFull ? 1 : 1.05 }}
                            whileTap={{ scale: isFull ? 1 : 0.95 }}
                            onClick={() => room.isPublic ? handleJoinPublic(room) : handleJoinPrivate(room)}
                            disabled={isFull}
                            className="px-6 py-2 rounded-lg font-bold transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              background: isFull ? 'hsl(var(--muted))' : `${roomColor}30`,
                              border: `2px solid ${roomColor}`,
                              color: roomColor,
                              boxShadow: isFull ? 'none' : `0 0 15px ${roomColor}30`,
                            }}
                          >
                            {isFull ? 'Full' : room.isPublic ? 'Join' : 'Enter Code'}
                            {!isFull && <ArrowRight size={16} />}
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Actions */}
              <button
                onClick={onClose}
                className="w-full px-6 py-3 rounded border-2 transition-all duration-300 hover:bg-white/5"
                style={{ borderColor: 'hsl(var(--border))' }}
              >
                Back
              </button>
            </>
          ) : (
            <>
              {/* Private Room Code Entry */}
              <div className="text-center mb-6">
                <div
                  className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4"
                  style={{
                    background: `${getRoomColor(selectedRoom.mode)}30`,
                    border: `2px solid ${getRoomColor(selectedRoom.mode)}`,
                  }}
                >
                  <Lock size={40} style={{ color: getRoomColor(selectedRoom.mode) }} />
                </div>
                
                <h2
                  className="text-2xl md:text-3xl font-bold mb-2"
                  style={{ color: getRoomColor(selectedRoom.mode), fontFamily: 'var(--font-display)' }}
                >
                  {selectedRoom.roomName}
                </h2>
                <p className="text-sm tracking-[0.3em] opacity-70 mb-2" style={{ fontFamily: 'var(--font-body)' }}>
                  Private Arena
                </p>
              </div>

              <div className="mb-6 p-4 rounded-lg" style={{ background: `${getRoomColor(selectedRoom.totalRounds)}15`, border: `1px solid ${getRoomColor(selectedRoom.totalRounds)}30` }}>
                <p className="text-sm mb-3 text-center">This is a private arena. Enter the room code to join.</p>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold block" style={{ color: getRoomColor(selectedRoom.totalRounds) }}>
                    Room Code
                  </label>
                  <Input
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="ABCD12"
                    maxLength={6}
                    className="text-center text-2xl font-bold tracking-widest"
                    style={{
                      background: `${getRoomColor(selectedRoom.totalRounds)}10`,
                      border: `2px solid ${getRoomColor(selectedRoom.totalRounds)}30`,
                      color: getRoomColor(selectedRoom.totalRounds),
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedRoom(null);
                    setRoomCode('');
                  }}
                  className="flex-1 px-6 py-3 rounded border-2 transition-all duration-300 hover:bg-white/5"
                  style={{ borderColor: 'hsl(var(--border))' }}
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmPrivate}
                  disabled={roomCode.length !== 6}
                  className="flex-1 px-6 py-3 rounded font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: `linear-gradient(135deg, ${getRoomColor(selectedRoom.totalRounds)}20, ${getRoomColor(selectedRoom.totalRounds)}40)`,
                    border: `2px solid ${getRoomColor(selectedRoom.totalRounds)}`,
                    color: getRoomColor(selectedRoom.totalRounds),
                    boxShadow: roomCode.length === 6 ? `0 0 20px ${getRoomColor(selectedRoom.totalRounds)}40` : 'none',
                  }}
                >
                  Join Arena →
                </button>
              </div>
            </>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
