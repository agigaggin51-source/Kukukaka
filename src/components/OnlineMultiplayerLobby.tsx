import React, { useState } from 'react';
import {
  Globe,
  Copy,
  Check,
  Users,
  Play,
  RotateCcw,
  Flag,
  LogOut,
  Clock,
  Sparkles,
  ArrowRight,
  Shield,
  Loader2,
  X
} from 'lucide-react';
import { PlayerColor } from '../types/chess';
import { OnlinePlayer } from '../lib/onlineMultiplayer';

interface OnlineMultiplayerLobbyProps {
  isOpen: boolean;
  onClose: () => void;
  isMatched: boolean;
  roomCode: string | null;
  myColor: PlayerColor | null;
  myRole: 'host' | 'guest' | null;
  opponent: OnlinePlayer | null;
  connectionStatus: 'connecting' | 'connected' | 'waiting' | 'ready' | 'error' | 'disconnected';
  timeControlMinutes: number;
  onCreateRoom: (roomCode: string, playerName: string, colorPref: PlayerColor, minutes: number) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
  onLeaveRoom: () => void;
  onResign: () => void;
  onRematch: () => void;
}

export const OnlineMultiplayerLobby: React.FC<OnlineMultiplayerLobbyProps> = ({
  isOpen,
  onClose,
  isMatched,
  roomCode,
  myColor,
  myRole,
  opponent,
  connectionStatus,
  timeControlMinutes,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onResign,
  onRematch,
}) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState('Pemain ' + Math.floor(100 + Math.random() * 900));
  const [inputCode, setInputCode] = useState('');
  const [selectedColor, setSelectedColor] = useState<PlayerColor>('w');
  const [selectedTime, setSelectedTime] = useState<number>(5);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const generated = `WCH-${rand}`;
    onCreateRoom(generated, playerName.trim() || 'Host', selectedColor, selectedTime);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanCode = inputCode.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 4) {
      setErrorMsg('Masukkan kode room yang valid (contoh: WCH-8K2M)');
      return;
    }
    onJoinRoom(cleanCode, playerName.trim() || 'Tamu');
  };

  // If in an active match and modal is closed, this component won't render
  // When modal is open:
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Globe className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg tracking-tight flex items-center gap-2">
                Main Online 1v1 Real-time
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Supabase
                </span>
              </h3>
              <p className="text-xs text-slate-400">Tantang teman bermain catur secara langsung tanpa instalasi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Active room state */}
          {roomCode ? (
            <div className="space-y-5">
              {/* Room Code Card */}
              <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-5 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">Kode Room Anda</span>
                <div className="my-2 flex items-center justify-center gap-3">
                  <span className="font-mono text-3xl font-black text-emerald-400 tracking-wider">
                    {roomCode}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all flex items-center gap-1.5 text-xs font-medium"
                    title="Salin Kode Room"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Tersalin!' : 'Salin'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Bagikan kode di atas kepada teman untuk bergabung ke pertandingan ini.
                </p>
              </div>

              {/* Status and Opponent Info */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-slate-500" /> Peran Anda:
                  </span>
                  <span className="font-semibold text-white">
                    {myColor === 'w' ? '⚪ Putih' : '⚫ Hitam'} ({myRole === 'host' ? 'Host / Pembuat' : 'Tamu'})
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-500" /> Durasi Timer:
                  </span>
                  <span className="font-semibold text-white">{timeControlMinutes} Menit per Pemain</span>
                </div>

                <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Status Lawan:</span>
                  <div className="flex items-center gap-2">
                    {opponent ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        {opponent.name} (Terhubung)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Menunggu Lawan...
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                {opponent && (
                  <button
                    onClick={onClose}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Lanjutkan ke Papan Catur
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={onResign}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-red-950/40 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-800/60 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    Menyerah (Resign)
                  </button>
                  <button
                    onClick={onRematch}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Minta Rematch
                  </button>
                </div>

                <button
                  onClick={onLeaveRoom}
                  className="w-full py-2.5 px-3 bg-red-900/20 hover:bg-red-900/30 text-red-400 border border-red-800/40 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5 mt-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Tinggalkan Room Online
                </button>
              </div>
            </div>
          ) : (
            /* Lobby tabs: Create or Join */
            <div className="space-y-5">
              {/* Tabs */}
              <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                <button
                  onClick={() => setTab('create')}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    tab === 'create'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Buat Room Baru
                </button>
                <button
                  onClick={() => setTab('join')}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    tab === 'join'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Gabung Room
                </button>
              </div>

              {/* Player Name */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Nama Panggilan Anda</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={20}
                  placeholder="Contoh: Grandmaster Roy"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {tab === 'create' ? (
                /* Tab 1: Create Room */
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Warna Bidak Anda</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedColor('w')}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                          selectedColor === 'w'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-slate-200 border border-slate-400 shadow-sm" />
                        Putih (White - Jalan Duluan)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedColor('b')}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                          selectedColor === 'b'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-slate-900 border border-slate-600 shadow-sm" />
                        Hitam (Black)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Kontrol Waktu</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[3, 5, 10].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setSelectedTime(mins)}
                          className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                            selectedTime === mins
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {mins} Menit {mins === 3 ? '(Blitz)' : mins === 5 ? '(Rapid)' : '(Klasik)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 mt-2"
                  >
                    <span>Buat Kode Room Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                /* Tab 2: Join Room */
                <form onSubmit={handleJoinSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Kode Room dari Teman</label>
                    <input
                      type="text"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                      placeholder="Contoh: WCH-8K2M"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-lg font-mono tracking-widest text-emerald-400 placeholder:text-slate-600 uppercase focus:outline-none focus:border-emerald-500 text-center transition-colors"
                    />
                    {errorMsg && <p className="text-xs text-red-400 mt-1.5">{errorMsg}</p>}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 mt-2"
                  >
                    <span>Masuk ke Room & Bertanding</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
