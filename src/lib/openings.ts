import { OpeningData } from '../types/chess';

export const OPENINGS_DATABASE: OpeningData[] = [
  // C20: King's Pawn Opening
  {
    eco: 'C20',
    name: "King's Pawn Opening",
    nameId: 'Pembukaan Pion Raja',
    desc: 'Langkah awal 1. e4 mengontrol petak pusat d5 dan e5, serta membuka jalur kembang untuk Menteri dan Gajah Sayap Raja.',
    descEn: 'Controls key central squares d5 and e5, opening lines for the queen and light-squared bishop.',
    moves: ['e4'],
  },
  // C20: King's Pawn Game (1. e4 e5)
  {
    eco: 'C20',
    name: "King's Pawn Game",
    nameId: 'Permainan Pion Raja Terbuka',
    desc: 'Pertemuan langsung di pusat (1. e4 e5). Membuka pertarungan taktis yang dinamis dan klasik.',
    descEn: 'Open game with direct central confrontation, offering sharp tactical and strategic battles.',
    moves: ['e4', 'e5'],
  },
  // C42: Petrov's Defense
  {
    eco: 'C42',
    name: "Petrov's Defense",
    nameId: "Pertahanan Petrov (Russian Defense)",
    desc: 'Hitam memilih serangan balik langsung ke pion e4 daripada bertahan pasif. Sangat kokoh dan solid.',
    descEn: 'A symmetrical counter-attack on e4, known for high solidity and counter-attacking chances.',
    moves: ['e4', 'e5', 'Nf3', 'Nf6'],
  },
  // C50: Italian Game
  {
    eco: 'C50',
    name: 'Italian Game',
    nameId: 'Pembukaan Italia (Italian Game)',
    desc: 'Gajah ke c4 menekan titik terlemah Hitam di f7. Salah satu pembukaan tertua dan paling kaya strategi dalam sejarah catur.',
    descEn: 'Focuses on the sensitive f7 square, allowing rapid kingside castling and harmonious piece play.',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'],
  },
  // C54: Giuoco Piano
  {
    eco: 'C54',
    name: 'Giuoco Piano',
    nameId: 'Giuoco Piano (Permainan Tenang)',
    desc: 'Hitam membalas dengan Bc5 menciptakan simetri pertarungan kontrol petak tengah.',
    descEn: 'The Quiet Game; both sides balance rapid development with solid central coordination.',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'],
  },
  // C57: Fried Liver Attack / Two Knights
  {
    eco: 'C57',
    name: 'Two Knights Defense',
    nameId: 'Pertahanan Dua Kuda',
    desc: 'Hitam mengembangkan kuda untuk menyerang pion e4, mengundang komplikasi taktis tajam.',
    descEn: 'Dynamic and tactical challenge to the Italian setup, actively counter-attacking e4.',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6'],
  },
  // C60: Ruy Lopez (Spanish Opening)
  {
    eco: 'C60',
    name: 'Ruy Lopez (Spanish Opening)',
    nameId: 'Pembukaan Spanyol (Ruy Lopez)',
    desc: 'Langkah 3. Bb5 memberikan tekanan jangka panjang pada Kuda c6 yang mempertahankan pion e5.',
    descEn: 'Classic mastery of positional pressure, pinning and attacking the defender of e5.',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'],
  },
  // C45: Scotch Game
  {
    eco: 'C45',
    name: 'Scotch Game',
    nameId: 'Pembukaan Skotlandia (Scotch Game)',
    desc: 'Putih segera mendobrak pusat dengan 3. d4 untuk membuka lajur dan memegang inisiatif ruang.',
    descEn: 'White plays 3. d4 immediately to break open the center and gain active piece play.',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4'],
  },
  // B20: Sicilian Defense
  {
    eco: 'B20',
    name: 'Sicilian Defense',
    nameId: 'Pertahanan Sisilia (Sicilian Defense)',
    desc: 'Respon paling populer dan tajam terhadap 1. e4! Hitam bertarung asimetris untuk memperebutkan sayap menteri dan pusat.',
    descEn: 'The most aggressive response to 1. e4, creating asymmetric and double-edged imbalances.',
    moves: ['e4', 'c5'],
  },
  // B90: Sicilian Najdorf
  {
    eco: 'B90',
    name: 'Sicilian Najdorf',
    nameId: 'Sisilia Najdorf',
    desc: '5... a6 menghentikan ancaman lompatan Kuda/Gajah ke b5 dan mempersiapkan ekspansi sayap Menteri b7-b5.',
    descEn: 'Favored by Fischer and Kasparov, 5... a6 prepares queenside expansion and limits White knights.',
    moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'],
  },
  // C00: French Defense
  {
    eco: 'C00',
    name: 'French Defense',
    nameId: 'Pertahanan Prancis (French Defense)',
    desc: '1... e6 mempersiapkan dorongan pusat d7-d5 dengan struktur rantai pion yang kokoh.',
    descEn: 'Solid and resilient pawn chain structure preparing an immediate central strike with d5.',
    moves: ['e4', 'e6'],
  },
  // B10: Caro-Kann Defense
  {
    eco: 'B10',
    name: 'Caro-Kann Defense',
    nameId: 'Pertahanan Caro-Kann',
    desc: 'Hitam mendukung d7-d5 dengan c7-c6 tanpa mengurung Gajah terang c8. Sangat kokoh dan minim kelemahan pion.',
    descEn: 'A rock-solid choice that prepares d5 while keeping the light-squared bishop free outside the pawn chain.',
    moves: ['e4', 'c6'],
  },
  // B01: Scandinavian Defense
  {
    eco: 'B01',
    name: 'Scandinavian Defense',
    nameId: 'Pertahanan Skandinavia',
    desc: 'Hitam langsung menantang pion pusat Putih dengan 1... d5 sejak langkah pertama.',
    descEn: 'Directly strikes at White’s center on move one, leading to rapid development.',
    moves: ['e4', 'd5'],
  },
  // D00: Queen's Pawn Opening
  {
    eco: 'D00',
    name: "Queen's Pawn Opening",
    nameId: 'Pembukaan Pion Menteri',
    desc: 'Langkah 1. d4 mengontrol petak pusat e5 dan c5, menjanjikan duel posisional yang lebih tenang dan mendalam.',
    descEn: 'Controls e5 and c5 with immediate piece defense, leading to strategic positional struggles.',
    moves: ['d4'],
  },
  // D02: London System
  {
    eco: 'D02',
    name: 'London System',
    nameId: 'Sistem London (London System)',
    desc: 'Pengembangan Gajah ke f4 sebelum e3 membentuk piramida pion tak tertembus. Pilihan favorit pemain modern.',
    descEn: 'Brings the dark-squared bishop to f4 before locking the pawn pyramid, very dependable and harmonious.',
    moves: ['d4', 'd5', 'Nf3', 'Nf6', 'Bf4'],
  },
  // D06: Queen's Gambit
  {
    eco: 'D06',
    name: "Queen's Gambit",
    nameId: 'Gambit Menteri (Queen\'s Gambit)',
    desc: 'Putih menawarkan pengorbanan pion sayap c4 untuk merebut dominasi pusat dengan pion e4 nantinya.',
    descEn: 'White offers the c4 pawn to exchange a wing pawn for a center pawn and seize central control.',
    moves: ['d4', 'd5', 'c4'],
  },
  // D20: Queen's Gambit Accepted
  {
    eco: 'D20',
    name: "Queen's Gambit Accepted",
    nameId: 'Gambit Menteri Diterima (QGA)',
    desc: 'Hitam memukul pion c4. Putih akan membalas dengan merebut pusat dan menarik kembali pion dengan tempo.',
    descEn: 'Black accepts the pawn, conceding the center temporarily in favor of free development.',
    moves: ['d4', 'd5', 'c4', 'dxc4'],
  },
  // D30: Queen's Gambit Declined
  {
    eco: 'D30',
    name: "Queen's Gambit Declined",
    nameId: 'Gambit Menteri Ditolak (QGD)',
    desc: 'Hitam menolak tawaran dengan memperkuat pion pusat melalui 2... e6.',
    descEn: 'Classical defense anchoring d5 with e6 to maintain an unyielding central foothold.',
    moves: ['d4', 'd5', 'c4', 'e6'],
  },
  // D10: Slav Defense
  {
    eco: 'D10',
    name: 'Slav Defense',
    nameId: 'Pertahanan Slav',
    desc: 'Mendukung pion d5 dengan c7-c6 untuk mempertahankan jalur keluar Gajah c8.',
    descEn: 'Solid and flexible defense to 1. d4, keeping the diagonal open for the bishop.',
    moves: ['d4', 'd5', 'c4', 'c6'],
  },
  // E60: King's Indian Defense
  {
    eco: 'E60',
    name: "King's Indian Defense",
    nameId: "Pertahanan Hindia Raja (KID)",
    desc: 'Hitam membiarkan Putih menduduki pusat lalu melancarkan serangan balik eksplosif ke Sayap Raja.',
    descEn: 'Hypermodern masterpiece allowing White central space before unleashing a vicious kingside assault.',
    moves: ['d4', 'Nf6', 'c4', 'g6'],
  },
  // A10: English Opening
  {
    eco: 'A10',
    name: 'English Opening',
    nameId: 'Pembukaan Inggris (English Opening)',
    desc: '1. c4 bertarung memperebutkan petak d5 dari sayap menteri, membuka opsi transisi fleksibel.',
    descEn: 'Flank opening asserting pressure on d5 while retaining fluid strategic transitions.',
    moves: ['c4'],
  },
  // A04: Réti Opening
  {
    eco: 'A04',
    name: 'Réti Opening',
    nameId: 'Pembukaan Réti',
    desc: '1. Nf3 mengontrol pusat secara tidak langsung, mempertahankan fleksibilitas struktur pion.',
    descEn: 'A hypermodern opening developing the knight first, keeping pawn options adaptable.',
    moves: ['Nf3'],
  },
];

export function detectOpening(moves: string[]): OpeningData {
  if (moves.length === 0) {
    return {
      eco: 'A00',
      name: 'Initial Position',
      nameId: 'Posisi Awal Catur',
      desc: 'Setiap bidak berada di petak awalnya. Siapkan strategi pembukaan, kuasai petak pusat, dan kembangkan perwira.',
      descEn: 'Starting position. Control the center, develop pieces toward active squares, and secure your king.',
      moves: [],
    };
  }

  // Find longest matching opening
  let bestMatch: OpeningData | null = null;
  let maxMatched = 0;

  for (const opening of OPENINGS_DATABASE) {
    if (opening.moves.length <= moves.length) {
      let matches = true;
      for (let i = 0; i < opening.moves.length; i++) {
        if (opening.moves[i] !== moves[i]) {
          matches = false;
          break;
        }
      }
      if (matches && opening.moves.length > maxMatched) {
        maxMatched = opening.moves.length;
        bestMatch = opening;
      }
    }
  }

  if (bestMatch) {
    return bestMatch;
  }

  // Fallback for custom or unknown continuation
  return {
    eco: 'A00',
    name: 'Custom Line',
    nameId: 'Varian Taktis Bebas',
    desc: `Langkah ke-${moves.length}: ${moves[moves.length - 1]}. Formasi telah berpindah ke variasi dinamis di luar buku standar.`,
    descEn: `Move ${moves.length}: ${moves[moves.length - 1]}. The game has transitioned into an independent, non-standard variation.`,
    moves,
  };
}
