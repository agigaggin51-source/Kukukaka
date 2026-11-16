import { Chess } from 'chess.js';
import { AnalyzedMove } from '../types/chess';
import { findBestMove, evaluateBoard } from '../lib/engine';
import { classifyMove, summarizeAnalysis } from '../lib/analysis';

// Web Worker for offloading all heavy minimax search and tactical classification off the main UI thread

self.onmessage = (event: MessageEvent) => {
  const { type, id, payload } = event.data;

  try {
    switch (type) {
      case 'EVALUATE': {
        const { fen, depth = 3, movetimeMs = 300 } = payload;
        const chess = new Chess(fen);
        const result = findBestMove(chess, depth, undefined, movetimeMs);
        self.postMessage({ type: 'EVALUATE_RESULT', id, result });
        break;
      }

      case 'AI_MOVE': {
        const { fen, level = 3, recentFens, movetimeMs = 800 } = payload;
        const chess = new Chess(fen);
        const result = findBestMove(chess, level, recentFens, movetimeMs);
        self.postMessage({ type: 'AI_MOVE_RESULT', id, result });
        break;
      }

      case 'CLASSIFY_MOVE': {
        const { fenBefore, fenAfter, san, moveNumber, movetimeMs = 300 } = payload;
        const result = classifyMove(fenBefore, fenAfter, san, moveNumber, 2, movetimeMs);
        self.postMessage({ type: 'CLASSIFY_MOVE_RESULT', id, result });
        break;
      }

      case 'RUN_BATCH_ANALYSIS': {
        const { historySans, cachedMoves = [] } = payload;
        const simChess = new Chess();
        const analyzedMoves: AnalyzedMove[] = [];
        const total = historySans.length;

        // Build quick lookup map for moves already analyzed live during the game
        const cacheMap = new Map<number, AnalyzedMove>();
        if (Array.isArray(cachedMoves)) {
          for (const m of cachedMoves) {
            if (m && typeof m.moveNumber === 'number') {
              cacheMap.set(m.moveNumber, m);
            }
          }
        }

        for (let i = 0; i < total; i++) {
          const san = historySans[i];
          const moveNumber = i + 1;
          const fenBefore = simChess.fen();
          const moveRes = simChess.move(san);
          if (!moveRes) break;
          const fenAfter = simChess.fen();

          // 1. Instant Cache Hit from live game analysis
          const cached = cacheMap.get(moveNumber);
          if (cached && cached.san === san) {
            analyzedMoves.push(cached);
          } else {
            // 2. Fast tactical analysis (depth 2, max 300ms movetime) for uncached moves
            const movetimeMs = payload.movetimeMs ?? 300;
            const analyzed = classifyMove(fenBefore, fenAfter, san, moveNumber, 2, movetimeMs);
            analyzedMoves.push(analyzed);
          }

          // 3. Emit progress update for real-time progress indicator
          self.postMessage({
            type: 'BATCH_ANALYSIS_PROGRESS',
            id,
            current: moveNumber,
            total,
          });
        }

        const summary = summarizeAnalysis(analyzedMoves);
        self.postMessage({
          type: 'RUN_BATCH_ANALYSIS_RESULT',
          id,
          result: { analyzedMoves, summary },
        });
        break;
      }

      case 'EVALUATE_BOARD_QUICK': {
        const { fen } = payload;
        const chess = new Chess(fen);
        const score = evaluateBoard(chess) / 100;
        self.postMessage({ type: 'EVALUATE_BOARD_QUICK_RESULT', id, score });
        break;
      }

      default:
        console.warn('[Engine Worker] Unknown message type:', type);
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Engine calculation error';
    self.postMessage({ type: 'ERROR', id, error: errorMsg });
  }
};
