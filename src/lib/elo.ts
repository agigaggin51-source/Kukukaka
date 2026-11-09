/**
 * Elo Rating System for W Chess
 * 
 * Rules:
 * - Elo < 1000: Fast acceleration (+50 Elo per win) to quickly reach fair competition tier.
 * - Elo >= 1000: Dynamically scales down between 15 - 25.
 *   Every 100 points above 1000 reduces the gain by 1 point, with a floor of +15.
 */

export function calculateEloGain(currentElo: number): number {
  if (currentElo < 1000) {
    return 50;
  }
  const scalingFactor = Math.floor((currentElo - 1000) / 100);
  return Math.max(15, 25 - scalingFactor);
}

/**
 * Fungsi untuk menghitung penambahan Elo saat pemain MENANG
 */
export function calculateEloOnWin(currentElo: number): number {
  let eloGain = 50; // Default awal untuk Elo < 1000

  if (currentElo >= 1000) {
    // Jika Elo sudah mencapai 1000+, gain dikurangi secara dinamis antara 15 - 25
    // Semakin tinggi Elo di atas 1000, penambahan poin semakin kecil (minimum 15)
    const scalingFactor = Math.floor((currentElo - 1000) / 100);
    eloGain = Math.max(15, 25 - scalingFactor);
  }

  const newElo = currentElo + eloGain;
  console.log(`Elo Lama: ${currentElo} | Menang! (+${eloGain} Elo) | Elo Baru: ${newElo}`);
  return newElo;
}

/**
 * Fungsi untuk menghitung pengurangan Elo saat pemain KALAH
 * Default pengurangan 15 poin (minimum Elo 800)
 */
export function calculateEloOnLoss(currentElo: number): number {
  const eloLoss = 15;
  const newElo = Math.max(800, currentElo - eloLoss);
  console.log(`Elo Lama: ${currentElo} | Kalah! (-${eloLoss} Elo) | Elo Baru: ${newElo}`);
  return newElo;
}

/**
 * Fungsi untuk menghitung penyesuaian Elo saat pemain REMIS / DRAW
 * Default penambahan 5 poin
 */
export function calculateEloOnDraw(currentElo: number): number {
  const eloGain = 5;
  const newElo = currentElo + eloGain;
  console.log(`Elo Lama: ${currentElo} | Remis! (+${eloGain} Elo) | Elo Baru: ${newElo}`);
  return newElo;
}
