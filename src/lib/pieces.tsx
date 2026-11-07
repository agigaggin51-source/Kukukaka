import React from 'react';

/**
 * Staunton Classic Wood Style Chess Pieces
 * - Traditional handcrafted Staunton 2D pieces with authentic wood-carving aesthetics
 * - White Pieces: Creamy light natural boxwood/maple with warm amber shadows and fine timber outlines
 * - Black Pieces: Deep rich rosewood/walnut with warm caramel wood-carved highlights
 * - Raja (King): Royal finial cross pattée, arched crown gallery with interior velvet drapery & pedestal base
 * - Gajah (Bishop): Authentic slanted mitre cleft cut (kupasan sudut khas) with carved finial pearl
 * - Kuda (Knight): Traditional Elgin-marble Staunton horse head with sculpted mane tufts, alert ears & expressive jaw
 * - Benteng (Rook): Heavy siege tower with deep embrasures and carved cordon molding
 * - Menteri (Queen): Flared multi-pointed coronet topped with mini wooden orbs
 * - Pion (Pawn): Spherical finial head with carved torus collar and flanged base
 */

export const PIECE_SVGS: Record<string, React.ReactNode> = {
  // ==========================================
  // WHITE PIECES (Natural Light Boxwood / Maple)
  // ==========================================

  // White Pawn
  'wP': (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm select-none">
      <defs>
        <linearGradient id="wWoodP" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fffdf7" />
          <stop offset="50%" stopColor="#f5e6ca" />
          <stop offset="100%" stopColor="#dfc599" />
        </linearGradient>
        <linearGradient id="wWoodBaseP" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#faf0db" />
          <stop offset="100%" stopColor="#d3b787" />
        </linearGradient>
      </defs>
      {/* Head Ball */}
      <circle
        cx="22.5"
        cy="13"
        r="5.5"
        fill="url(#wWoodP)"
        stroke="#45311e"
        strokeWidth="1.5"
      />
      {/* Head Specular Highlight */}
      <ellipse cx="20.5" cy="11" rx="2" ry="1.4" fill="#ffffff" opacity="0.65" />
      {/* Collar Ring */}
      <path
        d="M 17,19.5 C 19.5,21 25.5,21 28,19.5 C 27,18.2 18,18.2 17,19.5 Z"
        fill="#e5ce9e"
        stroke="#45311e"
        strokeWidth="1.4"
      />
      {/* Body / Stem */}
      <path
        d="M 19,20.5 C 17.5,24 16,28 14.5,33.5 L 30.5,33.5 C 29,28 27.5,24 26,20.5 Z"
        fill="url(#wWoodP)"
        stroke="#45311e"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Waist Carving Crease */}
      <path d="M 16.5,30 C 20,31.5 25,31.5 28.5,30" stroke="#8a6c42" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
      {/* Pedestal Base */}
      <path
        d="M 13,34 L 32,34 L 33.5,37.5 L 11.5,37.5 Z"
        fill="url(#wWoodBaseP)"
        stroke="#45311e"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M 9.5,37.5 L 35.5,37.5 C 36,37.5 36.5,38 36.5,38.5 C 36.5,39 36,39.5 35.5,39.5 L 9.5,39.5 C 9,39.5 8.5,39 8.5,38.5 C 8.5,38 9,37.5 9.5,37.5 Z"
        fill="#cca974"
        stroke="#45311e"
        strokeWidth="1.5"
      />
      <path d="M 12,38.5 L 33,38.5" stroke="#ffffff" strokeWidth="1.1" opacity="0.5" strokeLinecap="round" />
    </svg>
  ),

  // White Rook (Benteng Kayu Klasik)
  'wR': (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm select-none">
      <defs>
        <linearGradient id="wWoodR" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fffdf7" />
          <stop offset="50%" stopColor="#f5e6ca" />
          <stop offset="100%" stopColor="#dec396" />
        </linearGradient>
      </defs>
      {/* Tower Stem */}
      <path
        d="M 12.5,34.5 L 32.5,34.5 L 30.5,17 L 14.5,17 Z"
        fill="url(#wWoodR)"
        stroke="#45311e"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Vertical timber texture highlight */}
      <path d="M 18,18.5 L 17,33" stroke="#ffffff" strokeWidth="1.2" opacity="0.55" strokeLinecap="round" />
      <path d="M 27,18.5 L 28,33" stroke="#8a6c42" strokeWidth="1.1" opacity="0.45" strokeLinecap="round" />
      {/* Carved Cordon Ring / Parapet Base */}
      <path
        d="M 12.5,16 L 32.5,16 L 33.5,17.5 L 11.5,17.5 Z"
        fill="#e7d0a1"
        stroke="#45311e"
        strokeWidth="1.4"
      />
      {/* Crenellated Battlements (4 merlons, 3 deep embrasures) */}
      <path
        d="M 11,8.5 L 11,16 L 34,16 L 34,8.5 L 29.5,8.5 L 29.5,12.5 L 25.5,12.5 L 25.5,8.5 L 19.5,8.5 L 19.5,12.5 L 15.5,12.5 L 15.5,8.5 Z"
        fill="url(#wWoodR)"
        stroke="#45311e"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Embrasures inner shadow line */}
      <path d="M 16,13.5 L 19,13.5 M 26,13.5 L 29,13.5" stroke="#8a6c42" strokeWidth="1.2" />
      {/* Double-tiered Pedestal Base */}
      <path
        d="M 11.5,34.5 L 33.5,34.5 L 35,37.5 L 10,37.5 Z"
        fill="#ecd6aa"
        stroke="#45311e"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M 8.5,37.5 L 36.5,37.5 C 37,37.5 37.5,38 37.5,38.5 C 37.5,39 37,39.5 36.5,39.5 L 8.5,39.5 C 8,39.5 7.5,39 7.5,38.5 C 7.5,38 8,37.5 8.5,37.5 Z"
        fill="#cca974"
        stroke="#45311e"
        strokeWidth="1.5"
      />
      <path d="M 11,38.5 L 34,38.5" stroke="#ffffff" strokeWidth="1" opacity="0.6" strokeLinecap="round" />
    </svg>
  ),

  // White Knight (Kuda Kayu Tradisional Staunton)
  'wN': (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm select-none">
      <defs>
        <linearGradient id="wWoodN" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fffef9" />
          <stop offset="45%" stopColor="#f5e6ca" />
          <stop offset="100%" stopColor="#dec294" />
        </linearGradient>
      </defs>
      {/* Main Elgin-marble Staunton Horse Head Profile */}
      <path
        d="M 21.5,8 C 19.5,8 15.5,9.5 13,12.5 C 11.8,14 11.2,16 11.5,18 C 10.2,18.5 8,20.2 8,22.5 C 8,24.8 9.5,26 11.2,26.5 C 10.8,27.5 11.5,29 13.5,29 C 15,29 16.5,27.8 17.5,26.8 C 20.5,29.8 24.5,31.2 29,31.2 C 29,33 30,34.5 32,35.5 L 12.5,35.5 C 12,35.5 11.5,36 11.5,36.5 C 11.5,37 12,37.5 12.5,37.5 L 33.5,37.5 C 34,37.5 34.5,37 34.5,36.5 C 34.5,36 34,35.5 33.5,35.5 C 35.8,33.5 36.8,29.5 36.8,24.5 C 36.8,19.5 34.5,14.5 31.5,11 C 28.5,7.5 24.5,8 21.5,8 Z"
        fill="url(#wWoodN)"
        stroke="#45311e"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Pricked Ear */}
      <path
        d="M 19,8.5 L 21.5,13.5 L 23.5,11 Z"
        fill="#ebd4a7"
        stroke="#45311e"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {/* Distinct Sculpted Mane Tufts cascading down crest */}
      <path d="M 22,8.5 C 24.5,11 25.5,13.5 26,16" stroke="#45311e" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M 26.5,14 C 29,16.5 30.5,19.5 31,23" stroke="#45311e" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M 31,21 C 33,23.5 34,26.5 34.2,29.5" stroke="#45311e" strokeWidth="1.3" strokeLinecap="round" />
      {/* Expressive Eye & Brow */}
      <ellipse cx="15.5" cy="16.5" rx="1.5" ry="1.2" fill="#45311e" />
      <circle cx="15.2" cy="16.2" r="0.5" fill="#ffffff" />
      <path d="M 14,14.5 C 15.5,14 17.5,14.5 18,15.5" stroke="#8a6c42" strokeWidth="1.2" strokeLinecap="round" />
      {/* Nostril & Muzzle Line */}
      <circle cx="10.2" cy="22.5" r="1" fill="#45311e" />
      <path d="M 10.5,24.5 C 12,25.2 13.5,25 14.5,24" stroke="#45311e" strokeWidth="1.2" strokeLinecap="round" />
      {/* Jawline & Neck Muscle Highlight */}
      <path d="M 18,22 C 20,25 24,26.5 27,26" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
      {/* Weighted Pedestal Base */}
      <path
        d="M 10,37.5 L 35,37.5 L 35.5,40 L 9.5,40 Z"
        fill="#cca974"
        stroke="#45311e"
        strokeWidth="1.5"
      />
    </svg>
  ),

  // White Bishop (Gajah dengan Kupasan Sudut Khas Staunton)
  'wB': (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm select-none">
      <defs>
        <linearGradient id="wWoodB" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fffef8" />
          <stop offset="50%" stopColor="#f5e6ca" />
          <stop offset="100%" stopColor="#dfc599" />
        </linearGradient>
      </defs>
      {/* Finial Ball / Pearl */}
      <circle
        cx="22.5"
        cy="6.8"
        r="2.4"
        fill="#fdf6e7"
        stroke="#45311e"
        strokeWidth="1.4"
      />
      <circle cx="21.5" cy="6" r="0.8" fill="#ffffff" />
      {/* Main Mitre Body */}
      <path
        d="M 22.5,9 C 18,9 14.5,13.5 14.5,19.5 C 14.5,24 17.5,27.5 19,29.5 C 17,31.5 15,33.5 14.5,35 L 30.5,35 C 30,33.5 28,31.5 26,29.5 C 27.5,27.5 30.5,24 30.5,19.5 C 30.5,13.5 27,9 22.5,9 Z"
        fill="url(#wWoodB)"
        stroke="#45311e"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Authentic Staunton Slanted Cleft Notch (Kupasan Sudut Khas Gajah) */}
      <path
        d="M 23,12 L 29,18 L 26,20.5 L 21.5,15 Z"
        fill="#45311e"
        opacity="0.9"
      />
      <path d="M 23,12 L 29,18" stroke="#45311e" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M 21.5,15 L 26,20.5" stroke="#8a6c42" strokeWidth="1.2" strokeLinecap="round" />
      {/* Carved Mitre Front Crease */}
      <path d="M 22.5,14 L 22.5,22" stroke="#45311e" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M 18,17.5 L 27,17.5" stroke="#45311e" strokeWidth="1.3" strokeLinecap="round" />
      {/* Wood Specular Sheen */}
      <path d="M 16.5,18 C 16.5,14 19,10.5 21,10.5" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round" opacity="0.65" />
      {/* Collar & Flanged Base */}
      <path
        d="M 17,29.5 C 20.5,31 24.5,31 28,29.5"
        stroke="#45311e"
        strokeWidth="1.4"
      />
      <path
        d="M 13,35 L 32,35 L 33.5,37.5 L 11.5,37.5 Z"
        fill="#ecd6aa"
        stroke="#45311e"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M 9.5,37.5 L 35.5,37.5 L 36,40 L 9,40 Z"
        fill="#cca974"
        stroke="#45311e"
        strokeWidth="1.5"
      />
      <path d="M 12,38.5 L 33,38.5" stroke="#ffffff" strokeWidth="1" opacity="0.6" strokeLinecap="round" />
    </svg>
  ),

  // White Queen (Menteri dengan Mahkota Berornamen)
  'wQ': (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm select-none">
      <defs>
        <linearGradient id="wWoodQ" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fffef8" />
          <stop offset="50%" stopColor="#f5e6ca" />
          <stop offset="100%" stopColor="#dfc599" />
        </linearGradient>
      </defs>
      {/* 5-Point Flared Coronet Body */}
      <path
        d="M 9.5,23.5 L 7,13 L 14.5,18.5 L 22.5,10 L 30.5,18.5 L 38,13 L 35.5,23.5 C 35.5,27 33,30 30.5,32 C 29,33 28.5,34 28.5,35 L 16.5,35 C 16.5,34 16,33 14.5,32 C 12,30 9.5,27 9.5,23.5 Z"
        fill="url(#wWoodQ)"
        stroke="#45311e"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Carved Wooden Pearl Orbs on Coronet Points */}
      <circle cx="7" cy="12.5" r="2.1" fill="#fffcf5" stroke="#45311e" strokeWidth="1.3" />
      <circle cx="14.5" cy="17.8" r="1.9" fill="#fffcf5" stroke="#45311e" strokeWidth="1.3" />
      <circle cx="22.5" cy="9.5" r="2.3" fill="#fffcf5" stroke="#45311e" strokeWidth="1.4" />
      <circle cx="30.5" cy="17.8" r="1.9" fill="#fffcf5" stroke="#45311e" strokeWidth="1.3" />
      <circle cx="38" cy="12.5" r="2.1" fill="#fffcf5" stroke="#45311e" strokeWidth="1.3" />
      {/* Specular dots on orbs */}
      <circle cx="21.8" cy="8.8" r="0.7" fill="#ffffff" />
      {/* Coronet Waist & Filigree Ribbons */}
      <path d="M 12.5,25.5 C 18,28 27,28 32.5,25.5" stroke="#45311e" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M 14,29 C 18.5,31 26.5,31 31,29" stroke="#8a6c42" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
      {/* Base */}
      <path
        d="M 13,35 L 32,35 L 33.5,37.5 L 11.5,37.5 Z"
        fill="#ecd6aa"
        stroke="#45311e"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M 9.5,37.5 L 35.5,37.5 L 36,40 L 9,40 Z"
        fill="#cca974"
        stroke="#45311e"
        strokeWidth="1.5"
      />
      <path d="M 12,38.5 L 33,38.5" stroke="#ffffff" strokeWidth="1" opacity="0.6" strokeLinecap="round" />
    </svg>
  ),

  // White King (Raja dengan Mahkota Salib Staunton Tradisional)
  'wK': (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm select-none">
      <defs>
        <linearGradient id="wWoodK" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fffef8" />
          <stop offset="50%" stopColor="#f5e6ca" />
          <stop offset="100%" stopColor="#dec294" />
        </linearGradient>
      </defs>
      {/* Distinct Royal Staunton Cross Pattée / Maltese Cross */}
      <g>
        {/* Vertical stem */}
        <path
          d="M 21.2,3 L 23.8,3 L 23.2,7 L 24.5,7.5 L 24.5,9.5 L 23,10 L 23,12 L 22,12 L 22,10 L 20.5,9.5 L 20.5,7.5 L 21.8,7 Z"
          fill="#faf0da"
          stroke="#45311e"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        {/* Horizontal cross arms */}
        <path
          d="M 18,7.5 L 27,7.5 L 27.5,9.5 L 17.5,9.5 Z"
          fill="#faf0da"
          stroke="#45311e"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        {/* Center Jewel / Diamond */}
        <circle cx="22.5" cy="8.5" r="1.1" fill="#cca974" stroke="#45311e" strokeWidth="0.8" />
      </g>
      {/* Crown Robes & Arches */}
      <path
        d="M 22.5,12 C 16,12 11.5,15.5 11.5,21.5 C 11.5,25.5 14,28.5 16.5,30.5 C 18,31.8 19,33 19,34.5 L 26,34.5 C 26,33 27,31.8 28.5,30.5 C 31,28.5 33.5,25.5 33.5,21.5 C 33.5,15.5 29,12 22.5,12 Z"
        fill="url(#wWoodK)"
        stroke="#45311e"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Carved Velvet Cap Ribs & Filigree */}
      <path d="M 14.5,18.5 C 18,21.5 27,21.5 30.5,18.5" stroke="#45311e" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M 14,24.5 C 18,27.5 27,27.5 31,24.5" stroke="#45311e" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="22.5" cy="18" r="1.6" fill="#cca974" stroke="#45311e" strokeWidth="1" />
      {/* Specular Curve */}
      <path d="M 14,19 C 14,15 17,13 21,13" stroke="#ffffff" strokeWidth="1.3" opacity="0.65" strokeLinecap="round" />
      {/* Tiered Base */}
      <path
        d="M 13.5,34.5 L 31.5,34.5 L 33.5,37.5 L 11.5,37.5 Z"
        fill="#ecd6aa"
        stroke="#45311e"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M 9.5,37.5 L 35.5,37.5 L 36,40 L 9,40 Z"
        fill="#cca974"
        stroke="#45311e"
        strokeWidth="1.5"
      />
      <path d="M 12,38.5 L 33,38.5" stroke="#ffffff" strokeWidth="1" opacity="0.6" strokeLinecap="round" />
    </svg>
  ),

  // ==========================================
  // BLACK PIECES (Deep Rosewood / Walnut Wood)
  // ==========================================

  // Black Pawn
  'bP': (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm select-none">
      <defs>
        <linearGradient id="bWoodP" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f3320" />
          <stop offset="50%" stopColor="#372113" />
          <stop offset="100%" stopColor="#22120a" />
        </linearGradient>
      </defs>
      {/* Head Ball */}
      <circle
        cx="22.5"
        cy="13"
        r="5.5"
        fill="url(#bWoodP)"
        stroke="#1a0c05"
        strokeWidth="1.5"
      />
      {/* Warm Rosewood Carving Sheen */}
      <ellipse cx="20.5" cy="11" rx="2" ry="1.4" fill="#dfa26d" opacity="0.65" />
      {/* Collar Ring */}
      <path
        d="M 17,19.5 C 19.5,21 25.5,21 28,19.5 C 27,18.2 18,18.2 17,19.5 Z"
        fill="#5a3821"
        stroke="#1a0c05"
        strokeWidth="1.4"
      />
      {/* Body / Stem */}
      <path
        d="M 19,20.5 C 17.5,24 16,28 14.5,33.5 L 30.5,33.5 C 29,28 27.5,24 26,20.5 Z"
        fill="url(#bWoodP)"
        stroke="#1a0c05"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Wood Contour Lines in Caramel */}
      <path d="M 16.5,30 C 20,31.5 25,31.5 28.5,30" stroke="#d59a67" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
      <path d="M 18,22 C 17,25.5 16,29 15.5,32" stroke="#eab88b" strokeWidth="1.1" strokeLinecap="round" opacity="0.45" />
      {/* Pedestal Base */}
      <path
        d="M 13,34 L 32,34 L 33.5,37.5 L 11.5,37.5 Z"
        fill="#3e2515"
        stroke="#1a0c05"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M 9.5,37.5 L 35.5,37.5 C 36,37.5 36.5,38 36.5,38.5 C 36.5,39 36,39.5 35.5,39.5 L 9.5,39.5 C 9,39.5 8.5,39 8.5,38.5 C 8.5,38 9,37.5 9.5,37.5 Z"
        fill="#2a160c"
        stroke="#1a0c05"
        strokeWidth="1.5"
      />
      <path d="M 12,38.5 L 33,38.5" stroke="#dfa26d" strokeWidth="1.1" opacity="0.5" strokeLinecap="round" />
    </svg>
  ),

  // Black Rook (Benteng Kayu Gelap)
  'bR': (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm select-none">
      <defs>
        <linearGradient id="bWoodR" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f3320" />
          <stop offset="50%" stopColor="#372113" />
          <stop offset="100%" stopColor="#22120a" />
        </linearGradient>
      </defs>
      {/* Tower Stem */}
      <path
        d="M 12.5,34.5 L 32.5,34.5 L 30.5,17 L 14.5,17 Z"
        fill="url(#bWoodR)"
        stroke="#1a0c05"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Timber Grain Highlights */}
      <path d="M 18,18.5 L 17,33" stroke="#eab88b" strokeWidth="1.2" opacity="0.5" strokeLinecap="round" />
      <path d="M 27,18.5 L 28,33" stroke="#eab88b" strokeWidth="1" opacity="0.35" strokeLinecap="round" />
      {/* Carved Cordon Ring */}
      <path
        d="M 12.5,16 L 32.5,16 L 33.5,17.5 L 11.5,17.5 Z"
        fill="#5a3821"
        stroke="#1a0c05"
        strokeWidth="1.4"
      />
      <path d="M 13,16.8 L 32,16.8" stroke="#dfa26d" strokeWidth="1" opacity="0.75" />
      {/* Crenellated Battlements */}
      <path
        d="M 11,8.5 L 11,16 L 34,16 L 34,8.5 L 29.5,8.5 L 29.5,12.5 L 25.5,12.5 L 25.5,8.5 L 19.5,8.5 L 19.5,12.5 L 15.5,12.5 L 15.5,8.5 Z"
        fill="url(#bWoodR)"
        stroke="#1a0c05"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Carved rim highlights on merlons */}
      <path d="M 11.5,9.5 L 15,9.5 M 20,9.5 L 25,9.5 M 30,9.5 L 33.5,9.5" stroke="#dfa26d" strokeWidth="1.1" strokeLinecap="round" opacity="0.8" />
      {/* Base */}
      <path
        d="M 11.5,34.5 L 33.5,34.5 L 35,37.5 L 10,37.5 Z"
        fill="#3e2515"
        stroke="#1a0c05"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M 8.5,37.5 L 36.5,37.5 C 37,37.5 37.5,38 37.5,38.5 C 37.5,39 37,39.5 36.5,39.5 L 8.5,39.5 C 8,39.5 7.5,39 7.5,38.5 C 7.5,38 8,37.5 8.5,37.5 Z"
        fill="#2a160c"
        stroke="#1a0c05"
        strokeWidth="1.5"
      />
      <path d="M 11,38.5 L 34,38.5" stroke="#dfa26d" strokeWidth="1" opacity="0.5" strokeLinecap="round" />
    </svg>
  ),

  // Black Knight (Kuda Kayu Gelap Klasik Staunton)
  'bN': (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm select-none">
      <defs>
        <linearGradient id="bWoodN" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f3320" />
          <stop offset="45%" stopColor="#372113" />
          <stop offset="100%" stopColor="#22120a" />
        </linearGradient>
      </defs>
      {/* Horse Head Silhouette */}
      <path
        d="M 21.5,8 C 19.5,8 15.5,9.5 13,12.5 C 11.8,14 11.2,16 11.5,18 C 10.2,18.5 8,20.2 8,22.5 C 8,24.8 9.5,26 11.2,26.5 C 10.8,27.5 11.5,29 13.5,29 C 15,29 16.5,27.8 17.5,26.8 C 20.5,29.8 24.5,31.2 29,31.2 C 29,33 30,34.5 32,35.5 L 12.5,35.5 C 12,35.5 11.5,36 11.5,36.5 C 11.5,37 12,37.5 12.5,37.5 L 33.5,37.5 C 34,37.5 34.5,37 34.5,36.5 C 34.5,36 34,35.5 33.5,35.5 C 35.8,33.5 36.8,29.5 36.8,24.5 C 36.8,19.5 34.5,14.5 31.5,11 C 28.5,7.5 24.5,8 21.5,8 Z"
        fill="url(#bWoodN)"
        stroke="#1a0c05"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Ear with inner light */}
      <path
        d="M 19,8.5 L 21.5,13.5 L 23.5,11 Z"
        fill="#5a3821"
        stroke="#1a0c05"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {/* Sculpted Mane Tufts with warm wood carving highlights */}
      <path d="M 22,8.5 C 24.5,11 25.5,13.5 26,16" stroke="#dfa26d" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 26.5,14 C 29,16.5 30.5,19.5 31,23" stroke="#dfa26d" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 31,21 C 33,23.5 34,26.5 34.2,29.5" stroke="#dfa26d" strokeWidth="1.4" strokeLinecap="round" />
      {/* Expressive Eye & Brow */}
      <ellipse cx="15.5" cy="16.5" rx="1.5" ry="1.2" fill="#1a0c05" />
      <circle cx="15.2" cy="16.2" r="0.6" fill="#eab88b" />
      <path d="M 14,14.5 C 15.5,14 17.5,14.5 18,15.5" stroke="#dfa26d" strokeWidth="1.2" strokeLinecap="round" />
      {/* Nostril & Muzzle */}
      <circle cx="10.2" cy="22.5" r="1" fill="#1a0c05" />
      <path d="M 10.5,24.5 C 12,25.2 13.5,25 14.5,24" stroke="#dfa26d" strokeWidth="1.2" strokeLinecap="round" />
      {/* Jawline & Neck Muscle Carving Highlight */}
      <path d="M 18,22 C 20,25 24,26.5 27,26" stroke="#eab88b" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />
      {/* Base */}
      <path
        d="M 10,37.5 L 35,37.5 L 35.5,40 L 9.5,40 Z"
        fill="#2a160c"
        stroke="#1a0c05"
        strokeWidth="1.5"
      />
      <path d="M 13,38.5 L 32,38.5" stroke="#dfa26d" strokeWidth="1" opacity="0.5" strokeLinecap="round" />
    </svg>
  ),

  // Black Bishop (Gajah dengan Kupasan Sudut Khas Staunton)
  'bB': (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm select-none">
      <defs>
        <linearGradient id="bWoodB" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f3320" />
          <stop offset="50%" stopColor="#372113" />
          <stop offset="100%" stopColor="#22120a" />
        </linearGradient>
      </defs>
      {/* Finial Ball / Pearl */}
      <circle
        cx="22.5"
        cy="6.8"
        r="2.4"
        fill="#5a3821"
        stroke="#1a0c05"
        strokeWidth="1.4"
      />
      <circle cx="21.5" cy="6" r="0.8" fill="#dfa26d" />
      {/* Main Mitre Body */}
      <path
        d="M 22.5,9 C 18,9 14.5,13.5 14.5,19.5 C 14.5,24 17.5,27.5 19,29.5 C 17,31.5 15,33.5 14.5,35 L 30.5,35 C 30,33.5 28,31.5 26,29.5 C 27.5,27.5 30.5,24 30.5,19.5 C 30.5,13.5 27,9 22.5,9 Z"
        fill="url(#bWoodB)"
        stroke="#1a0c05"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Authentic Staunton Slanted Cleft Notch (Kupasan Sudut Khas Gajah) */}
      <path
        d="M 23,12 L 29,18 L 26,20.5 L 21.5,15 Z"
        fill="#1a0c05"
      />
      <path d="M 23,12 L 29,18" stroke="#dfa26d" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M 21.5,15 L 26,20.5" stroke="#eab88b" strokeWidth="1.2" strokeLinecap="round" />
      {/* Mitre Front Crease */}
      <path d="M 22.5,14 L 22.5,22" stroke="#dfa26d" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M 18,17.5 L 27,17.5" stroke="#dfa26d" strokeWidth="1.3" strokeLinecap="round" />
      {/* Wood Sheen */}
      <path d="M 16.5,18 C 16.5,14 19,10.5 21,10.5" stroke="#eab88b" strokeWidth="1.3" strokeLinecap="round" opacity="0.65" />
      {/* Collar & Base */}
      <path
        d="M 17,29.5 C 20.5,31 24.5,31 28,29.5"
        stroke="#dfa26d"
        strokeWidth="1.4"
      />
      <path
        d="M 13,35 L 32,35 L 33.5,37.5 L 11.5,37.5 Z"
        fill="#3e2515"
        stroke="#1a0c05"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M 9.5,37.5 L 35.5,37.5 L 36,40 L 9,40 Z"
        fill="#2a160c"
        stroke="#1a0c05"
        strokeWidth="1.5"
      />
      <path d="M 12,38.5 L 33,38.5" stroke="#dfa26d" strokeWidth="1" opacity="0.5" strokeLinecap="round" />
    </svg>
  ),

  // Black Queen (Menteri Kayu Gelap Berornamen)
  'bQ': (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm select-none">
      <defs>
        <linearGradient id="bWoodQ" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f3320" />
          <stop offset="50%" stopColor="#372113" />
          <stop offset="100%" stopColor="#22120a" />
        </linearGradient>
      </defs>
      {/* 5-Point Flared Coronet Body */}
      <path
        d="M 9.5,23.5 L 7,13 L 14.5,18.5 L 22.5,10 L 30.5,18.5 L 38,13 L 35.5,23.5 C 35.5,27 33,30 30.5,32 C 29,33 28.5,34 28.5,35 L 16.5,35 C 16.5,34 16,33 14.5,32 C 12,30 9.5,27 9.5,23.5 Z"
        fill="url(#bWoodQ)"
        stroke="#1a0c05"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Carved Wooden Pearl Orbs on Coronet Points */}
      <circle cx="7" cy="12.5" r="2.1" fill="#5a3821" stroke="#1a0c05" strokeWidth="1.3" />
      <circle cx="14.5" cy="17.8" r="1.9" fill="#5a3821" stroke="#1a0c05" strokeWidth="1.3" />
      <circle cx="22.5" cy="9.5" r="2.3" fill="#5a3821" stroke="#1a0c05" strokeWidth="1.4" />
      <circle cx="30.5" cy="17.8" r="1.9" fill="#5a3821" stroke="#1a0c05" strokeWidth="1.3" />
      <circle cx="38" cy="12.5" r="2.1" fill="#5a3821" stroke="#1a0c05" strokeWidth="1.3" />
      {/* Amber/Caramel Pearls Highlight */}
      <circle cx="21.8" cy="8.8" r="0.8" fill="#eab88b" />
      <circle cx="6.5" cy="11.8" r="0.7" fill="#dfa26d" />
      <circle cx="37.5" cy="11.8" r="0.7" fill="#dfa26d" />
      {/* Coronet Waist & Filigree Ribbons */}
      <path d="M 12.5,25.5 C 18,28 27,28 32.5,25.5" stroke="#dfa26d" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 14,29 C 18.5,31 26.5,31 31,29" stroke="#eab88b" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
      {/* Base */}
      <path
        d="M 13,35 L 32,35 L 33.5,37.5 L 11.5,37.5 Z"
        fill="#3e2515"
        stroke="#1a0c05"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M 9.5,37.5 L 35.5,37.5 L 36,40 L 9,40 Z"
        fill="#2a160c"
        stroke="#1a0c05"
        strokeWidth="1.5"
      />
      <path d="M 12,38.5 L 33,38.5" stroke="#dfa26d" strokeWidth="1" opacity="0.5" strokeLinecap="round" />
    </svg>
  ),

  // Black King (Raja Kayu Gelap dengan Mahkota Salib)
  'bK': (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm select-none">
      <defs>
        <linearGradient id="bWoodK" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f3320" />
          <stop offset="50%" stopColor="#372113" />
          <stop offset="100%" stopColor="#22120a" />
        </linearGradient>
      </defs>
      {/* Distinct Royal Staunton Cross Pattée / Maltese Cross */}
      <g>
        <path
          d="M 21.2,3 L 23.8,3 L 23.2,7 L 24.5,7.5 L 24.5,9.5 L 23,10 L 23,12 L 22,12 L 22,10 L 20.5,9.5 L 20.5,7.5 L 21.8,7 Z"
          fill="#5a3821"
          stroke="#1a0c05"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <path
          d="M 18,7.5 L 27,7.5 L 27.5,9.5 L 17.5,9.5 Z"
          fill="#5a3821"
          stroke="#1a0c05"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        {/* Carved Diamond Center Jewel */}
        <circle cx="22.5" cy="8.5" r="1.1" fill="#eab88b" stroke="#1a0c05" strokeWidth="0.8" />
        <path d="M 19,8.5 L 26,8.5" stroke="#dfa26d" strokeWidth="0.9" />
      </g>
      {/* Crown Robes & Arches */}
      <path
        d="M 22.5,12 C 16,12 11.5,15.5 11.5,21.5 C 11.5,25.5 14,28.5 16.5,30.5 C 18,31.8 19,33 19,34.5 L 26,34.5 C 26,33 27,31.8 28.5,30.5 C 31,28.5 33.5,25.5 33.5,21.5 C 33.5,15.5 29,12 22.5,12 Z"
        fill="url(#bWoodK)"
        stroke="#1a0c05"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Carved Velvet Cap Ribs & Filigree in Warm Caramel */}
      <path d="M 14.5,18.5 C 18,21.5 27,21.5 30.5,18.5" stroke="#dfa26d" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 14,24.5 C 18,27.5 27,27.5 31,24.5" stroke="#dfa26d" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="22.5" cy="18" r="1.6" fill="#eab88b" stroke="#1a0c05" strokeWidth="1" />
      {/* Wood Sheen */}
      <path d="M 14,19 C 14,15 17,13 21,13" stroke="#eab88b" strokeWidth="1.3" opacity="0.65" strokeLinecap="round" />
      {/* Tiered Base */}
      <path
        d="M 13.5,34.5 L 31.5,34.5 L 33.5,37.5 L 11.5,37.5 Z"
        fill="#3e2515"
        stroke="#1a0c05"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M 9.5,37.5 L 35.5,37.5 L 36,40 L 9,40 Z"
        fill="#2a160c"
        stroke="#1a0c05"
        strokeWidth="1.5"
      />
      <path d="M 12,38.5 L 33,38.5" stroke="#dfa26d" strokeWidth="1" opacity="0.5" strokeLinecap="round" />
    </svg>
  ),
};
