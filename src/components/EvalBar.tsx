import React from 'react';

interface EvalBarProps {
  evaluation: number; // in pawns e.g. +1.5 or -0.8
  mateIn?: number;
  isFlipped?: boolean;
}

export const EvalBar: React.FC<EvalBarProps> = ({ evaluation, mateIn, isFlipped = false }) => {
  // Convert evaluation into percentage for White (0% = Black winning, 100% = White winning)
  let whitePercentage = 50;

  if (mateIn !== undefined) {
    whitePercentage = mateIn > 0 ? 100 : 0;
  } else {
    // Sigmoid compression: 50 + 50 * (2 / (1 + 10^(-eval/4)) - 1)
    const winProbability = 1 / (1 + Math.pow(10, -evaluation / 4));
    whitePercentage = Math.max(4, Math.min(96, winProbability * 100));
  }

  // Format label text
  let labelText = '';
  if (mateIn !== undefined) {
    labelText = `M${Math.abs(mateIn)}`;
  } else {
    labelText = Math.abs(evaluation).toFixed(1);
  }

  const isWhiteWinning = (mateIn !== undefined && mateIn > 0) || evaluation >= 0;

  return (
    <div
      className="w-5 sm:w-6 h-full bg-[#262421] rounded flex flex-col justify-between overflow-hidden relative shadow-inner border border-neutral-800 select-none flex-shrink-0"
      title={`Evaluation: ${mateIn ? `Mate in ${mateIn}` : `${evaluation > 0 ? '+' : ''}${evaluation.toFixed(2)}`}`}
      data-testid="eval-bar"
    >
      {/* Top indicator text if Black is winning */}
      <div className="absolute top-1 left-0 right-0 text-center z-10">
        {!isWhiteWinning && (
          <span className="text-[9px] font-mono font-bold text-white tracking-tighter">
            {labelText}
          </span>
        )}
      </div>

      {/* Black section at top, White section at bottom */}
      <div
        className="w-full bg-[#262421] transition-all duration-300"
        style={{ height: `${100 - whitePercentage}%` }}
      />
      <div
        className="w-full bg-[#e8e8e8] transition-all duration-300"
        style={{ height: `${whitePercentage}%` }}
      />

      {/* Bottom indicator text if White is winning */}
      <div className="absolute bottom-1 left-0 right-0 text-center z-10">
        {isWhiteWinning && (
          <span className="text-[9px] font-mono font-bold text-[#1c1917] tracking-tighter">
            {labelText}
          </span>
        )}
      </div>
    </div>
  );
};
