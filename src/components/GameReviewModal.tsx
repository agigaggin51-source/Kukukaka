import React from 'react';
import {
  Trophy,
  RotateCcw,
  Eye,
  Zap,
  Sparkles,
  ArrowRight,
  TrendingUp,
  X,
  ShieldAlert,
} from 'lucide-react';
import { AnalysisSummary, MoveClassification } from '../types/chess';
import { getClassificationSymbol } from '../lib/analysis';

interface GameReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  winner: 'w' | 'b' | 'draw' | null;
  reason: string;
  whitePlayerName: string;
  blackPlayerName: string;
  summary: AnalysisSummary | null;
  isAnalyzing: boolean;
  analysisProgress?: { current: number; total: number } | null;
  onStartReview: () => void;
  onJumpToFirstKeyMoment: () => void;
  onNewGame: () => void;
}

const CLASSIFICATION_ROWS: {
  key: keyof AnalysisSummary['whiteBreakdown'];
  classification: MoveClassification;
}[] = [
  { key: 'brilliant', classification: 'brilliant' },
  { key: 'great', classification: 'great' },
  { key: 'best', classification: 'best' },
  { key: 'excellent', classification: 'excellent' },
  { key: 'good', classification: 'good' },
  { key: 'book', classification: 'book' },
  { key: 'inaccuracy', classification: 'inaccuracy' },
  { key: 'mistake', classification: 'mistake' },
  { key: 'blunder', classification: 'blunder' },
];

export const GameReviewModal: React.FC<GameReviewModalProps> = ({
  isOpen,
  onClose,
  winner,
  reason,
  whitePlayerName,
  blackPlayerName,
  summary,
  isAnalyzing,
  analysisProgress,
  onStartReview,
  onJumpToFirstKeyMoment,
  onNewGame,
}) => {
  if (!isOpen) return null;

  const isDraw = winner === 'draw';
  const resultTitle = isDraw
    ? 'Permainan Remis'
    : winner === 'w'
    ? `${whitePlayerName} Menang!`
    : `${blackPlayerName} Menang!`;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-[#262421] border border-neutral-700/80 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1e1c18] via-[#2a2824] to-[#1e1c18] p-4 sm:p-5 border-b border-neutral-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#81b64c] to-[#4a75a0] flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Game Review & Analisis
                </h2>
                <span className="bg-[#81b64c]/20 border border-[#81b64c]/50 text-[#81b64c] text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                  Stockfish 10
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Evaluasi akurasi & klasifikasi langkah ala Chess.com
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Tutup Game Review"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">
          {/* Result banner */}
          <div className="bg-[#1e1c18] rounded-xl p-3 sm:p-4 border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-800/80 border border-neutral-700 flex items-center justify-center">
                {isDraw ? (
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                ) : (
                  <Trophy className="w-5 h-5 text-amber-400 animate-pulse" />
                )}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">{resultTitle}</h3>
                <p className="text-xs text-neutral-400">{reason || 'Permainan selesai'}</p>
              </div>
            </div>
            {summary && (
              <div className="text-right">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-semibold">
                  Momen Kunci
                </span>
                <span className="text-sm font-extrabold text-[#26c2a3] flex items-center justify-end gap-1">
                  <Zap className="w-3.5 h-3.5 fill-[#26c2a3]" />
                  {summary.keyMomentsCount} Momen
                </span>
              </div>
            )}
          </div>

          {/* Analyzing loading state with real-time progress indicator */}
          {isAnalyzing && (
            <div className="bg-[#1e1c18] border border-blue-500/50 rounded-2xl p-5 sm:p-6 text-center shadow-xl">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider bg-blue-950/60 border border-blue-500/30 px-3 py-1 rounded-full">
                  ⚡ Live Eval Cache & Fast Depth 2
                </span>
              </div>

              <h4 className="text-base sm:text-lg font-black text-white tracking-tight">
                {analysisProgress && analysisProgress.total > 0
                  ? `Menganalisis langkah ${analysisProgress.current} dari ${analysisProgress.total}...`
                  : 'Menyiapkan Game Review...'}
              </h4>

              {/* Dynamic Progress Bar */}
              {analysisProgress && analysisProgress.total > 0 && (
                <div className="mt-3.5 max-w-md mx-auto">
                  <div className="flex justify-between text-[11px] text-neutral-400 font-mono mb-1.5 font-bold">
                    <span>Langkah {analysisProgress.current}/{analysisProgress.total}</span>
                    <span className="text-[#81b64c]">
                      {Math.min(100, Math.round((analysisProgress.current / analysisProgress.total) * 100))}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700 p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-[#81b64c] via-[#26c2a3] to-[#38bdf8] rounded-full transition-all duration-200 ease-out"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            5,
                            Math.round((analysisProgress.current / analysisProgress.total) * 100)
                          )
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <p className="text-xs text-neutral-400 mt-2.5 max-w-sm mx-auto">
                Memadukan cache evaluasi live pertandingan dan verifikasi taktis Stockfish instan.
              </p>
            </div>
          )}

          {/* Accuracy Score Cards Side-by-Side */}
          {summary && !isAnalyzing && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* White Card */}
              <div className="bg-[#1e1c18] border border-neutral-700/80 rounded-2xl p-3.5 sm:p-4 flex flex-col items-center relative overflow-hidden group hover:border-neutral-500 transition">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neutral-200 to-white" />
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                  Putih ({whitePlayerName})
                </span>

                {/* Circular Accuracy Score */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center my-1">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-neutral-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#81b64c] transition-all duration-1000 ease-out"
                      strokeDasharray={`${summary.accuracyWhite}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl sm:text-2xl font-black text-white font-mono leading-none">
                      {summary.accuracyWhite.toFixed(1)}%
                    </span>
                    <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider mt-0.5">
                      Akurasi
                    </span>
                  </div>
                </div>

                <div className="mt-2 text-center">
                  <span className="text-[10px] text-neutral-400 block font-medium">Performa Rating</span>
                  <span className="text-xs sm:text-sm font-bold text-[#81b64c] font-mono flex items-center gap-1 justify-center">
                    <TrendingUp className="w-3.5 h-3.5" />
                    ~{summary.whitePerformance} ELO
                  </span>
                </div>
              </div>

              {/* Black Card */}
              <div className="bg-[#1e1c18] border border-neutral-700/80 rounded-2xl p-3.5 sm:p-4 flex flex-col items-center relative overflow-hidden group hover:border-neutral-500 transition">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neutral-700 to-neutral-500" />
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                  Hitam ({blackPlayerName})
                </span>

                {/* Circular Accuracy Score */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center my-1">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-neutral-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#4a75a0] transition-all duration-1000 ease-out"
                      strokeDasharray={`${summary.accuracyBlack}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl sm:text-2xl font-black text-white font-mono leading-none">
                      {summary.accuracyBlack.toFixed(1)}%
                    </span>
                    <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider mt-0.5">
                      Akurasi
                    </span>
                  </div>
                </div>

                <div className="mt-2 text-center">
                  <span className="text-[10px] text-neutral-400 block font-medium">Performa Rating</span>
                  <span className="text-xs sm:text-sm font-bold text-[#5c8bb0] font-mono flex items-center gap-1 justify-center">
                    <TrendingUp className="w-3.5 h-3.5" />
                    ~{summary.blackPerformance} ELO
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Move Classification Side-by-Side Breakdown Table */}
          {summary && !isAnalyzing && (
            <div className="bg-[#1e1c18] border border-neutral-800 rounded-xl overflow-hidden">
              <div className="bg-neutral-800/60 px-3.5 py-2 border-b border-neutral-800 grid grid-cols-5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                <span className="text-center font-mono">Putih</span>
                <span className="col-span-3 text-center">Klasifikasi Langkah</span>
                <span className="text-center font-mono">Hitam</span>
              </div>

              <div className="divide-y divide-neutral-800/70 text-xs">
                {CLASSIFICATION_ROWS.map(({ key, classification }) => {
                  const info = getClassificationSymbol(classification);
                  if (!info) return null;

                  const whiteCount = summary.whiteBreakdown[key] || 0;
                  const blackCount = summary.blackBreakdown[key] || 0;

                  return (
                    <div
                      key={key}
                      className="grid grid-cols-5 items-center px-3.5 py-2 hover:bg-neutral-800/30 transition"
                    >
                      {/* White count */}
                      <span
                        className={`text-center font-mono font-bold text-xs ${
                          whiteCount > 0 ? 'text-white' : 'text-neutral-600'
                        }`}
                      >
                        {whiteCount}
                      </span>

                      {/* Label + Badge */}
                      <div className="col-span-3 flex items-center justify-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${info.badgeClass}`}
                          style={{ backgroundColor: info.bgColor, color: info.textColor }}
                        >
                          {info.symbol}
                        </span>
                        <span className="font-semibold text-neutral-200 text-xs truncate">
                          {info.shortLabel}
                        </span>
                      </div>

                      {/* Black count */}
                      <span
                        className={`text-center font-mono font-bold text-xs ${
                          blackCount > 0 ? 'text-white' : 'text-neutral-600'
                        }`}
                      >
                        {blackCount}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Action Buttons */}
        <div className="bg-[#1e1c18] p-4 border-t border-neutral-800 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={onStartReview}
            disabled={isAnalyzing}
            className="w-full sm:flex-1 py-3 bg-[#81b64c] hover:bg-[#96c95c] disabled:opacity-50 text-[#1c3308] font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-[#81b64c]/20 cursor-pointer active:scale-98"
          >
            <Eye className="w-4 h-4" /> Tinjau Langkah Demi Langkah
          </button>

          {summary && summary.keyMomentsCount > 0 && (
            <button
              onClick={onJumpToFirstKeyMoment}
              disabled={isAnalyzing}
              className="w-full sm:flex-1 py-3 bg-[#26c2a3] hover:bg-[#32d4b3] disabled:opacity-50 text-[#0f3830] font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-[#26c2a3]/20 cursor-pointer active:scale-98"
            >
              <Zap className="w-4 h-4 fill-current" /> Momen Kunci ({summary.keyMomentsCount})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onNewGame}
            className="w-full sm:w-auto px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Main Lagi
          </button>
        </div>
      </div>
    </div>
  );
};
