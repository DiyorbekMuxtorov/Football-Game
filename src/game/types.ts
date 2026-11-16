export type GameScreen = 'menu' | 'select' | 'playing' | 'victory';

export type MatchMode = 'quick' | 'best_of_3' | 'custom' | 'training';

export type PowerType = 'fire' | 'ice' | 'lightning' | 'super';

export type CharacterExpression = 'normal' | 'kick' | 'happy' | 'sad' | 'frozen' | 'shocked' | 'focused';

export type PlayerActionState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'brake'
  | 'jump'
  | 'fall'
  | 'land'
  | 'kick_normal'
  | 'kick_power'
  | 'kick_low'
  | 'kick_high'
  | 'kick_curved'
  | 'kick_volley'
  | 'kick_emergency'
  | 'defend'
  | 'tackle'
  | 'recover'
  | 'stumble';

export type ShotType =
  | 'normal'
  | 'power'
  | 'low'
  | 'high'
  | 'curved'
  | 'header'
  | 'running'
  | 'jump'
  | 'volley'
  | 'emergency';

export type HairStyle =
  | 'messi'
  | 'ronaldo'
  | 'mbappe'
  | 'yamal'
  | 'neymar'
  | 'haaland'
  | 'vini'
  | 'bellingham'
  | 'salah'
  | 'lewandowski';

export type KitPattern = 'stripes' | 'split' | 'solid' | 'trim' | 'sash';

export type CelebrationStyle = 'arms_sky' | 'leap_pump' | 'cross_arms' | 'dance_wave' | 'fist_roar';

export type StadiumTheme = 'international' | 'night' | 'indoor' | 'futuristic';

export type BallDesign = 'classic' | 'gold' | 'neon';

export type GraphicsQuality = 'high' | 'medium';

export interface CharacterDef {
  id: string;
  name: string;
  shortName: string;
  number: string;
  nationality: string;
  signatureTag: string;
  celebrationStyle: CelebrationStyle;
  skin: string;
  skinHighlight: string;
  skinShadow: string;
  eyeColor: string;
  hairStyle: HairStyle;
  hairColor: string;
  hairHighlight: string;
  facialHair: 'none' | 'beard' | 'goatee' | 'stubble' | 'fullbeard';
  eyebrowColor: string;
  jerseyPrimary: string;
  jerseySecondary: string;
  jerseyAccent: string;
  kitPattern: KitPattern;
  shortsColor: string;
  socksColor: string;
  cleatsColor: string;
  accentGlow: string;
}

export interface GameSettings {
  musicEnabled: boolean;
  soundEnabled: boolean;
  musicVolume: number; // 0 to 1
  sfxVolume: number; // 0 to 1
  graphicsQuality: GraphicsQuality;
  stadiumTheme: StadiumTheme;
  ballDesign: BallDesign;
  matchDuration: 60 | 90 | 120;
  staminaEnabled: boolean;
}

export interface PlayerMatchStats {
  shots: number;
  shotsOnTarget: number;
  kicks: number;
  headers: number;
  blocks: number;
  saves: number;
  tackles: number;
  specialsUsed: number;
  perfectShots: number;
}

export interface RivalrySeries {
  p1Wins: number;
  p2Wins: number;
  matchesPlayed: number;
  bestOfThreeActive?: boolean;
}

export interface HeadToHeadRecord {
  p1Wins: number;
  p2Wins: number;
  totalMatches: number;
  p1Goals: number;
  p2Goals: number;
  overtimeMatches: number;
  bestSingleScore: number;
}

export interface MatchResult {
  winner: 1 | 2;
  p1Score: number;
  p2Score: number;
  wasOvertime: boolean;
  durationSeconds: number;
  mode: MatchMode;
  p1Stats: PlayerMatchStats;
  p2Stats: PlayerMatchStats;
}

export interface MatchHistoryEntry {
  id: string;
  timestamp: number;
  p1Name: string;
  p2Name: string;
  p1Score: number;
  p2Score: number;
  winner: 1 | 2;
  wasOvertime: boolean;
  mode?: MatchMode;
}

export interface PlayerCareerStats {
  matches: number;
  wins: number;
  goals: number;
}

export interface PlayerState {
  id: 1 | 2;
  character: CharacterDef;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  turnTimer: number;
  feintTimer: number;
  headNodTimer: number;
  jumpCutDone: boolean;
  dribbleCooldown: number;
  onGround: boolean;
  runPhase: number;
  lastStrideHalf: number;
  actionState: PlayerActionState;
  kickTimer: number;
  kickDuration: number;
  kickType: ShotType;
  kickCooldown: number;
  landTimer: number;
  isDefending: boolean;
  timedBlockTimer: number;
  tackleTimer: number;
  tackleCooldown: number;
  recoverTimer: number;
  energy: number;
  stamina: number;
  isSprinting: boolean;
  specialCooldown: number;
  holdTimer: number;
  isChargingSpecial: boolean;
  isChargingPower: boolean;
  specialPrimedTimer: number;
  frozenTimer: number;
  stunTimer: number;
  fallTimer: number;
  expression: CharacterExpression;
  expressionTimer: number;
  score: number;
  stats: PlayerMatchStats;
}

export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  angularVelocity: number;
  activePower: PowerType | null;
  powerOwner: 1 | 2 | null;
  powerTimer: number;
  squashX: number;
  squashY: number;
  lastTouchPlayer: 1 | 2 | null;
  isCurved: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  kind: 'circle' | 'spark' | 'shard' | 'confetti' | 'ring' | 'turf';
  rotation?: number;
  vRot?: number;
}

export interface FloatingBanner {
  text: string;
  subtext?: string;
  color: string;
  timer: number;
  maxTimer: number;
  scale: number;
}

export interface GoalNetImpulse {
  leftRipple: number;
  rightRipple: number;
  leftY: number;
  rightY: number;
}

export type MatchPhase = 'vs_intro' | 'countdown' | 'playing' | 'goal' | 'overtime_intro' | 'ended';

export interface HudSnapshot {
  p1Score: number;
  p2Score: number;
  timeRemaining: number;
  isOvertime: boolean;
  isTraining: boolean;
  staminaEnabled: boolean;
  phase: MatchPhase;
  goalSkipReady: boolean;
  vsTimer: number;
  countdownText: string;
  p1Energy: number;
  p2Energy: number;
  p1Stamina: number;
  p2Stamina: number;
  p1SpecialCooldown: number;
  p2SpecialCooldown: number;
  p1Frozen: boolean;
  p2Frozen: boolean;
  p1Defending: boolean;
  p2Defending: boolean;
  nextPower: PowerType;
  tensionLevel: number;
  activeKeys: {
    p1Left: boolean;
    p1Right: boolean;
    p1Jump: boolean;
    p1Defend: boolean;
    p1Kick: boolean;
    p2Left: boolean;
    p2Right: boolean;
    p2Jump: boolean;
    p2Defend: boolean;
    p2Kick: boolean;
  };
}
