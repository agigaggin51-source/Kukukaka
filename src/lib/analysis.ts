import { Chess, Move } from 'chess.js';
import { AnalyzedMove, AnalysisSummary, MoveClassification, MoveBreakdownCount } from '../types/chess';
import { evaluateBoard, findBestMove, PIECE_VALUES } from './engine';
import { OPENINGS_DATABASE } from './openings';

// Helper to check if a piece was sacrificed
export interface ChessSymbolInfo {
  symbol: string;
  label: string;
  shortLabel: string;
  textColor: string;
  bgColor: string;
  badgeClass: string;
}

export function getClassificationSymbol(
  classification?: MoveClassification
): ChessSymbolInfo | null {
  if (!classification) return null;
  switch (classification) {
    case 'brilliant':
      return {
        symbol: '!!',
        label: 'Brilliant (!!)',
        shortLabel: 'Brilliant',
        textColor: '#0f3830',
        bgColor: '#26c2a3',
        badgeClass: 'bg-[#26c2a3] text-[#0f3830]',
      };
    case 'great':
      return {
        symbol: '!',
        label: 'Great Move (!)',
        shortLabel: 'Great',
        textColor: '#ffffff',
        bgColor: '#5c8bb0',
        badgeClass: 'bg-[#5c8bb0] text-white',
      };
    case 'best':
      return {
        symbol: '★',
        label: 'Best Move (*)',
        shortLabel: 'Best',
        textColor: '#1c3308',
        bgColor: '#81b64c',
        badgeClass: 'bg-[#81b64c] text-[#1c3308]',
      };
    case 'excellent':
      return {
        symbol: '!?',
        label: 'Excellent (!?)',
        shortLabel: 'Excellent',
        textColor: '#1e2d09',
        bgColor: '#96bc4b',
        badgeClass: 'bg-[#96bc4b] text-[#1e2d09]',
      };
    case 'good':
      return {
        symbol: '✓',
        label: 'Good (✓)',
        shortLabel: 'Good',
        textColor: '#ffffff',
        bgColor: '#769656',
        badgeClass: 'bg-[#769656] text-white',
      };
    case 'book':
      return {
        symbol: '📖',
        label: 'Book Move (Teori)',
        shortLabel: 'Book',
        textColor: '#ffffff',
        bgColor: '#a87948',
        badgeClass: 'bg-[#a87948] text-white',
      };
    case 'inaccuracy':
      return {
        symbol: '?!',
        label: 'Inaccuracy (?!)',
        shortLabel: 'Inaccuracy',
        textColor: '#423004',
        bgColor: '#f0c15c',
        badgeClass: 'bg-[#f0c15c] text-[#423004]',
      };
    case 'mistake':
      return {
        symbol: '?',
        label: 'Mistake (?)',
        shortLabel: 'Mistake',
        textColor: '#ffffff',
        bgColor: '#e68f43',
        badgeClass: 'bg-[#e68f43] text-white',
      };
    case 'blunder':
      return {
        symbol: '??',
        label: 'Blunder (??)',
        shortLabel: 'Blunder',
        textColor: '#ffffff',
        bgColor: '#ca3431',
        badgeClass: 'bg-[#ca3431] text-white',
      };
    default:
      return null;
  }
}

// Convert centipawn evaluation into win probability (0 to 1)
export function evalToWinProb(evalInPawns: number): number {
  return 1 / (1 + Math.pow(10, -evalInPawns / 4));
}

// Calculate move accuracy based on win probability drop
export function calculateMoveAccuracy(evalBefore: number, evalAfter: number, isWhite: boolean): number {
  const beforeProb = isWhite ? evalToWinProb(evalBefore) : evalToWinProb(-evalBefore);
  const afterProb = isWhite ? evalToWinProb(evalAfter) : evalToWinProb(-evalAfter);

  const probLoss = Math.max(0, beforeProb - afterProb);
  // CAPS accuracy model
  const rawScore = 100 * Math.max(0, 1 - Math.pow(probLoss, 1.05) * 1.85);
  return Math.min(100, Math.max(0, Math.round(rawScore * 10) / 10));
}

// Estimate performance rating based on accuracy score
export function estimatePerformanceRating(accuracy: number): number {
  if (accuracy >= 98) return 2600;
  if (accuracy >= 95) return 2400;
  if (accuracy >= 90) return 2150;
  if (accuracy >= 85) return 1900;
  if (accuracy >= 80) return 1700;
  if (accuracy >= 75) return 1500;
  if (accuracy >= 70) return 1300;
  if (accuracy >= 60) return 1100;
  if (accuracy >= 50) return 900;
  return 750;
}

function isPieceSacrifice(
  chessBefore: Chess,
  move: Move,
  evalAfterMove: number,
  isWhite: boolean
): boolean {
  const evalForPlayer = isWhite ? evalAfterMove : -evalAfterMove;

  // Must remain in an advantageous or winning position (eval >= 0.5)
  if (evalForPlayer < 0.5) return false;

  const movedPiece = move.piece; // 'p', 'n', 'b', 'r', 'q'
  const capturedPiece = move.captured; // e.g. undefined or 'p'

  // Sacrificed minor or major piece
  if (['n', 'b', 'r', 'q'].includes(movedPiece)) {
    const movedVal = PIECE_VALUES[movedPiece] || 0;
    const capturedVal = capturedPiece ? (PIECE_VALUES[capturedPiece] || 0) : 0;

    // Direct material sacrifice: giving up a piece of greater value for a smaller one
    if (movedVal - capturedVal >= 200) {
      return true;
    }

    // Checking if the piece moved into an attacked square without equal defender
    const testBoard = new Chess(chessBefore.fen());
    testBoard.move(move);

    const opponentMoves = testBoard.moves({ verbose: true });
    const directCapture = opponentMoves.find(
      (m) => m.to === move.to && (PIECE_VALUES[m.piece] || 0) < movedVal
    );
    if (directCapture) {
      return true;
    }
  }

  return false;
}

// Check if a move is part of the standard opening book
function isBookMove(san: string, moveNumber: number): boolean {
  if (moveNumber > 12) return false;
  return OPENINGS_DATABASE.some((op) => {
    const idx = moveNumber - 1;
    return op.moves[idx] === san;
  });
}

// Generate explanation text for a move classification
export function generateExplanation(
  classification: MoveClassification,
  san: string,
  isWhite: boolean,
  evalLoss: number,
  isSacrifice: boolean,
  bestMoveSan?: string
): string {
  const side = isWhite ? 'Putih' : 'Hitam';
  const bestAlternative = bestMoveSan && bestMoveSan !== san ? ` (Langkah terbaik: ${bestMoveSan})` : '';

  switch (classification) {
    case 'brilliant':
      return `${side} mengorbankan perwira dengan brilian (${san}) untuk memegang inisiatif serangan yang tak terbendung! (Pengorbanan taktis bermutu tinggi).`;
    case 'great':
      return `Langkah brilian posisi (${san})! Satu-satunya langkah krusial yang mempertahankan keunggulan taktis dan posisi.`;
    case 'best':
      return `Langkah terbaik mesin (${san}). Memaksimalkan penempatan perwira, tempo, dan penguasaan ruang.`;
    case 'excellent':
      return `Langkah sangat bagus (${san}). Sangat mendekati rekomendasi Stockfish dengan koordinasi perwira yang rapi.`;
    case 'good':
      return `Langkah solid (${san}). Menjaga kesolidan formasi dan stabilitas tempo permainan.`;
    case 'book':
      return `Langkah teori pembukaan catur (${san}). Mengembangkan perwira sesuai prinsip pembukaan standar.`;
    case 'inaccuracy':
      return `Ketidakakuratan (${san}). Kehilangan sedikit keunggulan posisional (~${evalLoss.toFixed(1)} pion).${bestAlternative}`;
    case 'mistake':
      return `Kesalahan posisi/taktik (${san}). Memberi peluang bagi lawan untuk merebut tempo serangan (~${evalLoss.toFixed(1)} pion).${bestAlternative}`;
    case 'blunder':
      return `Blunder fatal (${san})! Membalikkan evaluasi signifikan (~${evalLoss.toFixed(1)} pion) dan membahayakan posisi.${bestAlternative}`;
    default:
      return `Langkah ${san}.`;
  }
}

// Analyze a single move with configurable analysis depth for fast review
export function classifyMove(
  fenBefore: string,
  fenAfter: string,
  san: string,
  moveNumber: number,
  analysisDepth: number = 2
): AnalyzedMove {
  const chessBefore = new Chess(fenBefore);
  const isWhite = chessBefore.turn() === 'w';

  // Find best move in previous position with fast analysis depth
  const engineBest = findBestMove(chessBefore, analysisDepth);
  const evalBefore = engineBest.evaluation;

  // Evaluate position after move
  const chessAfter = new Chess(fenAfter);
  const evalAfter = evaluateBoard(chessAfter) / 100;

  // Calculate eval loss for the player who made the move
  const evalLoss = isWhite ? evalBefore - evalAfter : evalAfter - evalBefore;
  const clampedLoss = Math.max(0, evalLoss);

  // Find move details
  const moves = chessBefore.moves({ verbose: true });
  const actualMove = moves.find((m) => m.san === san) || moves[0];

  const isSacrifice = isPieceSacrifice(chessBefore, actualMove, evalAfter, isWhite);
  const isBook = isBookMove(san, moveNumber) && clampedLoss <= 0.35;

  let classification: MoveClassification = 'good';

  if (isSacrifice && clampedLoss <= 0.35) {
    classification = 'brilliant';
  } else if (isBook) {
    classification = 'book';
  } else if (actualMove.san === engineBest.bestMoveSan || clampedLoss <= 0.12) {
    // If it was a critical tactical find where alternative moves lose >= 1.2 pawns, classify as 'great'
    if (moves.length > 1 && clampedLoss <= 0.08) {
      classification = 'great';
    } else {
      classification = 'best';
    }
  } else if (clampedLoss <= 0.35) {
    classification = 'excellent';
  } else if (clampedLoss <= 0.75) {
    classification = 'good';
  } else if (clampedLoss <= 1.60) {
    classification = 'inaccuracy';
  } else if (clampedLoss <= 3.20) {
    classification = 'mistake';
  } else {
    classification = 'blunder';
  }

  const accuracy = calculateMoveAccuracy(evalBefore, evalAfter, isWhite);

  const explanation = generateExplanation(
    classification,
    san,
    isWhite,
    clampedLoss,
    isSacrifice,
    engineBest.bestMoveSan
  );

  return {
    moveNumber,
    color: isWhite ? 'w' : 'b',
    san,
    from: actualMove.from,
    to: actualMove.to,
    fenBefore,
    fenAfter,
    evalBefore,
    evalAfter,
    evalLoss: clampedLoss,
    accuracy,
    bestMoveSan: engineBest.bestMoveSan,
    bestMove: engineBest.bestMove,
    classification,
    explanation,
    isCapture: !!actualMove.captured,
    isCheck: chessAfter.inCheck(),
  };
}

const createEmptyBreakdown = (): MoveBreakdownCount => ({
  brilliant: 0,
  great: 0,
  best: 0,
  excellent: 0,
  good: 0,
  book: 0,
  inaccuracy: 0,
  mistake: 0,
  blunder: 0,
});

// Compute aggregate analysis breakdown with White vs Black side-by-side comparison
export function summarizeAnalysis(analyzedMoves: AnalyzedMove[]): AnalysisSummary {
  const whiteBreakdown = createEmptyBreakdown();
  const blackBreakdown = createEmptyBreakdown();

  const totalBreakdown = {
    brilliant: 0,
    great: 0,
    best: 0,
    excellent: 0,
    good: 0,
    book: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
  };

  const keyMoments: number[] = [];

  if (analyzedMoves.length === 0) {
    return {
      ...totalBreakdown,
      accuracyWhite: 85,
      accuracyBlack: 85,
      whiteBreakdown,
      blackBreakdown,
      whitePerformance: 1700,
      blackPerformance: 1700,
      keyMoments: [],
      keyMomentsCount: 0,
    };
  }

  let whiteAccSum = 0;
  let whiteCount = 0;
  let blackAccSum = 0;
  let blackCount = 0;

  for (const m of analyzedMoves) {
    const cls = m.classification || 'good';
    if (cls in totalBreakdown) {
      totalBreakdown[cls]++;
    }

    const moveAcc = m.accuracy !== undefined ? m.accuracy : 80;

    if (m.color === 'w') {
      if (cls in whiteBreakdown) {
        whiteBreakdown[cls]++;
      }
      whiteAccSum += moveAcc;
      whiteCount++;
    } else {
      if (cls in blackBreakdown) {
        blackBreakdown[cls]++;
      }
      blackAccSum += moveAcc;
      blackCount++;
    }

    // Key moments: Brilliant, Great, Mistake, or Blunder
    if (['brilliant', 'great', 'mistake', 'blunder'].includes(cls)) {
      keyMoments.push(m.moveNumber);
    }
  }

  const accuracyWhite = whiteCount > 0 ? Math.round((whiteAccSum / whiteCount) * 10) / 10 : 85;
  const accuracyBlack = blackCount > 0 ? Math.round((blackAccSum / blackCount) * 10) / 10 : 85;

  return {
    ...totalBreakdown,
    accuracyWhite,
    accuracyBlack,
    whiteBreakdown,
    blackBreakdown,
    whitePerformance: estimatePerformanceRating(accuracyWhite),
    blackPerformance: estimatePerformanceRating(accuracyBlack),
    keyMoments,
    keyMomentsCount: keyMoments.length,
  };
}
