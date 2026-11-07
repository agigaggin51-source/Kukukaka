import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables or fallback to user-provided credentials
export const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  'https://vvnnypujpoxtzhjhcctb.supabase.co';

export const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bm55cHVqcG94dHpoamhjY3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3MzEzODgsImV4cCI6MjEwOTMwNzM4OH0.2iPyS522o6i1ttfK67Uf1uCLXSjGfjG_frXMLGRD24U';

export interface CloudSavedGame {
  id: string;
  created_at: string;
  title: string;
  white_player: string;
  black_player: string;
  fen: string;
  pgn: string;
  moves: string[];
  result: string;
  mode: string;
  notes?: string;
  source?: 'supabase' | 'cache';
}

export interface CloudPlayerScore {
  id: string;
  created_at?: string;
  player_name: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  tactics_score: number;
  avatar: string;
}

export interface SupabaseStatusInfo {
  connected: boolean;
  projectHost: string;
  tables: {
    saved_games: boolean;
    leaderboard: boolean;
    puzzle_history: boolean;
  };
  sqlSchema: string;
  pendingTableCreation?: boolean;
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;
  try {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      return supabaseInstance;
    }
  } catch (err) {
    console.warn('Failed to init client-side Supabase client:', err);
  }
  return null;
}

// -----------------------------------------------------------------------
// Supabase Authentication Service
// -----------------------------------------------------------------------

export type UserRole = 'admin' | 'user';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  rating?: number;
  status?: 'active' | 'banned';
  created_at?: string;
}

export interface AdminUserRecord {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  rating: number;
  avatar: string;
  status: 'active' | 'banned';
  matches_played: number;
  created_at: string;
  last_login?: string;
}

export interface AdminStatsMetrics {
  totalUsers: number;
  adminCount: number;
  userCount: number;
  bannedCount: number;
  totalGames: number;
  whiteWins: number;
  blackWins: number;
  draws: number;
  totalPuzzles: number;
  supabaseConnected: boolean;
  supabaseHost: string;
  rlsEnabled: boolean;
  lastAuditCount: number;
}

export interface SecurityAuditEntry {
  id: string;
  timestamp: string;
  event: string;
  user_email: string;
  role: string;
  status: 'allowed' | 'denied';
  details: string;
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  // First check localStorage for persistent session
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('wchess_auth_user');
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile;
        if (parsed && parsed.id && parsed.email) {
          return parsed;
        }
      }
    } catch {
      // Ignore json parse error
    }
  }

  const client = getSupabase();
  if (!client) return null;

  try {
    const { data: { session } } = await client.auth.getSession();
    if (!session || !session.user) return null;

    const user = session.user;
    const meta = user.user_metadata || {};
    const name = meta.full_name || meta.name || user.email?.split('@')[0] || 'Grandmaster';
    
    // Determine role (default to admin for designated admin emails or metadata)
    const isAdminEmail = user.email?.toLowerCase() === 'admin@wchess.com' || user.email?.toLowerCase() === 'agigaggin51@gmail.com';
    const role: UserRole = (isAdminEmail || meta.role === 'admin') ? 'admin' : 'user';

    const profile: UserProfile = {
      id: user.id,
      email: user.email || '',
      name,
      role,
      avatar: meta.avatar || (role === 'admin' ? '🛡️' : '♟️'),
      rating: meta.rating || 1500,
      status: 'active',
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('wchess_auth_user', JSON.stringify(profile));
    }

    return profile;
  } catch (err) {
    console.warn('Error fetching current user:', err);
    return null;
  }
}

export async function signInWithEmail(email: string, password: string): Promise<{ user: UserProfile | null; error: string | null }> {
  const cleanEmail = email.trim().toLowerCase();

  // Try backend auth endpoint first (handles designated accounts & database mirror)
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password }),
    });

    const data = await res.json();
    if (res.ok && data.success && data.user) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('wchess_auth_user', JSON.stringify(data.user));
      }
      return { user: data.user, error: null };
    }
    if (!res.ok && data.error && !data.error.includes('tidak ditemukan')) {
      return { user: null, error: data.error };
    }
  } catch (backendErr) {
    console.warn('Backend login attempt failed, trying Supabase auth direct:', backendErr);
  }

  // Fallback to direct Supabase Auth
  const client = getSupabase();
  if (!client) return { user: null, error: 'Klien Supabase belum siap' };

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      let msg = error.message;
      if (msg.includes('Invalid login credentials')) {
        msg = 'Email atau kata sandi tidak valid.';
      } else if (msg.includes('Email not confirmed')) {
        msg = 'Email belum dikonfirmasi. Periksa kotak masuk/spam Anda.';
      }
      return { user: null, error: msg };
    }

    if (data.user) {
      const meta = data.user.user_metadata || {};
      const name = meta.full_name || meta.name || data.user.email?.split('@')[0] || 'Grandmaster';
      const isAdminEmail = data.user.email?.toLowerCase() === 'admin@wchess.com' || data.user.email?.toLowerCase() === 'agigaggin51@gmail.com';
      const role: UserRole = (isAdminEmail || meta.role === 'admin') ? 'admin' : 'user';

      const userProfile: UserProfile = {
        id: data.user.id,
        email: data.user.email || '',
        name,
        role,
        avatar: meta.avatar || (role === 'admin' ? '🛡️' : '♟️'),
        rating: meta.rating || 1500,
        status: 'active',
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('wchess_auth_user', JSON.stringify(userProfile));
      }

      return {
        user: userProfile,
        error: null,
      };
    }

    return { user: null, error: 'Gagal mengautentikasi pengguna.' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
    return { user: null, error: message };
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName?: string
): Promise<{ user: UserProfile | null; error: string | null; needsEmailConfirmation?: boolean }> {
  const cleanEmail = email.trim().toLowerCase();

  // Try backend signup first
  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password, name: fullName }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.user) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('wchess_auth_user', JSON.stringify(data.user));
      }
      return { user: data.user, error: null, needsEmailConfirmation: false };
    }
    if (!res.ok && data.error) {
      return { user: null, error: data.error };
    }
  } catch {
    // Fall back to Supabase client
  }

  const client = getSupabase();
  if (!client) return { user: null, error: 'Klien Supabase belum siap' };

  try {
    const { data, error } = await client.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: fullName || cleanEmail.split('@')[0],
          avatar: '♟️',
          role: 'user', // Default safe regular user role
        },
      },
    });

    if (error) {
      let msg = error.message;
      if (msg.includes('User already registered')) {
        msg = 'Email ini sudah terdaftar. Silakan pilih tab Masuk.';
      } else if (msg.includes('Password should be at least')) {
        msg = 'Kata sandi minimal harus 6 karakter.';
      }
      return { user: null, error: msg };
    }

    if (data.user) {
      const meta = data.user.user_metadata || {};
      const name = meta.full_name || fullName || data.user.email?.split('@')[0] || 'Grandmaster';
      const userProfile: UserProfile = {
        id: data.user.id,
        email: data.user.email || '',
        name,
        role: 'user',
        avatar: meta.avatar || '♟️',
        rating: 1200,
        status: 'active',
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('wchess_auth_user', JSON.stringify(userProfile));
      }

      const needsConfirmation = !data.session;
      return {
        user: userProfile,
        error: null,
        needsEmailConfirmation: needsConfirmation,
      };
    }

    return { user: null, error: 'Gagal mendaftar pengguna.' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat mendaftar';
    return { user: null, error: message };
  }
}

export async function signOutUser(): Promise<{ error: string | null }> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('wchess_auth_user');
    } catch {
      // ignore
    }
  }

  const client = getSupabase();
  if (!client) return { error: null };

  try {
    const { error } = await client.auth.signOut();
    return { error: error ? error.message : null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal keluar akun';
    return { error: message };
  }
}

// -----------------------------------------------------------------------
// Admin RBAC API Service Helpers
// -----------------------------------------------------------------------

export async function fetchAdminUsers(userRole: string, userEmail: string): Promise<AdminUserRecord[]> {
  try {
    const res = await fetch('/api/admin/users', {
      headers: {
        'x-user-role': userRole,
        'x-user-email': userEmail,
      },
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.users || [];
  } catch (err) {
    console.warn('Failed to fetch admin users:', err);
    return [];
  }
}

export async function updateUserRole(
  targetUserId: string,
  newRole: UserRole,
  userRole: string,
  userEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/users/role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': userRole,
        'x-user-email': userEmail,
      },
      body: JSON.stringify({ targetUserId, newRole }),
    });
    const data = await res.json();
    return { success: res.ok && data.success, error: data.error };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

export async function updateUserStatus(
  targetUserId: string,
  status: 'active' | 'banned',
  userRole: string,
  userEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/users/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': userRole,
        'x-user-email': userEmail,
      },
      body: JSON.stringify({ targetUserId, status }),
    });
    const data = await res.json();
    return { success: res.ok && data.success, error: data.error };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

export async function deleteUserAccount(
  targetUserId: string,
  userRole: string,
  userEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(targetUserId)}`, {
      method: 'DELETE',
      headers: {
        'x-user-role': userRole,
        'x-user-email': userEmail,
      },
    });
    const data = await res.json();
    return { success: res.ok && data.success, error: data.error };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

export async function fetchAdminStats(userRole: string, userEmail: string): Promise<AdminStatsMetrics | null> {
  try {
    const res = await fetch('/api/admin/stats', {
      headers: {
        'x-user-role': userRole,
        'x-user-email': userEmail,
      },
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.metrics || null;
  } catch (err) {
    console.warn('Failed to fetch admin stats:', err);
    return null;
  }
}

export async function fetchGlobalMatches(userRole: string, userEmail: string): Promise<CloudSavedGame[]> {
  try {
    const res = await fetch('/api/admin/games', {
      headers: {
        'x-user-role': userRole,
        'x-user-email': userEmail,
      },
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.games || [];
  } catch (err) {
    console.warn('Failed to fetch global games:', err);
    return [];
  }
}

export async function fetchAdminAuditLogs(userRole: string, userEmail: string): Promise<SecurityAuditEntry[]> {
  try {
    const res = await fetch('/api/admin/audit-logs', {
      headers: {
        'x-user-role': userRole,
        'x-user-email': userEmail,
      },
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.logs || [];
  } catch (err) {
    console.warn('Failed to fetch audit logs:', err);
    return [];
  }
}

export async function logRouteViolation(attemptedPath: string, attemptedBy: string, currentRole: string): Promise<void> {
  try {
    await fetch('/api/admin/log-route-violation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: attemptedPath,
        attemptedBy,
        currentRole,
      }),
    });
  } catch (err) {
    console.warn('Failed to report route violation:', err);
  }
}

// -----------------------------------------------------------------------
// Cloud API Service Calls (Proxied through backend for resilience)
// -----------------------------------------------------------------------

export async function fetchSupabaseStatus(): Promise<SupabaseStatusInfo> {
  try {
    const res = await fetch('/api/supabase/status');
    if (!res.ok) throw new Error('Status request failed');
    return await res.json();
  } catch (err) {
    return {
      connected: !!SUPABASE_URL,
      projectHost: 'vvnnypujpoxtzhjhcctb.supabase.co',
      tables: { saved_games: false, leaderboard: false, puzzle_history: false },
      sqlSchema: '',
      pendingTableCreation: true,
    };
  }
}

export async function fetchCloudGames(): Promise<CloudSavedGame[]> {
  try {
    const res = await fetch('/api/cloud/games');
    if (!res.ok) throw new Error('Fetch games failed');
    const data = await res.json();
    return data.games || [];
  } catch (err) {
    console.warn('Error fetching cloud games:', err);
    return [];
  }
}

export async function saveGameToCloud(game: Omit<CloudSavedGame, 'id' | 'created_at'>): Promise<CloudSavedGame | null> {
  try {
    const res = await fetch('/api/cloud/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(game),
    });
    if (!res.ok) throw new Error('Save game failed');
    const data = await res.json();
    return data.game || null;
  } catch (err) {
    console.warn('Error saving game to cloud:', err);
    return null;
  }
}

export async function deleteCloudGame(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/cloud/games/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('Error deleting cloud game:', err);
    return false;
  }
}

export async function fetchLeaderboard(): Promise<CloudPlayerScore[]> {
  try {
    const res = await fetch('/api/cloud/leaderboard');
    if (!res.ok) throw new Error('Fetch leaderboard failed');
    const data = await res.json();
    return data.leaderboard || [];
  } catch (err) {
    console.warn('Error fetching leaderboard:', err);
    return [];
  }
}

export async function recordMatchResult(payload: {
  player_name: string;
  result: 'win' | 'loss' | 'draw';
  opponent: string;
  tactics_points?: number;
}): Promise<CloudPlayerScore | null> {
  try {
    const res = await fetch('/api/cloud/leaderboard/record-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.player || null;
  } catch (err) {
    console.warn('Error recording match:', err);
    return null;
  }
}

export async function recordPuzzleSolved(payload: {
  puzzle_id: string;
  player_name: string;
  solved: boolean;
  rating_change: number;
  time_taken_seconds?: number;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/cloud/puzzles/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.warn('Error recording puzzle:', err);
    return false;
  }
}
