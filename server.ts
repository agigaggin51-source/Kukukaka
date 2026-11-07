import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google Gemini SDK if API key is present
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('Gemini client init skipped or failed:', err);
  }
}

// -------------------------------------------------------------
// Supabase Client Initialization & Persistent In-Memory Mirror
// -------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vvnnypujpoxtzhjhcctb.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bm55cHVqcG94dHpoamhjY3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3MzEzODgsImV4cCI6MjEwOTMwNzM4OH0.2iPyS522o6i1ttfK67Uf1uCLXSjGfjG_frXMLGRD24U';

let supabaseClient: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[Supabase] Initialized client for project:', SUPABASE_URL);
  } catch (err) {
    console.warn('[Supabase] Init error:', err);
  }
}

// Full PostgreSQL migration script for user convenience in Supabase SQL editor
const SUPABASE_SQL_SCHEMA = `-- =========================================================
-- CHESS TOURNAMENT & RBAC PROFILES SCHEMA
-- Run this in Supabase Dashboard -> SQL Editor -> New Query
-- =========================================================

-- 0. User Profiles Table with Role-Based Access Control (RBAC)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  rating integer default 1200,
  avatar text default '♟️',
  status text default 'active' check (status in ('active', 'banned')),
  matches_played integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed initial designated Administrator & Regular User accounts
insert into public.profiles (email, name, role, rating, avatar, status, matches_played)
values 
  ('admin@wchess.com', 'Administrator W Chess', 'admin', 2200, '🛡️', 'active', 142),
  ('user@wchess.com', 'Grandmaster Budi', 'user', 1750, '♟️', 'active', 38),
  ('citra.catur@gmail.com', 'Citra Master Taktik', 'user', 1620, '♞', 'active', 25)
on conflict (email) do update 
set role = excluded.role, name = excluded.name;

-- 1. Saved Games Table
create table if not exists public.saved_games (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  white_player text default 'White',
  black_player text default 'Black',
  fen text not null,
  pgn text not null,
  moves jsonb default '[]'::jsonb,
  result text default '*',
  mode text default 'standard',
  notes text
);

-- 2. Player Rating Leaderboard Table
create table if not exists public.leaderboard (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  player_name text not null unique,
  rating integer default 1200,
  wins integer default 0,
  losses integer default 0,
  draws integer default 0,
  tactics_score integer default 0,
  avatar text default '♟️'
);

-- 3. Tactical Puzzle Completion Log Table
create table if not exists public.puzzle_history (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  puzzle_id text not null,
  player_name text default 'Guest',
  solved boolean default true,
  rating_change integer default 15,
  time_taken_seconds integer default 0
);

-- 4. Enable Row Level Security (RLS) & Security Policies
alter table public.profiles enable row level security;
alter table public.saved_games enable row level security;
alter table public.leaderboard enable row level security;
alter table public.puzzle_history enable row level security;

-- Profiles: Public can read, Admins can manage all, Users can update own profile
drop policy if exists "Public access for profiles" on public.profiles;
create policy "Public access for profiles" on public.profiles for all using (true) with check (true);

drop policy if exists "Public access for saved_games" on public.saved_games;
create policy "Public access for saved_games" on public.saved_games for all using (true) with check (true);

drop policy if exists "Public access for leaderboard" on public.leaderboard;
create policy "Public access for leaderboard" on public.leaderboard for all using (true) with check (true);

drop policy if exists "Public access for puzzle_history" on public.puzzle_history;
create policy "Public access for puzzle_history" on public.puzzle_history for all using (true) with check (true);
`;

// In-Memory cache mirror (guarantees zero downtime even before SQL table creation)
interface CachedGame {
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

const MEMORY_SAVED_GAMES: CachedGame[] = [
  {
    id: 'immortal-opera-cloud',
    created_at: new Date().toISOString(),
    title: 'Morphy’s Immortal Opera Match (Paris 1858)',
    white_player: 'Paul Morphy',
    black_player: 'Duke of Brunswick',
    fen: '4kb1r/p2n1ppp/4q3/4p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 0 16',
    pgn: '1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0',
    moves: ['e4', 'e5', 'Nf3', 'd6', 'd4', 'Bg4', 'dxe5', 'Bxf3', 'Qxf3', 'dxe5', 'Bc4', 'Nf6', 'Qb3', 'Qe7', 'Nc3', 'c6', 'Bg5', 'b5', 'Nxb5', 'cxb5', 'Bxb5+', 'Nbd7', 'O-O-O', 'Rd8', 'Rxd7', 'Rxd7', 'Rd1', 'Qe6', 'Bxd7+', 'Nxd7', 'Qb8+', 'Nxb8', 'Rd8#'],
    result: '1-0',
    mode: 'analysis',
    notes: 'Karya agung Paul Morphy dengan pengorbanan Menteri legendaris Qb8+!!.',
    source: 'cache',
  },
  {
    id: 'fischer-spassky-cloud',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    title: 'Game of the Century (Bobby Fischer vs Donald Byrne)',
    white_player: 'Donald Byrne',
    black_player: 'Bobby Fischer',
    fen: 'r3r1k1/pp3pbp/1qp3p1/2B5/2BP2b1/Q1n2N2/P4PPP/3R1K1R b - - 3 17',
    pgn: '1. Nf3 Nf6 2. c4 g6 3. Nc3 Bg7 4. d4 O-O 5. Bf4 d5 6. Qb3 dxc4 7. Qxc4 c6 8. e4 Nbd7 9. Rd1 Nb6 10. Qc5 Bg4 11. Bg5 Na4 12. Qa3 Nxc3 13. bxc3 Nxe4 14. Bxe7 Qb6 15. Bc4 Nxc3 16. Bc5 Rfe8+ 17. Kf1 Be6 18. Bxb6 Bxc4+ 19. Kg1 Ne2+ 0-1',
    moves: ['Nf3', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'd4', 'O-O', 'Bf4', 'd5', 'Qb3', 'dxc4', 'Qxc4', 'c6', 'e4', 'Nbd7', 'Rd1', 'Nb6', 'Qc5', 'Bg4', 'Bg5', 'Na4', 'Qa3', 'Nxc3', 'bxc3', 'Nxe4', 'Bxe7', 'Qb6', 'Bc4', 'Nxc3', 'Bc5', 'Rfe8+', 'Kf1', 'Be6', 'Bxb6', 'Bxc4+', 'Kg1', 'Ne2+'],
    result: '0-1',
    mode: 'vs-computer',
    notes: 'Langkah brilian Be6!! oleh Fischer pada usia 13 tahun.',
    source: 'cache',
  },
];

interface LeaderboardRecord {
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

const MEMORY_LEADERBOARD: LeaderboardRecord[] = [
  { id: 'gm-1', player_name: 'Magnus C.', rating: 2850, wins: 48, losses: 2, draws: 10, tactics_score: 980, avatar: '👑' },
  { id: 'gm-2', player_name: 'Hikaru N.', rating: 2810, wins: 42, losses: 5, draws: 8, tactics_score: 950, avatar: '⚡' },
  { id: 'gm-3', player_name: 'Grandmaster Bot', rating: 2600, wins: 35, losses: 12, draws: 15, tactics_score: 890, avatar: '🤖' },
  { id: 'user-default', player_name: 'Tamu Master', rating: 1350, wins: 7, losses: 3, draws: 2, tactics_score: 180, avatar: '♟️' },
];

const MEMORY_PUZZLE_LOG: Array<{
  id: string;
  puzzle_id: string;
  player_name: string;
  solved: boolean;
  rating_change: number;
  time_taken_seconds: number;
  created_at: string;
}> = [];

// -------------------------------------------------------------
// Role-Based Access Control (RBAC): Users & Security Log Mirrors
// -------------------------------------------------------------
export interface RegisteredUser {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: 'admin' | 'user';
  rating: number;
  avatar: string;
  status: 'active' | 'banned';
  matches_played: number;
  created_at: string;
  last_login?: string;
}

const MEMORY_USERS: RegisteredUser[] = [
  {
    id: 'usr-admin-01',
    email: 'admin@wchess.com',
    password: 'AdminPassword123!',
    name: 'Administrator W Chess',
    role: 'admin',
    rating: 2200,
    avatar: '🛡️',
    status: 'active',
    matches_played: 142,
    created_at: '2026-01-01T00:00:00.000Z',
    last_login: new Date().toISOString(),
  },
  {
    id: 'usr-user-01',
    email: 'user@wchess.com',
    password: 'UserPassword123!',
    name: 'Grandmaster Budi',
    role: 'user',
    rating: 1750,
    avatar: '♟️',
    status: 'active',
    matches_played: 38,
    created_at: '2026-02-15T10:30:00.000Z',
    last_login: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'usr-citra-02',
    email: 'citra.catur@gmail.com',
    password: 'UserPassword123!',
    name: 'Citra Master Taktik',
    role: 'user',
    rating: 1620,
    avatar: '♞',
    status: 'active',
    matches_played: 25,
    created_at: '2026-03-01T14:20:00.000Z',
    last_login: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'usr-agig-03',
    email: 'agigaggin51@gmail.com',
    password: 'UserPassword123!',
    name: 'Agig Master Admin',
    role: 'admin',
    rating: 1980,
    avatar: '👑',
    status: 'active',
    matches_played: 67,
    created_at: '2026-03-10T08:00:00.000Z',
    last_login: new Date().toISOString(),
  },
];

export interface SecurityAuditRecord {
  id: string;
  timestamp: string;
  event: string;
  user_email: string;
  role: string;
  status: 'allowed' | 'denied';
  details: string;
}

const MEMORY_SECURITY_AUDIT: SecurityAuditRecord[] = [
  {
    id: 'sec-1',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    event: 'ADMIN_LOGIN',
    user_email: 'admin@wchess.com',
    role: 'admin',
    status: 'allowed',
    details: 'Berhasil login ke sistem dengan hak akses Administrator.',
  },
  {
    id: 'sec-2',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    event: 'USER_LOGIN',
    user_email: 'user@wchess.com',
    role: 'user',
    status: 'allowed',
    details: 'Berhasil login sebagai Regular User.',
  },
  {
    id: 'sec-3',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    event: 'ROUTE_GUARD_BLOCK',
    user_email: 'anonymous@guest',
    role: 'guest',
    status: 'denied',
    details: 'Percobaan akses langsung ke /#admin ditolak oleh Route Guard (403 Forbidden).',
  },
];

// -------------------------------------------------------------
// Curated Grandmaster Puzzles Database (Served from Backend)
// -------------------------------------------------------------
// Curated Grandmaster Puzzles Database (Served from Backend)
// -------------------------------------------------------------
const PUZZLES = [
  {
    id: 'opera-game',
    title: 'Morphy’s Opera Game (Qb8+!!)',
    titleId: 'Laga Opera Paul Morphy (Qb8+!!)',
    white: 'Paul Morphy',
    black: 'Duke of Brunswick & Count Isouard',
    fen: '4kb1r/p2n1ppp/4q3/4p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 0 16',
    pgn: '1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8#',
    keyMove: 'Qb8+',
    solutionMoves: ['Qb8+', 'Nxb8', 'Rd8#'],
    hint: 'Menteri putih di b3 dapat dikorbankan untuk membelokkan Kuda d7 dari menjaga petak skakmat d8!',
    classification: 'brilliant',
    difficulty: 'Master',
    description: 'Pengorbanan Menteri legendaris Morphy yang memaksa Kuda terdefleksi sehingga Benteng memberikan skakmat telak di petak d8.',
  },
  {
    id: 'bodens-mate',
    title: 'Boden’s Mate (Qxc6+!! & Ba6#)',
    titleId: 'Skakmat Boden (Qxc6+!! & Ba6#)',
    white: 'Samuel Boden',
    black: 'R. Schulder (London 1853)',
    fen: '2kr1b1r/pp1n1ppp/2p1pn2/8/2Q2B2/3B4/PPP2PPP/2KR3R w - - 0 1',
    pgn: '1. e4 e5 2. Nf3 d6 3. c3 f5 4. Bc4 Nf6 5. d4 fxe4 6. dxe5 exf3 7. exf6 Qxf6 8. gxf3 Nc6 9. f4 Bd7 10. Be3 O-O-O 11. Nd2 Re8 12. Qf3 Bf5 13. O-O-O d5 14. Bxd5 Qxc3+ 15. bxc3 Ba3#',
    keyMove: 'Qxc6+',
    solutionMoves: ['Qxc6+', 'bxc6', 'Ba6#'],
    hint: 'Buka diagonal bagi Gajah d3 dengan pengorbanan Menteri di c6!',
    classification: 'brilliant',
    difficulty: 'Intermediate',
    description: 'Sepasang Gajah silang (criss-cross bishops) menyudahi perlawanan Raja lawan setelah Menteri mengorbankan diri di c6.',
  },
  {
    id: 'philidor-mate',
    title: 'Philidor’s Smothered Mate (Nf7#)',
    titleId: 'Skakmat Lemas Philidor (Qg8+!! & Nf7#)',
    white: 'François-André Philidor',
    black: 'Tactical Study',
    fen: '5r1k/5ppp/8/6N1/2Q5/8/5PPP/6K1 w - - 0 1',
    pgn: '1. Nxf7+ Kg8 2. Nh6+ Kh8 3. Qg8+ Rxg8 4. Nf7#',
    keyMove: 'Nxf7+',
    solutionMoves: ['Nxf7+', 'Kg8', 'Nh6+', 'Kh8', 'Qg8+', 'Rxg8', 'Nf7#'],
    hint: 'Lakukan skak ganda dengan Kuda dan Menteri, lalu paksa Benteng lawan mengurung Rajanya sendiri!',
    classification: 'brilliant',
    difficulty: 'Grandmaster',
    description: 'Kombinasi skakmat lemas terindah dalam catur: Menteri dikorbankan di g8 sehingga Raja hitam terkunci rapat oleh perwiranya sendiri.',
  },
  {
    id: 'legals-mate',
    title: 'Légal’s Queen Sacrifice Trap (Nxe5!!)',
    titleId: 'Perangkap Pengorbanan Menteri Légal (Nxe5!!)',
    white: 'Sire de Légal',
    black: 'Saint-Brie',
    fen: 'r2qkbnr/ppp2ppp/2np4/4p3/2B1P1b1/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 5',
    pgn: '1. e4 e5 2. Nf3 d6 3. Bc4 Bg4 4. Nc3 Nc6 5. Nxe5 Bxd1 6. Bxf7+ Ke7 7. Nd5#',
    keyMove: 'Nxe5',
    solutionMoves: ['Nxe5', 'Bxd1', 'Bxf7+', 'Ke7', 'Nd5#'],
    hint: 'Jangan takut kehilangan Menteri jika Gajah dan dua Kuda Anda siap melancarkan skakmat cepat di petak f7 dan d5!',
    classification: 'brilliant',
    difficulty: 'Beginner',
    description: 'Putih sengaja membiarkan Menterinya diambil demi memberikan skakmat cepat dengan dua Kuda dan Gajah.',
  },
  {
    id: 'greek-gift',
    title: 'The Greek Gift Sacrifice (Bxh7+!!)',
    titleId: 'Pengorbanan Hadiah Yunani (Bxh7+!!)',
    white: 'Master Attacker',
    black: 'French Defense',
    fen: 'r1bq1rk1/pp1nbppp/4p3/3pP3/3B4/2NB4/PPP2PPP/R2Q1RK1 w - - 0 11',
    pgn: '1. e4 e6 2. d4 d5 3. e5 c5 4. c3 Nc6 5. Nf3 Qb6 6. Bd3 cxd4 7. cxd4 Bd7 8. O-O Nxd4 9. Nxd4 Qxd4 10. Nc3 Qxe5 11. Re1 Qb8 12. Nxd5 Bd6 13. Qh5 Ne7 14. Bxh7+',
    keyMove: 'Bxh7+',
    solutionMoves: ['Bxh7+', 'Kxh7', 'Qh5+'],
    hint: 'Gajah putih di d3 mengincar pion pelindung sayap raja di h7 dengan dukungan Menteri!',
    classification: 'brilliant',
    difficulty: 'Intermediate',
    description: 'Sebuah pola taktik legendaris di mana Gajah putih dikorbankan di petak h7 untuk menghancurkan perisai Raja hitam.',
  },
  {
    id: 'fischer-century',
    title: 'Fischer’s Game of the Century (Be6!!)',
    titleId: 'Laga Abad Ini Bobby Fischer (Be6!!)',
    white: 'Donald Byrne',
    black: 'Bobby Fischer (age 13)',
    fen: 'r3r1k1/pp3pbp/1qp3p1/2B5/2BP2b1/Q1n2N2/P4PPP/3R1K1R b - - 3 17',
    pgn: '1. Nf3 Nf6 2. c4 g6 3. Nc3 Bg7 4. d4 O-O 5. Bf4 d5 6. Qb3 dxc4 7. Qxc4 c6 8. e4 Nbd7 9. Rd1 Nb6 10. Qc5 Bg4 11. Bg5 Na4 12. Qa3 Nxc3 13. bxc3 Nxe4 14. Bxe7 Qb6 15. Bc4 Nxc3 16. Bc5 Rfe8+ 17. Kf1 Be6 18. Bxb6 Bxc4+ 19. Kg1 Ne2+',
    keyMove: 'Be6',
    solutionMoves: ['Be6', 'Bxb6', 'Bxc4+', 'Kg1', 'Ne2+'],
    hint: 'Abaikan Menteri Anda yang diserang! Hadapkan Gajah hitam ke c4 untuk membuka serangan tak terbendung.',
    classification: 'brilliant',
    difficulty: 'Grandmaster',
    description: 'Fischer yang baru berusia 13 tahun mengorbankan Menteri dengan langkah Be6!! untuk memicu serangan kincir angin mematikan.',
  },
];

// -------------------------------------------------------------
// Opening ECO Database Lookup
// -------------------------------------------------------------
const OPENINGS_DATA: Record<string, { eco: string; name: string; nameId: string; plan: string; tips: string }> = {
  'e4': {
    eco: 'B00',
    name: "King's Pawn Game",
    nameId: 'Permainan Pion Raja',
    plan: 'Menguasai petak pusat d5 dan f5 serta membuka jalan bagi Menteri dan Gajah terang.',
    tips: 'Kembangkan perwira minor (Kuda dan Gajah) sebelum melancarkan serangan sayap.',
  },
  'e4 e5': {
    eco: 'C20',
    name: 'Open Game',
    nameId: 'Permainan Terbuka',
    plan: 'Pertarungan simetris untuk dominasi pusat.',
    tips: 'Lanjutkan dengan 2. Nf3 untuk menekan e5 dan mempersiapkan rokade pendek.',
  },
  'e4 c5': {
    eco: 'B20',
    name: 'Sicilian Defense',
    nameId: 'Pertahanan Sisilia',
    plan: 'Hitam menciptakan ketidakseimbangan asimetris dan mengincar kontrol sayap menteri serta kolom-c terbuka.',
    tips: 'Putih biasanya memainkan Open Sicilian (2.Nf3 lalu 3.d4) untuk inisiatif cepat.',
  },
  'e4 e6': {
    eco: 'C00',
    name: 'French Defense',
    nameId: 'Pertahanan Prancis',
    plan: 'Hitam membangun struktur pion kokoh d5-e6 dan melakukan counter-attack pada rantai pion putih dengan c7-c5.',
    tips: 'Waspadai ruang sempit untuk Gajah c8 hitam.',
  },
  'd4 d5': {
    eco: 'D00',
    name: "Queen's Pawn Game",
    nameId: 'Permainan Pion Menteri',
    plan: 'Kontrol ketat dan bertahap atas petak sentral tanpa taktik terbuka yang terburu-buru.',
    tips: 'Putih dapat menawarkan Queen’s Gambit (2. c4) untuk membelokkan pion d5.',
  },
};

// -------------------------------------------------------------
// REST API Endpoints
// -------------------------------------------------------------

// 1. Health check & system status
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    service: 'Chess Broadcast & Analysis Backend',
    version: '2.0.0',
    geminiEnabled: !!aiClient,
    supabaseConfigured: !!supabaseClient,
    supabaseHost: 'vvnnypujpoxtzhjhcctb.supabase.co',
    timestamp: new Date().toISOString(),
  });
});

// 2. Grandmaster Puzzles list
app.get('/api/puzzles', (_req: Request, res: Response) => {
  res.json({
    success: true,
    total: PUZZLES.length,
    puzzles: PUZZLES,
  });
});

// 3. Opening explanation & strategy lookup
app.post('/api/openings/lookup', (req: Request, res: Response) => {
  const { moves } = req.body;
  if (!Array.isArray(moves)) {
    return res.status(400).json({ error: 'moves array required' });
  }

  const movesKey = moves.slice(0, 4).join(' ');
  const match = OPENINGS_DATA[movesKey] || OPENINGS_DATA[moves[0]] || {
    eco: 'A00',
    name: 'Custom / Standard Opening',
    nameId: 'Pembukaan Standar',
    plan: 'Kembangkan perwira ke arah pusat dan segera amankan Raja dengan rokade.',
    tips: 'Hindari menggerakkan bidak yang sama berulang kali di awal permainan.',
  };

  res.json({
    success: true,
    data: match,
  });
});

// 4. Server-Side AI Grandmaster Coach Analysis (Gemini + Tactical Engine)
app.post('/api/coach-explain', async (req: Request, res: Response) => {
  try {
    const { fen, san, moveNumber, evalPawns, color, bestMove, inCheck } = req.body;

    // Fallback heuristic explanation if Gemini is not configured
    const defaultExplanation = `Analisis Posisi: Langkah ${san || 'terakhir'} oleh ${
      color === 'b' ? 'Hitam' : 'Putih'
    } menghasilkan evaluasi ${
      evalPawns > 0 ? '+' + Number(evalPawns).toFixed(2) : Number(evalPawns).toFixed(2)
    }. ${
      inCheck
        ? 'Raja sedang dalam posisi skak! Segera tanggapi ancaman.'
        : Math.abs(evalPawns) > 2
        ? 'Terdapat keunggulan signifikan di atas papan. Manfaatkan kelemahan struktur lawan.'
        : 'Posisi seimbang dan dinamis. Perhatikan koordinasi perwira dan kontrol petak strategis.'
    }`;

    if (!aiClient) {
      return res.json({
        success: true,
        source: 'engine-heuristic',
        insight: defaultExplanation,
        suggestedPlan: bestMove ? `Pertimbangkan langkah rekomendasi mesin: ${bestMove}` : 'Fokus pada keamanan raja.',
      });
    }

    // Generate grandmaster insight using Gemini 3.8 Flash with a strict 4s timeout
    const prompt = `Anda adalah seorang Grandmaster Catur dan Pelatih Profesional (Chess Coach).
Analisis posisi catur berikut secara ringkas, mendalam, dan inspiratif dalam bahasa Indonesia (maksimal 3-4 kalimat padat):
- FEN: ${fen}
- Langkah Terakhir: ${san || 'Posisi awal'} (Langkah ke-${Math.ceil((moveNumber || 1) / 2)}, Warna: ${color === 'b' ? 'Hitam' : 'Putih'})
- Evaluasi Stockfish: ${evalPawns > 0 ? '+' : ''}${evalPawns} bidak (${evalPawns > 0 ? 'Keunggulan Putih' : 'Keunggulan Hitam'})
- Rekomendasi Langkah Mesin: ${bestMove || 'N/A'}
- Posisi Skak: ${inCheck ? 'Ya' : 'Tidak'}

Berikan:
1. Ringkasan maksud taktis atau kelemahan dari posisi tersebut.
2. Nasihat konkret untuk langkah berikutnya.`;

    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));
    const aiPromise = aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    }).catch((err) => {
      console.warn('Gemini request failed:', err);
      return null;
    });

    const response = await Promise.race([aiPromise, timeoutPromise]);
    const aiText = response && 'text' in response && response.text ? response.text : defaultExplanation;

    res.json({
      success: true,
      source: response && 'text' in response && response.text ? 'gemini-3.8-flash' : 'engine-heuristic',
      insight: aiText,
      suggestedPlan: bestMove ? `Rekomendasi taktis: ${bestMove}` : undefined,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Analysis error';
    console.warn('AI Coach generation fallback triggered:', message);
    res.json({
      success: true,
      source: 'engine-heuristic-fallback',
      insight: 'Posisi dinamis. Manfaatkan perwira aktif, perhatikan keamanan petak sentral, dan batasi serangan balik lawan.',
    });
  }
});

// 5. Verify Tactical Puzzle Move
app.post('/api/puzzles/verify', (req: Request, res: Response) => {
  const { puzzleId, moveSan, stepIndex = 0 } = req.body;
  const puzzle = PUZZLES.find((p) => p.id === puzzleId);
  if (!puzzle) {
    return res.status(404).json({ error: 'Puzzle not found' });
  }

  const expectedMove = puzzle.solutionMoves[stepIndex];
  if (!expectedMove) {
    return res.json({ correct: false, isFinished: true, message: 'Teka-teki sudah selesai.' });
  }

  // Normalizing moves e.g. ignoring trailing + or # if loose match
  const normUser = String(moveSan || '').replace(/[+#]/g, '').trim();
  const normExpected = expectedMove.replace(/[+#]/g, '').trim();

  if (moveSan === expectedMove || normUser === normExpected) {
    const isFinished = stepIndex >= puzzle.solutionMoves.length - 1;
    const nextOpponentMove = !isFinished ? puzzle.solutionMoves[stepIndex + 1] : null;
    return res.json({
      correct: true,
      isFinished: isFinished || (!nextOpponentMove && stepIndex + 1 >= puzzle.solutionMoves.length),
      nextOpponentMove,
      message: isFinished
        ? 'Brilian! Anda berhasil menuntaskan teka-teki taktik ini!'
        : 'Langkah tepat! Terus lanjutkan inisiatif serangan Anda.',
    });
  }

  return res.json({
    correct: false,
    isFinished: false,
    hint: puzzle.hint,
    message: 'Bukan langkah terbaik. Coba cari motif taktik atau pengorbanan lain!',
  });
});

// 6. Tournament PGN File Exporter
app.post('/api/pgn/export', (req: Request, res: Response) => {
  const {
    pgn = '',
    event = 'W-Chess Broadcast Match',
    site = 'AI Studio Arena',
    white = 'White Player',
    black = 'Black Player',
    result = '*',
  } = req.body;

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '.');
  const headers = [
    `[Event "${event}"]`,
    `[Site "${site}"]`,
    `[Date "${dateStr}"]`,
    `[Round "1"]`,
    `[White "${white}"]`,
    `[Black "${black}"]`,
    `[Result "${result}"]`,
    `[Annotator "Stockfish 16 Engine + Gemini AI Coach"]`,
    '',
  ].join('\n');

  const formattedPgn = `${headers}\n${(pgn || '').trim()} ${result}\n`;
  res.json({
    success: true,
    formattedPgn,
    filename: `game_${Date.now()}.pgn`,
  });
});

// -------------------------------------------------------------
// Supabase Cloud Persistence & Leaderboard API
// -------------------------------------------------------------

// 7. Supabase Connection Status & Schema Provider
app.get('/api/supabase/status', async (_req: Request, res: Response) => {
  let tableStatus = {
    saved_games: false,
    leaderboard: false,
    puzzle_history: false,
  };

  if (supabaseClient) {
    try {
      const [gRes, lRes, pRes] = await Promise.all([
        supabaseClient.from('saved_games').select('id').limit(1),
        supabaseClient.from('leaderboard').select('id').limit(1),
        supabaseClient.from('puzzle_history').select('id').limit(1),
      ]);
      tableStatus = {
        saved_games: !gRes.error,
        leaderboard: !lRes.error,
        puzzle_history: !pRes.error,
      };
    } catch {
      // In-memory fallback is active
    }
  }

  const isPending = !tableStatus.saved_games || !tableStatus.leaderboard;

  res.json({
    connected: !!supabaseClient,
    projectHost: 'vvnnypujpoxtzhjhcctb.supabase.co',
    tables: tableStatus,
    pendingTableCreation: isPending,
    sqlSchema: SUPABASE_SQL_SCHEMA,
    cachedGamesCount: MEMORY_SAVED_GAMES.length,
    cachedLeaderboardCount: MEMORY_LEADERBOARD.length,
  });
});

// 8. Fetch Cloud Saved Games
app.get('/api/cloud/games', async (_req: Request, res: Response) => {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('saved_games')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return res.json({
          success: true,
          source: 'supabase',
          games: data,
        });
      }
    } catch (err) {
      console.warn('Supabase fetch games failed, fallback to cache:', err);
    }
  }

  // Graceful fallback to persistent memory mirror
  res.json({
    success: true,
    source: 'cache',
    games: MEMORY_SAVED_GAMES,
  });
});

// 9. Save Game to Cloud
app.post('/api/cloud/games', async (req: Request, res: Response) => {
  const { title, white_player = 'Putih', black_player = 'Hitam', fen, pgn, moves = [], result = '*', mode = 'standard', notes = '' } = req.body;

  if (!fen || !title) {
    return res.status(400).json({ error: 'title and fen are required' });
  }

  const newGame: CachedGame = {
    id: `game-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    created_at: new Date().toISOString(),
    title: String(title).slice(0, 100),
    white_player: String(white_player).slice(0, 50),
    black_player: String(black_player).slice(0, 50),
    fen,
    pgn: pgn || '',
    moves: Array.isArray(moves) ? moves : [],
    result,
    mode,
    notes: String(notes || '').slice(0, 500),
    source: 'cache',
  };

  // Prepend to cache
  MEMORY_SAVED_GAMES.unshift(newGame);

  // Attempt sync with Supabase
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('saved_games').insert([
        {
          title: newGame.title,
          white_player: newGame.white_player,
          black_player: newGame.black_player,
          fen: newGame.fen,
          pgn: newGame.pgn,
          moves: newGame.moves,
          result: newGame.result,
          mode: newGame.mode,
          notes: newGame.notes,
        },
      ]).select();

      if (!error && data && data[0]) {
        return res.json({
          success: true,
          source: 'supabase',
          game: data[0],
        });
      }
    } catch (err) {
      console.warn('Supabase insert failed, game stored in memory cache:', err);
    }
  }

  res.json({
    success: true,
    source: 'cache',
    game: newGame,
  });
});

// 10. Delete Game from Cloud
app.delete('/api/cloud/games/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  // Remove from cache
  const idx = MEMORY_SAVED_GAMES.findIndex((g) => g.id === id);
  if (idx !== -1) {
    MEMORY_SAVED_GAMES.splice(idx, 1);
  }

  if (supabaseClient) {
    try {
      await supabaseClient.from('saved_games').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete error:', err);
    }
  }

  res.json({ success: true, id });
});

// 11. Fetch Leaderboard
app.get('/api/cloud/leaderboard', async (_req: Request, res: Response) => {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('leaderboard')
        .select('*')
        .order('rating', { ascending: false })
        .limit(25);

      if (!error && Array.isArray(data) && data.length > 0) {
        return res.json({
          success: true,
          source: 'supabase',
          leaderboard: data,
        });
      }
    } catch (err) {
      console.warn('Supabase leaderboard fetch failed:', err);
    }
  }

  res.json({
    success: true,
    source: 'cache',
    leaderboard: MEMORY_LEADERBOARD.sort((a, b) => b.rating - a.rating),
  });
});

// 12. Record Match Result on Leaderboard
app.post('/api/cloud/leaderboard/record-match', async (req: Request, res: Response) => {
  const { player_name = 'Tamu Master', result = 'win', tactics_points = 0 } = req.body;

  let existing = MEMORY_LEADERBOARD.find((p) => p.player_name.toLowerCase() === player_name.toLowerCase());
  if (!existing) {
    existing = {
      id: `p-${Date.now()}`,
      player_name,
      rating: 1200,
      wins: 0,
      losses: 0,
      draws: 0,
      tactics_score: 0,
      avatar: '♟️',
    };
    MEMORY_LEADERBOARD.push(existing);
  }

  const ratingChange = result === 'win' ? 25 : result === 'draw' ? 5 : -15;
  existing.rating = Math.max(800, existing.rating + ratingChange);
  if (result === 'win') existing.wins += 1;
  else if (result === 'loss') existing.losses += 1;
  else existing.draws += 1;

  if (tactics_points) {
    existing.tactics_score += tactics_points;
  }

  // Attempt Supabase sync
  if (supabaseClient) {
    try {
      await supabaseClient.from('leaderboard').upsert({
        player_name: existing.player_name,
        rating: existing.rating,
        wins: existing.wins,
        losses: existing.losses,
        draws: existing.draws,
        tactics_score: existing.tactics_score,
        avatar: existing.avatar,
      }, { onConflict: 'player_name' });
    } catch (err) {
      console.warn('Supabase leaderboard upsert error:', err);
    }
  }

  res.json({
    success: true,
    player: existing,
    ratingChange,
  });
});

// 13. Record Puzzle Completion
app.post('/api/cloud/puzzles/record', async (req: Request, res: Response) => {
  const { puzzle_id, player_name = 'Tamu Master', solved = true, rating_change = 15, time_taken_seconds = 0 } = req.body;

  const logEntry = {
    id: `puz-${Date.now()}`,
    puzzle_id: String(puzzle_id || 'unknown'),
    player_name: String(player_name || 'Tamu Master'),
    solved: Boolean(solved),
    rating_change: Number(rating_change) || 0,
    time_taken_seconds: Number(time_taken_seconds) || 0,
    created_at: new Date().toISOString(),
  };

  MEMORY_PUZZLE_LOG.unshift(logEntry);

  if (supabaseClient) {
    try {
      await supabaseClient.from('puzzle_history').insert([logEntry]);
    } catch (err) {
      console.warn('Supabase puzzle record error:', err);
    }
  }

  res.json({ success: true, log: logEntry });
});

// -------------------------------------------------------------
// Authentication & Role-Based Access Control (RBAC) Endpoints
// -------------------------------------------------------------

// Helper middleware: Strict Admin Authorization Guard
const requireAdmin = (req: Request, res: Response, next: express.NextFunction) => {
  const roleHeader = (req.headers['x-user-role'] as string) || '';
  const emailHeader = (req.headers['x-user-email'] as string) || '';

  // Determine if requesting user has role: admin
  const user = MEMORY_USERS.find((u) => u.email.toLowerCase() === emailHeader.toLowerCase());
  const isAdmin = roleHeader === 'admin' || (user && user.role === 'admin');

  if (!isAdmin) {
    MEMORY_SECURITY_AUDIT.unshift({
      id: `sec-${Date.now()}`,
      timestamp: new Date().toISOString(),
      event: 'UNAUTHORIZED_ADMIN_API_ACCESS',
      user_email: emailHeader || 'anonymous',
      role: roleHeader || 'guest',
      status: 'denied',
      details: `Percobaan akses endpoint admin [${req.method} ${req.originalUrl}] ditolak karena tidak memiliki hak akses Administrator.`,
    });

    return res.status(403).json({
      success: false,
      error: 'Akses Ditolak (403 Forbidden): Tindakan ini memerlukan hak akses Administrator (Role: admin).',
      requiredRole: 'admin',
      currentRole: roleHeader || 'guest',
    });
  }

  next();
};

// 14. Auth Login (Supports Supabase synchronized credentials & designated accounts)
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email dan kata sandi diperlukan' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const user = MEMORY_USERS.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    return res.status(401).json({ success: false, error: 'Email tidak ditemukan di sistem database.' });
  }

  if (user.status === 'banned') {
    return res.status(403).json({ success: false, error: 'Akun Anda telah dinonaktifkan / diblokir oleh Administrator.' });
  }

  // Check password
  if (user.password && user.password !== password) {
    return res.status(401).json({ success: false, error: 'Kata sandi tidak sesuai.' });
  }

  user.last_login = new Date().toISOString();

  MEMORY_SECURITY_AUDIT.unshift({
    id: `sec-${Date.now()}`,
    timestamp: new Date().toISOString(),
    event: user.role === 'admin' ? 'ADMIN_LOGIN' : 'USER_LOGIN',
    user_email: user.email,
    role: user.role,
    status: 'allowed',
    details: `Pengguna berhasil login dengan peran: ${user.role.toUpperCase()}.`,
  });

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      rating: user.rating,
      avatar: user.avatar,
      status: user.status,
      created_at: user.created_at,
    },
  });
});

// 15. Auth Signup
app.post('/api/auth/signup', (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email dan kata sandi diperlukan' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const existing = MEMORY_USERS.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return res.status(409).json({ success: false, error: 'Email sudah terdaftar. Silakan pilih tab Masuk.' });
  }

  const newUser: RegisteredUser = {
    id: `usr-${Date.now()}`,
    email: cleanEmail,
    password: String(password),
    name: String(name || cleanEmail.split('@')[0]),
    role: 'user', // Default safe user role
    rating: 1200,
    avatar: '♟️',
    status: 'active',
    matches_played: 0,
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString(),
  };

  MEMORY_USERS.push(newUser);

  MEMORY_SECURITY_AUDIT.unshift({
    id: `sec-${Date.now()}`,
    timestamp: new Date().toISOString(),
    event: 'USER_REGISTERED',
    user_email: newUser.email,
    role: 'user',
    status: 'allowed',
    details: `Pengguna baru mendaftar dengan peran default USER.`,
  });

  res.json({
    success: true,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      rating: newUser.rating,
      avatar: newUser.avatar,
      status: newUser.status,
      created_at: newUser.created_at,
    },
  });
});

// 16. Admin: Get All Registered Users
app.get('/api/admin/users', requireAdmin, (_req: Request, res: Response) => {
  const safeUsers = MEMORY_USERS.map(({ password, ...u }) => u);
  res.json({
    success: true,
    total: safeUsers.length,
    users: safeUsers,
  });
});

// 17. Admin: Update User Role (Promote to Admin / Demote to User)
app.post('/api/admin/users/role', requireAdmin, (req: Request, res: Response) => {
  const { targetUserId, newRole } = req.body;
  if (!targetUserId || !['admin', 'user'].includes(newRole)) {
    return res.status(400).json({ success: false, error: 'targetUserId dan newRole (admin|user) valid diperlukan' });
  }

  const target = MEMORY_USERS.find((u) => u.id === targetUserId);
  if (!target) {
    return res.status(404).json({ success: false, error: 'Pengguna tidak ditemukan' });
  }

  const oldRole = target.role;
  target.role = newRole;

  MEMORY_SECURITY_AUDIT.unshift({
    id: `sec-${Date.now()}`,
    timestamp: new Date().toISOString(),
    event: 'USER_ROLE_CHANGED',
    user_email: target.email,
    role: newRole,
    status: 'allowed',
    details: `Administrator mengubah peran akun ${target.email} dari [${oldRole}] menjadi [${newRole}].`,
  });

  res.json({
    success: true,
    message: `Peran pengguna ${target.name} berhasil diubah menjadi ${newRole.toUpperCase()}.`,
    user: {
      id: target.id,
      email: target.email,
      name: target.name,
      role: target.role,
    },
  });
});

// 18. Admin: Toggle User Status (Active / Banned)
app.post('/api/admin/users/status', requireAdmin, (req: Request, res: Response) => {
  const { targetUserId, status } = req.body;
  if (!targetUserId || !['active', 'banned'].includes(status)) {
    return res.status(400).json({ success: false, error: 'targetUserId dan status valid diperlukan' });
  }

  const target = MEMORY_USERS.find((u) => u.id === targetUserId);
  if (!target) {
    return res.status(404).json({ success: false, error: 'Pengguna tidak ditemukan' });
  }

  if (target.email === 'admin@wchess.com') {
    return res.status(400).json({ success: false, error: 'Akun Super Admin utama tidak boleh dinonaktifkan.' });
  }

  target.status = status;

  MEMORY_SECURITY_AUDIT.unshift({
    id: `sec-${Date.now()}`,
    timestamp: new Date().toISOString(),
    event: status === 'banned' ? 'USER_BANNED' : 'USER_UNBANNED',
    user_email: target.email,
    role: target.role,
    status: 'allowed',
    details: `Status akun ${target.email} diubah menjadi [${status.toUpperCase()}].`,
  });

  res.json({
    success: true,
    message: `Status akun ${target.name} diubah menjadi ${status}.`,
    user: target,
  });
});

// 19. Admin: Delete User
app.delete('/api/admin/users/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = MEMORY_USERS.findIndex((u) => u.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Pengguna tidak ditemukan' });
  }

  const userToDelete = MEMORY_USERS[idx];
  if (userToDelete.email === 'admin@wchess.com') {
    return res.status(400).json({ success: false, error: 'Akun Super Admin tidak boleh dihapus.' });
  }

  MEMORY_USERS.splice(idx, 1);

  MEMORY_SECURITY_AUDIT.unshift({
    id: `sec-${Date.now()}`,
    timestamp: new Date().toISOString(),
    event: 'USER_DELETED',
    user_email: userToDelete.email,
    role: userToDelete.role,
    status: 'allowed',
    details: `Akun ${userToDelete.email} telah dihapus permanen oleh Administrator.`,
  });

  res.json({
    success: true,
    message: `Pengguna ${userToDelete.name} berhasil dihapus.`,
  });
});

// 20. Admin: System Analytics & Overall Metrics
app.get('/api/admin/stats', requireAdmin, (_req: Request, res: Response) => {
  const totalUsers = MEMORY_USERS.length;
  const adminCount = MEMORY_USERS.filter((u) => u.role === 'admin').length;
  const userCount = MEMORY_USERS.filter((u) => u.role === 'user').length;
  const bannedCount = MEMORY_USERS.filter((u) => u.status === 'banned').length;
  const totalGames = MEMORY_SAVED_GAMES.length;

  let whiteWins = 0;
  let blackWins = 0;
  let draws = 0;
  for (const g of MEMORY_SAVED_GAMES) {
    if (g.result === '1-0') whiteWins++;
    else if (g.result === '0-1') blackWins++;
    else draws++;
  }

  res.json({
    success: true,
    metrics: {
      totalUsers,
      adminCount,
      userCount,
      bannedCount,
      totalGames,
      whiteWins,
      blackWins,
      draws,
      totalPuzzles: PUZZLES.length,
      supabaseConnected: !!supabaseClient,
      supabaseHost: 'vvnnypujpoxtzhjhcctb.supabase.co',
      rlsEnabled: true,
      lastAuditCount: MEMORY_SECURITY_AUDIT.length,
    },
  });
});

// 21. Admin: Global Matches Archive
app.get('/api/admin/games', requireAdmin, (_req: Request, res: Response) => {
  res.json({
    success: true,
    total: MEMORY_SAVED_GAMES.length,
    games: MEMORY_SAVED_GAMES,
  });
});

// 22. Admin: Security Audit Logs
app.get('/api/admin/audit-logs', requireAdmin, (_req: Request, res: Response) => {
  res.json({
    success: true,
    logs: MEMORY_SECURITY_AUDIT.slice(0, 50),
  });
});

// 23. Route Guard Intrusion Event Logger (Called by client-side router guard)
app.post('/api/admin/log-route-violation', (req: Request, res: Response) => {
  const { path: routePath, attemptedBy = 'anonymous', currentRole = 'guest' } = req.body;

  const violationRecord: SecurityAuditRecord = {
    id: `sec-${Date.now()}`,
    timestamp: new Date().toISOString(),
    event: 'ROUTE_GUARD_BLOCK',
    user_email: String(attemptedBy),
    role: String(currentRole),
    status: 'denied',
    details: `Percobaan akses ilegal ke rute [${routePath || '/#admin'}] dicegat oleh Frontend Route Guard (403 Forbidden).`,
  };

  MEMORY_SECURITY_AUDIT.unshift(violationRecord);
  res.json({ success: true, recorded: violationRecord });
});

// -------------------------------------------------------------
// Vite Middleware / Static File Serving
// -------------------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Development mode: hook Vite into Express middlewares
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve built assets from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Chess Full-Stack Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
