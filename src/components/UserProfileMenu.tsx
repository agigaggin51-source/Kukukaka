import React, { useState, useRef, useEffect } from 'react';
import { User, LogIn, LogOut, ChevronDown, ShieldCheck, Trophy, Cloud, Sparkles } from 'lucide-react';
import { UserProfile, signOutUser } from '../lib/supabaseClient';

interface UserProfileMenuProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onOpenCloud: () => void;
  onOpenLeaderboard: () => void;
  onOpenAdmin?: () => void;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  user,
  onOpenAuth,
  onSignOut,
  onOpenCloud,
  onOpenLeaderboard,
  onOpenAdmin,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOutClick = async () => {
    await signOutUser();
    onSignOut();
    setIsOpen(false);
  };

  if (!user) {
    return (
      <button
        onClick={onOpenAuth}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-950/40 flex items-center gap-1.5 transition-all cursor-pointer"
        title="Masuk atau Daftar Akun Supabase"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span>Masuk / Daftar</span>
      </button>
    );
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-slate-900 border transition-all text-xs text-slate-200 cursor-pointer shadow-sm ${
          isAdmin
            ? 'border-red-500/50 hover:border-red-400'
            : 'border-emerald-500/30 hover:border-emerald-500/60'
        }`}
      >
        <span className="text-sm">{user.avatar || (isAdmin ? '🛡️' : '♟️')}</span>
        <div className="text-left hidden sm:block max-w-[120px]">
          <div className="flex items-center gap-1">
            <p className="font-semibold text-white truncate leading-tight">{user.name}</p>
            {isAdmin && (
              <span className="px-1 py-0.2 text-[9px] font-bold bg-red-950 text-red-300 border border-red-800 rounded">
                ADMIN
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 font-mono leading-none mt-0.5">
            {isAdmin ? 'Administrator' : 'Regular User'}
          </p>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-50 animate-fade-in text-slate-200 space-y-2">
          {/* User Info Header */}
          <div className="px-2 py-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{user.avatar || (isAdmin ? '🛡️' : '♟️')}</span>
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-sm text-white truncate">{user.name}</p>
                  <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded uppercase ${
                    isAdmin
                      ? 'bg-red-950 text-red-300 border border-red-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate font-mono">{user.email}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">Status Keamanan:</span>
              <span className={`font-semibold flex items-center gap-1 ${
                isAdmin ? 'text-red-400' : 'text-emerald-400'
              }`}>
                <ShieldCheck className="w-3 h-3" />
                {isAdmin ? 'Admin Auth (RBAC)' : 'User Terotentikasi'}
              </span>
            </div>
          </div>

          {/* Quick Menu Actions */}
          <div className="space-y-1">
            {/* STRICT RBAC: Dashboard Admin only appears for admin role */}
            {isAdmin && onOpenAdmin && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenAdmin();
                }}
                className="w-full flex items-center space-x-2 px-2.5 py-2 text-xs rounded-lg bg-red-950/50 hover:bg-red-900/60 text-red-200 border border-red-800/60 transition-colors cursor-pointer font-medium"
              >
                <ShieldCheck className="w-4 h-4 text-red-400" />
                <span>Dashboard Admin</span>
              </button>
            )}

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenCloud();
              }}
              className="w-full flex items-center space-x-2 px-2.5 py-2 text-xs rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Cloud className="w-4 h-4 text-emerald-400" />
              <span>Arsip Permainan Cloud</span>
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenLeaderboard();
              }}
              className="w-full flex items-center space-x-2 px-2.5 py-2 text-xs rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Papan Peringkat Turnamen</span>
            </button>
          </div>

          {/* Logout Action */}
          <div className="pt-1 border-t border-slate-800">
            <button
              onClick={handleSignOutClick}
              className="w-full flex items-center space-x-2 px-2.5 py-2 text-xs rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar dari Akun</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
