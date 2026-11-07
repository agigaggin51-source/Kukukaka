import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Gem, X } from 'lucide-react';

interface BrilliantModalProps {
  isOpen: boolean;
  onClose: () => void;
  moveSan: string;
  explanation?: string;
}

export const BrilliantModal: React.FC<BrilliantModalProps> = ({
  isOpen,
  onClose,
  moveSan,
  explanation,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Fire confetti from bottom left and right
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7, x: 0.3 },
        colors: ['#26c2a3', '#81b64c', '#5c8bb0', '#ffd700'],
      });
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7, x: 0.7 },
        colors: ['#26c2a3', '#81b64c', '#5c8bb0', '#ffd700'],
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-[#312e2b] border-2 border-[#26c2a3] rounded-2xl p-6 max-w-md w-full shadow-2xl relative transform transition-all scale-100 animate-in zoom-in-95">
        <button
          onClick={onClose}
          aria-label="Close brilliant move modal"
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition p-1 rounded-lg hover:bg-neutral-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-13 h-13 rounded-2xl bg-[#26c2a3]/20 border border-[#26c2a3] flex items-center justify-center text-[#26c2a3] shadow-lg shadow-[#26c2a3]/20 flex-shrink-0">
            <Gem className="w-7 h-7 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-extrabold text-white">Brilliant Move!!</h3>
              <span className="text-xs bg-[#26c2a3] text-[#0f3830] px-2 py-0.5 rounded font-mono font-extrabold shadow">
                !!
              </span>
            </div>
            <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-[#26c2a3]" /> Stockfish Game Analysis Engine
            </p>
          </div>
        </div>

        <div className="bg-[#1e1c18] p-4 rounded-xl border border-neutral-700/80 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-400">Move Executed:</span>
            <span className="font-mono font-bold text-base text-[#26c2a3] bg-[#26c2a3]/10 px-2 py-0.5 rounded border border-[#26c2a3]/30">
              {moveSan}
            </span>
          </div>
          <p className="text-sm text-neutral-200 leading-relaxed">
            {explanation ||
              'You sacrificed a piece to force a decisive tactical breakthrough, seizing an overwhelming winning advantage or initiating an unstoppable mating net!'}
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#26c2a3] hover:bg-[#20aa8f] text-[#0f3830] font-bold rounded-xl text-sm transition shadow-lg shadow-[#26c2a3]/20 cursor-pointer active:scale-95"
          >
            Awesome!
          </button>
        </div>
      </div>
    </div>
  );
};
