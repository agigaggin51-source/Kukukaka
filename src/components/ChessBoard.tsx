import React, { useState, useRef, useMemo, useCallback, memo } from 'react';
import { Chess, Square, PieceSymbol, Piece } from 'chess.js';
import { BoardThemeId, MoveClassification } from '../types/chess';
import { PIECE_SVGS } from '../lib/pieces';
import { getClassificationSymbol } from '../lib/analysis';

interface ChessBoardProps {
  chess: Chess;
  isFlipped: boolean;
  themeId: BoardThemeId;
  onMakeMove: (from: Square, to: Square, promotion?: PieceSymbol) => boolean;
  lastMove?: { from: Square; to: Square } | null;
  brilliantSquare?: Square | null;
  bestMove?: string | null;
  showBestMoveArrow?: boolean;
  disabled?: boolean;
  isEditorMode?: boolean;
  onEditorSquareClick?: (square: Square) => void;
  reviewSquareBadge?: { square: Square; classification: MoveClassification } | null;
}

const THEME_COLORS: Record<BoardThemeId, { light: string; dark: string; lightText: string; darkText: string }> = {
  wood: { light: '#eedac2', dark: '#b88756', lightText: '#b88756', darkText: '#eedac2' },
  green: { light: '#ebecd0', dark: '#739552', lightText: '#739552', darkText: '#ebecd0' },
  blue: { light: '#d0dfea', dark: '#4b7399', lightText: '#4b7399', darkText: '#d0dfea' },
  slate: { light: '#e2e8f0', dark: '#526071', lightText: '#526071', darkText: '#e2e8f0' },
  neon: { light: '#e0e7ff', dark: '#4338ca', lightText: '#4338ca', darkText: '#e0e7ff' },
};

// -------------------------------------------------------------
// Memoized Individual Square Component (prevents 64x re-rendering)
// -------------------------------------------------------------
interface SquareProps {
  square: Square;
  piece: Piece | null;
  isDark: boolean;
  bgColor: string;
  textColor: string;
  isSelected: boolean;
  isLastMove: boolean;
  isCheck: boolean;
  isBrilliant: boolean;
  isLegalMove: boolean;
  isCapture: boolean;
  canDrag: boolean;
  rankLabel?: string;
  fileLabel?: string;
  reviewBadge?: { symbol: string; bgColor: string; textColor: string } | null;
  onClick: (sq: Square) => void;
  onDragStart: (e: React.DragEvent, sq: Square) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, sq: Square) => void;
}

const BoardSquare = memo<SquareProps>(({
  square,
  piece,
  bgColor,
  textColor,
  isSelected,
  isLastMove,
  isCheck,
  isBrilliant,
  isLegalMove,
  isCapture,
  canDrag,
  rankLabel,
  fileLabel,
  reviewBadge,
  onClick,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  return (
    <div
      onClick={() => onClick(square)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, square)}
      className="relative flex items-center justify-center cursor-pointer select-none"
      style={{ backgroundColor: bgColor }}
      data-square={square}
      role="gridcell"
      aria-label={`Square ${square}`}
    >
      {/* Overlays */}
      {isLastMove && <div className="absolute inset-0 bg-yellow-400/35 pointer-events-none" />}
      {isSelected && <div className="absolute inset-0 bg-emerald-600/50 pointer-events-none" />}
      {isCheck && <div className="absolute inset-0 bg-red-600/60 animate-pulse pointer-events-none" />}
      {isBrilliant && <div className="absolute inset-0 brilliant-square-highlight pointer-events-none" />}

      {/* Review Classification Floating Badge */}
      {reviewBadge && (
        <div
          className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 z-30 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black shadow-lg border border-neutral-900 animate-in zoom-in-75 duration-150 select-none pointer-events-none"
          style={{ backgroundColor: reviewBadge.bgColor, color: reviewBadge.textColor }}
        >
          {reviewBadge.symbol}
        </div>
      )}

      {/* Coordinate Labels */}
      {rankLabel && (
        <span
          className="absolute top-0.5 left-1 text-[10px] sm:text-xs font-bold pointer-events-none select-none z-10 opacity-80"
          style={{ color: textColor }}
        >
          {rankLabel}
        </span>
      )}
      {fileLabel && (
        <span
          className="absolute bottom-0.5 right-1 text-[10px] sm:text-xs font-bold pointer-events-none select-none z-10 opacity-80"
          style={{ color: textColor }}
        >
          {fileLabel}
        </span>
      )}

      {/* Piece SVG with Hardware Acceleration */}
      {piece && (
        <div
          draggable={canDrag}
          onDragStart={(e) => onDragStart(e, square)}
          className={`w-[88%] h-[88%] flex items-center justify-center z-10 will-change-transform ${
            canDrag
              ? 'cursor-grab active:cursor-grabbing hover:scale-105 active:scale-95 transition-transform duration-75'
              : 'cursor-default'
          }`}
        >
          {PIECE_SVGS[`${piece.color}${piece.type.toUpperCase()}`]}
        </div>
      )}

      {/* Move Hint Indicators */}
      {isLegalMove && !isCapture && (
        <div className="absolute w-[28%] h-[28%] rounded-full bg-black/25 pointer-events-none z-20" />
      )}
      {isLegalMove && isCapture && (
        <div className="absolute inset-1 rounded-full border-[5px] sm:border-[6px] border-black/25 pointer-events-none z-20" />
      )}
    </div>
  );
});

BoardSquare.displayName = 'BoardSquare';

// -------------------------------------------------------------
// High-Performance ChessBoard Component
// -------------------------------------------------------------
export const ChessBoard: React.FC<ChessBoardProps> = ({
  chess,
  isFlipped,
  themeId,
  onMakeMove,
  lastMove,
  brilliantSquare,
  bestMove,
  showBestMoveArrow = true,
  disabled = false,
  isEditorMode = false,
  onEditorSquareClick,
  reviewSquareBadge,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [promotionPending, setPromotionPending] = useState<{ from: Square; to: Square } | null>(null);
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const colors = THEME_COLORS[themeId] || THEME_COLORS.green;
  const currentTurn = chess.turn();

  const reviewBadgeInfo = useMemo(() => {
    if (!reviewSquareBadge) return null;
    const sym = getClassificationSymbol(reviewSquareBadge.classification);
    if (!sym) return null;
    return {
      square: reviewSquareBadge.square,
      symbol: sym.symbol,
      bgColor: sym.bgColor,
      textColor: sym.textColor,
    };
  }, [reviewSquareBadge]);

  // Find king square in check in single pass
  const checkSquare = useMemo(() => {
    if (!chess.inCheck()) return null;
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const piece = board[r][f];
        if (piece && piece.type === 'k' && piece.color === currentTurn) {
          const file = String.fromCharCode(97 + f);
          const rank = String(8 - r);
          return (file + rank) as Square;
        }
      }
    }
    return null;
  }, [chess, currentTurn]);

  // Memoize legal moves map for selected square
  const legalDests = useMemo(() => {
    const map = new Map<Square, boolean>();
    if (!selectedSquare) return map;

    try {
      const moves = chess.moves({ square: selectedSquare, verbose: true });
      for (let i = 0; i < moves.length; i++) {
        const m = moves[i];
        map.set(m.to as Square, !!m.captured);
      }
    } catch {
      // ignore
    }
    return map;
  }, [chess, selectedSquare]);

  const files = useMemo(() => ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], []);
  const ranks = useMemo(() => ['8', '7', '6', '5', '4', '3', '2', '1'], []);

  const displayFiles = useMemo(() => (isFlipped ? [...files].reverse() : files), [isFlipped, files]);
  const displayRanks = useMemo(() => (isFlipped ? [...ranks].reverse() : ranks), [isFlipped, ranks]);

  // Pre-calculate full 8x8 pieces matrix in O(1)
  const pieceMap = useMemo(() => {
    const map = new Map<Square, Piece>();
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const p = board[r][f];
        if (p) {
          const sq = (String.fromCharCode(97 + f) + (8 - r)) as Square;
          map.set(sq, p);
        }
      }
    }
    return map;
  }, [chess]);

  // Callbacks
  const handleSquareClick = useCallback((square: Square) => {
    if (isEditorMode) {
      onEditorSquareClick?.(square);
      return;
    }
    if (disabled || promotionPending) return;

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }

      // Check if legal move target
      if (legalDests.has(square)) {
        const piece = pieceMap.get(selectedSquare);
        if (
          piece &&
          piece.type === 'p' &&
          ((piece.color === 'w' && square[1] === '8') || (piece.color === 'b' && square[1] === '1'))
        ) {
          setPromotionPending({ from: selectedSquare, to: square });
          return;
        }

        const success = onMakeMove(selectedSquare, square);
        if (success) {
          setSelectedSquare(null);
          return;
        }
      }
    }

    const clickedPiece = pieceMap.get(square);
    if (clickedPiece && clickedPiece.color === currentTurn) {
      setSelectedSquare(square);
    } else {
      setSelectedSquare(null);
    }
  }, [isEditorMode, onEditorSquareClick, disabled, promotionPending, selectedSquare, legalDests, pieceMap, onMakeMove, currentTurn]);

  const handleDragStart = useCallback((e: React.DragEvent, square: Square) => {
    if (disabled || promotionPending) {
      e.preventDefault();
      return;
    }
    const piece = pieceMap.get(square);
    if (!piece || piece.color !== currentTurn) {
      e.preventDefault();
      return;
    }
    setDraggedSquare(square);
    setSelectedSquare(square);
    e.dataTransfer.setData('text/plain', square);
    e.dataTransfer.effectAllowed = 'move';
  }, [disabled, promotionPending, pieceMap, currentTurn]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetSquare: Square) => {
    e.preventDefault();
    if (!draggedSquare || disabled) return;

    const from = draggedSquare;
    setDraggedSquare(null);

    // Instant check against legal moves
    const moves = chess.moves({ square: from, verbose: true });
    const isLegal = moves.some((m) => m.to === targetSquare);

    if (isLegal) {
      const piece = pieceMap.get(from);
      if (
        piece &&
        piece.type === 'p' &&
        ((piece.color === 'w' && targetSquare[1] === '8') ||
          (piece.color === 'b' && targetSquare[1] === '1'))
      ) {
        setPromotionPending({ from, to: targetSquare });
        return;
      }

      onMakeMove(from, targetSquare);
      setSelectedSquare(null);
    }
  }, [draggedSquare, disabled, chess, pieceMap, onMakeMove]);

  const handlePromotionSelect = useCallback((promotionPiece: PieceSymbol) => {
    if (!promotionPending) return;
    onMakeMove(promotionPending.from, promotionPending.to, promotionPiece);
    setPromotionPending(null);
    setSelectedSquare(null);
  }, [promotionPending, onMakeMove]);

  // Arrow center calculation
  const arrowCoords = useMemo(() => {
    if (!showBestMoveArrow || !bestMove || bestMove.length < 4) return null;
    const fromSq = bestMove.slice(0, 2);
    const toSq = bestMove.slice(2, 4);
    if (fromSq === toSq) return null;

    const getCenter = (sq: string) => {
      const fIdx = displayFiles.indexOf(sq[0]);
      const rIdx = displayRanks.indexOf(sq[1]);
      return { x: (fIdx + 0.5) * 12.5, y: (rIdx + 0.5) * 12.5 };
    };

    const start = getCenter(fromSq);
    const end = getCenter(toSq);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const shorten = 2.5;
    const ratio = dist > 0 ? (dist - shorten) / dist : 1;

    return {
      x1: start.x,
      y1: start.y,
      x2: start.x + dx * ratio,
      y2: start.y + dy * ratio,
    };
  }, [showBestMoveArrow, bestMove, displayFiles, displayRanks]);

  return (
    <div className="relative h-full aspect-square select-none rounded-xl overflow-hidden shadow-2xl border-4 border-[#312e2b]">
      {/* 8x8 Board Grid */}
      <div
        ref={boardRef}
        className="w-full h-full grid grid-cols-8 grid-rows-8"
        role="grid"
        aria-label="Chess board"
      >
        {displayRanks.map((rank, rankIdx) =>
          displayFiles.map((file, fileIdx) => {
            const square = (file + rank) as Square;
            const piece = pieceMap.get(square) || null;
            const isDarkSquare = (fileIdx + rankIdx) % 2 === 1;

            return (
              <BoardSquare
                key={square}
                square={square}
                piece={piece}
                isDark={isDarkSquare}
                bgColor={isDarkSquare ? colors.dark : colors.light}
                textColor={isDarkSquare ? colors.darkText : colors.lightText}
                isSelected={selectedSquare === square}
                isLastMove={!!lastMove && (lastMove.from === square || lastMove.to === square)}
                isCheck={checkSquare === square}
                isBrilliant={brilliantSquare === square}
                isLegalMove={legalDests.has(square)}
                isCapture={legalDests.get(square) === true}
                canDrag={!disabled && !!piece && piece.color === currentTurn}
                rankLabel={fileIdx === 0 ? rank : undefined}
                fileLabel={rankIdx === 7 ? file : undefined}
                reviewBadge={reviewBadgeInfo && reviewBadgeInfo.square === square ? reviewBadgeInfo : null}
                onClick={handleSquareClick}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />
            );
          })
        )}
      </div>

      {/* SVG Best Move Engine Arrow Overlay */}
      {arrowCoords && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-30"
          viewBox="0 0 100 100"
        >
          <defs>
            <marker
              id="engine-arrow"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#26c2a3" />
            </marker>
          </defs>
          <line
            x1={arrowCoords.x1}
            y1={arrowCoords.y1}
            x2={arrowCoords.x2}
            y2={arrowCoords.y2}
            stroke="#26c2a3"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeOpacity="0.8"
            markerEnd="url(#engine-arrow)"
          />
        </svg>
      )}

      {/* Pawn Promotion Modal Picker */}
      {promotionPending && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-40 animate-in fade-in">
          <div className="bg-[#312e2b] border border-neutral-700 p-4 rounded-2xl shadow-2xl text-center">
            <h4 className="text-sm font-bold text-white mb-3">Choose Promotion Piece</h4>
            <div className="flex gap-2">
              {(['q', 'n', 'r', 'b'] as PieceSymbol[]).map((pType) => {
                const colorPrefix = chess.turn();
                const key = colorPrefix + pType.toUpperCase();
                return (
                  <button
                    key={pType}
                    onClick={() => handlePromotionSelect(pType)}
                    className="w-14 h-14 bg-[#1e1c18] hover:bg-neutral-800 border border-neutral-700 rounded-xl p-2 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer shadow-md"
                    aria-label={`Promote to ${pType}`}
                  >
                    {PIECE_SVGS[key]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
