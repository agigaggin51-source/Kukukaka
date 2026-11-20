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
3. Menyediakan fitur **Game Review cepat** (batas waktu evaluasi `movetime 300ms`) dengan metrik persentase akurasi (%) dan klasifikasi langkah (*Great*, *Best*, *Excellent*, *Good*, *Inaccuracy*, *Mistake*, *Blunder*).
4. Menyediakan fitur **Multiplayer Online 1v1 Real-time** dengan sistem kode room (*room code*) menggunakan **Supabase Realtime WebSocket Channels**, dilengkapi optimasi anti-lag (menonaktifkan evaluasi mesin real-time saat duel 1v1 berlangsung).
5. Menerapkan **Sistem Rating Elo Live** (mulai dari **400 Elo**, `+50` per kemenangan di bawah `1000 Elo`, dan penyesuaian dinamis `+15` hingga `+25` poin pada `1000+ Elo`) serta kontrol akses berbasis peran (**RBAC**) antara **Administrator** dan **Regular User** dengan perlindungan **Row Level Security (RLS)** di Supabase dan **Route Guard** di sisi frontend.

### 2.3 Batasan Masalah
- Aplikasi dibangun dalam bentuk Single Page Application (SPA) berbasis React 19 dan TypeScript.
- Basis data dan otentikasi menggunakan layanan Supabase Cloud (PostgreSQL 15) dengan cadangan lokal (*local cache / in-memory mirror*) di browser dan backend Node.js untuk menjamin keandalan tanpa henti.
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

### 3.5 Game Review & Analisis Catur Cepat (`movetime 300ms`)
* **Antarmuka Bersih Bebas Gangguan**: Pop-up notifikasi dan badge animasi *"Brilliant (!!)"* telah dinonaktifkan sehingga papan catur tetap fokus dan nyaman dilihat.
* **Analisis Cepat**: Kedalaman analisis pasca-pertandingan dibatasi waktu pencarian maksimal `300ms` per posisi (*fast movetime cap*) dan memanfaatkan *live evaluation cache* sehingga ulasan laga muncul cepat setelah pertandingan selesai.
* **Indikator Progres**: Menampilkan persentase dan progres langkah berjalan (contoh: *"Menganalisis langkah 14/38..."*).
* **Metrik Akurasi & Klasifikasi Langkah**: Menampilkan persentase akurasi pemain Putih dan Hitam, kurva momentum keunggulan (*Advantage Swing Curve*), serta klasifikasi langkah:
  * 🟢 **Great (!)**: Langkah taktis krusial atau pengorbanan efektif yang mempertahankan inisiatif unggul.
  * ★ **Best**: Langkah terkuat rekomendasi engine.
  * 🔵 **Excellent (!?)**: Langkah sangat baik yang mendekati pilihan utama engine.
  * ✓ **Good**: Langkah solid dan aman.
  * 🟡 **Inaccuracy (?!)**: Langkah suboptimal yang sedikit mengurangi keunggulan.
  * 🟠 **Mistake (?)**: Langkah salah yang membuang tempo atau posisi.
  * 🔴 **Blunder (??)**: Kesalahan fatal yang membalikkan hasil pertandingan.

### 3.6 Mode Multiplayer Online 1v1 Real-time & Optimasi Anti-Lag
* **Kode Room Unik**: Pemain dapat membuat room baru dengan kode room instan (contoh: `WCH-8K2M`) atau bergabung ke room teman dengan memasukkan kode.
* **Sinkronisasi Dua Arah Tanpa Freeze**: Pergerakan bidak disinkronkan secara langsung melalui kanal *Supabase Broadcast Channel* dengan proteksi timeout serta pemulihan otomatis berbasis FEN jika terjadi selisih sinkronisasi.
* **Optimasi Anti-Lag 1v1**: Evaluasi mesin Stockfish real-time dinonaktifkan otomatis selama pertandingan 1v1 berlangsung agar pergerakan bidak ringan dan instan, lalu baru aktif saat masuk mode AI atau pasca-pertandingan (*Review*).
* **Sistem Rating Elo Live**: Pemain baru memulai dari **400 Elo**. Kemenangan pada Elo `< 1000` memberi **+50 Elo**, sedangkan pada `1000+ Elo` bertambah dinamis antara **+15 hingga +25 poin**, lalu langsung disimpan ke tabel `profiles` di Supabase.
* **Jam Catur Sinkron & Deteksi Selesai**: Penghitung waktu (*clock timer*) kedua pemain berjalan sinkron, lengkap dengan deteksi otomatis skakmat (*Checkmate*), waktu habis (*Flagged*), remis (*Draw*), dan opsi Menyerah (*Resign*) atau Tanding Ulang (*Rematch*).

### 3.7 Fitur Pendukung Lainnya
* **Teka-teki Taktik Grandmaster (Puzzle Trainer)**: Kumpulan studi taktik klasik dunia seperti *Morphy Opera Game (Qb8+)*, *Boden's Mate*, *Philidor's Mate*, dan *Game of the Century*.
* **Editor Papan (Board Editor)**: Membantu pengguna menyusun posisi bidak bebas dan mengekspor/mengimpor kode FEN (*Forsyth-Edwards Notation*).
* **Ekspor Dokumen PGN**: Mengunduh catatan notasi pertandingan resmi lengkap dengan tag FIDE Tournament.

---

## 4. ARSITEKTUR SISTEM & TEKNOLOGI (TECH STACK)

### 4.1 Diagram Arsitektur Perangkat Lunak
```
+-----------------------------------------------------------------------+
|                           KLIEN (FRONTEND)                            |
|  React 19 SPA + TypeScript + Vite 8 + Tailwind CSS + Lucide Icons     |
|                                                                       |
|  +--------------------+  +-------------------+  +-------------------+ |
|  |     ChessBoard     |  |   Engine Worker   |  |   Supabase SDK    | |
|  |  (Staunton Vector) |  |  (Stockfish Logic)|  |  (Auth & Realtime)| |
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
| **User Interface (UI)** | React 19, Tailwind CSS | Membangun antarmuka modular, modern, responsif, dan bebas gangguan visual. |
| **Bahasa Pemrograman** | TypeScript, JavaScript ES6+ | Memberikan *type-safety* tinggi, meminimalkan *runtime error*, dan kode bersih. |
| **Build Tool & Bundler** | Vite 8 | Memungkinkan kompilasi cepat dan performa aset ringan. |
| **Logic & Engine Catur** | `chess.js`, Engine Web Worker | Validasi aturan langkah resmi FIDE, deteksi skak/skakmat/remis, dan kalkulasi evaluasi langkah dengan `movetime 300ms`. |
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
   - Langkah yang belum dievaluasi diproses menggunakan pencarian cepat berbatas waktu (`movetime 300ms`).
3. Sistem menghitung selisih kehilangan keunggulan (*centipawn loss*) untuk menentukan klasifikasi langkah (*Great*, *Best*, *Excellent*, *Good*, *Inaccuracy*, *Mistake*, *Blunder*).
4. Menghitung persentase akurasi pemain Putih dan Hitam (skala 0–100%).
5. Modal ulasan interaktif terbuka secara cepat dengan hasil akurasi dan momen kunci (*Key Moments*).

### 5.4 Alur Permainan Multiplayer Online 1v1 Real-time
1. **Pemain 1 (Host)** membuka menu **"Main Online (1v1)"** dan menekan tombol **"Buat Room Baru"**.
2. Sistem menghasilkan kode unik (contoh: `WCH-8K2M`) dan menghubungkan Pemain 1 ke kanal WebSocket Supabase Realtime dengan peran Putih (*White*).
3. **Pemain 2 (Tamu)** memasukkan kode room tersebut pada kolom **"Gabung Room"**.
4. Kanal mendeteksi kehadiran dua pemain dan memulai pertandingan secara otomatis, sementara evaluasi Stockfish real-time dinonaktifkan agar permainan berjalan ringan tanpa lag.
5. Setiap kali salah satu pemain melangkah, muatan data langkah (*from*, *to*, *promotion*, *fen*) disiarkan via `broadcast` event dengan mekanisme timeout & pemulihan FEN.
6. Papan lawan langsung bergerak sinkron secara *real-time* tanpa perlu menyegarkan (*refresh*) halaman.
7. Bila terjadi skakmat, pemain menyerah (*resign*), atau waktu habis, status hasil pertandingan (`matches`) dan pembaruan Live Elo (`profiles`) otomatis disimpan ke Supabase.

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
|    | role ('admin' | 'user')      |             |    | status ('ongoing'|'completed')|
|    | rating (INT, DEFAULT 400)    |             |    | result (TEXT: '1-0','0-1'..) |
|    | avatar (TEXT)                |             |    | fen / fen_string (TEXT)      |
|    | status ('active' | 'banned') |             |    | pgn (TEXT)                   |
|    | matches_played (INTEGER)     |             |    | time_control (TEXT)          |
|    | created_at (TIMESTAMPTZ)     |             |    | mode (TEXT)                  |
|    | updated_at (TIMESTAMPTZ)     |             |    | total_moves (INTEGER)        |
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
1. **Desain & Responsivitas Unggul**: Desain bidak klasik Staunton 2D, move list berkontras tinggi, serta antarmuka bersih tanpa pop-up pengganggu terbukti nyaman digunakan di perangkat layar sentuh ponsel maupun desktop.
2. **Kecerdasan Buatan yang Efektif**: Integrasi engine Stockfish dengan perbaikan logika endgame berhasil mengeliminasi masalah gerakan berulang (*shuffle*), memastikan eksekusi skakmat yang cepat dan akurat.
3. **Efisiensi Game Review**: Penerapan *cache* evaluasi langsung dan pembatasan `movetime 300ms` membuat analisis pasca-laga berjalan cepat tanpa membebani browser (*Great/Best/Blunder*).
4. **Komunikasi Real-time Anti-Lag**: Sinkronisasi pertandingan 1v1 via Supabase Realtime Channels berjalan ringan karena analisis Stockfish real-time dinonaktifkan selama duel berlangsung, dilengkapi sistem Live Elo mulai dari 400 poin dan penyimpanan riwayat otomatis ke tabel `matches`.
5. **Keamanan Data yang Ketat**: Pembagian peran Administrator dan User terlindungi dengan baik melalui kombinasi *Row Level Security* (RLS) di level basis data dan *Route Guard (403 Forbidden)* di level aplikasi.

### 7.2 Saran & Rencana Pengembangan Masa Depan
1. Menambahkan varian catur populer lainnya seperti *Chess960 (Fischer Random)* dan *Blitz Bullet 1+0*.
2. Mengintegrasikan sistem turnamen bergaya *Swiss-System* otomatis untuk kompetisi berskala komunitas atau sekolah.
3. Mengembangkan fitur *Voice Move Announcer* berbahasa Indonesia untuk aksesibilitas pemain penyandang disabilitas penglihatan.

---
*Laporan ini disusun secara resmi untuk memenuhi dokumentasi teknis dan syarat penilaian proyek pengembangan aplikasi web catur 'W Chess'.*
