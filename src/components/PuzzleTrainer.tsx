import React, { useState } from 'react';
import {
  Trophy,
  HelpCircle,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Sparkles,
  Award,
  Zap,
} from 'lucide-react';
import { BackendPuzzle } from '../lib/api';

interface PuzzleTrainerProps {
  puzzles: BackendPuzzle[];
  currentPuzzle: BackendPuzzle | null;
  currentStepIndex: number; // move step in the puzzle solution
  puzzleStatus: 'idle' | 'correct-step' | 'wrong' | 'solved';
  statusMessage: string;
  onSelectPuzzle: (puzzle: BackendPuzzle) => void;
  onResetPuzzle: () => void;
  onNextPuzzle: () => void;
  onPrevPuzzle: () => void;
  solvedPuzzleIds: string[];
  tacticalRating: number;
}

export const PuzzleTrainer: React.FC<PuzzleTrainerProps> = ({
  puzzles,
  currentPuzzle,
  currentStepIndex,
  puzzleStatus,
  statusMessage,
  onSelectPuzzle,
  onResetPuzzle,
  onNextPuzzle,
  onPrevPuzzle,
  solvedPuzzleIds,
  tacticalRating,
}) => {
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showSolution, setShowSolution] = useState<boolean>(false);

  if (!currentPuzzle) {
    return (
      <div className="p-6 text-center text-neutral-400">
        <Sparkles className="w-8 h-8 text-[#81b64c] mx-auto mb-2 animate-pulse" />
        <p>Memuat database teka-teki taktik dari backend...</p>
      </div>
    );
  }

  const isWhiteToMove = currentPuzzle.fen.split(' ')[1] === 'w';
  const isSolved = solvedPuzzleIds.includes(currentPuzzle.id) || puzzleStatus === 'solved';

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Beginner':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'Intermediate':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'Master':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
      case 'Grandmaster':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      default:
        return 'bg-neutral-800 text-neutral-300 border-neutral-700';
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3 p-3 sm:p-4 text-sm">
      {/* Header Stat & Rating HUD */}
      <div className="flex items-center justify-between bg-[#1e1c18] border border-neutral-800 rounded-xl p-3 shadow-inner">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-neutral-400">Rating Taktik Anda</div>
            <div className="text-lg font-black text-white flex items-center gap-1.5">
              <span>{tacticalRating}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#81b64c]/20 text-[#81b64c]">
                +{solvedPuzzleIds.length * 15} pts
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-neutral-400">Progres</div>
          <div className="text-sm font-bold text-white">
            {solvedPuzzleIds.length} / {puzzles.length} Selesai
          </div>
        </div>
      </div>

      {/* Active Puzzle Info Banner */}
      <div className="bg-[#262421] border border-neutral-800 rounded-xl p-3.5 space-y-2.5 shadow">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getDifficultyColor(
                  currentPuzzle.difficulty
                )}`}
              >
                {currentPuzzle.difficulty}
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                {currentPuzzle.white} vs {currentPuzzle.black}
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1 leading-snug">
              {currentPuzzle.titleId || currentPuzzle.title}
            </h3>
          </div>

          <div
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border shrink-0 ${
              isWhiteToMove
                ? 'bg-neutral-100 text-neutral-900 border-neutral-300'
                : 'bg-neutral-900 text-neutral-100 border-neutral-700'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full border ${
                isWhiteToMove ? 'bg-white border-neutral-400' : 'bg-black border-neutral-600'
              }`}
            />
            {isWhiteToMove ? 'Putih Jalan' : 'Hitam Jalan'}
          </div>
        </div>

        <p className="text-xs text-neutral-300 leading-relaxed border-t border-neutral-800 pt-2">
          {currentPuzzle.description}
        </p>

        {/* Dynamic Status / Feedback Message */}
        <div
          className={`p-3 rounded-lg flex items-center gap-2.5 text-xs font-medium border transition-all ${
            puzzleStatus === 'solved'
              ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300'
              : puzzleStatus === 'correct-step'
              ? 'bg-blue-950/50 border-blue-500/60 text-blue-300'
              : puzzleStatus === 'wrong'
              ? 'bg-rose-950/50 border-rose-500/60 text-rose-300 animate-shake'
              : 'bg-[#1a1916] border-neutral-800 text-neutral-300'
          }`}
        >
          {puzzleStatus === 'solved' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : puzzleStatus === 'wrong' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : puzzleStatus === 'correct-step' ? (
            <Zap className="w-5 h-5 text-blue-400 shrink-0" />
          ) : (
            <Sparkles className="w-5 h-5 text-[#81b64c] shrink-0" />
          )}
          <span className="leading-snug">
            {statusMessage ||
              (isWhiteToMove
                ? 'Mainkan langkah terbaik untuk Putih di atas papan catur!'
                : 'Mainkan langkah terbaik untuk Hitam di atas papan catur!')}
          </span>
        </div>

        {/* Hint Box (if revealed) */}
        {showHint && (
          <div className="bg-amber-950/30 border border-amber-500/40 rounded-lg p-2.5 text-xs text-amber-200 flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Petunjuk Taktik:</span>{' '}
              {currentPuzzle.hint || 'Cari pengorbanan perwira untuk membuka skakmat atau garpuan!'}
            </div>
          </div>
        )}

        {/* Full Solution Box (if revealed) */}
        {showSolution && currentPuzzle.solutionMoves && (
          <div className="bg-blue-950/30 border border-blue-500/40 rounded-lg p-2.5 text-xs text-blue-200 space-y-1">
            <div className="font-bold text-blue-300">Urutan Solusi Lengkap:</div>
            <div className="font-mono text-neutral-200 flex flex-wrap gap-1.5">
              {currentPuzzle.solutionMoves.map((m, idx) => (
                <span
                  key={idx}
                  className={`px-1.5 py-0.5 rounded text-[11px] ${
                    idx % 2 === 0
                      ? 'bg-white text-neutral-900 font-bold'
                      : 'bg-neutral-800 text-neutral-200'
                  }`}
                >
                  {idx + 1}. {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => {
              setShowHint(!showHint);
            }}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            {showHint ? 'Tutup Petunjuk' : 'Petunjuk Taktik'}
          </button>

          <button
            onClick={() => {
              setShowSolution(!showSolution);
            }}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5 text-blue-400" />
            {showSolution ? 'Tutup Solusi' : 'Lihat Solusi'}
          </button>

          <button
            onClick={() => {
              setShowHint(false);
              setShowSolution(false);
              onResetPuzzle();
            }}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ml-auto"
            title="Ulangi Teka-teki ini dari awal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Ulangi
          </button>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          onClick={onPrevPuzzle}
          className="flex-1 py-2 px-3 rounded-xl bg-[#262421] hover:bg-[#312e2b] border border-neutral-800 text-neutral-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Sebelumnya
        </button>

        <button
          onClick={onNextPuzzle}
          className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
            puzzleStatus === 'solved'
              ? 'bg-[#81b64c] hover:bg-[#96c95c] text-[#1c3308] border-[#81b64c] shadow-lg animate-pulse'
              : 'bg-[#262421] hover:bg-[#312e2b] text-neutral-300 hover:text-white border-neutral-800'
          }`}
        >
          Berikutnya
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Puzzle Catalog / Selector List */}
      <div className="bg-[#1e1c18] border border-neutral-800 rounded-xl p-3 flex-grow overflow-y-auto max-h-[260px] space-y-1.5">
        <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Koleksi Teka-teki Taktik</span>
          <span className="font-mono text-[10px] text-neutral-500">
            {puzzles.length} Teka-teki
          </span>
        </div>

        {puzzles.map((p, idx) => {
          const isSelected = p.id === currentPuzzle.id;
          const isDone = solvedPuzzleIds.includes(p.id);

          return (
            <button
              key={p.id}
              onClick={() => {
                setShowHint(false);
                setShowSolution(false);
                onSelectPuzzle(p);
              }}
              className={`w-full text-left p-2.5 rounded-lg border flex items-center justify-between gap-2 transition cursor-pointer ${
                isSelected
                  ? 'bg-[#312e2b] border-[#81b64c] text-white shadow'
                  : 'bg-[#262421]/60 border-neutral-800 hover:bg-[#262421] text-neutral-300'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-mono text-neutral-500 w-5">#{idx + 1}</span>
                <div className="truncate">
                  <div className="text-xs font-semibold truncate text-white">
                    {p.titleId || p.title}
                  </div>
                  <div className="text-[11px] text-neutral-400 truncate">
                    {p.white} • {p.difficulty}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {isDone ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" /> Selesai
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-neutral-500 px-1.5 py-0.5 rounded bg-neutral-800">
                    +15 pt
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
