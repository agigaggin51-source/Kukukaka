import React, { useState, useEffect } from 'react';
import { Cloud, Database, Download, Trash2, CheckCircle2, AlertCircle, Copy, Check, ExternalLink, RefreshCw, X, Play } from 'lucide-react';
import { CloudSavedGame, fetchCloudGames, saveGameToCloud, deleteCloudGame, fetchSupabaseStatus, SupabaseStatusInfo, UserProfile } from '../lib/supabaseClient';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFen: string;
  currentPgn: string;
  currentMoves: string[];
  gameMode: string;
  onLoadGame: (fen: string, pgn: string) => void;
  currentUser?: UserProfile | null;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  currentFen,
  currentPgn,
  currentMoves,
  gameMode,
  onLoadGame,
  currentUser,
}) => {
  const [games, setGames] = useState<CloudSavedGame[]>([]);
  const [status, setStatus] = useState<SupabaseStatusInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSql, setShowSql] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [whitePlayer, setWhitePlayer] = useState('Pemain Putih');
  const [blackPlayer, setBlackPlayer] = useState('Stockfish AI');
  const [notes, setNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setTitle(`Laga ${new Date().toLocaleDateString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`);
      if (currentUser?.name) {
        setWhitePlayer(currentUser.name);
      }
    }
  }, [isOpen, currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statusData, gamesData] = await Promise.all([
        fetchSupabaseStatus(),
        fetchCloudGames(),
      ]);
      setStatus(statusData);
      setGames(gamesData);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const saved = await saveGameToCloud({
        title: title.trim(),
        white_player: whitePlayer.trim() || 'Putih',
        black_player: blackPlayer.trim() || 'Hitam',
        fen: currentFen,
        pgn: currentPgn,
        moves: currentMoves,
        result: '*',
        mode: gameMode,
        notes: notes.trim(),
      });

      if (saved) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        await loadData();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus permainan ini dari Cloud?')) {
      await deleteCloudGame(id);
      setGames((prev) => prev.filter((g) => g.id !== id));
    }
  };

  const handleCopySql = () => {
    if (status?.sqlSchema) {
      navigator.clipboard.writeText(status.sqlSchema);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold tracking-tight text-white">Supabase Cloud Game Storage</h2>
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Terhubung ke project: <span className="font-mono text-emerald-400/90">{status?.projectHost || 'vvnnypujpoxtzhjhcctb.supabase.co'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status & SQL Banner */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-start space-x-3">
              <Database className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-slate-200">Database Supabase PostgreSQL Sinkron</p>
                <p className="text-slate-400 mt-0.5">
                  Tabel: <code className="text-emerald-400">saved_games</code>, <code className="text-emerald-400">leaderboard</code>, <code className="text-emerald-400">puzzle_history</code>. Data tersimpan di cloud & cache instan.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => setShowSql(!showSql)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center space-x-1.5 text-xs"
              >
                <span>{showSql ? 'Sembunyikan SQL' : 'Lihat SQL Schema'}</span>
              </button>
              <button
                onClick={loadData}
                disabled={loading}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Segarkan Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Collapsible SQL Schema Drawer */}
          {showSql && (
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/20 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  PostgreSQL DDL Migration (Supabase SQL Editor)
                </span>
                <button
                  onClick={handleCopySql}
                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center space-x-1 transition-colors"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Tersalin!' : 'Salin SQL'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-900 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 border border-slate-800">
                {status?.sqlSchema}
              </pre>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Jalankan script ini di menu <strong>SQL Editor</strong> di dashboard Supabase Anda jika belum dibuat.
              </p>
            </div>
          )}

          {/* Save Current Game Form */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
                <span>Simpan Posisi & Catatan Permainan Saat Ini</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-normal">
                  {currentMoves.length} Langkah
                </span>
              </h3>
              {saveSuccess && (
                <span className="text-xs text-emerald-400 flex items-center space-x-1 animate-fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tersimpan di Cloud!</span>
                </span>
              )}
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-400 mb-1">Judul Laga / Turnamen</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Laga Final Catur Cepat"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Pemain Putih</label>
                <input
                  type="text"
                  value={whitePlayer}
                  onChange={(e) => setWhitePlayer(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Pemain Hitam</label>
                <input
                  type="text"
                  value={blackPlayer}
                  onChange={(e) => setBlackPlayer(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Catatan Analisis</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan taktik / ide pembukaan"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-3 flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={saving || !title.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center space-x-2 transition-all shadow-md shadow-emerald-900/30"
                >
                  <Cloud className="w-4 h-4" />
                  <span>{saving ? 'Menyimpan...' : 'Simpan ke Supabase Cloud'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Cloud Saved Games List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">
                Arsip Permainan Tersimpan ({games.length})
              </h3>
              <span className="text-xs text-slate-500">Klik "Muat ke Papan" untuk menganalisis</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-12 text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                <span>Memuat arsip dari Supabase...</span>
              </div>
            ) : games.length === 0 ? (
              <div className="text-center p-10 bg-slate-950/30 border border-slate-850 rounded-xl text-slate-400 text-xs">
                Belum ada permainan tersimpan di Cloud. Simpan permainan di atas!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {games.map((g) => (
                  <div
                    key={g.id}
                    className="p-4 bg-slate-950/60 border border-slate-800/80 hover:border-emerald-500/40 rounded-xl transition-all group flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-white truncate max-w-[240px]">
                          {g.title}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400">
                          {g.result || '*'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        ⚪ <strong className="text-slate-300">{g.white_player}</strong> vs ⚫ <strong className="text-slate-300">{g.black_player}</strong>
                      </p>
                      {g.notes && (
                        <p className="text-xs text-slate-400/90 mt-1 italic line-clamp-1">
                          "{g.notes}"
                        </p>
                      )}
                      <div className="mt-2 text-[11px] text-slate-500 flex items-center space-x-3">
                        <span>{new Date(g.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span>•</span>
                        <span>{g.moves?.length || 0} langkah</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800/60">
                      <button
                        onClick={() => handleDelete(g.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Hapus dari Cloud"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          onLoadGame(g.fen, g.pgn);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg flex items-center space-x-1.5 transition-colors shadow-sm"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Muat ke Papan</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
