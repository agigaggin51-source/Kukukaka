import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, User, RefreshCw, X, Shield, Swords, Sparkles } from 'lucide-react';
import { CloudPlayerScore, fetchLeaderboard, recordMatchResult } from '../lib/supabaseClient';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose }) => {
  const [players, setPlayers] = useState<CloudPlayerScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overall' | 'tactics'>('overall');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchLeaderboard();
      setPlayers(data);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const sortedPlayers = [...players].sort((a, b) =>
    activeTab === 'overall' ? b.rating - a.rating : b.tactics_score - a.tactics_score
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold tracking-tight text-white">Papan Peringkat Turnamen (Cloud)</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                  Supabase Live
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Peringkat ELO & Skor Taktik Seluruh Pemain di Arena
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Segarkan Peringkat"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 pt-3">
          <button
            onClick={() => setActiveTab('overall')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'overall'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Rating Standar / ELO</span>
          </button>
          <button
            onClick={() => setActiveTab('tactics')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'tactics'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Skor Taktik Puzzle</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              <span>Memuat data leaderboard...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedPlayers.map((player, index) => {
                const rank = index + 1;
                const isTop3 = rank <= 3;

                return (
                  <div
                    key={player.id || player.player_name}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                      rank === 1
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : rank === 2
                        ? 'bg-slate-300/10 border-slate-300/30'
                        : rank === 3
                        ? 'bg-amber-700/10 border-amber-700/30'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      {/* Rank Indicator */}
                      <div className="w-7 text-center font-bold text-sm">
                        {rank === 1 ? (
                          <span className="text-amber-400 text-lg">🥇</span>
                        ) : rank === 2 ? (
                          <span className="text-slate-300 text-lg">🥈</span>
                        ) : rank === 3 ? (
                          <span className="text-amber-600 text-lg">🥉</span>
                        ) : (
                          <span className="text-slate-500 font-mono">#{rank}</span>
                        )}
                      </div>

                      {/* Avatar & Name */}
                      <div className="text-xl">{player.avatar || '♟️'}</div>
                      <div>
                        <div className="font-semibold text-sm text-white flex items-center space-x-1.5">
                          <span>{player.player_name}</span>
                          {rank === 1 && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-medium">
                              Juara
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                          <span className="text-emerald-400 font-medium">{player.wins}M</span>
                          <span>•</span>
                          <span className="text-red-400 font-medium">{player.losses}K</span>
                          <span>•</span>
                          <span className="text-slate-400">{player.draws}S</span>
                        </div>
                      </div>
                    </div>

                    {/* Score / ELO */}
                    <div className="text-right">
                      {activeTab === 'overall' ? (
                        <div>
                          <span className="font-mono font-bold text-base text-amber-400">
                            {player.rating}
                          </span>
                          <span className="text-[10px] text-slate-400 block uppercase">ELO Rating</span>
                        </div>
                      ) : (
                        <div>
                          <span className="font-mono font-bold text-base text-emerald-400">
                            {player.tactics_score}
                          </span>
                          <span className="text-[10px] text-slate-400 block uppercase">Poin Taktik</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
