import React, { useState, useRef, useEffect } from 'react';
import {
  ListOrdered,
  Cpu,
  Sliders,
  RotateCcw,
  RefreshCw,
  Wand2,
  Copy,
  Upload,
  Gem,
  CheckCircle,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Volume2,
  VolumeX,
  Sparkles,
  Server,
  Brain,
  Download,
} from 'lucide-react';
import {
  BoardThemeId,
  PlayerColor,
  OpeningData,
  AnalyzedMove,
  AnalysisSummary,
  EngineResult,
} from '../types/chess';
import { getClassificationSymbol } from '../lib/analysis';
import { EvalGraph, EvalPoint } from './EvalGraph';
import { GameReviewPanel } from './GameReviewPanel';
import {
  fetchPuzzles,
  requestCoachInsight,
  checkServerHealth,
  exportTournamentPGN,
  BackendPuzzle,
  ServerHealthResponse,
} from '../lib/api';

interface SidebarProps {
  activeTab: 'moves' | 'analysis' | 'settings' | 'review';
  setActiveTab: (tab: 'moves' | 'analysis' | 'settings' | 'review') => void;
  gameStatusText: string;
  isCheck: boolean;
  isGameOver: boolean;
  opening: OpeningData;
  moveHistory: { white: string; black?: string; moveIndex: number }[];
  currentMoveIndex: number;
  evalPoints: EvalPoint[];
  onJumpToMove: (index: number) => void;
  onStepMove: (delta: number) => void;
  onResetGame: () => void;
  onFlipBoard: () => void;
  onUndoMove: () => void;
  engineResult: EngineResult | null;
  onRunFullAnalysis: () => void;
  isAnalyzing: boolean;
  analysisSummary: AnalysisSummary | null;
  analyzedMoves: AnalyzedMove[];
  pgn: string;
  onImportPGN: (pgn: string) => void;
  fen: string;
  // Settings
  aiLevel: number;
  onChangeAiLevel: (level: number) => void;
  userSide: PlayerColor;
  onChangeUserSide: (side: PlayerColor) => void;
  themeId: BoardThemeId;
  onChangeTheme: (theme: BoardThemeId) => void;
  timeControlMinutes: number;
  onChangeTimeControl: (mins: number) => void;
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
  showBestMoveArrow: boolean;
  onToggleShowBestMoveArrow: (show: boolean) => void;
  onShowBrilliantModal: (move: AnalyzedMove) => void;
  whitePlayerName?: string;
  blackPlayerName?: string;
  onOpenSummaryModal?: () => void;
  analysisProgress?: { current: number; total: number } | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  gameStatusText,
  isCheck,
  isGameOver,
  opening,
  moveHistory,
  currentMoveIndex,
  evalPoints,
  onJumpToMove,
  onStepMove,
  onResetGame,
  onFlipBoard,
  onUndoMove,
  engineResult,
  onRunFullAnalysis,
  isAnalyzing,
  analysisProgress,
  analysisSummary,
  analyzedMoves,
  pgn,
  onImportPGN,
  fen,
  aiLevel,
  onChangeAiLevel,
  userSide,
  onChangeUserSide,
  themeId,
  onChangeTheme,
  timeControlMinutes,
  onChangeTimeControl,
  soundEnabled,
  onToggleSound,
  showBestMoveArrow,
  onToggleShowBestMoveArrow,
  onShowBrilliantModal,
  whitePlayerName = 'White',
  blackPlayerName = 'Black',
  onOpenSummaryModal,
}) => {
  const [pgnInput, setPgnInput] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const [backendPuzzles, setBackendPuzzles] = useState<BackendPuzzle[]>([]);
  const [coachInsight, setCoachInsight] = useState<string | null>(null);
  const [coachSource, setCoachSource] = useState<string | null>(null);
  const [isLoadingCoach, setIsLoadingCoach] = useState<boolean>(false);
  const [serverHealth, setServerHealth] = useState<ServerHealthResponse | null>(null);

  // Auto-scroll ref for move list container
  const moveListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (moveListRef.current) {
      moveListRef.current.scrollTop = moveListRef.current.scrollHeight;
    }
  }, [moveHistory.length, currentMoveIndex]);

  useEffect(() => {
    checkServerHealth().then(setServerHealth);
    fetchPuzzles().then(setBackendPuzzles);
  }, []);

  const handleAskCoach = async () => {
    setIsLoadingCoach(true);
    try {
      const activeAnalyzed = analyzedMoves.find((m) => m.moveNumber === currentMoveIndex);
      const res = await requestCoachInsight({
        fen,
        san: activeAnalyzed?.san,
        moveNumber: currentMoveIndex,
        evalPawns: engineResult ? engineResult.evaluation : 0,
        color: currentMoveIndex % 2 === 1 ? 'w' : 'b',
        bestMove: engineResult?.bestMove,
        inCheck: isCheck,
      });
      setCoachInsight(res.insight);
      setCoachSource(res.source);
    } finally {
      setIsLoadingCoach(false);
    }
  };

  const handleCopyPGN = () => {
    navigator.clipboard.writeText(pgn || '');
    setCopyFeedback('PGN Copied!');
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const handleCopyFEN = () => {
    navigator.clipboard.writeText(fen);
    setCopyFeedback('FEN Copied!');
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const handleDownloadPGN = async () => {
    try {
      const res = await exportTournamentPGN({
        pgn: pgn || '',
        event: 'W-Chess Broadcast Arena Match',
        white: userSide === 'w' ? 'User' : 'Stockfish AI',
        black: userSide === 'b' ? 'User' : 'Stockfish AI',
        result: isGameOver ? (isCheck ? '1-0' : '1/2-1/2') : '*',
      });
      const blob = new Blob([res.formattedPgn], { type: 'application/x-chess-pgn;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = res.filename || 'game.pgn';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setCopyFeedback('Berkas .PGN berhasil diunduh!');
      setTimeout(() => setCopyFeedback(null), 2500);
    } catch {
      setCopyFeedback('Gagal mengunduh PGN');
      setTimeout(() => setCopyFeedback(null), 2000);
    }
  };

  const handleImportSubmit = () => {
    if (pgnInput.trim()) {
      onImportPGN(pgnInput.trim());
      setPgnInput('');
    }
  };

  return (
    <div className="w-full lg:w-96 bg-[#312e2b] rounded-2xl flex flex-col border border-neutral-700/60 shadow-2xl h-[520px] lg:h-[680px] overflow-hidden select-none">
      {/* Tab Navigation Header */}
      <div className="flex border-b border-neutral-700/80 bg-[#1e1c18] rounded-t-2xl">
        <button
          onClick={() => setActiveTab('moves')}
          aria-label="Moves tab"
          className={`tab-btn flex-1 py-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'moves'
              ? 'text-white border-b-2 border-[#81b64c] bg-white/5'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5 text-[#81b64c]" /> Moves
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          aria-label="Engine analysis tab"
          className={`tab-btn flex-1 py-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'analysis'
              ? 'text-white border-b-2 border-[#81b64c] bg-white/5'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-blue-400" /> Engine
        </button>
        <button
          onClick={() => {
            if (analyzedMoves.length === 0 && onRunFullAnalysis) {
              onRunFullAnalysis();
            }
            setActiveTab('review');
          }}
          aria-label="Game Review tab"
          className={`tab-btn flex-1 py-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'review'
              ? 'text-white border-b-2 border-[#26c2a3] bg-white/5'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#26c2a3]" /> Review
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          aria-label="Setup tab"
          className={`tab-btn flex-1 py-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'settings'
              ? 'text-white border-b-2 border-[#81b64c] bg-white/5'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-amber-400" /> Setup
        </button>
      </div>

      {/* Tab 1: Moves List */}
      {activeTab === 'moves' && (
        <div className="flex-grow flex flex-col p-3 sm:p-4 overflow-hidden">
          {/* Game Status Banner */}
          <div
            className={`bg-[#1e1c18] border rounded-xl p-3 mb-3 text-center transition-colors ${
              isGameOver
                ? 'border-amber-500/50 bg-amber-950/20'
                : isCheck
                ? 'border-red-500/50 bg-red-950/20'
                : 'border-neutral-700/80'
            }`}
          >
            <span
              className={`text-sm font-bold block ${
                isGameOver
                  ? 'text-amber-400'
                  : isCheck
                  ? 'text-red-400'
                  : 'text-[#81b64c]'
              }`}
            >
              {gameStatusText}
            </span>
            <div className="text-[11px] text-neutral-400 mt-0.5 flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Stockfish Evaluation Ready
            </div>
          </div>

          {/* Dynamic Opening Book Card */}
          <div className="bg-[#1e1c18] border border-[#81b64c]/40 rounded-xl p-3 mb-3 flex flex-col gap-1 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#81b64c] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Pembukaan Catur (Opening)
              </span>
              <span className="text-[10px] bg-neutral-800 text-neutral-300 font-mono px-2 py-0.5 rounded border border-neutral-700 font-bold">
                {opening.eco}
              </span>
            </div>
            <div className="text-sm font-bold text-white mt-0.5">{opening.nameId}</div>
            <p className="text-xs text-neutral-300 leading-snug line-clamp-3">
              {opening.desc}
            </p>
          </div>

          {/* Moves History Table */}
          <div
            ref={moveListRef}
            className="flex-grow min-h-[175px] sm:min-h-[210px] max-h-[380px] overflow-y-auto bg-[#262420] rounded-xl border border-neutral-700/80 p-3 sm:p-3.5 font-mono text-xs shadow-inner scrollbar-thin"
          >
            {moveHistory.length === 0 ? (
              <div className="h-full min-h-[135px] flex flex-col items-center justify-center text-center p-4 rounded-lg bg-[#2e2b26] border border-neutral-700/60 shadow-xs">
                <BookOpen className="w-8 h-8 text-[#4ADE80] mb-2 stroke-[2.2] drop-shadow-sm" />
                <div className="text-[#FFFFFF] font-extrabold text-sm sm:text-base tracking-wide">
                  Daftar Langkah Permainan
                </div>
                <div className="text-[#4ADE80] font-bold text-xs sm:text-sm mt-1">
                  Game moves will appear here
                </div>
                <div className="text-[#FFFFFF]/90 text-[11px] sm:text-xs mt-1.5 font-sans">
                  Jalankan bidak pertamamu di papan catur!
                </div>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#262420] z-10 shadow-xs">
                  <tr className="text-neutral-400 border-b border-neutral-700/80 text-[11px] uppercase font-bold tracking-wider">
                    <th className="pb-2 pl-2 w-10 text-neutral-400">#</th>
                    <th className="pb-2 text-[#FFFFFF]">White</th>
                    <th className="pb-2 text-[#FFFFFF]">Black</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {moveHistory.map((item, idx) => {
                    const whiteIndex = idx * 2 + 1;
                    const blackIndex = idx * 2 + 2;
                    const isWhiteActive = currentMoveIndex === whiteIndex;
                    const isBlackActive = currentMoveIndex === blackIndex;

                    // Check if either move was brilliant / classified
                    const whiteAnalyzed = analyzedMoves.find(
                      (m) => m.moveNumber === whiteIndex
                    );
                    const blackAnalyzed = analyzedMoves.find(
                      (m) => m.moveNumber === blackIndex
                    );

                    const renderMoveBadge = (analyzed?: AnalyzedMove) => {
                      if (!analyzed) return null;
                      const symbolInfo = getClassificationSymbol(analyzed.classification);
                      if (!symbolInfo) return null;

                      return (
                        <span
                          onClick={(e) => {
                            if (analyzed.classification === 'brilliant') {
                              e.stopPropagation();
                              onShowBrilliantModal(analyzed);
                            }
                          }}
                          className={`text-[9px] leading-tight px-1 py-0.5 rounded font-black shadow-xs transition-transform hover:scale-110 ml-1 inline-flex items-center justify-center min-w-[15px] text-center ${symbolInfo.badgeClass}`}
                          title={`${symbolInfo.label}${analyzed.explanation ? `: ${analyzed.explanation}` : ''}`}
                          aria-label={symbolInfo.label}
                        >
                          {symbolInfo.symbol}
                        </span>
                      );
                    };

                    return (
                      <tr
                        key={idx}
                        className="hover:bg-neutral-800/60 transition-colors"
                      >
                        <td className="py-1.5 pl-2 text-neutral-300 font-bold">{idx + 1}.</td>
                        <td className="py-1.5 pr-1">
                          <button
                            onClick={() => onJumpToMove(whiteIndex)}
                            className={`w-full px-2 py-1 rounded cursor-pointer transition text-left flex items-center justify-between gap-1 font-bold ${
                              isWhiteActive
                                ? 'bg-[#81b64c] text-[#132405] font-black shadow-xs ring-1 ring-[#a3e635]'
                                : 'text-[#FFFFFF] hover:text-[#4ADE80] hover:bg-neutral-800/80'
                            }`}
                          >
                            <span>{item.white}</span>
                            {renderMoveBadge(whiteAnalyzed)}
                          </button>
                        </td>
                        <td className="py-1.5 pl-1">
                          {item.black ? (
                            <button
                              onClick={() => onJumpToMove(blackIndex)}
                              className={`w-full px-2 py-1 rounded cursor-pointer transition text-left flex items-center justify-between gap-1 font-bold ${
                                isBlackActive
                                  ? 'bg-[#81b64c] text-[#132405] font-black shadow-xs ring-1 ring-[#a3e635]'
                                  : 'text-[#FFFFFF] hover:text-[#4ADE80] hover:bg-neutral-800/80'
                              }`}
                            >
                              <span>{item.black}</span>
                              {renderMoveBadge(blackAnalyzed)}
                            </button>
                          ) : (
                            <span className="text-neutral-500 pl-2">...</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Selected Move Annotation Detail (if classified) */}
            {currentMoveIndex > 0 && (() => {
              const activeAnalyzed = analyzedMoves.find((m) => m.moveNumber === currentMoveIndex);
              if (!activeAnalyzed || !activeAnalyzed.classification) return null;
              const sym = getClassificationSymbol(activeAnalyzed.classification);
              if (!sym) return null;
              return (
                <div className="mt-2.5 p-2.5 bg-[#2e2b26] rounded-lg border border-neutral-700/80 text-xs flex items-start gap-2 shadow-inner">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-black flex-shrink-0 ${sym.badgeClass}`}>
                    {sym.symbol}
                  </span>
                  <div className="flex-grow">
                    <span className="font-bold text-[#FFFFFF] text-xs mr-1">{activeAnalyzed.san}:</span>
                    <span className="text-neutral-200 text-[11px] leading-tight font-sans">
                      {activeAnalyzed.explanation}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Interactive Momentum Evaluation Graph */}
          <EvalGraph
            evalHistory={evalPoints}
            currentIndex={currentMoveIndex}
            onJumpToMove={onJumpToMove}
            className="mt-2.5"
          />

          {/* Game Review Quick Launch Button */}
          {moveHistory.length > 0 && (
            <button
              onClick={() => {
                onRunFullAnalysis();
                setActiveTab('review');
              }}
              disabled={isAnalyzing}
              className="w-full py-2.5 mt-2 bg-gradient-to-r from-[#81b64c] to-[#26c2a3] hover:from-[#96c95c] hover:to-[#32d4b3] text-[#1c3308] font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer active:scale-98 disabled:opacity-80"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#1c3308] border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>
                    {analysisProgress && analysisProgress.total > 0
                      ? `Menganalisis langkah ${analysisProgress.current}/${analysisProgress.total}...`
                      : 'Menganalisis Game...'}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#0f3830]" />
                  Mulai Game Review (Akurasi & Blunder)
                </>
              )}
            </button>
          )}

          {/* Stepping controls & Game actions */}
          <div className="flex items-center justify-between gap-1 mt-2 pt-2 border-t border-neutral-700/60">
            <div className="flex items-center gap-1">
              <button
                onClick={() => onStepMove(-1)}
                aria-label="Previous move"
                className="p-2 bg-[#1e1c18] hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs cursor-pointer"
                title="Previous move"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => onStepMove(1)}
                aria-label="Next move"
                className="p-2 bg-[#1e1c18] hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs cursor-pointer"
                title="Next move"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={onUndoMove}
                aria-label="Undo move"
                className="px-2.5 py-1.5 bg-[#1e1c18] hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs font-semibold cursor-pointer"
                title="Undo move"
              >
                Undo
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={onFlipBoard}
                aria-label="Flip board"
                className="p-2 bg-[#1e1c18] hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs cursor-pointer"
                title="Flip board view"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={onResetGame}
                className="px-3 py-1.5 bg-[#81b64c] hover:bg-[#a3d168] text-[#1c3308] font-bold rounded-lg text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> New Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Engine Analysis */}
      {activeTab === 'analysis' && (
        <div className="flex-grow flex flex-col p-3 sm:p-4 overflow-y-auto">
          {/* Stockfish Engine Status Box */}
          <div className="bg-[#1e1c18] p-3.5 rounded-xl border border-neutral-700 mb-3 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-400" /> Stockfish Engine 10
              </span>
              <span className="text-xs font-mono bg-neutral-800 text-[#81b64c] px-2 py-0.5 rounded border border-neutral-700 font-bold">
                Depth: {engineResult ? engineResult.depth : aiLevel}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-2xl font-black font-mono text-white">
                {engineResult
                  ? engineResult.mateIn
                    ? `M${engineResult.mateIn}`
                    : (engineResult.evaluation > 0 ? '+' : '') +
                      engineResult.evaluation.toFixed(2)
                  : '0.00'}
              </div>
              <div className="text-xs text-neutral-400 leading-tight">
                <span className="text-[10px] text-neutral-500 uppercase block font-semibold">
                  Best Line:
                </span>
                <span className="font-mono text-[#81b64c] font-bold text-xs">
                  {engineResult && engineResult.pv.length > 0
                    ? engineResult.pv.slice(0, 4).join(' ')
                    : 'Calculating...'}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Momentum Evaluation Graph */}
          <EvalGraph
            evalHistory={evalPoints}
            currentIndex={currentMoveIndex}
            onJumpToMove={onJumpToMove}
            className="mb-3"
          />

          {/* Action buttons: Analyze Quality & Ask AI Coach */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2.5">
            <button
              onClick={onRunFullAnalysis}
              disabled={isAnalyzing}
              className="py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Wand2 className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              {isAnalyzing ? 'Analyzing...' : 'Analyze Quality'}
            </button>
            <button
              onClick={handleAskCoach}
              disabled={isLoadingCoach}
              className="py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              title="Minta Grandmaster AI menganalisis posisi dan memberikan rencana taktis"
            >
              <Sparkles className={`w-4 h-4 ${isLoadingCoach ? 'animate-spin' : 'text-amber-300'}`} />
              {isLoadingCoach ? 'Berpikir...' : 'Wawasan Pelatih AI'}
            </button>
          </div>

          {/* AI Grandmaster Coach Insight Box */}
          {coachInsight && (
            <div className="bg-[#1e1c18] border border-emerald-500/40 rounded-xl p-3 mb-3 shadow-md animate-in fade-in">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
                  <Brain className="w-3.5 h-3.5" /> Pelatih Catur Grandmaster
                </span>
                <span className="text-[9px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded font-mono border border-neutral-700">
                  {coachSource || 'AI Coach'}
                </span>
              </div>
              <p className="text-xs text-neutral-200 leading-relaxed font-sans">
                {coachInsight}
              </p>
            </div>
          )}

          {/* Backend Grandmaster Puzzles Selector */}
          <div className="bg-[#1e1c18] border border-neutral-800 rounded-xl p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Gem className="w-3.5 h-3.5 text-[#26c2a3]" /> Teka-Teki Legendaris (Backend)
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">
                {backendPuzzles.length} Tersedia
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {backendPuzzles.length > 0 ? (
                backendPuzzles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onImportPGN(p.pgn)}
                    className="p-2 bg-[#262421] hover:bg-neutral-800 border border-neutral-700/70 hover:border-[#26c2a3]/60 rounded-lg text-left transition flex flex-col cursor-pointer"
                    title={p.description}
                  >
                    <span className="text-[11px] font-bold text-white truncate">
                      {p.keyMove} {p.titleId.split('(')[0]}
                    </span>
                    <span className="text-[9px] text-[#26c2a3] font-mono mt-0.5">
                      {p.difficulty} • {p.classification}
                    </span>
                  </button>
                ))
              ) : (
                <button
                  onClick={() => {
                    const greekGiftPgn =
                      '1. e4 e6 2. d4 d5 3. e5 c5 4. c3 Nc6 5. Nf3 Qb6 6. Bd3 cxd4 7. cxd4 Bd7 8. O-O Nxd4 9. Nxd4 Qxd4 10. Nc3 Qxe5 11. Re1 Qb8 12. Nxd5 Bd6 13. Qh5 Ne7 14. Bxh7';
                    onImportPGN(greekGiftPgn);
                  }}
                  className="col-span-2 py-2 bg-[#26c2a3]/20 hover:bg-[#26c2a3]/30 border border-[#26c2a3]/50 text-[#26c2a3] font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Gem className="w-4 h-4" /> Muat Greek Gift (Bxh7!!)
                </button>
              )}
            </div>
          </div>

          {/* Backend Connection Status Pill */}
          <div className="flex items-center justify-between px-2 py-1 mb-2.5 bg-[#161512] rounded-lg border border-neutral-800 text-[10px] text-neutral-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Server className="w-3 h-3 text-emerald-400" />
              Express Backend:
              <span className={serverHealth ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                {serverHealth ? 'Online (Port 3000)' : 'Connecting...'}
              </span>
            </span>
            <span className="text-neutral-500">
              {serverHealth?.geminiEnabled ? 'Gemini 3.8 Flash Ready' : 'Heuristic Engine'}
            </span>
          </div>

          {/* Accuracy Scores & Breakdown */}
          {analysisSummary && (
            <div className="bg-[#1e1c18] p-3 rounded-xl border border-neutral-800 mb-3 animate-in fade-in">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-xs font-bold uppercase text-neutral-400">
                  Game Accuracy
                </span>
                <div className="flex gap-2 text-xs font-mono font-bold">
                  <span className="bg-white/10 px-2 py-0.5 rounded text-white border border-white/20">
                    White: {analysisSummary.accuracyWhite}%
                  </span>
                  <span className="bg-neutral-800 px-2 py-0.5 rounded text-neutral-300 border border-neutral-700">
                    Black: {analysisSummary.accuracyBlack}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#262421] p-2 rounded-lg border border-[#26c2a3]/30 flex justify-between items-center">
                  <span className="text-[#26c2a3] font-semibold flex items-center gap-1">
                    <Gem className="w-3.5 h-3.5" /> Brilliant (!!)
                  </span>
                  <span className="font-mono font-bold text-[#26c2a3]">
                    {analysisSummary.brilliant}
                  </span>
                </div>
                <div className="bg-[#262421] p-2 rounded-lg border border-neutral-800 flex justify-between items-center">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Best (*)
                  </span>
                  <span className="font-mono font-bold text-white">
                    {analysisSummary.best}
                  </span>
                </div>
                <div className="bg-[#262421] p-2 rounded-lg border border-neutral-800 flex justify-between items-center">
                  <span className="text-blue-400">Excellent</span>
                  <span className="font-mono font-bold text-white">
                    {analysisSummary.excellent}
                  </span>
                </div>
                <div className="bg-[#262421] p-2 rounded-lg border border-neutral-800 flex justify-between items-center">
                  <span className="text-lime-300">Good</span>
                  <span className="font-mono font-bold text-white">
                    {analysisSummary.good}
                  </span>
                </div>
                <div className="bg-[#262421] p-2 rounded-lg border border-neutral-800 flex justify-between items-center">
                  <span className="text-amber-400 flex items-center gap-1">
                    <HelpCircle className="w-3 h-3" /> Inaccuracy
                  </span>
                  <span className="font-mono font-bold text-white">
                    {analysisSummary.inaccuracy}
                  </span>
                </div>
                <div className="bg-[#262421] p-2 rounded-lg border border-neutral-800 flex justify-between items-center">
                  <span className="text-orange-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Mistake
                  </span>
                  <span className="font-mono font-bold text-white">
                    {analysisSummary.mistake}
                  </span>
                </div>
                <div className="bg-[#262421] p-2 rounded-lg border border-red-500/30 col-span-2 flex justify-between items-center">
                  <span className="text-red-400 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Blunder (??)
                  </span>
                  <span className="font-mono font-bold text-red-400">
                    {analysisSummary.blunder}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* PGN & FEN Tools */}
          <div className="mt-auto pt-2 border-t border-neutral-700/60">
            <span className="text-xs font-bold uppercase text-neutral-400 block mb-1">
              PGN / FEN Data
            </span>
            <textarea
              value={pgnInput}
              onChange={(e) => setPgnInput(e.target.value)}
              rows={2}
              className="w-full bg-[#1e1c18] border border-neutral-700 rounded-lg p-2 text-xs font-mono text-neutral-300 focus:outline-none focus:border-[#81b64c] resize-none"
              placeholder="Paste PGN here to import game..."
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleImportSubmit}
                className="flex-1 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" /> Import PGN
              </button>
              <button
                onClick={handleCopyPGN}
                className="flex-1 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" /> Salin PGN
              </button>
              <button
                onClick={handleDownloadPGN}
                className="flex-1 py-1.5 bg-[#81b64c] hover:bg-[#96c95c] text-[#1c3308] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow"
                title="Unduh berkas .pgn turnamen"
              >
                <Download className="w-3.5 h-3.5" /> Unduh .PGN
              </button>
              <button
                onClick={handleCopyFEN}
                className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-semibold flex items-center justify-center cursor-pointer"
                title="Salin string FEN papan aktif"
              >
                FEN
              </button>
            </div>
            {copyFeedback && (
              <span className="text-[11px] text-[#81b64c] font-bold block mt-1 text-center">
                {copyFeedback}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Setup & Settings */}
      {activeTab === 'settings' && (
        <div className="flex-grow flex flex-col p-4 overflow-y-auto gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-neutral-400 mb-1.5">
              Stockfish AI Difficulty
            </label>
            <select
              value={aiLevel}
              onChange={(e) => onChangeAiLevel(Number(e.target.value))}
              className="w-full bg-[#1e1c18] border border-neutral-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-[#81b64c] cursor-pointer"
            >
              <option value={1}>Level 1 - Easy (Depth 1)</option>
              <option value={2}>Level 2 - Casual (Depth 2)</option>
              <option value={3}>Level 3 - Medium (Depth 3)</option>
              <option value={4}>Level 4 - Hard (Depth 4)</option>
              <option value={5}>Level 5 - Expert (Depth 5+)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-neutral-400 mb-1.5">
              Play Side
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onChangeUserSide('w')}
                className={`py-2 font-bold rounded-xl text-xs transition cursor-pointer ${
                  userSide === 'w'
                    ? 'bg-[#81b64c] text-[#1c3308] shadow'
                    : 'bg-[#1e1c18] text-white border border-neutral-700 hover:bg-neutral-800'
                }`}
              >
                White (First Move)
              </button>
              <button
                onClick={() => onChangeUserSide('b')}
                className={`py-2 font-bold rounded-xl text-xs transition cursor-pointer ${
                  userSide === 'b'
                    ? 'bg-[#81b64c] text-[#1c3308] shadow'
                    : 'bg-[#1e1c18] text-white border border-neutral-700 hover:bg-neutral-800'
                }`}
              >
                Black (Second Move)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-neutral-400 mb-1.5">
              Board Theme
            </label>
            <select
              value={themeId}
              onChange={(e) => onChangeTheme(e.target.value as BoardThemeId)}
              className="w-full bg-[#1e1c18] border border-neutral-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-[#81b64c] cursor-pointer"
            >
              <option value="green">Chess.com Green</option>
              <option value="wood">Classic Wood</option>
              <option value="blue">Ocean Blue</option>
              <option value="slate">Modern Slate</option>
              <option value="neon">Cyber Neon</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-neutral-400 mb-1.5">
              Time Control
            </label>
            <select
              value={timeControlMinutes}
              onChange={(e) => onChangeTimeControl(Number(e.target.value))}
              className="w-full bg-[#1e1c18] border border-neutral-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-[#81b64c] cursor-pointer"
            >
              <option value={1}>1 Minute Bullet</option>
              <option value={3}>3 Minutes Blitz</option>
              <option value={5}>5 Minutes Blitz</option>
              <option value={10}>10 Minutes Rapid</option>
              <option value={0}>Unlimited Time</option>
            </select>
          </div>

          <div className="flex items-center justify-between border-t border-neutral-700/80 pt-3">
            <span className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-[#81b64c]" />
              ) : (
                <VolumeX className="w-4 h-4 text-neutral-500" />
              )}
              Sound Effects
            </span>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => onToggleSound(e.target.checked)}
              className="w-4 h-4 accent-[#81b64c] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between border-t border-neutral-700/80 pt-3">
            <span className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" /> Show Engine Arrow
            </span>
            <input
              type="checkbox"
              checked={showBestMoveArrow}
              onChange={(e) => onToggleShowBestMoveArrow(e.target.checked)}
              className="w-4 h-4 accent-[#81b64c] cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Tab 4: Game Review (Chess.com Style) */}
      {activeTab === 'review' && (
        <GameReviewPanel
          analyzedMoves={analyzedMoves}
          summary={analysisSummary}
          currentMoveIndex={currentMoveIndex}
          onJumpToMove={onJumpToMove}
          onStepMove={onStepMove}
          whitePlayerName={whitePlayerName}
          blackPlayerName={blackPlayerName}
          onOpenSummaryModal={onOpenSummaryModal || onRunFullAnalysis}
        />
      )}
    </div>
  );
};
