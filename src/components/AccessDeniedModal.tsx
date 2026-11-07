import React from 'react';
import { ShieldAlert, AlertTriangle, ArrowLeft, LogIn, Lock } from 'lucide-react';

interface AccessDeniedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
  currentRole?: string;
  attemptedPath?: string;
}

export const AccessDeniedModal: React.FC<AccessDeniedModalProps> = ({
  isOpen,
  onClose,
  onOpenLogin,
  currentRole = 'guest',
  attemptedPath = '/#admin',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-red-500/40 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Glowing Top Banner */}
        <div className="h-2 w-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500" />

        <div className="p-6 sm:p-8">
          {/* Header Icon & Title */}
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 shrink-0 shadow-inner">
              <ShieldAlert className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-red-950/80 text-red-400 border border-red-800/60 rounded">
                  403 Forbidden
                </span>
                <span className="text-xs text-slate-400">Route Security Guard</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                Akses Ditolak
              </h2>
            </div>
          </div>

          {/* Explanation Body */}
          <div className="mt-5 space-y-3">
            <p className="text-sm text-slate-300 leading-relaxed">
              Halaman <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">{attemptedPath}</span> hanya dapat diakses oleh akun dengan hak akses <strong className="text-red-400">Administrator (Role: admin)</strong>.
            </p>

            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span>Peran Anda Saat Ini:</span>
                <span className="font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                  {currentRole === 'user' ? 'Regular User' : currentRole === 'guest' ? 'Tamu / Guest' : currentRole}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Izin Diperlukan:</span>
                <span className="font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                  Role: admin
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 pt-1 border-t border-slate-800/80">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Percobaan akses tanpa otorisasi telah dicatat ke dalam audit log keamanan.</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2">
              <Lock className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>
                Untuk mengakses Dashboard Admin, silakan masuk menggunakan akun khusus penguji: <br />
                <strong className="text-white">admin@wchess.com</strong> (Sandi: <strong className="text-white">AdminPassword123!</strong>).
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={onClose}
              className="w-full sm:flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Permainan
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
              className="w-full sm:flex-1 py-2.5 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Masuk Akun Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
