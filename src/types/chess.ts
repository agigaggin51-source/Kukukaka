export type GameMode = 'vs-ai' | 'pass-play' | 'analysis' | 'puzzle-trainer' | 'board-editor' | 'online-multiplayer';
export type PlayerColor = 'w' | 'b';
export type BoardThemeId = 'green' | 'wood' | 'blue' | 'slate' | 'neon';

export interface BoardTheme {
  id: BoardThemeId;
  name: string;
  lightSquare: string;
  darkSquare: string;
  selectedSquare: string;
  lastMoveSquare: string;
  checkSquare: string;
}

export type MoveClassification = 
  | 'brilliant' 
  | 'great' 
  | 'best' 
  | 'excellent' 
  | 'good' 
  | 'inaccuracy' 
  | 'mistake' 
  | 'blunder' 
  | 'book';

export interface MoveBreakdownCount {
  brilliant: number;
  great: number;
  best: number;
  excellent: number;
  good: number;
  book: number;
  inaccuracy: number;
  mistake: number;
  blunder: number;
}

export interface AnalyzedMove {
  moveNumber: number;
  color: PlayerColor;
  san: string;
  from: string;
  to: string;
  fenBefore: string;
  fenAfter: string;
  evalBefore: number;
  evalAfter: number;
  evalLoss?: number;
  accuracy?: number; // 0 - 100%
  bestMoveSan?: string;
  bestMove?: string;
  classification?: MoveClassification;
  explanation?: string;
  isCapture?: boolean;
  isCheck?: boolean;
}

export interface OpeningData {
  eco: string;
  name: string;
  nameId: string; // Indonesian title
  desc: string;   // Indonesian explanation
  descEn: string;
  moves: string[]; // sequence of SAN moves, e.g. ["e4", "e5", "Nf3"]
}

export interface EngineResult {
  bestMove: string; // e.g. "e2e4" or SAN
  bestMoveSan: string;
  evaluation: number; // in pawns e.g. +0.45 or -2.1
  mateIn?: number;
  depth: number;
  pv: string[]; // principal variation
}

export interface AnalysisSummary {
  brilliant: number;
  great: number;
  best: number;
  excellent: number;
  good: number;
  book: number;
  inaccuracy: number;
  mistake: number;
  blunder: number;
  accuracyWhite: number;
  accuracyBlack: number;
  whiteBreakdown: MoveBreakdownCount;
  blackBreakdown: MoveBreakdownCount;
  whitePerformance: number;
  blackPerformance: number;
  keyMoments: number[]; // 1-based move numbers
  keyMomentsCount: number;
}

export interface PuzzleData {
  id: string;
  title: string;
  titleId: string;
  white: string;
  black: string;
  fen: string;
  pgn: string;
  keyMove: string;
  solutionMoves: string[]; // sequence of winning moves, e.g. ["Qb8+", "Nxb8", "Rd8#"]
  hint: string;
  classification: MoveClassification;
  difficulty: 'Beginner' | 'Intermediate' | 'Master' | 'Grandmaster';
  description: string;
}

