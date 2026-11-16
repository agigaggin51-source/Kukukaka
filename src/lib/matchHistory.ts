/**
 * Match History & Supabase 'matches' Table Synchronization for W Chess
 */

import { getSupabase } from './supabaseClient';

export interface MatchRecordPayload {
  id?: string;
  player1_id: string; // ID/UUID pemain Putih
  player2_id: string; // ID/UUID pemain Hitam
  status?: 'ongoing' | 'completed' | 'abandoned';
  result: '1-0' | '0-1' | '1/2-1/2' | '*';
  fen: string;
  pgn?: string;
  time_control?: string;
  mode?: string;
  total_moves?: number;
  notes?: string;
}

export interface SaveMatchResponse {
  success: boolean;
  match?: any;
  error?: string;
  source: 'supabase' | 'local_cache';
}

/**
 * Menyimpan status pertandingan catur ke tabel 'matches' di Supabase.
 * Dilengkapi dengan fallback cache lokal dan kompatibilitas skema (kolom fen / fen_string).
 */
export async function saveMatchToSupabase(payload: MatchRecordPayload): Promise<SaveMatchResponse> {
  const client = getSupabase();
  const matchId = payload.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `m-${Date.now()}`);

  const record: Record<string, any> = {
    id: matchId,
    player1_id: payload.player1_id,
    player2_id: payload.player2_id,
    status: payload.status || (payload.result === '*' ? 'ongoing' : 'completed'),
    result: payload.result,
    fen: payload.fen,
    fen_string: payload.fen, // Fallback untuk nama kolom alternatif di PostgreSQL
    pgn: payload.pgn || '',
    time_control: payload.time_control || '5+0',
    mode: payload.mode || 'online-1v1',
    total_moves: payload.total_moves || 0,
    created_at: new Date().toISOString(),
  };

  // 1. Simpan backup instan ke localStorage agar data tidak hilang jika jaringan terputus
  try {
    const cached = JSON.parse(localStorage.getItem('wchess_matches_cache') || '[]');
    const existingIndex = cached.findIndex((m: any) => m.id === matchId);
    if (existingIndex >= 0) {
      cached[existingIndex] = record;
    } else {
      cached.unshift(record);
    }
    localStorage.setItem('wchess_matches_cache', JSON.stringify(cached.slice(0, 50)));
  } catch {
    // Abaikan error localStorage
  }

  // 2. Jika klien Supabase belum tersedia, kembalikan hasil cache lokal
  if (!client) {
    return {
      success: true,
      match: record,
      source: 'local_cache',
      error: 'Klien Supabase offline, riwayat disimpan di cache lokal.',
    };
  }

  // 3. Simpan langsung ke database Supabase tabel 'matches'
  try {
    const { data, error } = await client
      .from('matches')
      .upsert(record, { onConflict: 'id' })
      .select();

    if (error) {
      console.warn('[Supabase matches] Upsert penuh gagal, mencoba payload selektif:', error.message);
      // Coba payload minimalis sesuai skema standar (id, player1_id, player2_id, result, fen_string)
      const minimalRecord = {
        id: matchId,
        player1_id: payload.player1_id,
        player2_id: payload.player2_id,
        result: payload.result,
        fen_string: payload.fen,
        created_at: record.created_at,
      };

      const retryRes = await client.from('matches').upsert(minimalRecord, { onConflict: 'id' }).select();
      if (retryRes.error) {
        throw retryRes.error;
      }

      console.log('[Supabase matches] ✅ Berhasil disimpan dengan skema selektif:', retryRes.data?.[0]);
      return {
        success: true,
        match: retryRes.data?.[0] || minimalRecord,
        source: 'supabase',
      };
    }

    console.log('[Supabase matches] ✅ Berhasil disimpan ke Supabase:', data?.[0]);
    return {
      success: true,
      match: data?.[0] || record,
      source: 'supabase',
    };
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : (typeof err === 'object' ? JSON.stringify(err) : String(err));
    console.warn('[Supabase matches] Gagal sinkronisasi remote, riwayat tetap aman di cache lokal:', msg);
    return {
      success: true,
      match: record,
      source: 'local_cache',
      error: msg,
    };
  }
}
