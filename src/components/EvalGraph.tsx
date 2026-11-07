import React, { useState, useRef } from 'react';
import { MoveClassification } from '../types/chess';
import { getClassificationSymbol } from '../lib/analysis';

export interface EvalPoint {
  moveIndex: number; // 1-based ply index (1 = White move 1, 2 = Black move 1, etc.)
  san: string;
  evalPawns: number; // clamped for display e.g. -5 to +5
  color: 'w' | 'b';
  classification?: MoveClassification;
}

interface EvalGraphProps {
  evalHistory: EvalPoint[];
  currentIndex: number;
  onJumpToMove: (index: number) => void;
  className?: string;
}

export const EvalGraph: React.FC<EvalGraphProps> = ({
  evalHistory,
  currentIndex,
  onJumpToMove,
  className = '',
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<EvalPoint | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Default baseline data if no moves yet
  const points: EvalPoint[] = [
    { moveIndex: 0, san: 'Start', evalPawns: 0, color: 'w' },
    ...evalHistory,
  ];

  // SVG dimensions
  const svgWidth = 400;
  const svgHeight = 110;
  const paddingX = 14;
  const paddingY = 12;

  const innerWidth = svgWidth - paddingX * 2;
  const innerHeight = svgHeight - paddingY * 2;
  const centerY = paddingY + innerHeight / 2; // Y position for 0.0 eval

  const maxMoves = Math.max(16, points.length);

  // Convert eval (-5.0 to +5.0) to SVG Y coordinate (+5 is top, -5 is bottom)
  const getY = (val: number) => {
    const clamped = Math.max(-5, Math.min(5, val));
    // +5 maps to paddingY, -5 maps to paddingY + innerHeight
    return centerY - (clamped / 5) * (innerHeight / 2);
  };

  // Convert moveIndex (0 to maxMoves) to SVG X coordinate
  const getX = (idx: number) => {
    return paddingX + (idx / Math.max(1, maxMoves - 1)) * innerWidth;
  };

  // Generate path data for the line
  const linePoints = points.map((p, idx) => ({
    x: getX(idx),
    y: getY(p.evalPawns),
    point: p,
  }));

  const linePath = linePoints.reduce(
    (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ''
  );

  // Generate shaded area paths for White (above 0) and Black (below 0)
  const areaPath = linePoints.length > 0
    ? `${linePath} L ${linePoints[linePoints.length - 1].x} ${centerY} L ${linePoints[0].x} ${centerY} Z`
    : '';

  // Active move X position
  const activePointIdx = Math.min(points.length - 1, Math.max(0, currentIndex));
  const activeX = getX(activePointIdx);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current || linePoints.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgRelX = (mouseX / rect.width) * svgWidth;

    // Find nearest point
    let closest = linePoints[0];
    let minDist = Infinity;
    linePoints.forEach((pt) => {
      const dist = Math.abs(pt.x - svgRelX);
      if (dist < minDist) {
        minDist = dist;
        closest = pt;
      }
    });

    setHoveredPoint(closest.point);
    setHoverPos({
      x: (closest.x / svgWidth) * rect.width,
      y: (closest.y / svgHeight) * rect.height,
    });
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setHoverPos(null);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-[#1e1c18] border border-neutral-800 rounded-xl p-2 select-none ${className}`}
      data-testid="eval-momentum-graph"
    >
      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1 px-1">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#81b64c]" /> Advantage Momentum
        </span>
        <span className="font-mono text-neutral-500 text-[9px]">
          {evalHistory.length > 0
            ? `${evalHistory.length} ply · Max range ±5.0`
            : 'Live evaluation swing curve'}
        </span>
      </div>

      <div className="relative w-full h-[110px] overflow-hidden rounded-lg bg-[#161512] border border-neutral-800/80 cursor-crosshair">
        {/* Zero baseline legend */}
        <div className="absolute left-1.5 top-1 text-[8px] font-mono text-neutral-500 font-bold">
          +5 (White)
        </div>
        <div className="absolute left-1.5 bottom-1 text-[8px] font-mono text-neutral-500 font-bold">
          -5 (Black)
        </div>

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full block"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={() => {
            if (hoveredPoint && hoveredPoint.moveIndex >= 0) {
              onJumpToMove(hoveredPoint.moveIndex);
            }
          }}
        >
          <defs>
            <linearGradient id="whiteAdvantageGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#81b64c" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#81b64c" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="blackAdvantageGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#26c2a3" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#26c2a3" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid Guideline (Zero center line) */}
          <line
            x1={paddingX}
            y1={centerY}
            x2={svgWidth - paddingX}
            y2={centerY}
            stroke="#3a3734"
            strokeWidth="1"
            strokeDasharray="2 3"
          />

          {/* Shaded advantage area */}
          {areaPath && (
            <path
              d={areaPath}
              fill="url(#whiteAdvantageGrad)"
              className="transition-all duration-200"
            />
          )}

          {/* Momentum Polyline */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#81b64c"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-200"
            />
          )}

          {/* Active Move Vertical Line */}
          <line
            x1={activeX}
            y1={paddingY}
            x2={activeX}
            y2={svgHeight - paddingY}
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeOpacity="0.7"
          />

          {/* Plot nodes for each move */}
          {linePoints.map((pt, i) => {
            if (i === 0) return null; // skip initial position dot
            const sym = getClassificationSymbol(pt.point.classification);
            const isHighlight =
              pt.point.classification === 'brilliant' ||
              pt.point.classification === 'blunder' ||
              pt.point.classification === 'mistake';

            return (
              <g
                key={i}
                className="cursor-pointer group"
                onClick={() => onJumpToMove(pt.point.moveIndex)}
              >
                {/* Special halo for classified critical moves */}
                {isHighlight && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={sym?.symbol === '!!' ? 5.5 : 4.5}
                    fill={sym?.bgColor || '#81b64c'}
                    fillOpacity="0.4"
                    className="animate-pulse"
                  />
                )}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHighlight ? 3.5 : 2}
                  fill={
                    sym
                      ? sym.bgColor
                      : pt.point.moveIndex === currentIndex
                      ? '#ffffff'
                      : '#81b64c'
                  }
                  stroke="#161512"
                  strokeWidth="1"
                />
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Popover */}
        {hoveredPoint && hoverPos && (
          <div
            className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-[#262421] border border-neutral-700 px-2 py-1 rounded-md shadow-xl z-30 text-[10px] whitespace-nowrap"
            style={{
              left: `${Math.max(45, Math.min(hoverPos.x, (containerRef.current?.clientWidth || 200) - 45))}px`,
              top: `${Math.max(26, hoverPos.y)}px`,
            }}
          >
            <div className="flex items-center gap-1.5 font-bold font-mono">
              <span className="text-white">
                {hoveredPoint.moveIndex === 0
                  ? 'Start'
                  : `${Math.ceil(hoveredPoint.moveIndex / 2)}.${hoveredPoint.color === 'b' ? '..' : ''} ${hoveredPoint.san}`}
              </span>
              <span
                className={`font-mono ${
                  hoveredPoint.evalPawns > 0
                    ? 'text-[#81b64c]'
                    : hoveredPoint.evalPawns < 0
                    ? 'text-cyan-400'
                    : 'text-neutral-400'
                }`}
              >
                {hoveredPoint.evalPawns > 0 ? '+' : ''}
                {hoveredPoint.evalPawns.toFixed(2)}
              </span>
            </div>
            {hoveredPoint.classification && (
              <div className="text-[9px] text-neutral-400 font-sans">
                {getClassificationSymbol(hoveredPoint.classification)?.label}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[9px] text-neutral-500 font-mono mt-1 px-1">
        <span>Click any point to review position</span>
        <span>Current: Move {Math.ceil(currentIndex / 2)}</span>
      </div>
    </div>
  );
};
