export type ScreenType =
  | 'splash'
  | 'setup'
  | 'pose_check'
  | 'countdown'
  | 'gameplay'
  | 'shot_result'
  | 'scoreboard'
  | 'game_over';

export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface DetectedPose {
  leftShoulder?: Landmark;
  rightShoulder?: Landmark;
  leftElbow?: Landmark;
  rightElbow?: Landmark;
  leftWrist?: Landmark;
  rightWrist?: Landmark;
  leftHip?: Landmark;
  rightHip?: Landmark;
  rawLandmarks?: Landmark[];
  ready: boolean;
  distanceScore: number; // 0 to 1
  swingDetected: boolean;
  swingSpeed: number;
  swingSide: 'off' | 'leg' | 'straight';
}

export type TimingQuality = 'PERFECT' | 'EARLY' | 'LATE' | 'MISSED';

export type ShotScoreType = 'OUT' | '0' | '1' | '2' | '3' | 'FOUR' | 'SIX';

export interface ShotResult {
  id: string;
  type: ShotScoreType;
  runs: number;
  timing: TimingQuality;
  speedKph: number;
  shotName: string;
  distanceMeters: number;
  description: string;
  timestamp: number;
}

export interface MatchStats {
  runs: number;
  ballsFaced: number;
  wickets: number;
  maxWickets: number;
  highScore: number;
  fours: number;
  sixes: number;
  dots: number;
  history: ShotResult[];
}

export interface BallState {
  id: number;
  active: boolean;
  progress: number; // 0 (bowler release) -> 1 (impact zone at batsman) -> >1 (flew away or hit wickets)
  speedKph: number;
  lineOffset: number; // -1 to +1 (outside off to down leg)
  flightDurationMs: number;
  isHit: boolean;
  isMissed: boolean;
  hitVector?: { x: number; y: number; z: number };
  hitResult?: ShotResult;
}
