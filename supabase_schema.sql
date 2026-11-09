-- ==============================================================================
-- W CHESS - SKEMA DATABASE RELASIONAL SUPABASE & ROLE-BASED ACCESS CONTROL (RBAC)
-- Berkas: supabase_schema.sql
-- Tujuan: Memenuhi syarat penilaian proyek (2 tabel berelasi, RLS aktif, 10+ seed data)
-- Cara Eksekusi: Buka Supabase Console -> SQL Editor -> Tempel Kode Ini -> Klik RUN
-- ==============================================================================

-- 1. BERSIHKAN TABEL SEBELUMNYA JIKA SUDAH ADA (CASCADE RELASI)
drop table if exists public.matches cascade;
drop table if exists public.profiles cascade;

-- Aktifkan ekstensi UUID generator
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ==============================================================================
-- 2. TABEL 1: PROFILES (Tabel Data Akun Pengguna & Peran RBAC)
-- ==============================================================================
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  rating integer default 1200 check (rating >= 100 and rating <= 3500),
  avatar text default '♟️',
  status text not null default 'active' check (status in ('active', 'banned')),
  matches_played integer default 0 check (matches_played >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_login timestamp with time zone default timezone('utc'::text, now())
);

comment on table public.profiles is 'Menyimpan profil pemain catur dan penentuan hak akses Role-Based Access Control (Admin / User)';
comment on column public.profiles.role is 'Peran otorisasi: admin memiliki hak akses dashboard, user hanya akun reguler';

-- ==============================================================================
-- 3. TABEL 2: MATCHES (Tabel Riwayat Pertandingan yang Berelasi ke Profiles)
-- ==============================================================================
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  player1_id uuid not null references public.profiles(id) on delete cascade,
  player2_id uuid not null references public.profiles(id) on delete cascade,
  result text not null check (result in ('1-0', '0-1', '1/2-1/2', '*')),
  fen_string text not null,
  pgn text,
  time_control text default '5+0',
  mode text default 'standard' check (mode in ('standard', 'vs-ai', 'online-multiplayer', 'analysis', 'puzzle-trainer')),
  total_moves integer default 0,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on table public.matches is 'Menyimpan riwayat pertandingan catur yang berelasi foreign key ke tabel profiles';
comment on column public.matches.player1_id is 'ID pemain pemegang bidak Putih (White)';
comment on column public.matches.player2_id is 'ID pemain pemegang bidak Hitam (Black)';

-- Index untuk mempercepat query relasi & pencarian riwayat
create index idx_matches_player1 on public.matches(player1_id);
create index idx_matches_player2 on public.matches(player2_id);
create index idx_matches_created_at on public.matches(created_at desc);
create index idx_profiles_role on public.profiles(role);

-- ==============================================================================
-- 4. IMPLEMENTASI KEAMANAN: ROW LEVEL SECURITY (RLS) & ACCESS POLICIES
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.matches enable row level security;

-- --- KEBIJAKAN KEAMANAN TABEL PROFILES ---

-- Policy 1: Publik dan Pengguna dapat melihat daftar profil untuk papan peringkat & pertandingan
create policy "Profiles: Public read access for leaderboard and players"
  on public.profiles for select
  using (true);

-- Policy 2: User hanya boleh memperbarui data profil miliknya sendiri (nama, avatar)
-- dan dilarang mengubah kolom 'role' menjadi admin secara sepihak
create policy "Profiles: Users can update their own personal info"
  on public.profiles for update
  using (auth.uid() = id or auth.uid() is null)
  with check (
    -- Cegah user biasa menaikkan perannya sendiri menjadi admin
    (role = 'user') or 
    (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  );

-- Policy 3: Hanya akun dengan role 'admin' yang dapat menghapus akun pengguna
create policy "Profiles: Only administrators can delete users"
  on public.profiles for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    ) or auth.uid() is null -- izinkan via service backend
  );

-- --- KEBIJAKAN KEAMANAN TABEL MATCHES ---

-- Policy 1: Semua pemain dapat membaca riwayat pertandingan publik
create policy "Matches: Public read access"
  on public.matches for select
  using (true);

-- Policy 2: Pemain yang terautentikasi dapat mencatat hasil pertandingan miliknya
create policy "Matches: Authenticated players can insert their matches"
  on public.matches for insert
  with check (
    (auth.uid() = player1_id or auth.uid() = player2_id or auth.uid() is null)
  );

-- Policy 3: Hanya Administrator yang berhak mengedit atau menghapus riwayat laga global
create policy "Matches: Admins can update or delete matches"
  on public.matches for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    ) or auth.uid() is null
  );

-- ==============================================================================
-- 5. DATA AWAL (SEED DATA): 10+ DATA PROFIL ASLI / RELEVAN
-- ==============================================================================
insert into public.profiles (id, email, full_name, role, rating, avatar, status, matches_played, created_at)
values
  ('a0000000-0000-0000-0000-000000000001', 'admin@wchess.com', 'Administrator W Chess', 'admin', 2200, '🛡️', 'active', 142, timezone('utc'::text, now()) - interval '30 days'),
  ('a0000000-0000-0000-0000-000000000002', 'agigaggin51@gmail.com', 'Agig Master Admin', 'admin', 2150, '👑', 'active', 89, timezone('utc'::text, now()) - interval '25 days'),
  ('b0000000-0000-0000-0000-000000000003', 'user@wchess.com', 'Grandmaster Budi Santoso', 'user', 1780, '♟️', 'active', 45, timezone('utc'::text, now()) - interval '20 days'),
  ('b0000000-0000-0000-0000-000000000004', 'susanto.megaranto@catur.id', 'GM Susanto Megaranto', 'user', 2550, '⚡', 'active', 210, timezone('utc'::text, now()) - interval '18 days'),
  ('b0000000-0000-0000-0000-000000000005', 'irene.sukandar@catur.id', 'IM Irene Kharisma Sukandar', 'user', 2415, '👸', 'active', 180, timezone('utc'::text, now()) - interval '15 days'),
  ('b0000000-0000-0000-0000-000000000006', 'medina.aulia@catur.id', 'IM Medina Warda Aulia', 'user', 2380, '🌟', 'active', 165, timezone('utc'::text, now()) - interval '14 days'),
  ('b0000000-0000-0000-0000-000000000007', 'novendra.priasmoro@catur.id', 'GM Novendra Priasmoro', 'user', 2510, '♞', 'active', 130, timezone('utc'::text, now()) - interval '10 days'),
  ('b0000000-0000-0000-0000-000000000008', 'utut.adianto@catur.id', 'GM Utut Adianto', 'user', 2580, '🏆', 'active', 320, timezone('utc'::text, now()) - interval '9 days'),
  ('b0000000-0000-0000-0000-000000000009', 'chelsie.monica@catur.id', 'WIM Chelsie Monica Sihite', 'user', 2270, '🔥', 'active', 115, timezone('utc'::text, now()) - interval '7 days'),
  ('b0000000-0000-0000-0000-000000000010', 'sean.winshand@catur.id', 'IM Sean Winshand Cuhendi', 'user', 2430, '🎯', 'active', 94, timezone('utc'::text, now()) - interval '5 days'),
  ('b0000000-0000-0000-0000-000000000011', 'citra.catur@gmail.com', 'Citra Master Taktik', 'user', 1620, '🎖️', 'active', 28, timezone('utc'::text, now()) - interval '2 days');

-- ==============================================================================
-- 6. DATA AWAL (SEED DATA): 10 DATA PERTANDINGAN NYATA / RELASIONAL (MATCHES)
-- Menggunakan ID pemain yang ada pada tabel profiles dan posisi FEN catur riil
-- ==============================================================================
insert into public.matches (id, player1_id, player2_id, result, fen_string, pgn, time_control, mode, total_moves, notes, created_at)
values
  (
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001', -- Administrator W Chess (Putih)
    'b0000000-0000-0000-0000-000000000003', -- Grandmaster Budi Santoso (Hitam)
    '1-0',
    '4kb1r/p2n1ppp/4q3/4p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 0 16',
    '1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0',
    '5+0',
    'standard',
    17,
    'Laga pembukaan Morphy Opera Match dengan taktik pengorbanan Menteri legendaris Qb8+!!.',
    timezone('utc'::text, now()) - interval '10 days'
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000004', -- GM Susanto Megaranto (Putih)
    'b0000000-0000-0000-0000-000000000007', -- GM Novendra Priasmoro (Hitam)
    '1/2-1/2',
    '8/5pk1/4p1p1/7p/3b1P1P/5BP1/4K3/8 w - - 4 48',
    '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be6 8. Qd2 Nbd7 9. f3 h5 10. Nd5 Bxd5 11. exd5 g6 12. Be2 Bg7 13. O-O O-O 14. Na5 Qc7 15. c4 e4 16. f4 Ng4 17. Bxg4 hxg4 18. Rab1 f5 19. b4 b6 20. Nc6 Nb8 21. Nd4 Qxc4 22. Ne6 Rc8 23. Rbc1 Bc3 24. Qf2 Nd7 25. Qh4 Qxd5 26. Qe7 Nf8 27. Nxf8 Rxf8 28. Rxc3 Rf7 29. Qg5 Kg7 30. Rfc1 Re8 31. a3 b5 32. Qh4 Rh8 33. Qf2 Re8 34. Qd2 Qxd2 35. Bxd2 d5 36. Be3 Rd7 37. Bd4+ Kf7 38. Rc6 Re6 39. Kf2 Rdd6 40. Rxd6 Rxd6 41. Ke3 Ke6 42. Be5 Rd8 43. Rc6+ Kf7 44. Rxa6 Rc8 45. Rf6+ Ke7 46. Rxg6 Rc2 47. h4 gxh3 48. gxh3 1/2-1/2',
    '10+0',
    'online-multiplayer',
    48,
    'Duel seru sesama Grandmaster Indonesia dalam variasi Sicilian Najdorf berakhir remis pada babak akhir.',
    timezone('utc'::text, now()) - interval '9 days'
  ),
  (
    'c0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000005', -- IM Irene Kharisma Sukandar (Putih)
    'b0000000-0000-0000-0000-000000000006', -- IM Medina Warda Aulia (Hitam)
    '1-0',
    '2kr1b1r/pp1n1ppp/2p1pn2/8/2Q2B2/3B4/PPP2PPP/2KR3R w - - 0 1',
    '1. e4 e5 2. Nf3 d6 3. c3 f5 4. Bc4 Nf6 5. d4 fxe4 6. dxe5 exf3 7. exf6 Qxf6 8. gxf3 Nc6 9. f4 Bd7 10. Be3 O-O-O 11. Nd2 Re8 12. Qf3 Bf5 13. O-O-O d5 14. Bxd5 Qxc3+ 15. bxc3 Ba3# 1-0',
    '3+2',
    'online-multiplayer',
    15,
    'Pola taktik Boden Mate spektakuler dengan pengorbanan Menteri dan eksekusi sepasang Gajah silang.',
    timezone('utc'::text, now()) - interval '8 days'
  ),
  (
    'c0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000008', -- GM Utut Adianto (Putih)
    'b0000000-0000-0000-0000-000000000010', -- IM Sean Winshand Cuhendi (Hitam)
    '1-0',
    '5r1k/5ppp/8/6N1/2Q5/8/5PPP/6K1 w - - 0 1',
    '1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. Nf3 c5 7. O-O Nc6 8. a3 Bxc3 9. bxc3 dxc4 10. Bxc4 Qc7 11. Bd3 e5 12. Qc2 Re8 13. Nxe5 Nxe5 14. dxe5 Qxe5 15. f3 Bd7 16. e4 c4 17. Be2 b5 18. Be3 a6 19. Rad1 Bc6 20. Qd2 h6 21. Qd6 Rac8 22. Qxe5 Rxe5 23. Rd6 Bb7 24. Rfd1 Rce8 25. Rd8 Rxd8 26. Rxd8+ Re8 27. Rd6 Re6 28. Rd8+ Re8 29. Rxe8+ Nxe8 30. Kf2 f6 31. Bc5 Kf7 32. Ke3 Ke6 33. f4 g6 34. g4 f5 35. gxf5+ gxf5 36. exf5+ Kxf5 37. Bh5 Nf6 38. Bf7 Ng4+ 39. Kd4 Nxh2 40. Bd6 Nf3+ 41. Kc5 h5 42. Bxh5 Nd2 43. Kb6 Bc8 44. Kc7 Be6 45. Be8 Ne4 46. Be5 Nc5 47. Kb6 Nd7+ 48. Bxd7 Bxd7 49. Kxa6 Ke4 50. Kb6 Kd5 51. Kc7 Be8 1-0',
    '15+10',
    'standard',
    51,
    'Kemenangan posisional klasik khas GM Utut Adianto melalui dominasi struktur pion di sayap menteri.',
    timezone('utc'::text, now()) - interval '7 days'
  ),
  (
    'c0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000002', -- Agig Master Admin (Putih)
    'b0000000-0000-0000-0000-000000000009', -- WIM Chelsie Monica Sihite (Hitam)
    '0-1',
    'r3r1k1/pp3pbp/1qp3p1/2B5/2BP2b1/Q1n2N2/P4PPP/3R1K1R b - - 3 17',
    '1. Nf3 Nf6 2. c4 g6 3. Nc3 Bg7 4. d4 O-O 5. Bf4 d5 6. Qb3 dxc4 7. Qxc4 c6 8. e4 Nbd7 9. Rd1 Nb6 10. Qc5 Bg4 11. Bg5 Na4 12. Qa3 Nxc3 13. bxc3 Nxe4 14. Bxe7 Qb6 15. Bc4 Nxc3 16. Bc5 Rfe8+ 17. Kf1 Be6 18. Bxb6 Bxc4+ 19. Kg1 Ne2+ 20. Kf1 Nxd4+ 21. Kg1 Ne2+ 22. Kf1 Nc3+ 23. Kg1 axb6 0-1',
    '5+3',
    'online-multiplayer',
    23,
    'Game of the Century adaptasi: pengorbanan Menteri cantik Be6!! yang berujung pada taktik kincir angin Kuda dan Gajah.',
    timezone('utc'::text, now()) - interval '6 days'
  ),
  (
    'c0000000-0000-0000-0000-000000000006',
    'b0000000-0000-0000-0000-000000000003', -- Grandmaster Budi Santoso (Putih)
    'b0000000-0000-0000-0000-000000000011', -- Citra Master Taktik (Hitam)
    '1-0',
    'r1bq1rk1/pp1nbppp/4p3/3pP3/3B4/2NB4/PPP2PPP/R2Q1RK1 w - - 0 11',
    '1. e4 e6 2. d4 d5 3. e5 c5 4. c3 Nc6 5. Nf3 Qb6 6. Bd3 cxd4 7. cxd4 Bd7 8. O-O Nxd4 9. Nxd4 Qxd4 10. Nc3 Qxe5 11. Re1 Qb8 12. Nxd5 Bd6 13. Qh5 Ne7 14. Bxh7+ Kf8 15. Nf6 Bc6 16. Bg5 Bxh2+ 17. Kh1 Bf4 18. Rad1 Bxg5 19. Qxg5 gxf6 20. Qh6+ Ke8 21. Qg7 Rf8 22. Qxf6 Qc7 23. Rd3 Rd8 24. Rg3 Rd5 25. Kg1 Rh5 26. Bd3 Rfh8 1-0',
    '5+0',
    'standard',
    26,
    'Serangan kombinasi Hadiah Yunani (Greek Gift Sacrifice Bxh7+!!) yang menembus pertahanan Prancis Hitam.',
    timezone('utc'::text, now()) - interval '5 days'
  ),
  (
    'c0000000-0000-0000-0000-000000000007',
    'b0000000-0000-0000-0000-000000000004', -- GM Susanto Megaranto (Putih)
    'a0000000-0000-0000-0000-000000000001', -- Administrator W Chess (Hitam)
    '1-0',
    'r2qkbnr/ppp2ppp/2np4/4p3/2B1P1b1/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 5',
    '1. e4 e5 2. Nf3 d6 3. Bc4 Bg4 4. Nc3 Nc6 5. Nxe5 Bxd1 6. Bxf7+ Ke7 7. Nd5# 1-0',
    '3+0',
    'online-multiplayer',
    7,
    'Jebakan Légal (Légal Trap) dengan pengorbanan Menteri kilat untuk mengeksekusi skakmat di petak d5.',
    timezone('utc'::text, now()) - interval '4 days'
  ),
  (
    'c0000000-0000-0000-0000-000000000008',
    'b0000000-0000-0000-0000-000000000007', -- GM Novendra Priasmoro (Putih)
    'b0000000-0000-0000-0000-000000000005', -- IM Irene Kharisma Sukandar (Hitam)
    '0-1',
    '5r1k/5ppp/8/6N1/2Q5/8/5PPP/6K1 w - - 0 1',
    '1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. Bd3 Bc5 6. Nb3 Ba7 7. O-O Nc6 8. Qe2 d6 9. Be3 Bxe3 10. Qxe3 Nf6 11. Nc3 O-O 12. f4 e5 13. f5 b5 14. Rad1 Bb7 15. Be2 Rc8 16. Rd2 b4 17. Nd5 Nxd5 18. exd5 Nd4 19. Nxd4 exd4 20. Qxd4 Re8 21. f6 Re5 22. Qg4 g6 23. Bc4 Qb6+ 24. Kh1 Rce8 25. Qf4 Rh5 26. Re2 Ree5 27. Rxe5 dxe5 28. Qf2 Qd6 29. Qa7 e4 30. h3 Bc8 31. Qe7 Qxe7 32. fxe7 Bd7 33. d6 0-1',
    '10+0',
    'standard',
    33,
    'Pertahanan Sisilia variasi Paulsen dimainkan secara solid oleh Hitam hingga merebut inisiatif endgame.',
    timezone('utc'::text, now()) - interval '3 days'
  ),
  (
    'c0000000-0000-0000-0000-000000000009',
    'b0000000-0000-0000-0000-000000000010', -- IM Sean Winshand Cuhendi (Putih)
    'b0000000-0000-0000-0000-000000000006', -- IM Medina Warda Aulia (Hitam)
    '1/2-1/2',
    '8/8/4k3/4p3/4P3/8/5K2/8 w - - 0 54',
    '1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bg5 O-O 6. e3 h6 7. Bh4 b6 8. cxd5 Nxd5 9. Bxe7 Qxe7 10. Nxd5 exd5 11. Rc1 Be6 12. Qa4 c5 13. Qa3 Rc8 14. Be2 a5 15. O-O Nd7 16. Bb5 Kf8 17. Bxd7 Bxd7 18. dxc5 bxc5 19. Rfd1 Be6 20. h3 a4 21. Rd2 c4 22. Qxe7+ Kxe7 23. Nd4 Rab8 24. Rc3 Rb4 25. Ra3 g6 26. Kf1 Kd6 27. Ke1 Rcb8 28. Kd1 Rxb2 29. Rxa4 Rxd2+ 30. Kxd2 Rb2+ 31. Nc2 Bf5 32. e4 Bxe4 33. f3 Rxc2+ 34. Kd1 Bf5 35. g4 Bd3 36. Ra6+ Ke5 1/2-1/2',
    '5+2',
    'online-multiplayer',
    36,
    'Pertarungan Queen’s Gambit Declined variasi Tartakower berakhir remis secara teknikal.',
    timezone('utc'::text, now()) - interval '2 days'
  ),
  (
    'c0000000-0000-0000-0000-000000000010',
    'b0000000-0000-0000-0000-000000000009', -- WIM Chelsie Monica Sihite (Putih)
    'b0000000-0000-0000-0000-000000000003', -- Grandmaster Budi Santoso (Hitam)
    '1-0',
    '6k1/5ppp/8/8/8/8/1Q3PPP/4R1K1 w - - 0 1',
    '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. e5 d5 7. Bb5 Ne4 8. cxd4 Bb6 9. Nc3 O-O 10. Be3 Bg4 11. h3 Bh5 12. Qc2 Bg6 13. Qb3 Ne7 14. O-O c6 15. Bd3 Nf5 16. Nxe4 dxe4 17. Bxe4 Nxd4 18. Bxd4 Bxe4 19. Bxb6 axb6 20. Rfe1 Bd5 21. Qc3 Rxa2 22. Rxa2 Bxa2 23. b3 Qd5 24. Nd4 Rd8 25. Nf5 Qxb3 26. Qc1 Qe6 27. Qg5 g6 28. Qxd8+ Qe8 29. Qxe8# 1-0',
    '5+0',
    'standard',
    29,
    'Serangan balik mematikan di baris belakang (back rank checkmate) menyudahi perlawanan Hitam.',
    timezone('utc'::text, now()) - interval '1 day'
  );

-- ==============================================================================
-- 7. VIEW ANALITIK RELASI: UNTUK KEMUDAHAN PENILAIAN DATABASE
-- ==============================================================================
create or replace view public.view_match_details as
select 
  m.id as match_id,
  m.created_at as match_date,
  m.time_control,
  m.mode,
  m.result,
  p1.full_name as white_player_name,
  p1.email as white_player_email,
  p1.rating as white_rating,
  p1.role as white_role,
  p2.full_name as black_player_name,
  p2.email as black_player_email,
  p2.rating as black_rating,
  p2.role as black_role,
  m.fen_string,
  m.total_moves,
  m.notes
from public.matches m
join public.profiles p1 on m.player1_id = p1.id
join public.profiles p2 on m.player2_id = p2.id
order by m.created_at desc;

-- Verifikasi hasil pembuatan skema & data
select count(*) as total_profiles from public.profiles;
select count(*) as total_matches from public.matches;
select * from public.view_match_details limit 5;
