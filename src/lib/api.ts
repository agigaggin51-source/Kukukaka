export interface BackendPuzzle {
  id: string;
  title: string;
  titleId: string;
  white: string;
  black: string;
  fen: string;
  pgn: string;
  keyMove: string;
  solutionMoves?: string[];
  hint?: string;
  classification: string;
  difficulty: string;
  description: string;
}

export interface CoachInsightResponse {
  success: boolean;
  source: string;
  insight: string;
  suggestedPlan?: string;
}

export interface ServerHealthResponse {
  status: string;
  service: string;
  version: string;
  geminiEnabled: boolean;
  timestamp: string;
}

export interface VerifyPuzzleResponse {
  correct: boolean;
  isFinished: boolean;
  nextOpponentMove?: string | null;
  hint?: string;
  message: string;
}

export interface ExportPgnResponse {
  success: boolean;
  formattedPgn: string;
  filename: string;
}

/**
 * Fetch puzzles database from Express backend
 */
export async function fetchPuzzles(): Promise<BackendPuzzle[]> {
  try {
    const res = await fetch('/api/puzzles');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.puzzles || [];
  } catch (err) {
    console.warn('Backend fetchPuzzles failed, returning offline fallback:', err);
    return [];
  }
}

/**
 * Verify puzzle move against backend solution line
 */
export async function verifyPuzzleMove(params: {
  puzzleId: string;
  moveSan: string;
  stepIndex: number;
}): Promise<VerifyPuzzleResponse> {
  try {
    const res = await fetch('/api/puzzles/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend verifyPuzzleMove failed:', err);
    return {
      correct: false,
      isFinished: false,
      message: 'Koneksi backend bermasalah.',
    };
  }
}

/**
 * Export PGN with tournament tags
 */
export async function exportTournamentPGN(params: {
  pgn: string;
  event?: string;
  white?: string;
  black?: string;
  result?: string;
}): Promise<ExportPgnResponse> {
  try {
    const res = await fetch('/api/pgn/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend exportTournamentPGN failed:', err);
    return {
      success: false,
      formattedPgn: params.pgn,
      filename: 'game.pgn',
    };
  }
}

/**
 * Verify backend connectivity
 */
export async function checkServerHealth(): Promise<ServerHealthResponse | null> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Request server-side Grandmaster AI Coach analysis for current position
 */
export async function requestCoachInsight(params: {
  fen: string;
  san?: string;
  moveNumber?: number;
  evalPawns: number;
  color: 'w' | 'b';
  bestMove?: string;
  inCheck?: boolean;
}): Promise<CoachInsightResponse> {
  try {
    const res = await fetch('/api/coach-explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend requestCoachInsight failed:', err);
    return {
      success: false,
      source: 'offline-fallback',
      insight: 'Posisi dinamis. Kembangkan perwira ke arah pusat dan perhatikan keamanan raja.',
    };
  }
}

