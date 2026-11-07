import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Zap,
  Play,
  Pause,
  Award,
  Sparkles,
  ArrowUpRight,
  Brain,
  SlidersHorizontal,
  Flame,
} from 'lucide-react';
import { AnalyzedMove, AnalysisSummary } from '../types/chess';
import { getClassificationSymbol } from '../lib/analysis';

interface GameReviewPanelProps {
  analyzedMoves: AnalyzedMove[];
  summary: AnalysisSummary | null;
  currentMoveIndex: number;
  onJumpToMove: (index: number) => void;
  onStepMove: (delta: number) => void;
  whitePlayerName: string;
  blackPlayerName: string;
  onOpenSummaryModal: () => void;
  onShowBestMoveArrow?: () => void;
}

export const GameReviewPanel: React.FC<GameReviewPanelProps> = ({
  analyzedMoves,
  summary,
  currentMoveIndex,
  onJumpToMove,
  onStepMove,
  whitePlayerName,
  blackPlayerName,
  onOpenSummaryModal,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'key' | 'mistakes'>('all');
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);

  // Active move in review (currentMoveIndex is 1-based move index matching historySans)
  const activeMove = analyzedMoves.find((m) => m.moveNumber === currentMoveIndex) || analyzedMoves[0];
  const symbolInfo = activeMove ? getClassificationSymbol(activeMove.classification) : null;

  // Auto-play timer
  useEffect(() => {
    if (!isAutoPlaying) return;
    if (analyzedMoves.length === 0) return;

    const interval = setInterval(() => {
      if (currentMoveIndex >= analyzedMoves.length) {
        setIsAutoPlaying(false);
      } else {
        onStepMove(1);
      }
    }, 1800);

    return () => clearInterval(interval);
  }, [isAutoPlaying, currentMoveIndex, analyzedMoves.length, onStepMove]);

  // Jump to next key moment
  const handleNextKeyMoment = () => {
    if (!summary || summary.keyMoments.length === 0) return;

    // Find the next key moment strictly after currentMoveIndex
    const nextKey = summary.keyMoments.find((km) => km > currentMoveIndex);
    if (nextKey !== undefined) {
      onJumpToMove(nextKey);
    } else {
      // Loop back to the first key moment
      onJumpToMove(summary.keyMoments[0]);
    }
  };

  // Filter moves for chip navigation
  const filteredMoves = analyzedMoves.filter((m) => {
    if (filterMode === 'all') return true;
    if (filterMode === 'key') {
      return ['brilliant', 'great', 'mistake', 'blunder'].includes(m.classification || '');
    }
    if (filterMode === 'mistakes') {
      return ['inaccuracy', 'mistake', 'blunder'].includes(m.classification || '');
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#262421] text-white">
      {/* Top Header: Accuracy Pills & Summary Trigger */}
      <div className="p-3 sm:p-4 bg-[#1e1c18] border-b border-neutral-800 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          {summary ? (
            <div className="flex items-center gap-2 text-xs font-mono font-bold">
              <div className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white inline-block" />
                <span className="text-neutral-300 truncate max-w-[70px] sm:max-w-none">{whitePlayerName}:</span>
                <span className="text-[#81b64c] font-black">{summary.accuracyWhite.toFixed(1)}%</span>
              </div>
              <div className="bg-neutral-800 px-2.5 py-1 rounded-lg border border-neutral-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-neutral-600 inline-block" />
                <span className="text-neutral-300 truncate max-w-[70px] sm:max-w-none">{blackPlayerName}:</span>
                <span className="text-[#5c8bb0] font-black">{summary.accuracyBlack.toFixed(1)}%</span>
              </div>
            </div>
          ) : (
            <span className="text-xs font-bold text-neutral-400">Game Review Stockfish</span>
          )}
        </div>

        <button
          onClick={onOpenSummaryModal}
          className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold rounded-lg border border-neutral-700 text-neutral-200 hover:text-white transition flex items-center gap-1 cursor-pointer shrink-0"
        >
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Ringkasan</span> Akurasi
        </button>
      </div>

      {/* Main Review Body */}
      <div className="p-3 sm:p-4 flex-grow overflow-y-auto space-y-3">
        {/* Active Move Coach Commentary Card */}
        {activeMove ? (
          <div className="bg-[#1e1c18] border border-neutral-700/80 rounded-2xl p-4 shadow-lg relative overflow-hidden animate-in fade-in duration-150">
            {/* Top row: Move header & Classification Badge */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#81b64c] to-[#4a75a0] flex items-center justify-center shadow">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-white font-mono">
                      {Math.ceil(activeMove.moveNumber / 2)}. {activeMove.color === 'w' ? '' : '... '}
                      {activeMove.san}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      ({activeMove.color === 'w' ? 'Putih' : 'Hitam'})
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400">
                    Langkah ke-{activeMove.moveNumber} dari {analyzedMoves.length}
                  </span>
                </div>
              </div>

              {symbolInfo && (
                <div
                  className="px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow font-bold text-xs shrink-0"
                  style={{ backgroundColor: symbolInfo.bgColor, color: symbolInfo.textColor }}
                >
                  <span className="font-mono font-black">{symbolInfo.symbol}</span>
                  <span className="text-[11px] font-bold">{symbolInfo.shortLabel}</span>
                </div>
              )}
            </div>

            {/* Eval loss & move accuracy meters */}
            <div className="grid grid-cols-2 gap-2 bg-[#262421] p-2.5 rounded-xl border border-neutral-800 mb-3 text-xs">
              <div>
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-semibold">
                  Akurasi Langkah
                </span>
                <span
                  className={`font-mono font-black text-sm ${
                    (activeMove.accuracy ?? 100) >= 85
                      ? 'text-[#81b64c]'
                      : (activeMove.accuracy ?? 100) >= 60
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}
                >
                  {(activeMove.accuracy ?? 85).toFixed(1)}%
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-semibold">
                  Centipawn Loss
                </span>
                <span
                  className={`font-mono font-bold text-sm ${
                    (activeMove.evalLoss ?? 0) <= 0.35
                      ? 'text-neutral-300'
                      : (activeMove.evalLoss ?? 0) <= 1.2
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}
                >
                  {(activeMove.evalLoss ?? 0) > 0
                    ? `-${(activeMove.evalLoss ?? 0).toFixed(2)} pion`
                    : '0.00 pion'}
                </span>
              </div>
            </div>

            {/* Coach explanation */}
            <p className="text-xs text-neutral-200 leading-relaxed font-sans mb-3 bg-[#262421]/60 p-2.5 rounded-xl border border-neutral-800/60">
              {activeMove.explanation}
            </p>

            {/* Best alternative recommendation (if move was not the best) */}
            {activeMove.bestMoveSan && activeMove.bestMoveSan !== activeMove.san && (
              <div className="flex items-center justify-between bg-[#161512] p-2.5 rounded-xl border border-neutral-800 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#81b64c]" />
                  <span className="text-neutral-400 text-[11px]">Rekomendasi Stockfish:</span>
                  <span className="font-mono font-bold text-[#81b64c] text-xs">
                    {activeMove.bestMoveSan}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500 font-mono">
                  {activeMove.bestMove}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#1e1c18] border border-neutral-800 rounded-2xl p-6 text-center text-neutral-400 text-xs">
            Pilih langkah dari daftar di bawah untuk melihat ulasan taktis Stockfish.
          </div>
        )}

        {/* Move Chips Filter Pills */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" /> Navigasi Langkah
            </span>
            <div className="flex gap-1 text-[10px]">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-[#81b64c] text-[#1c3308]'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                Semua ({analyzedMoves.length})
              </button>
              <button
                onClick={() => setFilterMode('key')}
                className={`px-2 py-0.5 rounded-md font-bold transition flex items-center gap-1 cursor-pointer ${
                  filterMode === 'key'
                    ? 'bg-[#26c2a3] text-[#0f3830]'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <Flame className="w-2.5 h-2.5" />
                Kunci ({summary?.keyMomentsCount ?? 0})
              </button>
              <button
                onClick={() => setFilterMode('mistakes')}
                className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                  filterMode === 'mistakes'
                    ? 'bg-[#ca3431] text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                Error
              </button>
            </div>
          </div>

          {/* Interactive Chips Grid */}
          <div className="max-h-48 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-1 bg-[#1e1c18] rounded-xl border border-neutral-800">
            {filteredMoves.map((m, idx) => {
              const info = getClassificationSymbol(m.classification);
              const isSelected = m.moveNumber === currentMoveIndex;

              return (
                <button
                  key={`${m.moveNumber}-${m.color}-${idx}`}
                  onClick={() => onJumpToMove(m.moveNumber)}
                  className={`p-1.5 rounded-lg border text-left transition flex items-center justify-between gap-1 text-xs font-mono cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-700 border-white text-white font-bold shadow'
                      : 'bg-[#262421] border-neutral-800 hover:border-neutral-700 text-neutral-300'
                  }`}
                >
                  <span className="truncate">
                    {Math.ceil(m.moveNumber / 2)}
                    {m.color === 'w' ? '.' : '...'} {m.san}
                  </span>
                  {info && (
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shrink-0"
                      style={{ backgroundColor: info.bgColor, color: info.textColor }}
                      title={info.label}
                    >
                      {info.symbol}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Review Step Navigation Toolbar */}
      <div className="p-3 bg-[#1e1c18] border-t border-neutral-800 shrink-0 space-y-2">
        <div className="flex items-center justify-between gap-1.5">
          {/* Step Back buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onJumpToMove(0)}
              disabled={currentMoveIndex <= 0}
              aria-label="Awal Permainan"
              className="p-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-300 hover:text-white rounded-lg transition cursor-pointer"
              title="Awal Permainan"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onStepMove(-1)}
              disabled={currentMoveIndex <= 0}
              aria-label="Langkah Sebelumnya"
              className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-300 hover:text-white rounded-lg font-bold text-xs transition flex items-center gap-1 cursor-pointer"
              title="Langkah Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>
          </div>

          {/* Autoplay Toggle */}
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              isAutoPlaying
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
            }`}
            title="Putar langkah catur otomatis"
          >
            {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isAutoPlaying ? 'Jeda' : 'Otomatis'}</span>
          </button>

          {/* Step Forward buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onStepMove(1)}
              disabled={currentMoveIndex >= analyzedMoves.length}
              aria-label="Langkah Berikutnya"
              className="px-3 py-2 bg-[#81b64c] hover:bg-[#96c95c] disabled:opacity-40 text-[#1c3308] font-bold rounded-lg text-xs transition flex items-center gap-1 shadow cursor-pointer"
              title="Langkah Berikutnya"
            >
              <span>Berikutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onJumpToMove(analyzedMoves.length)}
              disabled={currentMoveIndex >= analyzedMoves.length}
              aria-label="Akhir Permainan"
              className="p-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-300 hover:text-white rounded-lg transition cursor-pointer"
              title="Akhir Permainan"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Jump to Next Key Moment CTA */}
        {summary && summary.keyMomentsCount > 0 && (
          <button
            onClick={handleNextKeyMoment}
            className="w-full py-2 bg-gradient-to-r from-[#26c2a3] to-[#20a389] hover:from-[#32d4b3] hover:to-[#26c2a3] text-[#0f3830] font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            Lompat ke Momen Kunci Berikutnya ({summary.keyMomentsCount} Tersedia)
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
