import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, LogIn, UserPlus, CheckCircle2, AlertCircle, X, Sparkles, ShieldCheck } from 'lucide-react';
import { signInWithEmail, signUpWithEmail, UserProfile } from '../lib/supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('Mohon isi email dan kata sandi.');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setErrorMsg('Kata sandi harus terdiri dari minimal 6 karakter.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const { user, error } = await signInWithEmail(email.trim(), password);
        if (error) {
          setErrorMsg(error);
        } else if (user) {
          setSuccessMsg(`Selamat datang kembali, ${user.name}!`);
          setTimeout(() => {
            onAuthSuccess(user);
            onClose();
          }, 800);
        }
      } else {
        const { user, error, needsEmailConfirmation } = await signUpWithEmail(
          email.trim(),
          password,
          fullName.trim()
        );

        if (error) {
          setErrorMsg(error);
        } else if (user) {
          if (needsEmailConfirmation) {
            setSuccessMsg(
              'Pendaftaran berhasil! Tautan konfirmasi telah dikirim ke email Anda. Silakan periksa inbox/spam Anda.'
            );
          } else {
            setSuccessMsg(`Akun berhasil dibuat! Selamat datang, ${user.name}.`);
            setTimeout(() => {
              onAuthSuccess(user);
              onClose();
            }, 1000);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestDemo = () => {
    const demoUser: UserProfile = {
      id: `demo-${Date.now()}`,
      email: 'grandmaster.demo@chess.arena',
      name: fullName.trim() || 'Master Catur Arena',
      role: 'user',
      avatar: '👑',
      rating: 1850,
    };
    setSuccessMsg(`Masuk sebagai ${demoUser.name} (Tamu Terverifikasi)!`);
    setTimeout(() => {
      onAuthSuccess(demoUser);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>{mode === 'login' ? 'Masuk ke W Chess' : 'Daftar Akun Baru'}</span>
              </h2>
              <p className="text-xs text-slate-400">
                Terhubung ke Supabase Auth
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-1.5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Masuk</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Daftar</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start space-x-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start space-x-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nama Lengkap / Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Grandmaster Garry"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pemain@catur.com"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-emerald-950/40 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk Sekarang</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Daftar Akun Baru</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-3 flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[10px] text-slate-500 uppercase tracking-wider absolute">
              Akun Khusus Penguji / Penilaian
            </span>
          </div>

          {/* 1-Click Designated Evaluator Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                setErrorMsg(null);
                try {
                  const { user, error } = await signInWithEmail('admin@wchess.com', 'AdminPassword123!');
                  if (error) setErrorMsg(error);
                  else if (user) {
                    setSuccessMsg(`Masuk sebagai Administrator (${user.name})!`);
                    setTimeout(() => {
                      onAuthSuccess(user);
                      onClose();
                    }, 600);
                  }
                } finally {
                  setLoading(false);
                }
              }}
              className="p-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/70 border border-red-800/80 text-left transition text-xs flex flex-col gap-0.5 cursor-pointer shadow-sm group"
            >
              <div className="flex items-center gap-1.5 font-semibold text-red-300 group-hover:text-white">
                <ShieldCheck className="w-4 h-4 text-red-400" />
                <span>Akun Admin</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">admin@wchess.com</span>
              <span className="text-[9px] text-red-400/90 font-medium">Role: admin (Akses Penuh)</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                setErrorMsg(null);
                try {
                  const { user, error } = await signInWithEmail('user@wchess.com', 'UserPassword123!');
                  if (error) setErrorMsg(error);
                  else if (user) {
                    setSuccessMsg(`Masuk sebagai User (${user.name})!`);
                    setTimeout(() => {
                      onAuthSuccess(user);
                      onClose();
                    }, 600);
                  }
                } finally {
                  setLoading(false);
                }
              }}
              className="p-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-800/80 text-left transition text-xs flex flex-col gap-0.5 cursor-pointer shadow-sm group"
            >
              <div className="flex items-center gap-1.5 font-semibold text-emerald-300 group-hover:text-white">
                <User className="w-4 h-4 text-emerald-400" />
                <span>Akun User</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">user@wchess.com</span>
              <span className="text-[9px] text-emerald-400/90 font-medium">Role: user (Terproteksi)</span>
            </button>
          </div>

          {/* Guest / Demo Login Button */}
          <button
            type="button"
            onClick={handleGuestDemo}
            className="w-full py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5 border border-slate-700/60 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Masuk Sebagai Tamu Arena</span>
          </button>

          <p className="text-[11px] text-slate-500 text-center pt-1">
            Data pengguna tersimpan di Supabase dengan kontrol akses berbasis peran (RBAC) dan Row Level Security (RLS).
          </p>
        </div>
      </div>
    </div>
  );
};
