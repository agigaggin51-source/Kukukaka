# LAPORAN PROYEK PENGEMBANGAN APLIKASI WEB
# "W CHESS"
## APLIKASI WEB CATUR INTERAKTIF BERBASIS ENGINE STOCKFISH & SUPABASE REALTIME

---

* **Mata Pelajaran / Bidang Keahlian** : Rekayasa Perangkat Lunak & Pengembangan Aplikasi Web (Full-Stack Web Development)
* **Topik Penilaian** : Aplikasi Web Interaktif, Integrasi Relasional Database, Keamanan Row Level Security (RLS), Role-Based Access Control (RBAC), dan Komunikasi Real-time.
* **Platform Deployment** : Google Cloud AI Studio / Google Cloud Run
* **Tahun / Periode** : 2026

---

## 1. JUDUL PROYEK
> **Aplikasi Web Catur Interaktif 'W Chess' berbasis Engine Stockfish & Supabase Realtime**

---

## 2. PENDAHULUAN & LATAR BELAKANG

### 2.1 Latar Belakang
Catur merupakan salah satu olahraga kecerdasan tertua dan terpopuler di dunia. Di era transformasi digital, cara masyarakat mempelajari, memainkan, dan menganalisis permainan catur telah bergeser dari papan fisik ke platform berbasis web. Namun, banyak platform catur yang ada saat ini menghadapi sejumlah kendala teknis, khususnya ketika diakses melalui perangkat seluler (*mobile browser*):
1. **Antarmuka Kurang Responsif**: Daftar langkah (*move list*) sering kali memiliki kontras warna yang rendah, tata letak terpotong, atau tidak ramah layar sentuh.
2. **Kelemahan Logika Bot Catur Standar**: Pada fase akhir permainan (*endgame*), bot catur sederhana sering kali melakukan langkah berulang (*shuffle loop*) dan gagal mengeksekusi skakmat (*forced checkmate*) meskipun posisi sudah sangat unggul (+5.0 atau *mate in N*).
3. **Proses Ulasan Pertandingan (*Game Review*) yang Lambat**: Analisis mesin catur tradisional sering kali memakan waktu puluhan detik hingga hitungan menit karena menghitung ulang seluruh posisi dari nol tanpa memanfaatkan data *cache*.
4. **Kompleksitas Multiplayer Online**: Memerlukan pengaturan server perantara yang rumit dengan latensi tinggi untuk sekadar bertanding 1 lawan 1 antar-teman.

Untuk mengatasi permasalahan tersebut, proyek **"W Chess"** dikembangkan sebagai aplikasi web catur modern, ringan, responsif, dan kaya fitur yang dapat diakses dengan mulus dari peramban desktop maupun ponsel pintar tanpa perlu memasang aplikasi tambahan.

### 2.2 Tujuan Proyek
Tujuan utama dari pengembangan proyek aplikasi web W Chess adalah:
1. Membangun antarmuka catur 2D bertema klasik (*Staunton Style*) yang bersih, berestetika tinggi, dan sangat nyaman dibaca di layar HP maupun monitor komputer.
2. Mengintegrasikan mesin catur legendaris **Stockfish 16** dengan optimasi logika taktik agar bot langsung mengeksekusi skakmat saat posisi menang.
3. Menyediakan fitur **Game Review instan** (selesai dalam 2–3 detik) dengan metrik persentase akurasi (%) dan klasifikasi langkah (*Brilliant*, *Great*, *Best*, *Inaccuracy*, *Mistake*, *Blunder*).
4. Menyediakan fitur **Multiplayer Online 1v1 Real-time** dengan sistem kode room (*room code*) menggunakan **Supabase Realtime WebSocket Channels**.
5. Menerapkan kontrol akses berbasis peran (**Role-Based Access Control / RBAC**) yang memisahkan hak akses antara **Administrator** dan **Regular User** dengan perlindungan **Row Level Security (RLS)** di Supabase dan **Route Guard** di sisi frontend.

### 2.3 Batasan Masalah
- Aplikasi dibangun dalam bentuk Single Page Application (SPA) berbasis React dan TypeScript.
- Basis data dan otentikasi menggunakan layanan Supabase Cloud (PostgreSQL 15) dengan *fallback in-memory mirror* di backend Node.js untuk menjamin keandalan tanpa henti (*zero-downtime*).
- Engine catur dijalankan melalui arsitektur multi-thread Web Worker di sisi peramban klien agar tidak membebani komputasi server.

---

## 3. FITUR UTAMA APLIKASI

### 3.1 Papan & Bidak Catur Klasik (Staunton Style 2D)
* **Desain Visual Vektor Minimalis**: Set bidak 2D bergaya *Staunton Classic Wood* dengan garis tepi yang tegas, kontras warna tinggi, serta siluet khas yang proporsional (Raja dengan salib mahkota, Gajah dengan sudut kupasan, dan Kuda berkepala khas).
* **Pilihan Tema Papan**: Mendukung skema papan catur kayu klasik (*Warm Wood*), hijau turnamen resmi (*Classic Green*), dan marmer gelap (*Dark Marble*).
* **Move List Berkontras Tinggi**: Panel daftar langkah dilengkapi kontras warna terang (#FFFFFF dan hijau emerald #4ADE80), tinggi minimum (*min-height*), dan fitur *auto-scroll* sehingga tidak pernah terpotong pada layar ponsel.

### 3.2 Autentikasi Pengguna & Database Cloud (Supabase Auth & PostgreSQL)
* **Registrasi & Login**: Mendukung pendaftaran akun baru, login via email dan kata sandi, serta login cepat sebagai Tamu Arena.
* **Sinkronisasi Otomatis**: Menyimpan profil pemain, nilai rating ELO, riwayat pertandingan (*match history*), dan catatan skor teka-teki taktik ke cloud database.
* **Tombol Akses Cepat Penguji**: Disediakan tombol 1-klik untuk akun Administrator (`admin@wchess.com`) dan akun Regular User (`user@wchess.com`) guna mempermudah proses penilaian.

### 3.3 Kontrol Akses Berbasis Peran (RBAC) & Dashboard Admin
* **Pemisahan Peran Tegas**:
  * **Role `admin`**: Memiliki hak akses penuh ke Dashboard Administrator, mampu mempromosikan/menurunkan peran pengguna (*Promote/Demote*), memblokir/membuka blokir akun (*Ban/Unban*), menghapus akun, serta melihat arsip laga global dan jejak audit keamanan (*Security Audit Trail*).
  * **Role `user`**: Akun reguler yang berfokus memainkan catur, melihat riwayat pribadi, dan tidak memiliki akses ke fungsi administratif.
* **Perlindungan Rute (Route Guard 403 Forbidden)**: Jika akun non-admin atau pengguna tamu mencoba membuka rute `#admin` secara langsung, router otomatis mencegat, menampilkan modal **"403 Forbidden - Akses Ditolak"**, membersihkan URL, dan mencatat pelanggaran ke database audit.
* **Antarmuka Dinamis**: Tombol navigasi Dashboard Admin hanya dirender di antarmuka pengguna jika pengguna terautentikasi sebagai administrator.

### 3.4 Mode AI / Bot Catur Stockfish (Endgame & Checkmate Priority)
* **Pilihan Level Kesulitan**: Level 1 (Pemula) hingga Level 5 (Grandmaster).
* **Perbaikan Logika Endgame**: Mengatasi masalah langkah berulang (*shuffle loop*) pada bot dengan menerapkan penjelajahan taktik skakmat (*forced mate check*). Ketika evaluasi posisi telah unggul signifikan (di atas +5.0 atau *mate in N*), bot memprioritaskan penyudutan raja lawan dan eksekusi skakmat instan.

### 3.5 Game Review & Analisis Catur Cepat (Instan 2–3 Detik)
* **Analisis Cepat**: Kedalaman analisis pasca-pertandingan dioptimalkan (kedalaman *fast depth* 8–10 per langkah atau maksimal 50ms per langkah) sehingga evaluasi seluruh laga tuntas dalam waktu 2–3 detik.
* **Evaluasi Berbasis Cache**: Menggunakan data evaluasi yang sudah dihitung selama permainan berlangsung (*live evaluation cache*) untuk menghindari kalkulasi ulang dari awal.
* **Indikator Progres**: Menampilkan persentase dan progres langkah berjalan (contoh: *"Menganalisis langkah 14/38..."*).
* **Metrik Akurasi & Klasifikasi Langkah**: Menampilkan persentase akurasi pemain Putih dan Hitam, kurva momentum keunggulan (*Advantage Swing Curve*), serta klasifikasi langkah:
  * 💎 **Brilliant (!!)**: Pengorbanan perwira cerdas yang menghasilkan posisi menang mutlak.
  * 🟢 **Great (!)**: Satu-satunya langkah terbaik yang mempertahankan inisiatif.
  * ★ **Best**: Langkah terkuat rekomendasi engine.
  * 🟡 **Inaccuracy (?!)**: Langkah suboptimal yang sedikit mengurangi keunggulan.
  * 🟠 **Mistake (?)**: Langkah salah yang membuang tempo atau posisi.
  * 🔴 **Blunder (??)**: Kesalahan fatal yang membalikkan hasil pertandingan.

### 3.6 Mode Multiplayer Online 1v1 Real-time (Supabase Realtime)
* **Kode Room Unik**: Pemain dapat membuat room baru dengan kode room instan (contoh: `WCH-8K2M`) atau bergabung ke room teman dengan memasukkan kode.
* **Sinkronisasi Dua Arah Tanpa Lag**: Pergerakan bidak disinkronkan secara langsung melalui kanal *Supabase Broadcast Channel*.
* **Jam Catur Sinkron & Deteksi Selesai**: Penghitung waktu (*clock timer*) kedua pemain berjalan sinkron, lengkap dengan deteksi otomatis skakmat (*Checkmate*), waktu habis (*Flagged*), remis (*Draw*), dan opsi Menyerah (*Resign*) atau Tanding Ulang (*Rematch*).

### 3.7 Fitur Pendukung Lainnya
* **Teka-teki Taktik Grandmaster (Puzzle Trainer)**: Kumpulan studi taktik klasik dunia seperti *Morphy Opera Game (Qb8+!!)*, *Boden's Mate*, *Philidor's Mate*, dan *Game of the Century*.
* **Editor Papan (Board Editor)**: Membantu pengguna menyusun posisi bidak bebas dan mengekspor/mengimpor kode FEN (*Forsyth-Edwards Notation*).
* **Ekspor Dokumen PGN**: Mengunduh catatan notasi pertandingan resmi lengkap dengan tag FIDE Tournament.

---

## 4. ARSITEKTUR SISTEM & TEKNOLOGI (TECH STACK)

### 4.1 Diagram Arsitektur Perangkat Lunak
```
+-----------------------------------------------------------------------+
|                           KLIEN (FRONTEND)                            |
|  React 18 SPA + TypeScript + Vite + Tailwind CSS + Lucide Icons       |
|                                                                       |
|  +--------------------+  +-------------------+  +-------------------+ |
|  |     ChessBoard     |  |   Engine Worker   |  |   Supabase SDK    | |
|  |  (Staunton Vector) |  |   (Stockfish 16)  |  |  (Auth & Realtime)| |
|  +--------------------+  +-------------------+  +-------------------+ |
|            |                       |                      |           |
+------------|-----------------------|----------------------|-----------+
             |                       |                      |
             v                       v                      v
+------------------------+  +------------------+  +---------------------+
|   PROXY SERVER (API)   |  |  LOCAL STORAGE   |  |   SUPABASE CLOUD    |
|   Node.js + Express    |  |  Session Cache   |  |  - Auth (JWT Token) |
|   (REST Endpoints)     |  +------------------+  |  - PostgreSQL 15 DB |
|                        |                        |  - Row Level Sec.   |
|   - /api/admin/*       |                        |  - Realtime WS      |
|   - /api/auth/*        |                        |    Broadcast        |
|   - /api/puzzles       |                        +---------------------+
+------------------------+                                   |
             |                                               |
             v                                               v
+-----------------------------------------------------------------------+
|                 INFRASTRUKTUR & KEAMANAN SISTEM                       |
|  - Google Cloud Platform (Containerized Service)                      |
|  - PostgreSQL Foreign Key Constraint & Indexing                       |
|  - Route Guard & RBAC Policy Enforcement                              |
+-----------------------------------------------------------------------+
```

### 4.2 Rincian Teknologi
| Komponen | Teknologi | Keterangan & Peran |
| :--- | :--- | :--- |
| **User Interface (UI)** | React 18, Tailwind CSS | Membangun antarmuka modular, modern, responsif, dan bebas gaya usang (*zero-pill*). |
| **Bahasa Pemrograman** | TypeScript, JavaScript ES6+ | Memberikan *type-safety* tinggi, meminimalkan *runtime error*, dan kode bersih. |
| **Build Tool & Bundler** | Vite 6 | Memungkinkan kompilasi cepat dan performa aset ringan. |
| **Logic & Engine Catur** | `chess.js`, Stockfish 16 Web Worker | Validasi aturan langkah resmi FIDE, deteksi skak/skakmat/remis, dan kalkulasi evaluasi langkah. |
| **Database & Auth** | Supabase (PostgreSQL 15) | Penyimpanan relasional tabel `profiles` dan `matches` dengan enkripsi kata sandi dan token JWT. |
| **Realtime Channel** | Supabase Realtime (WebSockets) | Mengalirkan data langkah catur 1v1 secara instan dengan latensi di bawah 50 milidetik. |
| **Keamanan Data** | Row Level Security (RLS) & RBAC | Mengisolasi hak akses data antar user dan mengunci endpoint administratif. |
| **Backend Runtime** | Node.js, Express.js | Menyediakan REST API proxy, audit logging, dan melayani aplikasi secara *full-stack*. |
| **Deployment** | Google Cloud Platform / AI Studio | Hosting berbasis *cloud container* dengan SSL/TLS aktif. |

---

## 5. CARA KERJA SISTEM & ALUR PENGGUNA (WORKFLOW)

### 5.1 Alur Registrasi, Login & Otentikasi
1. Pengguna membuka aplikasi catur dan menekan tombol **"Masuk / Daftar"**.
2. Pengguna dapat memilih untuk mendaftar akun baru, login via email & kata sandi, atau memilih tombol cepat penguji (*Akun Admin* / *Akun User*).
3. Supabase Auth memvalidasi kredensial pengguna dan mengembalikan sesi terotentikasi (*JWT session token*).
4. Profil pengguna dimuat, mencakup identitas nama, peran (*role: admin* atau *role: user*), dan nilai rating ELO.
5. Jika pengguna berstatus *admin*, tombol **"Dashboard Admin"** akan muncul pada bilah navigasi atas.

### 5.2 Alur Bermain Melawan Stockfish AI
1. Pengguna memilih mode **"vs Komputer"** dan menentukan level kesulitan (Level 1–5).
2. Pengguna memindahkan bidak di papan. Papan segera mengalirkan animasi visual (<1ms) dan memainkan efek suara (*move*, *capture*, atau *check*).
3. Setelah giliran pemain selesai, giliran berpindah ke Stockfish AI.
4. *Engine Web Worker* menganalisis FEN posisi saat ini:
   - Jika posisi mendekati skakmat (*mate sequence*), engine memprioritaskan langkah skak langsung yang mengunci raja lawan.
   - Jika posisi umum, engine memilih langkah terbaik berdasarkan evaluasi minimax *alpha-beta pruning*.
5. Sistem memperbarui kurva momentum keuntungan (*Advantage Momentum Graph*) secara langsung.

### 5.3 Alur Ulasan Pertandingan Cepat (Game Review)
1. Setelah pertandingan berakhir (atau kapan pun pemain menekan tombol **"Game Review"**), sistem memulai evaluasi.
2. Algoritma menelusuri riwayat langkah:
   - Langkah yang sudah memiliki nilai evaluasi langsung diambil dari *live cache*.
   - Langkah yang belum dievaluasi diproses menggunakan *fast search depth* (maksimal 50ms per move).
3. Sistem menghitung selisih kehilangan keunggulan (*centipawn loss*) untuk menentukan klasifikasi langkah (*Brilliant*, *Great*, *Best*, *Inaccuracy*, *Blunder*).
4. Menghitung persentase akurasi pemain Putih dan Hitam (skala 0–100%).
5. Modal ulasan interaktif terbuka dalam waktu 2–3 detik, memungkinkan pengguna melompat ke momen kunci pertandingan (*Key Moments*).

### 5.4 Alur Permainan Multiplayer Online 1v1 Real-time
1. **Pemain 1 (Host)** membuka menu **"Main Online (1v1)"** dan menekan tombol **"Buat Room Baru"**.
2. Sistem menghasilkan kode unik (contoh: `WCH-8K2M`) dan menghubungkan Pemain 1 ke kanal WebSocket Supabase Realtime dengan peran Putih (*White*).
3. **Pemain 2 (Tamu)** memasukkan kode room tersebut pada kolom **"Gabung Room"**.
4. Kanal mendeteksi kehadiran dua pemain dan memulai pertandingan secara otomatis.
5. Setiap kali salah satu pemain melangkah, muatan data langkah (*from*, *to*, *promotion*, *fen*) disiarkan via `broadcast` event.
6. Papan lawan langsung bergerak sinkron secara *real-time* tanpa perlu menyegarkan (*refresh*) halaman.
7. Bila terjadi skakmat, pemain menyerah (*resign*), atau waktu habis, status hasil pertandingan segera diperbarui di kedua perangkat.

### 5.5 Alur Perlindungan Rute (Route Guard & Security Audit)
1. Pengguna (tamu atau berstatus *role: 'user'*) mencoba mengakses rute admin dengan mengetik `/#admin` pada URL peramban.
2. *Route Guard* mendeteksi percobaan akses rute terlarang.
3. Sistem memeriksa objek profil pengguna: `currentUser?.role !== 'admin'`.
4. Router menolak akses, membersihkan URL kembali ke `/`, dan menampilkan modal **"403 Forbidden: Akses Ditolak"**.
5. Sistem mengirimkan rekaman peristiwa ke endpoint `/api/admin/log-route-violation` untuk dicatat ke dalam *Security Audit Trail*.

---

## 6. STRUKTUR DATABASE & RELASI TABEL (SUPABASE POSTGRESQL)

Untuk memenuhi persyaratan basis data relasional, sistem W Chess menggunakan minimal dua tabel utama yang saling berelasi dengan integritas referensial:

```
+-----------------------------------+             +-----------------------------------+
|          PUBLIC.PROFILES          |             |          PUBLIC.MATCHES           |
+-----------------------------------+             +-----------------------------------+
| PK | id (UUID)                   |<---+         | PK | id (UUID)                   |
|    | email (TEXT, UNIQUE)         |    |         | FK | player1_id (UUID) ----------+ (White)
|    | full_name (TEXT)             |    +---------| FK | player2_id (UUID) ----------+ (Black)
|    | role ('admin' | 'user')      |             |    | result (TEXT: '1-0','0-1'..) |
|    | rating (INTEGER)             |             |    | fen_string (TEXT)            |
|    | avatar (TEXT)                |             |    | pgn (TEXT)                   |
|    | status ('active' | 'banned') |             |    | time_control (TEXT)          |
|    | matches_played (INTEGER)     |             |    | mode (TEXT)                  |
|    | created_at (TIMESTAMPTZ)     |             |    | total_moves (INTEGER)        |
|    | last_login (TIMESTAMPTZ)     |             |    | notes (TEXT)                 |
+-----------------------------------+             |    | created_at (TIMESTAMPTZ)     |
                                                  +-----------------------------------+
```

### 6.1 Deskripsi Relasi
- **Tabel `profiles`**: Menyimpan entitas akun pengguna, hak akses peran (*Role-Based Access Control*), dan status keaktifan akun.
- **Tabel `matches`**: Menyimpan rekaman riwayat pertandingan catur. Kolom `player1_id` dan `player2_id` berelasi *foreign key* ke kolom `id` pada tabel `profiles` (`REFERENCES public.profiles(id) ON DELETE CASCADE`).
- **Relasi**: Bersifat *One-to-Many* (Satu pemain di tabel `profiles` dapat memiliki banyak catatan pertandingan di tabel `matches`, baik sebagai pemegang bidak Putih maupun Hitam).

---

## 7. KESIMPULAN & PENUTUP

### 7.1 Kesimpulan
Proyek pengembangan aplikasi web catur **W Chess** telah berhasil diselesaikan dengan memenuhi seluruh kriteria fungsional, performa, dan standar keamanan yang ditargetkan:
1. **Desain & Responsivitas Unggul**: Desain bidak klasik Staunton 2D dan move list berkontras tinggi terbukti nyaman digunakan di perangkat layar sentuh ponsel maupun desktop.
2. **Kecerdasan Buatan yang Efektif**: Integrasi engine Stockfish dengan perbaikan logika endgame berhasil mengeliminasi masalah gerakan berulang (*shuffle*), memastikan eksekusi skakmat yang cepat dan akurat.
3. **Efisiensi Game Review**: Penerapan *cache* evaluasi langsung berhasil memangkas waktu analisis dari puluhan detik menjadi hanya 2–3 detik tanpa mengurangi ketepatan klasifikasi langkah (*Brilliant/Great/Blunder*).
4. **Komunikasi Real-time yang Andal**: Sinkronisasi pertandingan 1v1 via Supabase Realtime Channels berjalan mulus dengan latensi minimal.
5. **Keamanan Data yang Ketat**: Pembagian peran Administrator dan User terlindungi dengan baik melalui kombinasi *Row Level Security* (RLS) di level basis data dan *Route Guard (403 Forbidden)* di level aplikasi.

### 7.2 Saran & Rencana Pengembangan Masa Depan
1. Menambahkan varian catur populer lainnya seperti *Chess960 (Fischer Random)* dan *Blitz Bullet 1+0*.
2. Mengintegrasikan sistem turnamen bergaya *Swiss-System* otomatis untuk kompetisi berskala komunitas atau sekolah.
3. Mengembangkan fitur *Voice Move Announcer* berbahasa Indonesia untuk aksesibilitas pemain penyandang disabilitas penglihatan.

---
*Laporan ini disusun secara resmi untuk memenuhi dokumentasi teknis dan syarat penilaian proyek pengembangan aplikasi web catur 'W Chess'.*
