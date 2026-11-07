import React from 'react';
import { Trophy, RotateCcw, Eye, ShieldAlert } from 'lucide-react';

interface GameOverModalProps {
  isOpen: boolean;
  winner: 'w' | 'b' | 'draw' | null;
  reason: string;
  onNewGame: () => void;
  onReview: () => void;
  onClose: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  winner,
  reason,
  onNewGame,
  onReview,
  onClose,
}) => {
  if (!isOpen) return null;

  const isDraw = winner === 'draw';
  const title = isDraw
    ? 'Game Drawn!'
    : winner === 'w'
    ? 'White Wins!'
    : 'Black Wins!';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-[#312e2b] border border-neutral-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-chessPanelLight border border-neutral-600 shadow-lg">
          {isDraw ? (
            <ShieldAlert className="w-8 h-8 text-amber-400" />
          ) : (
            <Trophy className="w-8 h-8 text-amber-400 animate-pulse" />
          )}
        </div>

        <h3 className="text-2xl font-black text-white mb-1">{title}</h3>
        <p className="text-sm text-neutral-300 font-medium mb-6 bg-[#1e1c18] py-2 px-3 rounded-lg border border-neutral-800">
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
