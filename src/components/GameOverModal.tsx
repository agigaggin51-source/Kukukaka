import React, { useEffect } from 'react';
import { Trophy, RotateCcw, Eye, ShieldAlert, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameOverModalProps {
  isOpen: boolean;
  winner: 'w' | 'b' | 'draw' | null;
  reason: string;
  isUserWinner?: boolean;
  eloChange?: number | null;
  newElo?: number | null;
  onNewGame: () => void;
  onReview: () => void;
  onClose: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  winner,
  reason,
  isUserWinner,
  eloChange,
  newElo,
  onNewGame,
  onReview,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen && isUserWinner) {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#81b64c', '#e5a93b', '#38bdf8', '#ffffff'],
        });
      } catch {
        // ignore confetti errors in headless env
      }
    }
  }, [isOpen, isUserWinner]);

  if (!isOpen) return null;

  const isDraw = winner === 'draw';
  const title = isUserWinner
    ? 'Selamat Kamu Menang! 🎉'
    : isDraw
    ? 'Permainan Remis (Draw)!'
    : winner === 'w'
    ? 'Putih Menang!'
    : 'Hitam Menang!';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-[#312e2b] border border-neutral-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-chessPanelLight border border-neutral-600 shadow-lg relative">
          {isDraw ? (
            <ShieldAlert className="w-8 h-8 text-amber-400" />
          ) : isUserWinner ? (
            <Trophy className="w-9 h-9 text-amber-400 animate-bounce" />
          ) : (
            <Trophy className="w-8 h-8 text-neutral-400" />
          )}
          {isUserWinner && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 items-center justify-center text-[10px] text-black font-black">★</span>
            </span>
          )}
        </div>

        <h3 className="text-xl font-black text-white mb-1">{title}</h3>
        
        {/* Elo Notification Badge */}
        {eloChange !== undefined && eloChange !== null && (
          <div className="my-3 p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-center gap-2">
            {eloChange > 0 ? (
              <TrendingUp className="w-4 h-4 text-[#81b64c]" />
            ) : eloChange < 0 ? (
              <TrendingDown className="w-4 h-4 text-rose-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-400" />
            )}
            <span className="text-xs font-bold text-neutral-200">
              {eloChange > 0 ? (
                <>
                  <span className="text-[#81b64c]">+{eloChange} Poin Elo</span> bertambah!
                </>
              ) : eloChange < 0 ? (
                <>
                  <span className="text-rose-400">{eloChange} Poin Elo</span>
                </>
              ) : (
                <>Rating tetap seimbang</>
              )}
            </span>
            {newElo !== undefined && newElo !== null && (
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                {newElo} ELO
              </span>
            )}
          </div>
        )}

        <p className="text-xs text-neutral-300 font-medium mb-5 bg-[#1e1c18] py-2 px-3 rounded-lg border border-neutral-800">
          {reason}
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onReview}
            className="w-full py-3 bg-[#81b64c] hover:bg-[#96c95c] text-[#1c3308] font-black rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-[#81b64c]/30 cursor-pointer active:scale-98"
          >
            <Eye className="w-4 h-4" /> Game Review (Analisis Akurasi)
          </button>
          <button
            onClick={onNewGame}
            className="w-full py-2.5 bg-neutral-700 hover:bg-neutral-600 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <RotateCcw className="w-4 h-4" /> Main Lagi (New Game)
          </button>
          <button
            onClick={onClose}
            className="w-full py-1.5 text-neutral-400 hover:text-white text-xs font-medium cursor-pointer"
          >
            Tutup Dialog
          </button>
        </div>
      </div>
    </div>
  );
};
