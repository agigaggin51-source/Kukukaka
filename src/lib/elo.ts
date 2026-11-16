/**
 * Elo Rating System & Supabase Integration for W Chess
 * 
 * Rules:
 * - Pemain baru mulai dari 400 Elo (DEFAULT_STARTING_ELO = 400).
 * - Elo < 1000: Penambahan +50 poin setiap menang (akselerasi pemula).
 * - Elo >= 1000: Penambahan disesuaikan dinamis antara 15 - 25 poin per kemenangan.
 *   Setiap 100 poin di atas 1000 mengurangi gain sebanyak 1 poin (floor minimum +15).
 * - Fungsi sinkronisasi langsung ke tabel 'profiles' di Supabase.
 */

import { getSupabase } from './supabaseClient';

export const DEFAULT_STARTING_ELO = 400;

/**
 * Menghitung besaran poin Elo yang didapat saat pemain menang
 */
export function calculateEloGain(currentElo: number): number {
  if (currentElo < 1000) {
    return 50; // +50 poin untuk Elo < 1000
  }
  // Dinamis antara 15 - 25 poin untuk Elo >= 1000
  const scalingFactor = Math.floor((currentElo - 1000) / 100);
  return Math.max(15, 25 - scalingFactor);
}

/**
 * Fungsi untuk menghitung rating Elo baru saat pemain MENANG
 */
export function calculateEloOnWin(currentElo: number): number {
  const eloGain = calculateEloGain(currentElo);
  const newElo = currentElo + eloGain;
  console.log(`[Elo Live] Lama: ${currentElo} | Menang! (+${eloGain} Elo) | Baru: ${newElo}`);
  return newElo;
}

/**
 * Fungsi untuk menghitung pengurangan rating Elo saat pemain KALAH
 * Default pengurangan 15 poin (batas minimum 100 Elo)
 */
export function calculateEloOnLoss(currentElo: number): number {
  const eloLoss = 15;
  const newElo = Math.max(100, currentElo - eloLoss);
  console.log(`[Elo Live] Lama: ${currentElo} | Kalah! (-${eloLoss} Elo) | Baru: ${newElo}`);
  return newElo;
}

/**
 * Fungsi untuk menghitung rating Elo saat pemain REMIS / DRAW
 * Default penambahan 5 poin
 */
export function calculateEloOnDraw(currentElo: number): number {
  const eloGain = 5;
  const newElo = currentElo + eloGain;
  console.log(`[Elo Live] Lama: ${currentElo} | Remis! (+${eloGain} Elo) | Baru: ${newElo}`);
  return newElo;
}

/**
 * Mengupdate nilai Elo pengguna langsung ke tabel 'profiles' di Supabase
 */
export async function updateUserEloInSupabase(
  userId: string,
  newElo: number
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!userId) {
    return { success: false, error: 'User ID tidak valid' };
  }

  // 1. Update sesi lokal terlebih dahulu agar UI instan dan reaktif
  try {
    const stored = localStorage.getItem('wchess_auth_user');
    if (stored) {
      const user = JSON.parse(stored);
      if (user.id === userId) {
        user.rating = newElo;
        localStorage.setItem('wchess_auth_user', JSON.stringify(user));
      }
    }
  } catch {
    // Ignore localStorage error
  }

  // 2. Update langsung ke database Supabase
  const client = getSupabase();
  if (!client) {
    console.warn('[Supabase] Klien belum siap, rating tersimpan di sesi lokal.');
    return { success: true, error: 'Tersimpan lokal (klien offline)' };
  }

  try {
    const { data, error } = await client
      .from('profiles')
      .update({
        rating: newElo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('[Supabase] Gagal mengupdate rating di tabel profiles:', error.message);
      return { success: false, error: error.message };
    }

    console.log(`[Supabase] ✅ Berhasil update Elo user ${userId} -> ${newElo}`, data);
    return { success: true, data };
  } catch (err: any) {
    const message = err instanceof Error ? err.message : 'Kesalahan jaringan Supabase';
    console.error('[Supabase] Exception saat update Elo:', message);
    return { success: false, error: message };
  }
}
