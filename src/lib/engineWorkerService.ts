import { Chess } from 'chess.js';
import { EngineResult, AnalyzedMove, AnalysisSummary } from '../types/chess';
import { findBestMove, evaluateBoard } from './engine';
import { classifyMove, summarizeAnalysis } from './analysis';

type WorkerCallback = (data: any) => void;

class EngineWorkerService {
  private worker: Worker | null = null;
  private messageId = 0;
  private callbacks = new Map<number, WorkerCallback>();
  private progressCallbacks = new Map<number, (current: number, total: number) => void>();
  private currentEvalRequestId: number | null = null;
  private isWorkerAvailable = false;

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    try {
      if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
        this.worker = new Worker(new URL('../workers/engineWorker.ts', import.meta.url), {
          type: 'module',
        });

        this.worker.onmessage = (event: MessageEvent) => {
          const { id, type, current, total, result, score, error } = event.data;

          if (type === 'BATCH_ANALYSIS_PROGRESS') {
            const progCb = this.progressCallbacks.get(id);
            if (progCb) {
              progCb(current, total);
            }
            return;
          }

          const cb = this.callbacks.get(id);
          if (cb) {
            this.callbacks.delete(id);
            this.progressCallbacks.delete(id);
            if (error) {
              console.warn('[Engine Worker Error]:', error);
            } else {
              cb(result ?? score);
            }
          }
        };

        this.worker.onerror = (err) => {
          console.warn('[Engine Worker Error Handler]:', err);
          this.isWorkerAvailable = false;
        };

        this.isWorkerAvailable = true;
      }
    } catch (err) {
      console.warn('Web Worker initialization fallback to async main-thread:', err);
      this.isWorkerAvailable = false;
    }
  }

  /**
   * Request position evaluation with automatic debouncing / cancellation of older requests
   */
  public evaluatePositionAsync(fen: string, depth = 3): Promise<EngineResult> {
    const id = ++this.messageId;
    this.currentEvalRequestId = id;

    return new Promise((resolve) => {
      // If Web Worker is active, delegate search to worker thread
      if (this.worker && this.isWorkerAvailable) {
        this.callbacks.set(id, (res: EngineResult) => {
          // Only resolve if this is still the most recent evaluation request
          if (this.currentEvalRequestId === id) {
            resolve(res);
          }
        });

        this.worker.postMessage({
          type: 'EVALUATE',
          id,
          payload: { fen, depth },
        });
      } else {
        // Fallback: Non-blocking async execution using setTimeout
        setTimeout(() => {
          if (this.currentEvalRequestId === id) {
            try {
              const chess = new Chess(fen);
              const res = findBestMove(chess, depth);
              resolve(res);
            } catch {
              resolve({ bestMove: '', bestMoveSan: '', evaluation: 0, depth, pv: [] });
            }
          }
        }, 0);
      }
    });
  }

  /**
   * Request AI Move computation without blocking the UI
   */
  public getAiMoveAsync(fen: string, level = 3, recentFens?: string[]): Promise<EngineResult> {
    const id = ++this.messageId;

    return new Promise((resolve) => {
      if (this.worker && this.isWorkerAvailable) {
        this.callbacks.set(id, (res: EngineResult) => {
          resolve(res);
        });

        this.worker.postMessage({
          type: 'AI_MOVE',
          id,
          payload: { fen, level, recentFens },
        });
      } else {
        setTimeout(() => {
          try {
            const chess = new Chess(fen);
            const res = findBestMove(chess, level, recentFens);
            resolve(res);
          } catch {
            resolve({ bestMove: '', bestMoveSan: '', evaluation: 0, depth: level, pv: [] });
          }
        }, 0);
      }
    });
  }

  /**
   * Asynchronously classify move for sacrifice/brilliant detection
   */
  public classifyMoveAsync(
    fenBefore: string,
    fenAfter: string,
    san: string,
    moveNumber: number
  ): Promise<AnalyzedMove> {
    const id = ++this.messageId;

    return new Promise((resolve) => {
      if (this.worker && this.isWorkerAvailable) {
        this.callbacks.set(id, (res: AnalyzedMove) => {
          resolve(res);
        });

        this.worker.postMessage({
          type: 'CLASSIFY_MOVE',
          id,
          payload: { fenBefore, fenAfter, san, moveNumber },
        });
      } else {
        setTimeout(() => {
          try {
            const res = classifyMove(fenBefore, fenAfter, san, moveNumber);
            resolve(res);
          } catch {
            resolve({
              moveNumber,
              color: 'w',
              san,
              from: '',
              to: '',
              fenBefore,
              fenAfter,
              evalBefore: 0,
              evalAfter: 0,
              classification: 'good',
              explanation: `Langkah ${san}`,
            });
          }
        }, 0);
      }
    });
  }

  /**
   * Asynchronously run full game analysis for all moves with caching and progress reporting
   */
  public runBatchAnalysisAsync(
    historySans: string[],
    cachedMoves?: AnalyzedMove[],
    onProgress?: (current: number, total: number) => void
  ): Promise<{ analyzedMoves: AnalyzedMove[]; summary: AnalysisSummary }> {
    const id = ++this.messageId;

    return new Promise((resolve) => {
      if (onProgress) {
        this.progressCallbacks.set(id, onProgress);
      }

      if (this.worker && this.isWorkerAvailable) {
        this.callbacks.set(
          id,
          (res: { analyzedMoves: AnalyzedMove[]; summary: AnalysisSummary }) => {
            this.progressCallbacks.delete(id);
            resolve(res);
          }
        );

        this.worker.postMessage({
          type: 'RUN_BATCH_ANALYSIS',
          id,
          payload: { historySans, cachedMoves },
        });
      } else {
        setTimeout(() => {
          try {
            const simChess = new Chess();
            const analyzedMoves: AnalyzedMove[] = [];
            const cacheMap = new Map<number, AnalyzedMove>();
            if (Array.isArray(cachedMoves)) {
              for (const m of cachedMoves) {
                if (m && typeof m.moveNumber === 'number') {
                  cacheMap.set(m.moveNumber, m);
                }
              }
            }

            for (let i = 0; i < historySans.length; i++) {
              const san = historySans[i];
              const moveNumber = i + 1;
              const fenBefore = simChess.fen();
              const moveRes = simChess.move(san);
              if (!moveRes) break;
              const fenAfter = simChess.fen();

              const cached = cacheMap.get(moveNumber);
              if (cached && cached.san === san) {
                analyzedMoves.push(cached);
              } else {
                analyzedMoves.push(classifyMove(fenBefore, fenAfter, san, moveNumber, 2));
              }

              if (onProgress) {
                onProgress(moveNumber, historySans.length);
              }
            }
            const summary = summarizeAnalysis(analyzedMoves);
            this.progressCallbacks.delete(id);
            resolve({ analyzedMoves, summary });
          } catch {
            this.progressCallbacks.delete(id);
            resolve({ analyzedMoves: [], summary: summarizeAnalysis([]) });
          }
        }, 0);
      }
    });
  }
}

export const engineService = new EngineWorkerService();
