export type GameScene =
  | 'throneHall'
  | 'portalRoom'
  | 'trial'
  | 'proof'
  | 'throneClaim'
  | 'kingReveal';

export type TrialMode = 1 | 3 | 5;

export type TrialId =
  | 'colorSigil'
  | 'logicLabyrinth'
  | 'patternOracle'
  | 'memoryOfCrown'
  | 'finalOath';

export interface Trial {
  id: TrialId;
  name: string;
  portalColor: string;
  colorHex: string;
  description: string;
  completed?: boolean;
}

export interface MultiplayerInfo {
  isHost: boolean;
  roomCode?: string;
  playerCount?: number;
  isPublic?: boolean;
  roomName?: string;
}

export interface RoomInfo {
  roomCode: string;
  roomName: string;
  hostName: string;
  mode: TrialMode;
  playerCount: number;
  maxPlayers: number;
  isPublic: boolean;
  selectedTrials: Trial[];
  status: 'waiting' | 'starting' | 'in-progress';
}

export interface GameState {
  scene: GameScene;
  selectedMode: TrialMode | null;
  trialsCompleted: number;
  totalTrials: TrialMode;
  currentTrial: Trial | null;
  activatedPortals: string[];
  multiplayer?: MultiplayerInfo;
}

export const TRIALS: Trial[] = [
  { id: 'colorSigil', name: 'Cipher Grid', portalColor: '#FFD700', colorHex: 'gold', description: 'Decode the chromatic rune sequence' },
  { id: 'logicLabyrinth', name: 'Logic Labyrinth', portalColor: '#00F0FF', colorHex: 'neon', description: 'Navigate the path of reason' },
  { id: 'patternOracle', name: 'Pattern Oracle', portalColor: '#8B5CF6', colorHex: 'purple', description: 'Predict the sequence of fate' },
  { id: 'memoryOfCrown', name: 'Memory of the Crown', portalColor: '#FFD700', colorHex: 'gold', description: 'Remember the fragments of kingship' },
  { id: 'finalOath', name: 'Thronebreaker Protocol', portalColor: '#FF2E63', colorHex: 'crimson', description: 'Swear fealty to the throne' },
];
