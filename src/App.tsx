import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Chess, Square, PieceSymbol } from 'chess.js';
import {
  Bot,
  Users,
  Cpu,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Award,
  Trophy,
  Layers,
  Cloud,
  Sparkles,
  Globe,
  Copy,
  Check,
  LogOut,
  Flag,
  RotateCcw,
} from 'lucide-react';
import {
  GameMode,
  PlayerColor,
  BoardThemeId,
  AnalyzedMove,
  AnalysisSummary,
  EngineResult,
} from './types/chess';
import { ChessBoard } from './components/ChessBoard';
import { EvalBar } from './components/EvalBar';
import { PlayerBox } from './components/PlayerBox';
import { Sidebar } from './components/Sidebar';
import { EvalPoint } from './components/EvalGraph';
import { BrilliantModal } from './components/BrilliantModal';
import { GameOverModal } from './components/GameOverModal';
import { GameReviewModal } from './components/GameReviewModal';
import { PuzzleTrainer } from './components/PuzzleTrainer';
import { BoardEditor, SelectedPieceType } from './components/BoardEditor';
import { CloudSyncModal } from './components/CloudSyncModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileMenu } from './components/UserProfileMenu';
import { OnlineMultiplayerLobby } from './components/OnlineMultiplayerLobby';
import { AdminDashboard } from './components/AdminDashboard';
import { AccessDeniedModal } from './components/AccessDeniedModal';
import {
  createOnlineRoom,
  joinOnlineRoom,
  sendOnlineMove,
  sendOnlineResign,
  sendOnlineRematch,
  leaveOnlineRoom,
  OnlinePlayer,
  OnlineMovePayload,
} from './lib/onlineMultiplayer';
import { recordMatchResult, recordPuzzleSolved, getCurrentUser, UserProfile, logRouteViolation } from './lib/supabaseClient';
import { fetchPuzzles, BackendPuzzle } from './lib/api';
import { sounds } from './lib/audio';
import { detectOpening } from './lib/openings';
import { findBestMove, evaluateBoard } from './lib/engine';
import { classifyMove, summarizeAnalysis } from './lib/analysis';
import { engineService } from './lib/engineWorkerService';
import { calculateEloOnWin } from './lib/elo';

export default function App() {
  // Game instance & history
  const [chess, setChess] = useState<Chess>(() => new Chess());
  const [mode, setMode] = useState<GameMode>('vs-ai');
  const [userSide, setUserSide] = useState<PlayerColor>('w');
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [themeId, setThemeId] = useState<BoardThemeId>('wood');
  const [activeTab, setActiveTab] = useState<'moves' | 'analysis' | 'settings' | 'review'>('moves');
  const [isGameReviewModalOpen, setIsGameReviewModalOpen] = useState<boolean>(false);

  // Move tracking & state history for step navigation
  const [historyFens, setHistoryFens] = useState<string[]>([new Chess().fen()]);
  const [historySans, setHistorySans] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);

  // Time controls & clocks
  const [timeControlMinutes, setTimeControlMinutes] = useState<number>(5);
  const [whiteTime, setWhiteTime] = useState<number>(300);
  const [blackTime, setBlackTime] = useState<number>(300);
  const [isClockRunning, setIsClockRunning] = useState<boolean>(false);

  // Analysis & Engine
  const [engineResult, setEngineResult] = useState<EngineResult | null>(null);
  const [analyzedMoves, setAnalyzedMoves] = useState<AnalyzedMove[]>([]);
  const [analysisSummary, setAnalysisSummary] = useState<AnalysisSummary | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<{ current: number; total: number } | null>(null);
  const [showBestMoveArrow, setShowBestMoveArrow] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Modals & alerts
  const [brilliantModalData, setBrilliantModalData] = useState<{
    isOpen: boolean;
    moveSan: string;
    explanation?: string;
  }>({ isOpen: false, moveSan: '' });

  const [brilliantSquare, setBrilliantSquare] = useState<Square | null>(null);
  const [gameOverModal, setGameOverModal] = useState<{
    isOpen: boolean;
    winner: 'w' | 'b' | 'draw' | null;
    reason: string;
    isUserWinner?: boolean;
    eloChange?: number | null;
    newElo?: number | null;
  }>({ isOpen: false, winner: null, reason: '' });

  // Cloud & Leaderboard modals
  const [isCloudModalOpen, setIsCloudModalOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);

  // Supabase Auth & Current User Profile state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // RBAC Admin Dashboard & Security Route Guard state
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState<boolean>(false);
  const [isAccessDeniedModalOpen, setIsAccessDeniedModalOpen] = useState<boolean>(false);
  const [attemptedAdminPath, setAttemptedAdminPath] = useState<string>('/#admin');

  const aiThinkingRef = useRef<boolean>(false);
  const [aiLevel, setAiLevel] = useState<number>(3);

  // Puzzle Trainer state
  const [puzzles, setPuzzles] = useState<BackendPuzzle[]>([]);
  const [currentPuzzle, setCurrentPuzzle] = useState<BackendPuzzle | null>(null);
  const [puzzleStepIndex, setPuzzleStepIndex] = useState<number>(0);
  const [puzzleStatus, setPuzzleStatus] = useState<'idle' | 'correct-step' | 'wrong' | 'solved'>('idle');
  const [puzzleStatusMessage, setPuzzleStatusMessage] = useState<string>('');
  const [solvedPuzzleIds, setSolvedPuzzleIds] = useState<string[]>([]);
  const [tacticalRating, setTacticalRating] = useState<number>(1500);

  // Board Editor state
  const [selectedEditorPiece, setSelectedEditorPiece] = useState<SelectedPieceType>('wQ');
  const [editorSideToMove, setEditorSideToMove] = useState<'w' | 'b'>('w');
  const [editorCastling, setEditorCastling] = useState({
    whiteO_O: true,
    whiteO_O_O: true,
    blackO_O: true,
    blackO_O_O: true,
  });

  // Online Multiplayer state
  const [isOnlineLobbyOpen, setIsOnlineLobbyOpen] = useState<boolean>(false);
  const [onlineRoomCode, setOnlineRoomCode] = useState<string | null>(null);
  const [onlineMyColor, setOnlineMyColor] = useState<PlayerColor>('w');
  const [onlineMyRole, setOnlineMyRole] = useState<'host' | 'guest'>('host');
  const [onlineOpponent, setOnlineOpponent] = useState<OnlinePlayer | null>(null);
  const [onlineConnectionStatus, setOnlineConnectionStatus] = useState<
    'connecting' | 'connected' | 'waiting' | 'ready' | 'error' | 'disconnected'
  >('waiting');
  const [copiedCodeBanner, setCopiedCodeBanner] = useState<boolean>(false);

  // Fetch puzzles & restore Supabase auth session on mount
  useEffect(() => {
    fetchPuzzles().then((data) => {
      if (data && data.length > 0) {
        setPuzzles(data);
        if (!currentPuzzle) {
          setCurrentPuzzle(data[0]);
        }
      }
    });

    // Restore authenticated Supabase user profile
    getCurrentUser().then((user) => {
      if (user) {
        setCurrentUser(user);
      }
    });
  }, []);

  // Strict RBAC Route Guard: Monitor URL hash (#admin) and search params (?view=admin)
  useEffect(() => {
    const checkAdminRouteAccess = () => {
      const hash = window.location.hash;
      const search = window.location.search;
      const isAttemptingAdmin = hash === '#admin' || hash === '#/admin' || search.includes('view=admin');

      if (isAttemptingAdmin) {
        if (currentUser && currentUser.role === 'admin') {
          setIsAdminDashboardOpen(true);
        } else {
          // Deny access: show Access Denied Modal, log violation, sanitize URL
          const attempted = hash || search || '/#admin';
          setAttemptedAdminPath(attempted);
          setIsAccessDeniedModalOpen(true);
          setIsAdminDashboardOpen(false);

          // Clear the admin hash/query from URL without page reload
          if (window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname);
          }

          // Call backend security audit logger
          void logRouteViolation(
            attempted,
            currentUser ? currentUser.email : 'anonymous@guest',
            currentUser ? currentUser.role : 'guest'
          );
        }
      }
    };

    // Run check immediately on mount and whenever currentUser changes
    checkAdminRouteAccess();

    window.addEventListener('hashchange', checkAdminRouteAccess);
    window.addEventListener('popstate', checkAdminRouteAccess);

    return () => {
      window.removeEventListener('hashchange', checkAdminRouteAccess);
      window.removeEventListener('popstate', checkAdminRouteAccess);
    };
  }, [currentUser]);

  // Audio preference sync
  useEffect(() => {
    sounds.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Keep board perspective synced with side
  useEffect(() => {
    if (mode === 'vs-ai') {
      setIsFlipped(userSide === 'b');
    }
  }, [userSide, mode]);

  // Calculate captured pieces
  const capturedPieces = useMemo(() => {
    const counts = { w: [] as string[], b: [] as string[] };
    const board = chess.board();
    const currentPieces: Record<string, number> = {};

    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const piece = board[r][f];
        if (piece) {
          const key = piece.color + piece.type;
          currentPieces[key] = (currentPieces[key] || 0) + 1;
        }
      }
    }

    const initialPieces: Record<string, number> = {
      wp: 8, wn: 2, wb: 2, wr: 2, wq: 1, wk: 1,
      bp: 8, bn: 2, bb: 2, br: 2, bq: 1, bk: 1,
    };

    for (const [key, initialCount] of Object.entries(initialPieces)) {
      const color = key[0] as 'w' | 'b';
      const type = key[1];
      const curCount = currentPieces[key] || 0;
      const missing = initialCount - curCount;
      for (let i = 0; i < missing; i++) {
        // missing piece of color was captured by the other color
        if (color === 'w') {
          counts.b.push(type); // captured by black
        } else {
          counts.w.push(type); // captured by white
        }
      }
    }

    return counts;
  }, [chess]);

  // Dynamic Opening Detection
  const currentOpening = useMemo(() => {
    return detectOpening(historySans.slice(0, currentStepIndex));
  }, [historySans, currentStepIndex]);

  // Active move history table structure
  const moveHistoryPairs = useMemo(() => {
    const pairs: { white: string; black?: string; moveIndex: number }[] = [];
    for (let i = 0; i < historySans.length; i += 2) {
      pairs.push({
        white: historySans[i],
        black: historySans[i + 1],
        moveIndex: i + 1,
      });
    }
    return pairs;
  }, [historySans]);

  // Dynamic Evaluation points for the momentum graph
  const evalPoints = useMemo<EvalPoint[]>(() => {
    return historySans.map((san, idx) => {
      const moveNumber = idx + 1;
      const color = (idx % 2 === 0 ? 'w' : 'b') as 'w' | 'b';
      const analyzed = analyzedMoves.find((m) => m.moveNumber === moveNumber);
      let evalPawns = 0;
      if (analyzed) {
        evalPawns = analyzed.evalAfter;
      } else if (idx === historySans.length - 1 && engineResult) {
        evalPawns = engineResult.evaluation;
      }
      return {
        moveIndex: moveNumber,
        san,
        evalPawns,
        color,
        classification: analyzed?.classification,
      };
    });
  }, [historySans, analyzedMoves, engineResult]);

  // Run engine evaluation asynchronously in Web Worker without blocking UI
  useEffect(() => {
    let active = true;
    const currentFen = chess.fen();

    engineService.evaluatePositionAsync(currentFen, Math.min(aiLevel, 3)).then((res) => {
      if (active) {
        setEngineResult(res);
      }
    });

    return () => {
      active = false;
    };
  }, [chess, aiLevel]);

  // Chess clocks countdown timer
  useEffect(() => {
    if (!isClockRunning || timeControlMinutes === 0 || chess.isGameOver()) return;

    const interval = setInterval(() => {
      const turn = chess.turn();
      if (turn === 'w') {
        setWhiteTime((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsClockRunning(false);
            setGameOverModal({
              isOpen: true,
              winner: 'b',
              reason: 'White ran out of time! Black wins on time.',
            });
            sounds.playGameOver();
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsClockRunning(false);
            setGameOverModal({
              isOpen: true,
              winner: 'w',
              reason: 'Black ran out of time! White wins on time.',
            });
            sounds.playGameOver();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isClockRunning, chess, timeControlMinutes]);

  // Check game over status after moves
  const checkGameOverState = useCallback((c: Chess) => {
    if (c.isCheckmate()) {
      setIsClockRunning(false);
      const winner = c.turn() === 'w' ? 'b' : 'w';
      const winnerName = winner === 'w' ? 'White' : 'Black';
      sounds.playGameOver();

      let isUserWinner = false;
      if (mode === 'vs-ai') {
        isUserWinner = winner === userSide;
      } else if (mode === 'online-multiplayer') {
        isUserWinner = winner === onlineMyColor;
      }

      let eloChange = 0;
      let newElo = currentUser?.rating || 1500;

      if (isUserWinner) {
        newElo = calculateEloOnWin(currentUser?.rating || 1500);
        eloChange = newElo - (currentUser?.rating || 1500);
        if (currentUser) {
          const updated = { ...currentUser, rating: newElo };
          setCurrentUser(updated);
          try {
            localStorage.setItem('wchess_user_session', JSON.stringify(updated));
          } catch {
            // ignore
          }
        }
      } else {
        eloChange = -15;
        newElo = Math.max(800, (currentUser?.rating || 1500) - 15);
        if (currentUser) {
          const updated = { ...currentUser, rating: newElo };
          setCurrentUser(updated);
          try {
            localStorage.setItem('wchess_user_session', JSON.stringify(updated));
          } catch {
            // ignore
          }
        }
      }

      setGameOverModal({
        isOpen: true,
        winner,
        reason: isUserWinner
          ? `Skakmat! Anda memenangkan pertandingan secara gemilang!`
          : `Checkmate! ${winnerName} won the match.`,
        isUserWinner,
        eloChange,
        newElo,
      });

      if (mode === 'vs-ai') {
        recordMatchResult({
          player_name: currentUser ? currentUser.name : 'Tamu Master',
          result: isUserWinner ? 'win' : 'loss',
          opponent: `Stockfish Level ${aiLevel}`,
        });
      } else if (mode === 'online-multiplayer') {
        recordMatchResult({
          player_name: currentUser ? currentUser.name : 'Anda',
          result: isUserWinner ? 'win' : 'loss',
          opponent: onlineOpponent?.name || 'Lawan Online',
        });
      }
      return true;
    }
    if (c.isDraw()) {
      setIsClockRunning(false);
      let reason = 'Game drawn.';
      if (c.isStalemate()) reason = 'Draw by stalemate (no legal moves).';
      else if (c.isThreefoldRepetition()) reason = 'Draw by threefold repetition.';
      else if (c.isInsufficientMaterial()) reason = 'Draw by insufficient material.';
      sounds.playGameOver();

      const eloChange = 5;
      const newElo = (currentUser?.rating || 1500) + eloChange;
      if (currentUser) {
        const updated = { ...currentUser, rating: newElo };
        setCurrentUser(updated);
        try {
          localStorage.setItem('wchess_user_session', JSON.stringify(updated));
        } catch {
          // ignore
        }
      }

      setGameOverModal({
        isOpen: true,
        winner: 'draw',
        reason,
        isUserWinner: false,
        eloChange,
        newElo,
      });

      if (mode === 'vs-ai') {
        recordMatchResult({
          player_name: currentUser ? currentUser.name : 'Tamu Master',
          result: 'draw',
          opponent: `Stockfish Level ${aiLevel}`,
        });
      } else if (mode === 'online-multiplayer') {
        recordMatchResult({
          player_name: currentUser ? currentUser.name : 'Anda',
          result: 'draw',
          opponent: onlineOpponent?.name || 'Lawan Online',
        });
      }
      return true;
    }
    return false;
  }, [mode, userSide, aiLevel, currentUser, onlineMyColor, onlineOpponent]);

  // Trigger AI move if in vs-ai mode and it's AI's turn
  const triggerAiMove = useCallback(
    (currentChess: Chess) => {
      const aiColor = userSide === 'w' ? 'b' : 'w';
      if (currentChess.turn() !== aiColor || currentChess.isGameOver()) {
        return;
      }

      aiThinkingRef.current = true;
      const targetFen = currentChess.fen();
      const thinkingDelay = Math.random() * 150 + 250;

      setTimeout(async () => {
        try {
          const res = await engineService.getAiMoveAsync(targetFen, aiLevel, historyFens.slice(-6));
          aiThinkingRef.current = false;
          if (!res.bestMove) return;

          const from = res.bestMove.slice(0, 2) as Square;
          const to = res.bestMove.slice(2, 4) as Square;
          const promotion = (res.bestMove[4] || undefined) as PieceSymbol | undefined;

          const nextChess = new Chess(targetFen);
          const moveResult = nextChess.move({ from, to, promotion });
          if (!moveResult) return;

          const fenAfter = nextChess.fen();

          // Instant sound feedback
          if (nextChess.inCheck()) {
            sounds.playCheck();
          } else if (moveResult.captured) {
            sounds.playCapture();
          } else if (moveResult.flags.includes('k') || moveResult.flags.includes('q')) {
            sounds.playCastle();
          } else {
            sounds.playMove();
          }

          // Update board & history immediately
          setChess(nextChess);
          setLastMove({ from, to });
          setHistoryFens((prev) => [...prev, fenAfter]);
          setHistorySans((prev) => [...prev, moveResult.san]);
          setCurrentStepIndex((prev) => prev + 1);

          // Asynchronously classify move in worker
          const moveNumber = historySans.length + 1;
          engineService.classifyMoveAsync(targetFen, fenAfter, moveResult.san, moveNumber).then((analyzed) => {
            setAnalyzedMoves((prev) => [...prev, analyzed]);
            if (analyzed.classification === 'brilliant') {
              setBrilliantSquare(to);
              sounds.playBrilliant();
              setBrilliantModalData({
                isOpen: true,
                moveSan: moveResult.san,
                explanation: analyzed.explanation,
              });
            }
          });

          checkGameOverState(nextChess);
        } catch {
          aiThinkingRef.current = false;
        }
      }, thinkingDelay);
    },
    [userSide, aiLevel, historySans.length, checkGameOverState]
  );

  // Handle opponent move incoming from Supabase Realtime channel
  const handleOpponentOnlineMove = useCallback(
    (payload: OnlineMovePayload) => {
      setChess((prevChess) => {
        const nextChess = new Chess(prevChess.fen());
        try {
          const moveRes = nextChess.move({
            from: payload.from as Square,
            to: payload.to as Square,
            promotion: (payload.promotion as PieceSymbol) || 'q',
          });

          if (moveRes) {
            if (nextChess.inCheck()) sounds.playCheck();
            else if (moveRes.captured) sounds.playCapture();
            else if (moveRes.flags.includes('k') || moveRes.flags.includes('q')) sounds.playCastle();
            else sounds.playMove();

            setLastMove({ from: payload.from as Square, to: payload.to as Square });
            setHistoryFens((prev) => [...prev, nextChess.fen()]);
            setHistorySans((prev) => [...prev, moveRes.san]);
            setCurrentStepIndex((prev) => prev + 1);
            setWhiteTime(payload.whiteTime);
            setBlackTime(payload.blackTime);
            setIsClockRunning(true);
            checkGameOverState(nextChess);
          }
        } catch (err) {
          console.warn('Gagal memproses langkah lawan:', err);
        }
        return nextChess;
      });
    },
    [checkGameOverState]
  );

  const handleCreateOnlineRoom = async (
    code: string,
    playerName: string,
    colorPref: PlayerColor,
    minutes: number
  ) => {
    setOnlineRoomCode(code);
    setOnlineMyColor(colorPref);
    setOnlineMyRole('host');
    setTimeControlMinutes(minutes);
    setWhiteTime(minutes * 60);
    setBlackTime(minutes * 60);
    setMode('online-multiplayer');
    setIsFlipped(colorPref === 'b');
    handleResetGame();

    try {
      await createOnlineRoom(code, playerName, colorPref, minutes, {
        onOpponentJoin: (opp) => {
          setOnlineOpponent(opp);
          sounds.playCastle();
        },
        onOpponentLeave: () => {
          setOnlineOpponent(null);
        },
        onMoveReceived: (payload) => {
          handleOpponentOnlineMove(payload);
        },
        onResignReceived: (data) => {
          setIsClockRunning(false);
          const winner = data.resigningColor === 'w' ? 'b' : 'w';
          setGameOverModal({
            isOpen: true,
            winner,
            reason: `${data.senderName} (${data.resigningColor === 'w' ? 'Putih' : 'Hitam'}) telah menyerah.`,
          });
          sounds.playGameOver();
        },
        onRematchReceived: () => {
          handleResetGame();
          sounds.playMove();
        },
        onGameSyncReceived: (state) => {
          if (state.fen) {
            const syncedChess = new Chess(state.fen);
            setChess(syncedChess);
            setWhiteTime(state.whiteTime);
            setBlackTime(state.blackTime);
          }
        },
        onStatusChange: (status) => {
          setOnlineConnectionStatus(status);
        },
      });
    } catch (err: any) {
      console.error('Failed to create online room:', err);
    }
  };

  const handleJoinOnlineRoom = async (code: string, playerName: string) => {
    setOnlineRoomCode(code);
    setOnlineMyRole('guest');
    setMode('online-multiplayer');
    handleResetGame();

    try {
      const session = await joinOnlineRoom(code, playerName, {
        onOpponentJoin: (opp) => {
          setOnlineOpponent(opp);
          sounds.playCastle();
        },
        onOpponentLeave: () => {
          setOnlineOpponent(null);
        },
        onMoveReceived: (payload) => {
          handleOpponentOnlineMove(payload);
        },
        onResignReceived: (data) => {
          setIsClockRunning(false);
          const winner = data.resigningColor === 'w' ? 'b' : 'w';
          setGameOverModal({
            isOpen: true,
            winner,
            reason: `${data.senderName} (${data.resigningColor === 'w' ? 'Putih' : 'Hitam'}) telah menyerah.`,
          });
          sounds.playGameOver();
        },
        onRematchReceived: () => {
          handleResetGame();
          sounds.playMove();
        },
        onGameSyncReceived: (state) => {
          if (state.fen) {
            const syncedChess = new Chess(state.fen);
            setChess(syncedChess);
            setWhiteTime(state.whiteTime);
            setBlackTime(state.blackTime);
            if (state.timeControlMinutes) {
              setTimeControlMinutes(state.timeControlMinutes);
            }
          }
        },
        onStatusChange: (status) => {
          setOnlineConnectionStatus(status);
        },
      });
      setOnlineMyColor(session.myColor);
      setIsFlipped(session.myColor === 'b');
    } catch (err: any) {
      console.error('Failed to join online room:', err);
    }
  };

  const handleLeaveOnlineRoom = () => {
    leaveOnlineRoom();
    setOnlineRoomCode(null);
    setOnlineOpponent(null);
    setMode('vs-ai');
    setIsFlipped(userSide === 'b');
    setIsOnlineLobbyOpen(false);
  };

  const handleOnlineResign = () => {
    if (onlineRoomCode) {
      void sendOnlineResign(onlineMyColor);
      setIsClockRunning(false);
      setGameOverModal({
        isOpen: true,
        winner: onlineMyColor === 'w' ? 'b' : 'w',
        reason: 'Anda menyerah dari pertandingan online.',
      });
      sounds.playGameOver();
    }
  };

  const handleOnlineRematch = () => {
    if (onlineRoomCode) {
      void sendOnlineRematch();
      handleResetGame();
    }
  };

  // Handle a user move
  const handleMakeMove = (from: Square, to: Square, promotion?: PieceSymbol): boolean => {
    if (aiThinkingRef.current && mode === 'vs-ai') return false;
    if (chess.isGameOver()) return false;

    // Check if it's user's turn in vs-ai
    if (mode === 'vs-ai') {
      const userColor = userSide;
      if (chess.turn() !== userColor) return false;
    }

    // Check if it's user's turn in online-multiplayer
    if (mode === 'online-multiplayer') {
      if (chess.turn() !== onlineMyColor) return false;
    }

    const fenBefore = chess.fen();
    const nextChess = new Chess(fenBefore);

    try {
      const moveResult = nextChess.move({
        from,
        to,
        promotion: promotion || 'q',
      });

      if (!moveResult) return false;

      // Special handling for Interactive Puzzle Trainer Mode
      if (mode === 'puzzle-trainer') {
        if (!currentPuzzle || !currentPuzzle.solutionMoves) return false;
        const userSan = moveResult.san;
        const expectedMove = currentPuzzle.solutionMoves[puzzleStepIndex];
        const normUser = userSan.replace(/[+#]/g, '');
        const normExpected = (expectedMove || '').replace(/[+#]/g, '');

        if (expectedMove && (userSan === expectedMove || normUser === normExpected)) {
          // Correct move in puzzle!
          setChess(nextChess);
          setLastMove({ from, to });
          sounds.playMove();

          const isFinished = puzzleStepIndex >= currentPuzzle.solutionMoves.length - 1;
          if (isFinished) {
            setPuzzleStatus('solved');
            setPuzzleStatusMessage('Brilian! Anda berhasil menyelesaikan teka-teki taktik ini!');
            sounds.playBrilliant();
            if (!solvedPuzzleIds.includes(currentPuzzle.id)) {
              setSolvedPuzzleIds((prev) => [...prev, currentPuzzle.id]);
              const playerName = currentUser ? currentUser.name : 'Tamu Master';
              void recordPuzzleSolved({
                puzzle_id: currentPuzzle.id,
                player_name: playerName,
                solved: true,
                rating_change: 15,
              });
              void recordMatchResult({
                player_name: playerName,
                result: 'win',
                opponent: 'Tactical Study',
                tactics_points: 15,
              });
            }
          } else {
            setPuzzleStatus('correct-step');
            setPuzzleStatusMessage('Langkah tepat! Membalas pertahanan lawan...');
            const nextOpponentMove = currentPuzzle.solutionMoves[puzzleStepIndex + 1];
            if (nextOpponentMove) {
              setTimeout(() => {
                try {
                  const oppChess = new Chess(nextChess.fen());
                  const oppRes = oppChess.move(nextOpponentMove);
                  if (oppRes) {
                    setChess(oppChess);
                    setLastMove({ from: oppRes.from, to: oppRes.to });
                    if (oppChess.inCheck()) sounds.playCheck();
                    else sounds.playMove();
                    setPuzzleStepIndex(puzzleStepIndex + 2);
                    setPuzzleStatus('idle');
                    setPuzzleStatusMessage('Giliran Anda melangkah kembali!');
                  }
                } catch {
                  // ignore
                }
              }, 450);
            }
          }
          return true;
        } else {
          // Wrong move in puzzle: notify and reject
          setPuzzleStatus('wrong');
          setPuzzleStatusMessage('Bukan langkah terbaik! Coba cari motif kombinasi atau pengorbanan lain.');
          sounds.playCheck();
          return false;
        }
      }

      // Start clocks on first move
      if (!isClockRunning && timeControlMinutes > 0) {
        setIsClockRunning(true);
      }

      const fenAfter = nextChess.fen();

      // Sound feedback
      if (nextChess.inCheck()) {
        sounds.playCheck();
      } else if (moveResult.captured) {
        sounds.playCapture();
      } else if (moveResult.flags.includes('k') || moveResult.flags.includes('q')) {
        sounds.playCastle();
      } else {
        sounds.playMove();
      }

      // 1. Apply move state IMMEDIATELY (< 1ms zero-latency visual response)
      setChess(nextChess);
      setLastMove({ from, to });
      const newFens = historyFens.slice(0, currentStepIndex + 1);
      newFens.push(fenAfter);
      setHistoryFens(newFens);

      const newSans = historySans.slice(0, currentStepIndex);
      newSans.push(moveResult.san);
      setHistorySans(newSans);

      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);

      if (mode === 'online-multiplayer') {
        void sendOnlineMove({
          from,
          to,
          promotion: (promotion as string) || undefined,
          san: moveResult.san,
          fen: fenAfter,
          whiteTime,
          blackTime,
          turn: nextChess.turn(),
          moveIndex: nextIndex,
        });
      }

      const isOver = checkGameOverState(nextChess);

      // 2. Offload tactical move classification asynchronously to Web Worker
      const moveNumber = newSans.length;
      engineService.classifyMoveAsync(fenBefore, fenAfter, moveResult.san, moveNumber).then((analyzed) => {
        setAnalyzedMoves((prev) => [...prev, analyzed]);

        if (analyzed.classification === 'brilliant') {
          setBrilliantSquare(to);
          sounds.playBrilliant();
          setBrilliantModalData({
            isOpen: true,
            moveSan: moveResult.san,
            explanation: analyzed.explanation,
          });
        } else {
          setBrilliantSquare(null);
        }
      });

      // 3. Trigger AI if vs-ai mode
      if (!isOver && mode === 'vs-ai') {
        triggerAiMove(nextChess);
      }

      return true;
    } catch {
      return false;
    }
  };

  // Trigger initial AI move if user chose Black
  useEffect(() => {
    if (mode === 'vs-ai' && userSide === 'b' && chess.turn() === 'w' && historySans.length === 0) {
      triggerAiMove(chess);
    }
  }, [mode, userSide, chess, historySans.length, triggerAiMove]);

  // Jump to past move index in table
  const handleJumpToMove = (index: number) => {
    if (index < 0 || index >= historyFens.length) return;
    const targetFen = historyFens[index];
    const previewChess = new Chess(targetFen);
    setChess(previewChess);
    setCurrentStepIndex(index);
  };

  const handleStepMove = (delta: number) => {
    const target = currentStepIndex + delta;
    if (target >= 0 && target < historyFens.length) {
      handleJumpToMove(target);
    }
  };

  // Undo move
  const handleUndoMove = () => {
    if (historyFens.length <= 1) return;
    const stepsToUndo = mode === 'vs-ai' ? 2 : 1;
    const newLength = Math.max(1, historyFens.length - stepsToUndo);
    const newFens = historyFens.slice(0, newLength);
    const newSans = historySans.slice(0, newLength - 1);

    setHistoryFens(newFens);
    setHistorySans(newSans);
    setCurrentStepIndex(newLength - 1);
    setChess(new Chess(newFens[newFens.length - 1]));
    setLastMove(null);
    setBrilliantSquare(null);
  };

  // Reset Game
  const handleResetGame = () => {
    const fresh = new Chess();
    setChess(fresh);
    setHistoryFens([fresh.fen()]);
    setHistorySans([]);
    setCurrentStepIndex(0);
    setLastMove(null);
    setBrilliantSquare(null);
    setWhiteTime(timeControlMinutes * 60);
    setBlackTime(timeControlMinutes * 60);
    setIsClockRunning(false);
    setGameOverModal({ isOpen: false, winner: null, reason: '' });
    setAnalyzedMoves([]);
    setAnalysisSummary(null);

    if (mode === 'vs-ai' && userSide === 'b') {
      setTimeout(() => triggerAiMove(fresh), 400);
    }
  };

  // Load game from Supabase Cloud
  const handleLoadCloudGame = (fen: string, pgn: string) => {
    try {
      const newGame = new Chess();
      if (pgn) {
        newGame.loadPgn(pgn);
      } else if (fen) {
        newGame.load(fen);
      }
      setChess(newGame);
      setHistoryFens([newGame.fen()]);
      setHistorySans(newGame.history());
      setCurrentStepIndex(newGame.history().length);
      setMode('analysis');
      setActiveTab('moves');
      sounds.playMove();
    } catch (err) {
      console.warn('Gagal memuat permainan cloud:', err);
    }
  };

  // Run full game review & analysis using Web Worker with live evaluation cache & progress tracking
  const handleRunFullAnalysis = async (openModalOnDone = true) => {
    if (historySans.length === 0) return;
    setIsAnalyzing(true);
    setAnalysisProgress({ current: 0, total: historySans.length });
    if (openModalOnDone) {
      setIsGameReviewModalOpen(true);
    }

    try {
      const res = await engineService.runBatchAnalysisAsync(
        historySans,
        analyzedMoves,
        (current, total) => {
          setAnalysisProgress({ current, total });
        }
      );
      setAnalyzedMoves(res.analyzedMoves);
      setAnalysisSummary(res.summary);
      setIsAnalyzing(false);
      setAnalysisProgress(null);

      const firstBrilliant = res.analyzedMoves.find((m) => m.classification === 'brilliant');
      if (firstBrilliant && !brilliantSquare) {
        setBrilliantSquare(firstBrilliant.to as Square);
      }
    } catch {
      setIsAnalyzing(false);
      setAnalysisProgress(null);
    }
  };

  const handleStartReviewMode = () => {
    setIsGameReviewModalOpen(false);
    setActiveTab('review');
    if (currentStepIndex === 0 && historySans.length > 0) {
      handleJumpToMove(1);
    }
  };

  const handleJumpToFirstKeyMoment = () => {
    setIsGameReviewModalOpen(false);
    setActiveTab('review');
    if (analysisSummary && analysisSummary.keyMoments.length > 0) {
      handleJumpToMove(analysisSummary.keyMoments[0]);
    } else if (historySans.length > 0) {
      handleJumpToMove(1);
    }
  };

  // Current reviewed move and square badge for Game Review mode
  const activeReviewedMove = useMemo(() => {
    if (activeTab !== 'review') return null;
    if (currentStepIndex <= 0 || currentStepIndex > analyzedMoves.length) return null;
    return analyzedMoves[currentStepIndex - 1];
  }, [activeTab, currentStepIndex, analyzedMoves]);

  const currentReviewBadge = useMemo(() => {
    if (!activeReviewedMove || !activeReviewedMove.to || !activeReviewedMove.classification) return null;
    return {
      square: activeReviewedMove.to as Square,
      classification: activeReviewedMove.classification,
    };
  }, [activeReviewedMove]);

  // Import PGN
  const handleImportPGN = (pgnString: string) => {
    try {
      const newChess = new Chess();
      newChess.loadPgn(pgnString);
      const moves = newChess.history();

      const replayChess = new Chess();
      const fens = [replayChess.fen()];
      for (const san of moves) {
        replayChess.move(san);
        fens.push(replayChess.fen());
      }

      setChess(replayChess);
      setHistorySans(moves);
      setHistoryFens(fens);
      setCurrentStepIndex(fens.length - 1);
      setMode('analysis');
      setActiveTab('moves');
    } catch {
      alert('Invalid PGN format.');
    }
  };

  // Puzzle Trainer Handlers
  const handleSelectPuzzle = useCallback((p: BackendPuzzle) => {
    setCurrentPuzzle(p);
    const puzzleChess = new Chess(p.fen);
    setChess(puzzleChess);
    setPuzzleStepIndex(0);
    setPuzzleStatus('idle');
    setPuzzleStatusMessage('');
    setIsFlipped(p.fen.split(' ')[1] === 'b');
    setHistoryFens([p.fen]);
    setHistorySans([]);
    setCurrentStepIndex(0);
    setLastMove(null);
    setBrilliantSquare(null);
  }, []);

  const handleResetPuzzle = useCallback(() => {
    if (!currentPuzzle) return;
    const puzzleChess = new Chess(currentPuzzle.fen);
    setChess(puzzleChess);
    setPuzzleStepIndex(0);
    setPuzzleStatus('idle');
    setPuzzleStatusMessage('');
    setHistoryFens([currentPuzzle.fen]);
    setHistorySans([]);
    setCurrentStepIndex(0);
    setLastMove(null);
  }, [currentPuzzle]);

  const handleNextPuzzle = useCallback(() => {
    if (!puzzles.length || !currentPuzzle) return;
    const idx = puzzles.findIndex((p) => p.id === currentPuzzle.id);
    const nextIdx = (idx + 1) % puzzles.length;
    handleSelectPuzzle(puzzles[nextIdx]);
  }, [puzzles, currentPuzzle, handleSelectPuzzle]);

  const handlePrevPuzzle = useCallback(() => {
    if (!puzzles.length || !currentPuzzle) return;
    const idx = puzzles.findIndex((p) => p.id === currentPuzzle.id);
    const prevIdx = (idx - 1 + puzzles.length) % puzzles.length;
    handleSelectPuzzle(puzzles[prevIdx]);
  }, [puzzles, currentPuzzle, handleSelectPuzzle]);

  // Board Editor Handlers
  const handleEditorSquareClick = useCallback(
    (square: Square) => {
      if (mode !== 'board-editor') return;
      const nextChess = new Chess(chess.fen());
      if (selectedEditorPiece === 'empty') {
        nextChess.remove(square);
      } else {
        const color = selectedEditorPiece[0] as 'w' | 'b';
        const type = selectedEditorPiece[1].toLowerCase() as PieceSymbol;
        nextChess.put({ type, color }, square);
      }

      const parts = nextChess.fen().split(' ');
      let castlingStr = '';
      if (editorCastling.whiteO_O) castlingStr += 'K';
      if (editorCastling.whiteO_O_O) castlingStr += 'Q';
      if (editorCastling.blackO_O) castlingStr += 'k';
      if (editorCastling.blackO_O_O) castlingStr += 'q';
      if (!castlingStr) castlingStr = '-';
      const newFen = `${parts[0]} ${editorSideToMove} ${castlingStr} - 0 1`;

      try {
        const finalChess = new Chess(newFen);
        setChess(finalChess);
        setHistoryFens([finalChess.fen()]);
        setHistorySans([]);
        setCurrentStepIndex(0);
      } catch {
        setChess(nextChess);
      }
    },
    [chess, mode, selectedEditorPiece, editorSideToMove, editorCastling]
  );

  const handleClearEditorBoard = useCallback(() => {
    const emptyChess = new Chess('8/8/8/8/8/8/8/8 w - - 0 1');
    setChess(emptyChess);
    setHistoryFens([emptyChess.fen()]);
    setHistorySans([]);
    setCurrentStepIndex(0);
  }, []);

  const handleResetEditorStandard = useCallback(() => {
    const startChess = new Chess();
    setChess(startChess);
    setHistoryFens([startChess.fen()]);
    setHistorySans([]);
    setCurrentStepIndex(0);
  }, []);

  const handleLoadEditorFen = useCallback((fenStr: string) => {
    const loadedChess = new Chess(fenStr);
    setChess(loadedChess);
    setHistoryFens([loadedChess.fen()]);
    setHistorySans([]);
    setCurrentStepIndex(0);
    setEditorSideToMove(loadedChess.turn());
  }, []);

  const handleStartVsAiFromEditor = useCallback(() => {
    setMode('vs-ai');
    setUserSide(chess.turn());
    setIsClockRunning(false);
  }, [chess]);

  const handleStartAnalysisFromEditor = useCallback(() => {
    setMode('analysis');
    setActiveTab('analysis');
  }, []);

  // Status Banner Text
  const gameStatusText = useMemo(() => {
    if (chess.isCheckmate()) {
      return `Checkmate! ${chess.turn() === 'w' ? 'Black' : 'White'} wins!`;
    }
    if (chess.isDraw()) {
      return 'Game Drawn!';
    }
    if (chess.inCheck()) {
      return `${chess.turn() === 'w' ? 'White' : 'Black'} is in Check!`;
    }
    return `${chess.turn() === 'w' ? "White" : "Black"}'s Turn to Move`;
  }, [chess]);

  // Player Names & Ratings
  const topPlayerColor = isFlipped ? 'w' : 'b';
  const bottomPlayerColor = isFlipped ? 'b' : 'w';

  const getPlayerDetails = (col: PlayerColor) => {
    if (mode === 'puzzle-trainer') {
      return {
        name: col === 'w' ? currentPuzzle?.white || 'Master Putih' : currentPuzzle?.black || 'Master Hitam',
        ratingText: currentPuzzle?.difficulty || 'Taktik',
        isAi: false,
      };
    }
    if (mode === 'board-editor') {
      return {
        name: col === 'w' ? 'Editor Sisi Putih' : 'Editor Sisi Hitam',
        ratingText: 'Setup',
        isAi: false,
      };
    }
    if (mode === 'vs-ai') {
      if (col === userSide) {
        return {
          name: currentUser ? currentUser.name : 'You',
          ratingText: currentUser?.rating ? String(currentUser.rating) : '1500',
          isAi: false,
        };
      }
      return {
        name: 'Stockfish AI',
        ratingText: `Level ${aiLevel}`,
        isAi: true,
      };
    }
    if (mode === 'online-multiplayer') {
      const isMe = col === onlineMyColor;
      if (isMe) {
        return {
          name: currentUser ? currentUser.name : (onlineMyRole === 'host' ? 'Host (Anda)' : 'Tamu (Anda)'),
          ratingText: onlineMyRole === 'host' ? 'Host' : 'Tamu',
          isAi: false,
        };
      }
      return {
        name: onlineOpponent ? onlineOpponent.name : 'Menunggu Lawan...',
        ratingText: onlineOpponent ? 'Online' : 'Menunggu...',
        isAi: false,
      };
    }
    if (mode === 'pass-play') {
      return {
        name: col === 'w' ? 'Player 1 (White)' : 'Player 2 (Black)',
        ratingText: 'Local',
        isAi: false,
      };
    }
    // Analysis
    return {
      name: col === 'w' ? 'White Analysis' : 'Black Analysis',
      ratingText: 'Engine',
      isAi: false,
    };
  };

  const topDetails = getPlayerDetails(topPlayerColor);
  const bottomDetails = getPlayerDetails(bottomPlayerColor);

  return (
    <div className="min-h-screen bg-[#161512] text-[#bababa] flex flex-col justify-between selection:bg-[#81b64c] selection:text-black">
      {/* Header Navigation */}
      <header className="bg-[#262421] border-b border-neutral-800 px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-black text-xl tracking-wide text-white">
            <span className="w-8 h-8 rounded-lg bg-[#81b64c] text-[#1c3308] flex items-center justify-center font-bold text-lg shadow">
              W
            </span>
            <span className="font-bold">
              W <span className="text-[#81b64c]">Chess</span>
            </span>
          </div>
          <span className="bg-[#1e1c18] text-xs px-2.5 py-0.5 rounded-md text-neutral-400 font-mono hidden md:inline-block border border-neutral-800">
            Stockfish + Arena Taktik
          </span>
        </div>

        {/* Mode Select Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-[#1e1c18] p-1 rounded-xl border border-neutral-800 overflow-x-auto max-w-[65vw] sm:max-w-none">
          <button
            onClick={() => {
              setIsOnlineLobbyOpen(true);
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              mode === 'online-multiplayer'
                ? 'bg-emerald-600 text-white shadow border border-emerald-400'
                : 'text-emerald-400 hover:text-white hover:bg-emerald-500/20'
            }`}
            title="Main Online 1v1 Real-time via Supabase"
          >
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Main Online (1v1)</span>
          </button>
          <button
            onClick={() => {
              setMode('vs-ai');
              handleResetGame();
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              mode === 'vs-ai'
                ? 'bg-[#312e2b] text-white shadow border border-neutral-700'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4 text-[#81b64c]" />
            <span className="hidden sm:inline">vs</span> Komputer
          </button>
          <button
            onClick={() => {
              setMode('pass-play');
              handleResetGame();
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              mode === 'pass-play'
                ? 'bg-[#312e2b] text-white shadow border border-neutral-700'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="hidden md:inline">Pass & Play</span>
          </button>
          <button
            onClick={() => {
              setMode('analysis');
              setActiveTab('analysis');
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              mode === 'analysis'
                ? 'bg-[#312e2b] text-white shadow border border-neutral-700'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4 text-blue-400" />
            <span className="hidden md:inline">Analisis</span>
          </button>
          <button
            onClick={() => {
              setMode('puzzle-trainer');
              if (currentPuzzle) {
                handleSelectPuzzle(currentPuzzle);
              } else if (puzzles.length > 0) {
                handleSelectPuzzle(puzzles[0]);
              }
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              mode === 'puzzle-trainer'
                ? 'bg-[#312e2b] text-white shadow border border-[#81b64c]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Teka-teki</span>
          </button>
          <button
            onClick={() => {
              setMode('board-editor');
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              mode === 'board-editor'
                ? 'bg-[#312e2b] text-white shadow border border-teal-500'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-teal-400" />
            <span>Editor Papan</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Supabase Cloud Storage Button */}
          <button
            onClick={() => setIsCloudModalOpen(true)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 transition cursor-pointer"
            title="Buka Supabase Cloud Storage (Simpan & Muat Permainan)"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cloud</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse hidden md:inline-block" />
          </button>

          {/* Tournament Leaderboard Button */}
          <button
            onClick={() => setIsLeaderboardOpen(true)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 transition cursor-pointer"
            title="Buka Papan Peringkat Turnamen"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Peringkat</span>
          </button>

          {/* Game Review Button */}
          <button
            onClick={() => handleRunFullAnalysis(true)}
            disabled={historySans.length === 0}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-[#81b64c]/20 to-[#26c2a3]/20 hover:from-[#81b64c]/30 hover:to-[#26c2a3]/30 disabled:opacity-40 text-white border border-[#81b64c]/40 flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
            title="Buka Game Review & Analisis Akurasi ala Chess.com"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#26c2a3]" />
            <span className="hidden sm:inline">Game</span> Review
          </button>

          {/* STRICT RBAC: Dashboard Admin Button - ONLY visible if currentUser?.role === 'admin' */}
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setIsAdminDashboardOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-md shadow-red-950/50 flex items-center gap-1.5 transition cursor-pointer border border-red-500/50"
              title="Buka Dashboard Administrator (Role: Admin)"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dashboard</span> Admin
            </button>
          )}

          {/* User Profile & Auth Menu */}
          <UserProfileMenu
            user={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onSignOut={() => setCurrentUser(null)}
            onOpenCloud={() => setIsCloudModalOpen(true)}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
            onOpenAdmin={() => setIsAdminDashboardOpen(true)}
          />

          <button
            onClick={() => setActiveTab('settings')}
            aria-label="Settings"
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
            title="Open Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Interactive Chess Area */}
      <main className="flex-grow flex flex-col lg:flex-row items-center lg:items-center justify-center gap-4 sm:gap-6 p-2 sm:p-4 max-w-7xl mx-auto w-full">
        {/* Board Column */}
        <div className="flex flex-col items-center justify-center w-full max-w-[620px]">
          {/* Online Match Quick Bar */}
          {mode === 'online-multiplayer' && (
            <div className="w-full mb-2 bg-[#1e1c18] border border-emerald-500/30 rounded-xl px-3 py-2 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  Room:
                  <span className="font-mono text-emerald-400 font-extrabold">{onlineRoomCode || '---'}</span>
                </span>
                <button
                  onClick={() => {
                    if (onlineRoomCode) {
                      navigator.clipboard.writeText(onlineRoomCode);
                      setCopiedCodeBanner(true);
                      setTimeout(() => setCopiedCodeBanner(false), 2000);
                    }
                  }}
                  className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] flex items-center gap-1 cursor-pointer"
                  title="Salin Kode Room"
                >
                  {copiedCodeBanner ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCodeBanner ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-neutral-400 hidden sm:inline">
                  Anda: <b className="text-white">{onlineMyColor === 'w' ? '⚪ Putih' : '⚫ Hitam'}</b>
                </span>
                <button
                  onClick={() => setIsOnlineLobbyOpen(true)}
                  className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-500/40 cursor-pointer"
                >
                  Info Room
                </button>
                <button
                  onClick={handleOnlineResign}
                  className="px-2 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs font-semibold rounded-lg border border-red-800/50 flex items-center gap-1 cursor-pointer"
                >
                  <Flag className="w-3 h-3" />
                  <span>Resign</span>
                </button>
              </div>
            </div>
          )}

          {/* Top Player Box */}
          <PlayerBox
            color={topPlayerColor}
            name={topDetails.name}
            ratingText={topDetails.ratingText}
            isAi={topDetails.isAi}
            isTurn={chess.turn() === topPlayerColor}
            timeLeftSeconds={topPlayerColor === 'w' ? whiteTime : blackTime}
            timeUnlimited={timeControlMinutes === 0 || mode === 'puzzle-trainer' || mode === 'board-editor'}
            capturedPieces={capturedPieces[topPlayerColor]}
            opponentCaptured={capturedPieces[bottomPlayerColor]}
          />

          {/* Board + Eval Bar Row */}
          <div className="flex w-full gap-2 sm:gap-3 my-1 sm:my-2 justify-center items-stretch h-[340px] sm:h-[500px] lg:h-[580px]">
            {/* Stockfish Evaluation Bar */}
            <EvalBar
              evaluation={engineResult?.evaluation || 0}
              mateIn={engineResult?.mateIn}
              isFlipped={isFlipped}
            />

            {/* Main Chess Board */}
            <div className="h-full aspect-square flex justify-center">
              <ChessBoard
                chess={chess}
                isFlipped={isFlipped}
                themeId={themeId}
                onMakeMove={handleMakeMove}
                lastMove={lastMove}
                bestMove={activeReviewedMove?.bestMove || engineResult?.bestMove || null}
                showBestMoveArrow={
                  (showBestMoveArrow && mode === 'analysis') ||
                  (activeTab === 'review' &&
                    !!activeReviewedMove &&
                    ['inaccuracy', 'mistake', 'blunder'].includes(activeReviewedMove.classification || ''))
                }
                disabled={(mode === 'vs-ai' && chess.turn() !== userSide) || (mode === 'online-multiplayer' && chess.turn() !== onlineMyColor) || activeTab === 'review'}
                isEditorMode={mode === 'board-editor'}
                onEditorSquareClick={handleEditorSquareClick}
                reviewSquareBadge={currentReviewBadge}
              />
            </div>
          </div>

          {/* Bottom Player Box */}
          <PlayerBox
            color={bottomPlayerColor}
            name={bottomDetails.name}
            ratingText={bottomDetails.ratingText}
            isAi={bottomDetails.isAi}
            isTurn={chess.turn() === bottomPlayerColor}
            timeLeftSeconds={bottomPlayerColor === 'w' ? whiteTime : blackTime}
            timeUnlimited={timeControlMinutes === 0 || mode === 'puzzle-trainer' || mode === 'board-editor'}
            capturedPieces={capturedPieces[bottomPlayerColor]}
            opponentCaptured={capturedPieces[topPlayerColor]}
          />
        </div>

        {/* Right Sidebar Panel: Context-Aware per GameMode */}
        {mode === 'puzzle-trainer' ? (
          <div className="w-full lg:w-96 bg-[#312e2b] rounded-2xl flex flex-col border border-neutral-700/60 shadow-2xl h-[520px] lg:h-[680px] overflow-hidden select-none">
            <PuzzleTrainer
              puzzles={puzzles}
              currentPuzzle={currentPuzzle}
              currentStepIndex={puzzleStepIndex}
              puzzleStatus={puzzleStatus}
              statusMessage={puzzleStatusMessage}
              onSelectPuzzle={handleSelectPuzzle}
              onResetPuzzle={handleResetPuzzle}
              onNextPuzzle={handleNextPuzzle}
              onPrevPuzzle={handlePrevPuzzle}
              solvedPuzzleIds={solvedPuzzleIds}
              tacticalRating={tacticalRating}
            />
          </div>
        ) : mode === 'board-editor' ? (
          <div className="w-full lg:w-96 bg-[#312e2b] rounded-2xl flex flex-col border border-neutral-700/60 shadow-2xl h-[520px] lg:h-[680px] overflow-hidden select-none">
            <BoardEditor
              currentFen={chess.fen()}
              selectedPiece={selectedEditorPiece}
              onSelectPiece={setSelectedEditorPiece}
              onClearBoard={handleClearEditorBoard}
              onResetStandard={handleResetEditorStandard}
              onFlipBoard={() => setIsFlipped(!isFlipped)}
              isFlipped={isFlipped}
              onLoadFen={handleLoadEditorFen}
              onStartVsAi={handleStartVsAiFromEditor}
              onStartAnalysis={handleStartAnalysisFromEditor}
              sideToMove={editorSideToMove}
              onChangeSideToMove={(side) => {
                setEditorSideToMove(side);
                const parts = chess.fen().split(' ');
                try {
                  const newFen = `${parts[0]} ${side} ${parts[2] || '-'} - 0 1`;
                  setChess(new Chess(newFen));
                } catch {
                  // ignore
                }
              }}
              castlingRights={editorCastling}
              onChangeCastling={(rights) => {
                setEditorCastling(rights);
                const parts = chess.fen().split(' ');
                let cStr = '';
                if (rights.whiteO_O) cStr += 'K';
                if (rights.whiteO_O_O) cStr += 'Q';
                if (rights.blackO_O) cStr += 'k';
                if (rights.blackO_O_O) cStr += 'q';
                if (!cStr) cStr = '-';
                try {
                  const newFen = `${parts[0]} ${editorSideToMove} ${cStr} - 0 1`;
                  setChess(new Chess(newFen));
                } catch {
                  // ignore
                }
              }}
            />
          </div>
        ) : (
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            gameStatusText={gameStatusText}
            isCheck={chess.inCheck()}
            isGameOver={chess.isGameOver()}
            opening={currentOpening}
            moveHistory={moveHistoryPairs}
            currentMoveIndex={currentStepIndex}
            evalPoints={evalPoints}
            onJumpToMove={handleJumpToMove}
            onStepMove={handleStepMove}
            onResetGame={handleResetGame}
            onFlipBoard={() => setIsFlipped(!isFlipped)}
            onUndoMove={handleUndoMove}
            engineResult={engineResult}
            onRunFullAnalysis={handleRunFullAnalysis}
            isAnalyzing={isAnalyzing}
            analysisProgress={analysisProgress}
            analysisSummary={analysisSummary}
            analyzedMoves={analyzedMoves}
            pgn={chess.pgn()}
            onImportPGN={handleImportPGN}
            fen={chess.fen()}
            aiLevel={aiLevel}
            onChangeAiLevel={setAiLevel}
            userSide={userSide}
            onChangeUserSide={(side) => {
              setUserSide(side);
              handleResetGame();
            }}
            themeId={themeId}
            onChangeTheme={setThemeId}
            timeControlMinutes={timeControlMinutes}
            onChangeTimeControl={(mins) => {
              setTimeControlMinutes(mins);
              setWhiteTime(mins * 60);
              setBlackTime(mins * 60);
            }}
            soundEnabled={soundEnabled}
            onToggleSound={setSoundEnabled}
            showBestMoveArrow={showBestMoveArrow}
            onToggleShowBestMoveArrow={setShowBestMoveArrow}
            onShowBrilliantModal={(m) => {
              setBrilliantModalData({
                isOpen: true,
                moveSan: m.san,
                explanation: m.explanation,
              });
            }}
            whitePlayerName={getPlayerDetails('w').name}
            blackPlayerName={getPlayerDetails('b').name}
            onOpenSummaryModal={() => setIsGameReviewModalOpen(true)}
          />
        )}
      </main>

      {/* Footer / Status bar */}
      <footer className="bg-[#1e1c18] border-t border-neutral-800 px-4 py-2 text-center text-xs text-neutral-500 flex flex-wrap justify-center items-center gap-3">
        <span>Stockfish Engine Analysis & Tactical Move Classifier</span>
        <span className="hidden sm:inline">•</span>
        <span className="text-[#81b64c] font-semibold">Opening Book: ECO Codes</span>
        <span className="hidden sm:inline">•</span>
        <span className="text-[#26c2a3] font-semibold">Brilliant (!!) Sacrifice Detector</span>
      </footer>

      {/* Modals */}
      <BrilliantModal
        isOpen={brilliantModalData.isOpen}
        onClose={() => setBrilliantModalData({ isOpen: false, moveSan: '' })}
        moveSan={brilliantModalData.moveSan}
        explanation={brilliantModalData.explanation}
      />

      <GameOverModal
        isOpen={gameOverModal.isOpen}
        winner={gameOverModal.winner}
        reason={gameOverModal.reason}
        isUserWinner={gameOverModal.isUserWinner}
        eloChange={gameOverModal.eloChange}
        newElo={gameOverModal.newElo}
        onNewGame={handleResetGame}
        onReview={() => {
          setGameOverModal({ isOpen: false, winner: null, reason: '' });
          handleRunFullAnalysis(true);
        }}
        onClose={() => setGameOverModal({ isOpen: false, winner: null, reason: '' })}
      />

      <GameReviewModal
        isOpen={isGameReviewModalOpen}
        onClose={() => setIsGameReviewModalOpen(false)}
        winner={gameOverModal.winner}
        reason={gameOverModal.reason || (chess.isGameOver() ? gameStatusText : 'Ulasan Permainan')}
        whitePlayerName={getPlayerDetails('w').name}
        blackPlayerName={getPlayerDetails('b').name}
        summary={analysisSummary}
        isAnalyzing={isAnalyzing}
        analysisProgress={analysisProgress}
        onStartReview={handleStartReviewMode}
        onJumpToFirstKeyMoment={handleJumpToFirstKeyMoment}
        onNewGame={() => {
          setIsGameReviewModalOpen(false);
          handleResetGame();
        }}
      />

      {/* Cloud Game Storage Modal */}
      <CloudSyncModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        currentFen={chess.fen()}
        currentPgn={chess.pgn()}
        currentMoves={historySans}
        gameMode={mode}
        onLoadGame={handleLoadCloudGame}
        currentUser={currentUser}
      />

      {/* Cloud Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />

      {/* Supabase Login & Sign Up Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
        }}
      />

      {/* Supabase Online 1v1 Real-time Lobby Modal */}
      <OnlineMultiplayerLobby
        isOpen={isOnlineLobbyOpen}
        onClose={() => setIsOnlineLobbyOpen(false)}
        isMatched={mode === 'online-multiplayer' && !!onlineRoomCode}
        roomCode={onlineRoomCode}
        myColor={onlineMyColor}
        myRole={onlineMyRole}
        opponent={onlineOpponent}
        connectionStatus={onlineConnectionStatus}
        timeControlMinutes={timeControlMinutes}
        onCreateRoom={handleCreateOnlineRoom}
        onJoinRoom={handleJoinOnlineRoom}
        onLeaveRoom={handleLeaveOnlineRoom}
        onResign={handleOnlineResign}
        onRematch={handleOnlineRematch}
      />

      {/* RBAC Admin Dashboard Modal (Strictly Guarded for role === 'admin') */}
      {currentUser?.role === 'admin' && (
        <AdminDashboard
          isOpen={isAdminDashboardOpen}
          onClose={() => setIsAdminDashboardOpen(false)}
          currentUser={currentUser}
        />
      )}

      {/* RBAC 403 Forbidden Access Denied Modal */}
      <AccessDeniedModal
        isOpen={isAccessDeniedModalOpen}
        onClose={() => setIsAccessDeniedModalOpen(false)}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        currentRole={currentUser ? currentUser.role : 'guest'}
        attemptedPath={attemptedAdminPath}
      />
    </div>
  );
}
