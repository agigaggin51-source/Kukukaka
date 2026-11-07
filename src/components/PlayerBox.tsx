import React from 'react';
import { Bot, User, Shield } from 'lucide-react';
import { PIECE_SVGS } from '../lib/pieces';
import { PIECE_VALUES } from '../lib/engine';

interface PlayerBoxProps {
  color: 'w' | 'b';
  name: string;
  ratingText: string;
  isAi: boolean;
  isTurn: boolean;
  timeLeftSeconds: number;
  timeUnlimited: boolean;
  capturedPieces: string[]; // piece letters e.g. ['p', 'p', 'n']
  opponentCaptured: string[];
}

export const PlayerBox: React.FC<PlayerBoxProps> = ({
  color,
  name,
  ratingText,
  isAi,
  isTurn,
  timeLeftSeconds,
  timeUnlimited,
  capturedPieces,
  opponentCaptured,
}) => {
  // Format MM:SS
  const mins = Math.floor(timeLeftSeconds / 60);
  const secs = timeLeftSeconds % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  const isLowTime = !timeUnlimited && timeLeftSeconds <= 20;

  // Calculate material difference
  const myMaterial = capturedPieces.reduce((acc, p) => acc + (PIECE_VALUES[p] || 0), 0);
  const oppMaterial = opponentCaptured.reduce((acc, p) => acc + (PIECE_VALUES[p] || 0), 0);
  const diffPawns = (myMaterial - oppMaterial) / 100;

  // Group captured pieces for display
  const pieceCounts: Record<string, number> = {};
  capturedPieces.forEach((p) => {
    pieceCounts[p] = (pieceCounts[p] || 0) + 1;
  });

  // Opponent piece color prefix for SVG rendering
  const oppPiecePrefix = color === 'w' ? 'b' : 'w';

  return (
    <div
      className={`w-full bg-[#262421] px-3.5 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between border-neutral-800 transition-all ${
        color === 'b' ? 'rounded-t-2xl border-b' : 'rounded-b-2xl border-t'
      } ${isTurn ? 'ring-1 ring-[#81b64c]/40' : ''}`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar with Turn Ring */}
        <div className="relative">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-md transition-transform ${
              color === 'w'
                ? 'bg-neutral-100 text-neutral-900 border border-neutral-300'
                : 'bg-neutral-800 text-neutral-100 border border-neutral-700'
            } ${isTurn ? 'scale-105' : 'opacity-90'}`}
          >
            {isAi ? (
              <Bot className="w-5 h-5 text-[#81b64c]" />
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
          {isTurn && (
            <span
              className="absolute -top-1 -right-1 w-3 h-3 bg-[#81b64c] rounded-full border-2 border-[#262421] animate-ping"
              title="Active turn"
            />
          )}
          {isTurn && (
            <span
              className="absolute -top-1 -right-1 w-3 h-3 bg-[#81b64c] rounded-full border-2 border-[#262421]"
              title="Active turn"
            />
          )}
        </div>

        <div>
          {/* Player Name and Broadcast Title */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white tracking-tight flex items-center gap-1.5">
              {name}
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">
              {ratingText}
            </span>
            {isAi && (
              <span className="text-[9px] font-black uppercase tracking-wider text-[#26c2a3] bg-[#26c2a3]/10 px-1.5 py-0.2 rounded border border-[#26c2a3]/20">
                BOT
              </span>
            )}
          </div>

          {/* Captured pieces and net material advantage */}
          <div className="flex items-center gap-1.5 h-4 mt-0.5 text-xs text-neutral-400">
            <div className="flex items-center gap-0.5">
              {['q', 'r', 'b', 'n', 'p'].map((type) => {
                const count = pieceCounts[type];
                if (!count) return null;
                const svgKey = oppPiecePrefix + type.toUpperCase();
                return (
                  <div key={type} className="flex items-center">
                    <div className="w-3.5 h-3.5 opacity-90 drop-shadow-xs">
                      {PIECE_SVGS[svgKey]}
                    </div>
                    {count > 1 && (
                      <span className="text-[10px] font-mono text-neutral-400 -ml-0.5 mr-0.5 font-bold">
                        {count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {diffPawns > 0 && (
              <span className="text-[11px] font-mono font-black text-[#81b64c] ml-1">
                +{diffPawns}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Broadcast Digital Clock */}
      <div
        className={`px-3.5 py-1 rounded-xl font-mono tabular-nums font-bold text-base sm:text-lg border shadow-inner transition-all ${
          timeUnlimited
            ? 'bg-[#1a1815] text-neutral-500 border-neutral-800'
            : isLowTime
            ? 'bg-red-950/70 text-red-300 border-red-600/80 animate-pulse'
            : isTurn
            ? 'bg-[#1a1815] text-white border-[#81b64c]/70 ring-1 ring-[#81b64c]/20'
            : 'bg-[#1a1815] text-neutral-400 border-neutral-800'
        }`}
        aria-label={`${name} timer`}
      >
        {timeUnlimited ? '∞' : timeFormatted}
      </div>
    </div>
  );
};
