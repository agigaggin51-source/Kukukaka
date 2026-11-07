import { Chess, Move, Square } from 'chess.js';
import { EngineResult } from '../types/chess';

// Piece values in centipawns
export const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece Square Tables (White's perspective; flipped for Black)
const PAWN_PST = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_PST = [
 -50,-40,-30,-30,-30,-30,-40,-50,
 -40,-20,  0,  0,  0,  0,-20,-40,
 -30,  0, 10, 15, 15, 10,  0,-30,
 -30,  5, 15, 20, 20, 15,  5,-30,
 -30,  0, 15, 20, 20, 15,  0,-30,
 -30,  5, 10, 15, 15, 10,  5,-30,
 -40,-20,  0,  5,  5,  0,-20,-40,
 -50,-40,-30,-30,-30,-30,-40,-50,
];

const BISHOP_PST = [
 -20,-10,-10,-10,-10,-10,-10,-20,
 -10,  0,  0,  0,  0,  0,  0,-10,
 -10,  0,  5, 10, 10,  5,  0,-10,
 -10,  5,  5, 10, 10,  5,  5,-10,
 -10,  0, 10, 10, 10, 10,  0,-10,
 -10, 10, 10, 10, 10, 10, 10,-10,
 -10,  5,  0,  0,  0,  0,  5,-10,
 -20,-10,-10,-10,-10,-10,-10,-20,
];

const ROOK_PST = [
   0,  0,  0,  0,  0,  0,  0,  0,
   5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
   0,  0,  0,  5,  5,  0,  0,  0
];

const QUEEN_PST = [
 -20,-10,-10, -5, -5,-10,-10,-20,
 -10,  0,  0,  0,  0,  0,  0,-10,
 -10,  0,  5,  5,  5,  5,  0,-10,
  -5,  0,  5,  5,  5,  5,  0, -5,
   0,  0,  5,  5,  5,  5,  0, -5,
 -10,  5,  5,  5,  5,  5,  0,-10,
 -10,  0,  5,  0,  0,  0,  0,-10,
 -20,-10,-10, -5, -5,-10,-10,-20
];

// Middlegame King Table (favors castle safety on back rank)
const KING_MID_PST = [
 -30,-40,-40,-50,-50,-40,-40,-30,
 -30,-40,-40,-50,-50,-40,-40,-30,
 -30,-40,-40,-50,-50,-40,-40,-30,
 -30,-40,-40,-50,-50,-40,-40,-30,
 -20,-30,-30,-40,-40,-30,-30,-20,
 -10,-20,-20,-20,-20,-20,-20,-10,
  20, 20,  0,  0,  0,  0, 20, 20,
  20, 30, 10,  0,  0, 10, 30, 20
];

// Endgame King Table (favors centralization and king activity to support mate)
const KING_END_PST = [
 -50,-30,-30,-30,-30,-30,-30,-50,
 -30,-10, 10, 10, 10, 10,-10,-30,
 -30,-10, 20, 30, 30, 20,-10,-30,
 -30,-10, 30, 40, 40, 30,-10,-30,
 -30,-10, 30, 40, 40, 30,-10,-30,
 -30,-10, 20, 30, 30, 20,-10,-30,
 -30,-20,-10,  0,  0,-10,-20,-30,
 -50,-40,-30,-20,-20,-30,-40,-50
];

// Square index from 0 to 63
function getSquareIndex(square: Square, isWhite: boolean): number {
  const file = square.charCodeAt(0) - 97; // a -> 0
  const rank = 8 - parseInt(square[1], 10); // 8 -> 0
  const idx = rank * 8 + file;
  return isWhite ? idx : (7 - rank) * 8 + file;
}

export interface BoardMetrics {
  whiteMaterial: number;
  blackMaterial: number;
  whitePieces: number;
  blackPieces: number;
  whiteKingSq: Square;
  blackKingSq: Square;
  isEndgame: boolean;
  winningSide: 'w' | 'b' | null;
  materialDiff: number;
}

export function getBoardMetrics(chess: Chess): BoardMetrics {
  let whiteMaterial = 0;
  let blackMaterial = 0;
  let whitePieces = 0;
  let blackPieces = 0;
  let whiteKingSq: Square = 'e1';
  let blackKingSq: Square = 'e8';

  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const p = board[r][f];
      if (!p) continue;
      const val = PIECE_VALUES[p.type] || 0;
      const fileChar = String.fromCharCode(97 + f);
      const rankChar = String(8 - r);
      const sq = (fileChar + rankChar) as Square;

      if (p.type === 'k') {
        if (p.color === 'w') whiteKingSq = sq;
        else blackKingSq = sq;
      } else {
        if (p.color === 'w') {
          whiteMaterial += val;
          whitePieces++;
        } else {
          blackMaterial += val;
          blackPieces++;
        }
      }
    }
  }

  const isEndgame =
    whiteMaterial <= 1400 || blackMaterial <= 1400 || whitePieces + blackPieces <= 5;
  const materialDiff = whiteMaterial - blackMaterial;
  let winningSide: 'w' | 'b' | null = null;
  if (materialDiff >= 350) winningSide = 'w';
  else if (materialDiff <= -350) winningSide = 'b';

  return {
    whiteMaterial,
    blackMaterial,
    whitePieces,
    blackPieces,
    whiteKingSq,
    blackKingSq,
    isEndgame,
    winningSide,
    materialDiff,
  };
}

// Evaluate position statically from White's perspective (+ is better for White)
export function evaluateBoard(chess: Chess): number {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -30000 : 30000;
  }
  if (chess.isDraw()) {
    return 0;
  }

  const metrics = getBoardMetrics(chess);
  let totalScore = 0;
  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const piece = board[r][f];
      if (!piece) continue;

      const val = PIECE_VALUES[piece.type] || 0;
      const fileChar = String.fromCharCode(97 + f);
      const rankChar = String(8 - r);
      const sq = (fileChar + rankChar) as Square;
      const isWhite = piece.color === 'w';

      let pstBonus = 0;
      const pstIdx = getSquareIndex(sq, isWhite);

      switch (piece.type) {
        case 'p': {
          pstBonus = PAWN_PST[pstIdx] || 0;
          // In endgame, heavily reward advanced passed pawns
          if (metrics.isEndgame) {
            const pawnRank = isWhite ? 8 - r : r + 1;
            if (pawnRank >= 5) {
              pstBonus += (pawnRank - 4) * 45;
            }
          }
          break;
        }
        case 'n':
          pstBonus = KNIGHT_PST[pstIdx] || 0;
          break;
        case 'b':
          pstBonus = BISHOP_PST[pstIdx] || 0;
          break;
        case 'r':
          pstBonus = ROOK_PST[pstIdx] || 0;
          break;
        case 'q':
          pstBonus = QUEEN_PST[pstIdx] || 0;
          break;
        case 'k': {
          // In endgame or won position, use active King PST so King helps execute mate
          if (metrics.isEndgame || metrics.winningSide) {
            pstBonus = KING_END_PST[pstIdx] || 0;
          } else {
            pstBonus = KING_MID_PST[pstIdx] || 0;
          }
          break;
        }
      }

      const score = val + pstBonus;
      totalScore += isWhite ? score : -score;
    }
  }

  // Mop-Up Evaluation: Active King Drive & Enemy King Cornering in Won/Endgame Positions
  if (metrics.winningSide) {
    const isWhiteWinning = metrics.winningSide === 'w';
    const winKingSq = isWhiteWinning ? metrics.whiteKingSq : metrics.blackKingSq;
    const loseKingSq = isWhiteWinning ? metrics.blackKingSq : metrics.whiteKingSq;

    const winRank = 8 - parseInt(winKingSq[1], 10);
    const winFile = winKingSq.charCodeAt(0) - 97;
    const loseRank = 8 - parseInt(loseKingSq[1], 10);
    const loseFile = loseKingSq.charCodeAt(0) - 97;

    // 1. Distance of losing King to corners/edges (drive enemy king to rim)
    const centerDistRank = Math.max(3 - loseRank, loseRank - 4);
    const centerDistFile = Math.max(3 - loseFile, loseFile - 4);
    const cornerDistance = centerDistRank + centerDistFile; // 0 (center) to 6 (corner)
    const cornerBonus = cornerDistance * 35;

    // 2. Proximity between winning King and losing King (bring king to support checkmate)
    const manhattanDist = Math.abs(winRank - loseRank) + Math.abs(winFile - loseFile);
    const closenessBonus = (14 - manhattanDist) * 25;

    const mopUpTotal = cornerBonus + closenessBonus;
    totalScore += isWhiteWinning ? mopUpTotal : -mopUpTotal;
  }

  return totalScore;
}

// Order moves: checks & checkmates first, captures (MVV-LVA), then promotions and quiet moves
function orderMoves(moves: Move[], chess: Chess): Move[] {
  return moves.slice().sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    // Fast checkmate priority
    if (a.san.includes('#')) scoreA += 100000;
    if (b.san.includes('#')) scoreB += 100000;

    // Direct check priority
    if (a.san.includes('+')) scoreA += 5000;
    if (b.san.includes('+')) scoreB += 5000;

    // Captures (MVV-LVA)
    if (a.captured) {
      scoreA += (PIECE_VALUES[a.captured] || 0) * 10 - (PIECE_VALUES[a.piece] || 0) + 1000;
    }
    if (b.captured) {
      scoreB += (PIECE_VALUES[b.captured] || 0) * 10 - (PIECE_VALUES[b.piece] || 0) + 1000;
    }

    // Promotions
    if (a.promotion) scoreA += 900;
    if (b.promotion) scoreB += 900;

    return scoreB - scoreA;
  });
}

// Alpha-Beta Minimax search with Mate Distance Pruning (ply) and Anti-Stalemate Penalties
function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  ply: number = 0,
  recentFens?: Set<string>
): { score: number; bestMove?: Move } {
  // Mate distance pruning: faster checkmates score higher, prolonged checkmates score lower
  if (chess.isCheckmate()) {
    return { score: chess.turn() === 'w' ? -30000 + ply : 30000 - ply };
  }

  if (chess.isDraw()) {
    // When ahead, a draw (stalemate/repetition) is catastrophic; avoid it at all costs!
    const staticEval = evaluateBoard(chess);
    if (staticEval > 300) return { score: -20000 + ply };
    if (staticEval < -300) return { score: 20000 - ply };
    return { score: 0 };
  }

  if (depth === 0) {
    return { score: evaluateBoard(chess) };
  }

  const moves = orderMoves(chess.moves({ verbose: true }), chess);
  if (moves.length === 0) {
    return { score: evaluateBoard(chess) };
  }

  let bestMove: Move | undefined = moves[0];

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const res = minimax(chess, depth - 1, alpha, beta, false, ply + 1, recentFens);
      chess.undo();

      // Repetition penalty in winning position to prevent endless piece shuffling
      let effectiveScore = res.score;
      if (recentFens && recentFens.size > 0 && effectiveScore > 400 && !move.san.includes('#')) {
        const nextFen = chess.fen().split(' ')[0];
        if (recentFens.has(nextFen)) {
          effectiveScore -= 300;
        }
      }

      if (effectiveScore > maxEval) {
        maxEval = effectiveScore;
        bestMove = move;
      }
      alpha = Math.max(alpha, effectiveScore);
      if (beta <= alpha) break; // Beta cutoff
    }
    return { score: maxEval, bestMove };
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const res = minimax(chess, depth - 1, alpha, beta, true, ply + 1, recentFens);
      chess.undo();

      let effectiveScore = res.score;
      if (recentFens && recentFens.size > 0 && effectiveScore < -400 && !move.san.includes('#')) {
        const nextFen = chess.fen().split(' ')[0];
        if (recentFens.has(nextFen)) {
          effectiveScore += 300;
        }
      }

      if (effectiveScore < minEval) {
        minEval = effectiveScore;
        bestMove = move;
      }
      beta = Math.min(beta, effectiveScore);
      if (beta <= alpha) break; // Alpha cutoff
    }
    return { score: minEval, bestMove };
  }
}

/**
 * Fast Dedicated Mate-in-1 Checker
 * If any legal move immediately delivers checkmate, return it immediately across ALL levels.
 */
function findInstantMateInOne(chess: Chess): Move | null {
  const legalMoves = chess.moves({ verbose: true });
  for (const m of legalMoves) {
    chess.move(m);
    const isMate = chess.isCheckmate();
    chess.undo();
    if (isMate) {
      return m;
    }
  }
  return null;
}

/**
 * Fast Forced Mate-in-2 Checker
 * If any legal move guarantees a checkmate on the next turn against all opponent replies,
 * return that move immediately to prevent delay and piece shuffling.
 */
function findInstantMateInTwo(chess: Chess): { candidate: Move; pv: string[] } | null {
  const legalMoves = chess.moves({ verbose: true });
  // Prioritize checks and captures first
  const sorted = legalMoves.slice().sort((a, b) => {
    const aCheck = a.san.includes('+') ? 1 : 0;
    const bCheck = b.san.includes('+') ? 1 : 0;
    return bCheck - aCheck;
  });

  for (const candidate of sorted) {
    chess.move(candidate);
    const replies = chess.moves({ verbose: true });
    if (replies.length > 0) {
      let allRepliesMated = true;
      let samplePv: string[] = [];

      for (const reply of replies) {
        chess.move(reply);
        const counterMoves = chess.moves({ verbose: true });
        const killerMate = counterMoves.find((cm) => {
          chess.move(cm);
          const done = chess.isCheckmate();
          chess.undo();
          return done;
        });
        chess.undo();

        if (!killerMate) {
          allRepliesMated = false;
          break;
        } else if (samplePv.length === 0) {
          samplePv = [candidate.san, reply.san, killerMate.san];
        }
      }

      if (allRepliesMated) {
        chess.undo();
        return { candidate, pv: samplePv };
      }
    }
    chess.undo();
  }
  return null;
}

/**
 * Find best move with checkmate priority, endgame King centralization, and anti-shuffle logic
 */
export function findBestMove(
  chessInstance: Chess,
  depth: number = 3,
  recentFens?: string[]
): EngineResult {
  const clone = new Chess(chessInstance.fen());
  const isWhite = clone.turn() === 'w';
  const legalMoves = clone.moves({ verbose: true });

  if (legalMoves.length === 0) {
    return {
      bestMove: '',
      bestMoveSan: '',
      evaluation: 0,
      depth,
      pv: [],
    };
  }

  // -----------------------------------------------------------------
  // 1. TACTICAL MATE-IN-1: Checked immediately at ALL levels
  // -----------------------------------------------------------------
  const instantMate = findInstantMateInOne(clone);
  if (instantMate) {
    return {
      bestMove: instantMate.from + instantMate.to + (instantMate.promotion || ''),
      bestMoveSan: instantMate.san,
      evaluation: isWhite ? 300 : -300,
      mateIn: isWhite ? 1 : -1,
      depth: Math.max(depth, 1),
      pv: [instantMate.san],
    };
  }

  // -----------------------------------------------------------------
  // 2. TACTICAL FORCED MATE-IN-2: Fast execution check
  // -----------------------------------------------------------------
  const instantMate2 = findInstantMateInTwo(clone);
  if (instantMate2) {
    return {
      bestMove:
        instantMate2.candidate.from +
        instantMate2.candidate.to +
        (instantMate2.candidate.promotion || ''),
      bestMoveSan: instantMate2.candidate.san,
      evaluation: isWhite ? 299 : -299,
      mateIn: isWhite ? 2 : -2,
      depth: Math.max(depth, 2),
      pv: instantMate2.pv,
    };
  }

  // Analyze board metrics to detect overwhelming advantage or endgame
  const metrics = getBoardMetrics(clone);
  const isWinning = isWhite ? metrics.materialDiff >= 450 : metrics.materialDiff <= -450;
  const isOverwhelming = isWhite ? metrics.materialDiff >= 700 : metrics.materialDiff <= -700;
  const isEndgame = metrics.isEndgame;

  // -----------------------------------------------------------------
  // 3. Easy Mode (depth 1):
  // When in winning position, endgame, or mate search: NEVER blunder or play random moves!
  // Only play occasional random moves in quiet, non-winning early game positions.
  // -----------------------------------------------------------------
  if (depth === 1 && !isWinning && !isEndgame) {
    if (Math.random() < 0.35 && legalMoves.length > 1) {
      // Pick a random non-blunder move
      const nonHangingMoves = legalMoves.filter((m) => !m.captured || PIECE_VALUES[m.piece] <= 330);
      const candidates = nonHangingMoves.length > 0 ? nonHangingMoves : legalMoves;
      const randomMove = candidates[Math.floor(Math.random() * candidates.length)];
      return {
        bestMove: randomMove.from + randomMove.to + (randomMove.promotion || ''),
        bestMoveSan: randomMove.san,
        evaluation: Number((evaluateBoard(clone) / 100).toFixed(2)),
        depth: 1,
        pv: [randomMove.san],
      };
    }
  }

  // Dynamic search depth: boost depth when in endgame or winning to guarantee precise checkmate
  let searchDepth = Math.max(1, Math.min(depth, 5));
  if ((isWinning || isEndgame) && searchDepth < 3) {
    searchDepth = 3;
  }
  if (isOverwhelming && searchDepth < 4) {
    searchDepth = 4;
  }

  // Build recent positions set for anti-shuffle repetition prevention
  const recentFenSet = new Set<string>();
  if (recentFens && recentFens.length > 0) {
    for (const f of recentFens) {
      recentFenSet.add(f.split(' ')[0]);
    }
  }

  // Execute Alpha-Beta Minimax search
  const result = minimax(clone, searchDepth, -Infinity, Infinity, isWhite, 0, recentFenSet);

  let bestMove = result.bestMove || legalMoves[0];

  // Anti-shuffle fallback: if chosen move repeats recent position and we have winning advantage,
  // pick the next best move that does not repeat the board state unless it's checkmate.
  if (
    isWinning &&
    recentFenSet.size > 0 &&
    !bestMove.san.includes('#') &&
    legalMoves.length > 1
  ) {
    const testSim = new Chess(clone.fen());
    testSim.move(bestMove);
    const resultingFen = testSim.fen().split(' ')[0];

    if (recentFenSet.has(resultingFen)) {
      // Find alternative progressive moves (checks, pawn advances, king advances towards enemy)
      const nonRepeating = legalMoves.filter((m) => {
        const s = new Chess(clone.fen());
        s.move(m);
        return !recentFenSet.has(s.fen().split(' ')[0]);
      });

      if (nonRepeating.length > 0) {
        // Pick the top alternative evaluated move
        let topAlt = nonRepeating[0];
        let bestAltScore = isWhite ? -Infinity : Infinity;

        for (const alt of nonRepeating) {
          const s = new Chess(clone.fen());
          s.move(alt);
          const score = evaluateBoard(s);
          if (isWhite ? score > bestAltScore : score < bestAltScore) {
            bestAltScore = score;
            topAlt = alt;
          }
        }
        bestMove = topAlt;
      }
    }
  }

  // Calculate principal variation line (up to 3 moves ahead)
  const pv: string[] = [bestMove.san];
  const pvSim = new Chess(clone.fen());
  pvSim.move(bestMove);

  for (let i = 0; i < 3 && !pvSim.isGameOver(); i++) {
    const nextRes = minimax(pvSim, 1, -Infinity, Infinity, pvSim.turn() === 'w', 0);
    if (nextRes.bestMove) {
      pv.push(nextRes.bestMove.san);
      pvSim.move(nextRes.bestMove);
    } else {
      break;
    }
  }

  // Compute evaluation in pawns and mate distance
  let evalPawns = result.score / 100;
  let mateIn: number | undefined;

  if (Math.abs(result.score) > 25000) {
    const movesToMate = Math.ceil((30000 - Math.abs(result.score)) / 2) || 1;
    mateIn = result.score > 0 ? movesToMate : -movesToMate;
  }

  return {
    bestMove: bestMove.from + bestMove.to + (bestMove.promotion || ''),
    bestMoveSan: bestMove.san,
    evaluation: Number(evalPawns.toFixed(2)),
    mateIn,
    depth: searchDepth,
    pv,
  };
}

