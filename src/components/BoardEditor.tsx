import React, { useState } from 'react';
import {
  RotateCcw,
  Trash2,
  Play,
  Cpu,
  Copy,
  Check,
  Upload,
  RefreshCw,
  Shield,
  Layers,
} from 'lucide-react';
import { PIECE_SVGS } from '../lib/pieces';
import { Square } from 'chess.js';

export type SelectedPieceType =
  | 'wK' | 'wQ' | 'wR' | 'wB' | 'wN' | 'wP'
  | 'bK' | 'bQ' | 'bR' | 'bB' | 'bN' | 'bP'
  | 'empty';

interface BoardEditorProps {
  currentFen: string;
  selectedPiece: SelectedPieceType;
  onSelectPiece: (piece: SelectedPieceType) => void;
  onClearBoard: () => void;
  onResetStandard: () => void;
  onFlipBoard: () => void;
  isFlipped: boolean;
  onLoadFen: (fen: string) => void;
  onStartVsAi: () => void;
  onStartAnalysis: () => void;
  sideToMove: 'w' | 'b';
  onChangeSideToMove: (side: 'w' | 'b') => void;
  castlingRights: {
    whiteO_O: boolean;
    whiteO_O_O: boolean;
    blackO_O: boolean;
    blackO_O_O: boolean;
  };
  onChangeCastling: (rights: {
    whiteO_O: boolean;
    whiteO_O_O: boolean;
    blackO_O: boolean;
    blackO_O_O: boolean;
  }) => void;
}

export const BoardEditor: React.FC<BoardEditorProps> = ({
  currentFen,
  selectedPiece,
  onSelectPiece,
  onClearBoard,
  onResetStandard,
  onFlipBoard,
  isFlipped,
  onLoadFen,
  onStartVsAi,
  onStartAnalysis,
  sideToMove,
  onChangeSideToMove,
  castlingRights,
  onChangeCastling,
}) => {
  const [fenInput, setFenInput] = useState<string>(currentFen);
  const [copied, setCopied] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Update input text when external FEN changes
  React.useEffect(() => {
    setFenInput(currentFen);
  }, [currentFen]);

  const handleCopyFen = () => {
    navigator.clipboard.writeText(currentFen);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyFen = () => {
    try {
      setLoadError(null);
      onLoadFen(fenInput.trim());
    } catch {
      setLoadError('Format FEN tidak valid!');
    }
  };

  const whitePieces: SelectedPieceType[] = ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP'];
  const blackPieces: SelectedPieceType[] = ['bK', 'bQ', 'bR', 'bB', 'bN', 'bP'];

  return (
    <div className="flex flex-col h-full space-y-3.5 p-3 sm:p-4 text-sm overflow-y-auto">
      {/* Header */}
      <div className="bg-[#1e1c18] border border-neutral-800 rounded-xl p-3 shadow-inner">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Editor Papan & Posisi Catur</h3>
              <p className="text-[11px] text-neutral-400">
                Pilih bidak dari palet lalu klik petak papan untuk menaruhnya.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Piece Palette */}
      <div className="bg-[#262421] border border-neutral-800 rounded-xl p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
            Palet Bidak (Pilih & Letakkan)
          </span>
          <span className="text-[11px] text-neutral-400">
            Terpilih: <strong className="text-white">{selectedPiece}</strong>
          </span>
        </div>

        {/* White Pieces Row */}
        <div>
          <span className="text-[11px] text-neutral-400 font-semibold mb-1 block">Bidak Putih:</span>
          <div className="grid grid-cols-6 gap-1.5">
            {whitePieces.map((p) => {
              const isSelected = selectedPiece === p;
              return (
                <button
                  key={p}
                  onClick={() => onSelectPiece(p)}
                  className={`h-11 rounded-lg border flex items-center justify-center p-1 transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#81b64c]/20 border-[#81b64c] shadow ring-2 ring-[#81b64c]/40'
                      : 'bg-[#1e1c18] border-neutral-700 hover:bg-[#312e2b]'
                  }`}
                  title={`Pilih ${p}`}
                >
                  <div className="w-8 h-8">{PIECE_SVGS[p]}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Black Pieces Row */}
        <div>
          <span className="text-[11px] text-neutral-400 font-semibold mb-1 block">Bidak Hitam:</span>
          <div className="grid grid-cols-6 gap-1.5">
            {blackPieces.map((p) => {
              const isSelected = selectedPiece === p;
              return (
                <button
                  key={p}
                  onClick={() => onSelectPiece(p)}
                  className={`h-11 rounded-lg border flex items-center justify-center p-1 transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#81b64c]/20 border-[#81b64c] shadow ring-2 ring-[#81b64c]/40'
                      : 'bg-[#1e1c18] border-neutral-700 hover:bg-[#312e2b]'
                  }`}
                  title={`Pilih ${p}`}
                >
                  <div className="w-8 h-8">{PIECE_SVGS[p]}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Eraser / Clear tool */}
        <div className="pt-1">
          <button
            onClick={() => onSelectPiece('empty')}
            className={`w-full py-2 px-3 rounded-lg border flex items-center justify-center gap-2 text-xs font-semibold transition cursor-pointer ${
              selectedPiece === 'empty'
                ? 'bg-rose-950/40 border-rose-500 text-rose-300 ring-2 ring-rose-500/30'
                : 'bg-[#1e1c18] border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            Mode Penghapus (Klik petak untuk menghapus bidak)
          </button>
        </div>
      </div>

      {/* Side to Move & Castling Setup */}
      <div className="bg-[#262421] border border-neutral-800 rounded-xl p-3 space-y-2.5">
        <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
          Giliran & Hak Rokade
        </span>

        {/* Side to Move */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400 w-24">Giliran Jalan:</span>
          <div className="flex-1 grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onChangeSideToMove('w')}
              className={`py-1.5 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                sideToMove === 'w'
                  ? 'bg-white text-neutral-900 border-white shadow'
                  : 'bg-[#1e1c18] text-neutral-400 border-neutral-800 hover:text-white'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white border border-neutral-400" />
              Putih (White)
            </button>
            <button
              onClick={() => onChangeSideToMove('b')}
              className={`py-1.5 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                sideToMove === 'b'
                  ? 'bg-neutral-900 text-white border-neutral-600 shadow'
                  : 'bg-[#1e1c18] text-neutral-400 border-neutral-800 hover:text-white'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-black border border-neutral-600" />
              Hitam (Black)
            </button>
          </div>
        </div>

        {/* Castling rights */}
        <div className="border-t border-neutral-800 pt-2 space-y-1.5">
          <div className="text-[11px] text-neutral-400 font-semibold flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-neutral-400" />
            Hak Rokade (Castling Rights):
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
            <label className="flex items-center gap-1.5 bg-[#1e1c18] p-1.5 rounded-lg border border-neutral-800 cursor-pointer hover:bg-neutral-800">
              <input
                type="checkbox"
                checked={castlingRights.whiteO_O}
                onChange={(e) =>
                  onChangeCastling({ ...castlingRights, whiteO_O: e.target.checked })
                }
                className="rounded accent-[#81b64c]"
              />
              <span className="text-neutral-300 text-[11px]">Putih O-O</span>
            </label>
            <label className="flex items-center gap-1.5 bg-[#1e1c18] p-1.5 rounded-lg border border-neutral-800 cursor-pointer hover:bg-neutral-800">
              <input
                type="checkbox"
                checked={castlingRights.whiteO_O_O}
                onChange={(e) =>
                  onChangeCastling({ ...castlingRights, whiteO_O_O: e.target.checked })
                }
                className="rounded accent-[#81b64c]"
              />
              <span className="text-neutral-300 text-[11px]">Putih O-O-O</span>
            </label>
            <label className="flex items-center gap-1.5 bg-[#1e1c18] p-1.5 rounded-lg border border-neutral-800 cursor-pointer hover:bg-neutral-800">
              <input
                type="checkbox"
                checked={castlingRights.blackO_O}
                onChange={(e) =>
                  onChangeCastling({ ...castlingRights, blackO_O: e.target.checked })
                }
                className="rounded accent-[#81b64c]"
              />
              <span className="text-neutral-300 text-[11px]">Hitam O-O</span>
            </label>
            <label className="flex items-center gap-1.5 bg-[#1e1c18] p-1.5 rounded-lg border border-neutral-800 cursor-pointer hover:bg-neutral-800">
              <input
                type="checkbox"
                checked={castlingRights.blackO_O_O}
                onChange={(e) =>
                  onChangeCastling({ ...castlingRights, blackO_O_O: e.target.checked })
                }
                className="rounded accent-[#81b64c]"
              />
              <span className="text-neutral-300 text-[11px]">Hitam O-O-O</span>
            </label>
          </div>
        </div>
      </div>

      {/* Board Utility Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onResetStandard}
          className="py-2 px-2 rounded-lg bg-[#262421] hover:bg-[#312e2b] border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Awal Standar
        </button>
        <button
          onClick={onClearBoard}
          className="py-2 px-2 rounded-lg bg-[#262421] hover:bg-rose-950/30 hover:border-rose-700/50 border border-neutral-800 text-xs font-semibold text-rose-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Kosongkan
        </button>
        <button
          onClick={onFlipBoard}
          className="py-2 px-2 rounded-lg bg-[#262421] hover:bg-[#312e2b] border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {isFlipped ? 'Lihat Putih' : 'Lihat Hitam'}
        </button>
      </div>

      {/* FEN Input & String Manager */}
      <div className="bg-[#262421] border border-neutral-800 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
            Notasi FEN (Forsyth-Edwards)
          </span>
          <button
            onClick={handleCopyFen}
            className="text-xs font-semibold text-[#81b64c] hover:underline flex items-center gap-1 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Tersalin!' : 'Salin FEN'}
          </button>
        </div>

        <textarea
          value={fenInput}
          onChange={(e) => setFenInput(e.target.value)}
          rows={2}
          className="w-full bg-[#1e1c18] border border-neutral-700 rounded-lg p-2 text-xs font-mono text-neutral-200 focus:outline-none focus:border-[#81b64c] resize-none"
          placeholder="Tempelkan string FEN di sini..."
        />

        {loadError && (
          <div className="text-xs text-rose-400 font-medium">{loadError}</div>
        )}

        <button
          onClick={handleApplyFen}
          className="w-full py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition cursor-pointer border border-neutral-700"
        >
          <Upload className="w-3.5 h-3.5 text-[#81b64c]" />
          Terapkan FEN ke Papan
        </button>
      </div>

      {/* Launch Actions */}
      <div className="pt-1 space-y-2">
        <button
          onClick={onStartVsAi}
          className="w-full py-2.5 px-4 rounded-xl bg-[#81b64c] hover:bg-[#96c95c] text-[#1c3308] text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          Mulai Lawan Komputer dari Posisi Ini
        </button>

        <button
          onClick={onStartAnalysis}
          className="w-full py-2.5 px-4 rounded-xl bg-[#262421] hover:bg-[#312e2b] border border-neutral-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Cpu className="w-4 h-4 text-blue-400" />
          Buka di Mode Analisis Mesin
        </button>
      </div>
    </div>
  );
};
